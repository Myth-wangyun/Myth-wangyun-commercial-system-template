"""
教学质量模块 - 神殿教化司培训计划与成绩汇总表（按月汇总）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
字段：目标/实际 培训计划数、完成数、成绩等
数据来源：教化司培训计划与成绩每月个人目标与结果表（按月合计）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 教化司培训计划与成绩汇总表(AccountBase):
    __tablename__ = "教化司培训计划与成绩汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    目标培训计划数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际培训计划数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标完成数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际完成数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标平均成绩: Mapped[float | None] = mapped_column(Float, nullable=True)
    实际平均成绩: Mapped[float | None] = mapped_column(Float, nullable=True)

    目标参与人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际参与人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标合格率: Mapped[float | None] = mapped_column(Float, nullable=True)
    实际合格率: Mapped[float | None] = mapped_column(Float, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份"),
        Index("idx_教化司培训计划神殿年份月份", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[教化司培训计划与成绩汇总表.__table__], checkfirst=True)

def init_campus_training_plan_performance_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[教化司培训计划与成绩汇总表]:
    _migrate()
    return (
        db.query(教化司培训计划与成绩汇总表)
        .filter(
            教化司培训计划与成绩汇总表.神殿名称 == 神殿名称,
            教化司培训计划与成绩汇总表.年份 == 年份,
        )
        .order_by(教化司培训计划与成绩汇总表.月份)
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

    db.query(教化司培训计划与成绩汇总表).filter(
        教化司培训计划与成绩汇总表.神殿名称 == 神殿名称,
        教化司培训计划与成绩汇总表.年份 == 年份,
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

    def _to_float(v) -> Optional[float]:
        try:
            if v is None or v == "":
                return None
            return float(str(v))
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
            教化司培训计划与成绩汇总表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                目标培训计划数=_to_int(_get(r, "目标培训计划数", "targetTrainingPlanCount")),
                实际培训计划数=_to_int(_get(r, "实际培训计划数", "actualTrainingPlanCount")),
                目标完成数=_to_int(_get(r, "目标完成数", "targetCompletionCount")),
                实际完成数=_to_int(_get(r, "实际完成数", "actualCompletionCount")),
                目标平均成绩=_to_float(_get(r, "目标平均成绩", "targetAverageScore")),
                实际平均成绩=_to_float(_get(r, "实际平均成绩", "actualAverageScore")),
                目标参与人数=_to_int(_get(r, "目标参与人数", "targetParticipantCount")),
                实际参与人数=_to_int(_get(r, "实际参与人数", "actualParticipantCount")),
                目标合格率=_to_float(_get(r, "目标合格率", "targetPassRate")),
                实际合格率=_to_float(_get(r, "实际合格率", "actualPassRate")),
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

    def _to_float(v) -> Optional[float]:
        try:
            if v is None or v == "":
                return None
            return float(str(v))
        except Exception:
            return None

    def _get(d: Dict[str, Any], *keys: str):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    existing = (
        db.query(教化司培训计划与成绩汇总表)
        .filter(
            教化司培训计划与成绩汇总表.神殿名称 == 神殿名称,
            教化司培训计划与成绩汇总表.年份 == 年份,
            教化司培训计划与成绩汇总表.月份 == 月份,
        )
        .first()
    )

    if existing:
        existing.目标培训计划数 = _to_int(_get(data, "目标培训计划数", "targetTrainingPlanCount")) or existing.目标培训计划数
        existing.实际培训计划数 = _to_int(_get(data, "实际培训计划数", "actualTrainingPlanCount")) or existing.实际培训计划数
        existing.目标完成数 = _to_int(_get(data, "目标完成数", "targetCompletionCount")) or existing.目标完成数
        existing.实际完成数 = _to_int(_get(data, "实际完成数", "actualCompletionCount")) or existing.实际完成数
        existing.目标平均成绩 = _to_float(_get(data, "目标平均成绩", "targetAverageScore")) or existing.目标平均成绩
        existing.实际平均成绩 = _to_float(_get(data, "实际平均成绩", "actualAverageScore")) or existing.实际平均成绩
        existing.目标参与人数 = _to_int(_get(data, "目标参与人数", "targetParticipantCount")) or existing.目标参与人数
        existing.实际参与人数 = _to_int(_get(data, "实际参与人数", "actualParticipantCount")) or existing.实际参与人数
        existing.目标合格率 = _to_float(_get(data, "目标合格率", "targetPassRate")) or existing.目标合格率
        existing.实际合格率 = _to_float(_get(data, "实际合格率", "actualPassRate")) or existing.实际合格率
    else:
        db.add(
            教化司培训计划与成绩汇总表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                目标培训计划数=_to_int(_get(data, "目标培训计划数", "targetTrainingPlanCount")),
                实际培训计划数=_to_int(_get(data, "实际培训计划数", "actualTrainingPlanCount")),
                目标完成数=_to_int(_get(data, "目标完成数", "targetCompletionCount")),
                实际完成数=_to_int(_get(data, "实际完成数", "actualCompletionCount")),
                目标平均成绩=_to_float(_get(data, "目标平均成绩", "targetAverageScore")),
                实际平均成绩=_to_float(_get(data, "实际平均成绩", "actualAverageScore")),
                目标参与人数=_to_int(_get(data, "目标参与人数", "targetParticipantCount")),
                实际参与人数=_to_int(_get(data, "实际参与人数", "actualParticipantCount")),
                目标合格率=_to_float(_get(data, "目标合格率", "targetPassRate")),
                实际合格率=_to_float(_get(data, "实际合格率", "actualPassRate")),
            )
        )

    db.flush()

