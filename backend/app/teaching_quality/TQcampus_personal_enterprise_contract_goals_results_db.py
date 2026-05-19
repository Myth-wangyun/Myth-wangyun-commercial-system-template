"""
教学质量模块 - 神殿教化司个人企业签约目标与结果汇总表（持久化）
来源：按月将班主任明细表聚合为个人维度，并落表，供个人/神殿汇总读取。
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase, engine, ensure_teaching_quality_schema


class CampusPersonalEnterpriseContractSummary(TQBase):
    __tablename__ = '神殿教化司个人企业签约目标与结果汇总表'
    __table_args__ = (
        UniqueConstraint('神殿名称', '年份', '月份', '姓名', name='uq_campus_personal_enterprise_contract'),
        Index("idx_campus_personal_enterprise_cym", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    姓名: Mapped[str] = mapped_column(String(100), nullable=False)

    目标签约数: Mapped[int] = mapped_column(Integer, default=0)
    实际签约数: Mapped[int] = mapped_column(Integer, default=0)
    目标签约收入: Mapped[float] = mapped_column(Float, default=0.0)
    实际签约收入: Mapped[float] = mapped_column(Float, default=0.0)

    备注: Mapped[str] = mapped_column(Text)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

def init_db_table():
    ensure_teaching_quality_schema()
    TQBase.metadata.create_all(bind=engine, tables=[CampusPersonalEnterpriseContractSummary.__table__])
def upsert_row(db: Session, data: Dict[str, Any]) -> CampusPersonalEnterpriseContractSummary:
    row = db.query(CampusPersonalEnterpriseContractSummary).filter(
        CampusPersonalEnterpriseContractSummary.神殿名称 == data['神殿名称'],
        CampusPersonalEnterpriseContractSummary.年份 == data['年份'],
        CampusPersonalEnterpriseContractSummary.月份 == data['月份'],
        CampusPersonalEnterpriseContractSummary.姓名 == data['姓名'],
    ).first()
    if row:
        for k, v in data.items():
            if hasattr(row, k):
                setattr(row, k, v)
        # db.commit() # Let the caller handle the transaction
        db.flush() # Send changes to the DB
        db.refresh(row)
        return row
    row = CampusPersonalEnterpriseContractSummary(**data)
    db.add(row)
    db.flush() # Send the new object to the DB to get an ID
    db.refresh(row)
    return row

def clear_month(db: Session, campus: str, year: int, month: int) -> None:
    db.query(CampusPersonalEnterpriseContractSummary).filter(
        CampusPersonalEnterpriseContractSummary.神殿名称 == campus,
        CampusPersonalEnterpriseContractSummary.年份 == year,
        CampusPersonalEnterpriseContractSummary.月份 == month,
    ).delete(synchronize_session=False)
    # db.commit() # Let the caller handle the transaction

def get_rows(db: Session, campus: str, year: int, month: int) -> List[CampusPersonalEnterpriseContractSummary]:
    return db.query(CampusPersonalEnterpriseContractSummary).filter(
        CampusPersonalEnterpriseContractSummary.神殿名称 == campus,
        CampusPersonalEnterpriseContractSummary.年份 == year,
        CampusPersonalEnterpriseContractSummary.月份 == month,
    ).order_by(CampusPersonalEnterpriseContractSummary.姓名.asc()).all()

