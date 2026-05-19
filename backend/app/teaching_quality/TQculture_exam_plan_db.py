"""
教学质量模块 - 企业文化考试计划表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."企业文化考试计划表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null
- 考试时间 varchar(50)
- 考试地点 varchar(200)
- 考试方式 varchar(100)
- 考试主题 varchar(200)
- 考试内容概述 text
- 考试对象 varchar(200)
- 监考人 varchar(100)
- 考场布置 varchar(200)
- 需准备资料 text
- 备注 text
唯一：神殿名称 + 年份 + 月份 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 企业文化考试计划表(AccountBase):
    __tablename__ = "企业文化考试计划表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    考试时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    考试地点: Mapped[str | None] = mapped_column(String(200), nullable=True)
    考试方式: Mapped[str | None] = mapped_column(String(100), nullable=True)
    考试主题: Mapped[str | None] = mapped_column(String(200), nullable=True)
    考试内容概述: Mapped[str | None] = mapped_column(Text, nullable=True)
    考试对象: Mapped[str | None] = mapped_column(String(200), nullable=True)
    监考人: Mapped[str | None] = mapped_column(String(100), nullable=True)
    考场布置: Mapped[str | None] = mapped_column(String(200), nullable=True)
    需准备资料: Mapped[str | None] = mapped_column(Text, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_企业文化考试计划_维度序号"),
        Index("idx_企业文化考试计划_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate() -> None:
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[企业文化考试计划表.__table__])

def init_culture_exam_plan_tables() -> None:
    _migrate()

def fetch_culture_exam_plan_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int
) -> List[企业文化考试计划表]:
    _migrate()
    return (
        db.query(企业文化考试计划表)
        .filter(
            企业文化考试计划表.神殿名称 == 神殿名称,
            企业文化考试计划表.年份 == 年份,
            企业文化考试计划表.月份 == 月份,
        )
        .order_by(企业文化考试计划表.序号)
        .all()
    )

def replace_culture_exam_plan_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
) -> None:
    _migrate()
    db.query(企业文化考试计划表).filter(
        企业文化考试计划表.神殿名称 == 神殿名称,
        企业文化考试计划表.年份 == 年份,
        企业文化考试计划表.月份 == 月份,
    ).delete()

    def _to_int(val) -> int | None:
        try:
            return int(val)
        except Exception:
            return None

    def _clean_text(val) -> str | None:
        if val is None:
            return None
        text_val = str(val).strip()
        return text_val or None

    for row in sorted(
        行列表,
        key=lambda x: _to_int(x.get("序号") or x.get("index") or x.get("serialNumber")) or 0,
    ):
        序号 = row.get("序号") or row.get("index") or row.get("serialNumber")
        序号 = _to_int(序号)
        if 序号 is None:
            continue

        考试时间 = _clean_text(row.get("考试时间") or row.get("examDate") or row.get("time"))
        考试地点 = _clean_text(row.get("考试地点") or row.get("location"))
        考试方式 = _clean_text(row.get("考试方式") or row.get("method"))
        考试主题 = _clean_text(row.get("考试主题") or row.get("topic"))
        考试内容概述 = _clean_text(row.get("考试内容概述") or row.get("summary"))
        考试对象 = _clean_text(row.get("考试对象") or row.get("audience"))
        监考人 = _clean_text(row.get("监考人") or row.get("proctor"))
        考场布置 = _clean_text(row.get("考场布置") or row.get("arrangement"))
        需准备资料 = _clean_text(row.get("需准备资料") or row.get("materials"))
        备注 = _clean_text(row.get("备注") or row.get("remark"))

        if not any(
            [
                考试时间,
                考试地点,
                考试方式,
                考试主题,
                考试内容概述,
                考试对象,
                监考人,
                考场布置,
                需准备资料,
                备注,
            ]
        ):
            continue

        db.add(
            企业文化考试计划表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=序号,
                考试时间=考试时间,
                考试地点=考试地点,
                考试方式=考试方式,
                考试主题=考试主题,
                考试内容概述=考试内容概述,
                考试对象=考试对象,
                监考人=监考人,
                考场布置=考场布置,
                需准备资料=需准备资料,
                备注=备注,
            )
        )

    db.flush()
