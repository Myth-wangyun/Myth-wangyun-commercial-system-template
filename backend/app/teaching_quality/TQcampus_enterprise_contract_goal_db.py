"""
教学质量模块 - 神殿教化司企业签约目标（手填）表
用于存储神殿在某年某月的企业签约目标数量与目标收入。
实际签约数量与实际签约收入仍由班主任明细表聚合得到。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase, engine, ensure_teaching_quality_schema


class CampusEnterpriseContractGoal(TQBase):
    __tablename__ = '神殿教化司企业签约目标手填表'
    __table_args__ = (
        UniqueConstraint('神殿名称', '年份', '月份', name='uq_campus_enterprise_goal'),
        Index("idx_campus_enterprise_goal_campus_year_month", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)

    # 手填目标字段
    目标签约数: Mapped[int] = mapped_column(Integer, default=0)
    目标签约收入: Mapped[float] = mapped_column(Float, default=0.0)
    # 手填实际收入（按月神殿汇总，如有录入则覆盖班主任明细聚合的实际收入）
    实际签约收入: Mapped[float | None] = mapped_column(Float, nullable=True)

    备注: Mapped[str] = mapped_column(Text)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

def init_db_table():
    ensure_teaching_quality_schema()
    TQBase.metadata.create_all(bind=engine, tables=[CampusEnterpriseContractGoal.__table__])

def upsert_goal(db: Session, data: Dict[str, Any]) -> CampusEnterpriseContractGoal:
    existing = db.query(CampusEnterpriseContractGoal).filter(
        CampusEnterpriseContractGoal.神殿名称 == data['神殿名称'],
        CampusEnterpriseContractGoal.年份 == data['年份'],
        CampusEnterpriseContractGoal.月份 == data['月份'],
    ).first()
    if existing:
        for k, v in data.items():
            if hasattr(existing, k):
                setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    obj = CampusEnterpriseContractGoal(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_goal(db: Session, campus: str, year: int, month: int) -> Optional[CampusEnterpriseContractGoal]:
    return db.query(CampusEnterpriseContractGoal).filter(
        CampusEnterpriseContractGoal.神殿名称 == campus,
        CampusEnterpriseContractGoal.年份 == year,
        CampusEnterpriseContractGoal.月份 == month,
    ).first()

def get_goals_for_year(db: Session, campus: str, year: int) -> List[CampusEnterpriseContractGoal]:
    return db.query(CampusEnterpriseContractGoal).filter(
        CampusEnterpriseContractGoal.神殿名称 == campus,
        CampusEnterpriseContractGoal.年份 == year,
    ).order_by(CampusEnterpriseContractGoal.月份.asc()).all()

