"""
教学质量模块 - 教化司培训计划与成绩汇总表（月度明细，管理端页面）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
字段：培训目标、主要内容、培训方式、负责人、培训人数、合格人数、考试合格率、平均成绩
"""
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import Column, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 教化司培训计划与成绩月度表(AccountBase):
    __tablename__ = "教化司培训计划与成绩月度表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    培训目标: Mapped[str | None] = mapped_column(String(200), nullable=True)
    主要内容: Mapped[str | None] = mapped_column(String(200), nullable=True)
    培训方式: Mapped[str | None] = mapped_column(String(100), nullable=True)
    负责人: Mapped[str | None] = mapped_column(String(100), nullable=True)

    培训人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    合格人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    考试合格率: Mapped[float | None] = mapped_column(Float, nullable=True)
    平均成绩: Mapped[float | None] = mapped_column(Float, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[教化司培训计划与成绩月度表.__table__], checkfirst=True)

def init_training_plan_performance_mgnt_tables():
    _migrate()

def update_or_create_row(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    data: Dict[str, Any],
):
    """更新或创建单条记录（管理端）"""

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
        db.query(教化司培训计划与成绩月度表)
        .filter(
            教化司培训计划与成绩月度表.神殿名称 == 神殿名称,
            教化司培训计划与成绩月度表.年份 == 年份,
            教化司培训计划与成绩月度表.月份 == 月份,
        )
        .first()
    )

    values = dict(
        培训目标=_get(data, "培训目标", "trainingObjective"),
        主要内容=_get(data, "主要内容", "mainContent"),
        培训方式=_get(data, "培训方式", "trainingMethod"),
        负责人=_get(data, "负责人", "personInCharge"),
        培训人数=_to_int(_get(data, "培训人数", "numberOfTrainees")),
        合格人数=_to_int(_get(data, "合格人数", "numberOfQualified")),
        考试合格率=_to_float(_get(data, "考试合格率", "examPassRate")),
        平均成绩=_to_float(_get(data, "平均成绩", "averageScore")),
    )

    if existing:
        for k, v in values.items():
            if v is not None:
                setattr(existing, k, v)
    else:
        db.add(
            教化司培训计划与成绩月度表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                **values,
            )
        )

    db.flush()

def fetch_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
):
    """获取指定神殿年份的所有月度记录"""
    return (
        db.query(教化司培训计划与成绩月度表)
        .filter(
            教化司培训计划与成绩月度表.神殿名称 == 神殿名称,
            教化司培训计划与成绩月度表.年份 == 年份,
        )
        .order_by(教化司培训计划与成绩月度表.月份)
        .all()
    )
