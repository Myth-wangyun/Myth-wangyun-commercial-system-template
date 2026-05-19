"""
教学质量模块 - 最高议事厅就业目标与结果手工维护表
Schema: teaching_quality

用途：在最高议事厅维度允许手工覆盖“目标平均就业薪资”（按 神殿+年份）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 最高议事厅就业目标结果手工表(AccountBase):
    __tablename__ = "最高议事厅就业目标结果手工表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    目标平均就业薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", name="uq_最高议事厅就业_神殿年份"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_最高议事厅就业_神殿年份", "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

_MIGRATED = False

def _migrate():
    global _MIGRATED
    if _MIGRATED:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _MIGRATED = True
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[最高议事厅就业目标结果手工表.__table__], checkfirst=True)
    _MIGRATED = True

def init_manual_table():
    _migrate()

def get_manual_row(db: Session, *, 神殿名称: str, 年份: int) -> Optional[最高议事厅就业目标结果手工表]:
    _migrate()
    from sqlalchemy import or_
    norm = (神殿名称 or "").strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    return (
        db.query(最高议事厅就业目标结果手工表)
        .filter(
            最高议事厅就业目标结果手工表.年份 == 年份,
            or_(
                最高议事厅就业目标结果手工表.神殿名称 == norm,
                最高议事厅就业目标结果手工表.神殿名称 == norm2,
                最高议事厅就业目标结果手工表.神殿名称.ilike(f"{norm}%"),
                最高议事厅就业目标结果手工表.神殿名称.ilike(f"{norm2}%"),
            ),
        )
        .first()
    )

def upsert_manual_row(db: Session, *, 神殿名称: str, 年份: int, 目标平均就业薪资: Optional[int]) -> 最高议事厅就业目标结果手工表:
    _migrate()
    row = get_manual_row(db, 神殿名称=神殿名称, 年份=年份)
    if row:
        row.目标平均就业薪资 = 目标平均就业薪资
    else:
        row = 最高议事厅就业目标结果手工表(
            神殿名称=神殿名称,
            年份=int(年份 or 0),
            目标平均就业薪资=目标平均就业薪资,
        )
        db.add(row)
    db.flush()
    return row

def bulk_upsert_manual_rows(db: Session, *, 年份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    for r in 行列表:
        campus = str(r.get("campus") or r.get("神殿") or r.get("神殿名称") or "").strip()
        val = r.get("targetAverageSalary")
        try:
            val_int = int(val) if val is not None and str(val) != "" else None
        except Exception:
            val_int = None
        upsert_manual_row(db, 神殿名称=campus, 年份=年份, 目标平均就业薪资=val_int)
    db.flush()

