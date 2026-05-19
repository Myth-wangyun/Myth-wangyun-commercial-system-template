"""
教学质量模块 - 神殿教化司口碑招生目标与结果汇总表（按月汇总）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
字段：目标/实际 口碑量、上门量、招生人数、收入
数据来源：口碑招生每月个人目标与结果表（按月合计）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

# 仅在进程生命周期内迁移一次，防止频繁 DDL 锁表
_MIGRATED = False

class 口碑招生目标与结果汇总表(AccountBase):
    __tablename__ = "口碑招生目标与结果汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    目标口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标上门量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际上门量: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标收入: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际收入: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份"),
        Index("idx_口碑招生神殿年份月份", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    global _MIGRATED
    if _MIGRATED:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _MIGRATED = True
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[口碑招生目标与结果汇总表.__table__], checkfirst=True)
    _MIGRATED = True

def init_campus_reputation_enrollment_goals_results_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[口碑招生目标与结果汇总表]:
    _migrate()
    return (
        db.query(口碑招生目标与结果汇总表)
        .filter(
            口碑招生目标与结果汇总表.神殿名称 == 神殿名称,
            口碑招生目标与结果汇总表.年份 == 年份,
        )
        .order_by(口碑招生目标与结果汇总表.月份)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年的每月汇总行。兼容中文/英文键。"""
    _migrate()

    db.query(口碑招生目标与结果汇总表).filter(
        口碑招生目标与结果汇总表.神殿名称 == 神殿名称,
        口碑招生目标与结果汇总表.年份 == 年份,
    ).delete()

    def _to_int(v) -> Optional[int]:
        try:
            if v is None or v == "":
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    for r in 行列表:
        月份 = _to_int(_get(r, "月份", "month")) or 0
        if not 月份:
            continue
        db.add(
            口碑招生目标与结果汇总表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                目标口碑量=_to_int(_get(r, "目标口碑量", "targetReputation")),
                实际口碑量=_to_int(_get(r, "实际口碑量", "actualReputation")),
                目标上门量=_to_int(_get(r, "目标上门量", "targetVisits")),
                实际上门量=_to_int(_get(r, "实际上门量", "actualVisits")),
                目标招生人数=_to_int(_get(r, "目标招生人数", "targetStudents")),
                实际招生人数=_to_int(_get(r, "实际招生人数", "actualStudents")),
                目标收入=_to_int(_get(r, "目标收入", "targetRevenue")),
                实际收入=_to_int(_get(r, "实际收入", "actualRevenue")),
            )
        )

    db.flush()

def update_or_create_row(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    data: Dict[str, Any],
):
    """更新或创建单条记录"""
    _migrate()

    def _to_int(v) -> Optional[int]:
        try:
            if v is None or v == "":
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    existing = (
        db.query(口碑招生目标与结果汇总表)
        .filter(
            口碑招生目标与结果汇总表.神殿名称 == 神殿名称,
            口碑招生目标与结果汇总表.年份 == 年份,
            口碑招生目标与结果汇总表.月份 == 月份,
        )
        .first()
    )

    if existing:
        existing.目标口碑量 = _to_int(_get(data, "目标口碑量", "targetReputation")) or existing.目标口碑量
        existing.实际口碑量 = _to_int(_get(data, "实际口碑量", "actualReputation")) or existing.实际口碑量
        existing.目标上门量 = _to_int(_get(data, "目标上门量", "targetVisits")) or existing.目标上门量
        existing.实际上门量 = _to_int(_get(data, "实际上门量", "actualVisits")) or existing.实际上门量
        existing.目标招生人数 = _to_int(_get(data, "目标招生人数", "targetStudents")) or existing.目标招生人数
        existing.实际招生人数 = _to_int(_get(data, "实际招生人数", "actualStudents")) or existing.实际招生人数
        existing.目标收入 = _to_int(_get(data, "目标收入", "targetRevenue")) or existing.目标收入
        existing.实际收入 = _to_int(_get(data, "实际收入", "actualRevenue")) or existing.实际收入
    else:
        db.add(
            口碑招生目标与结果汇总表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                目标口碑量=_to_int(_get(data, "目标口碑量", "targetReputation")),
                实际口碑量=_to_int(_get(data, "实际口碑量", "actualReputation")),
                目标上门量=_to_int(_get(data, "目标上门量", "targetVisits")),
                实际上门量=_to_int(_get(data, "实际上门量", "actualVisits")),
                目标招生人数=_to_int(_get(data, "目标招生人数", "targetStudents")),
                实际招生人数=_to_int(_get(data, "实际招生人数", "actualStudents")),
                目标收入=_to_int(_get(data, "目标收入", "targetRevenue")),
                实际收入=_to_int(_get(data, "实际收入", "actualRevenue")),
            )
        )

    db.flush()
