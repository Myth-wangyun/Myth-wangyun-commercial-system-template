"""
教学质量模块 - 神殿教化司师资配比月度表
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
字段：学生总人数、目标/实际 老师数量、班主任空缺/冗余、中层目标/实际/空缺/冗余、两个配比字段
"""
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 教化司师资配比月度表(AccountBase):
    __tablename__ = "教化司师资配比月度表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    学生总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标师生配比: Mapped[str | None] = mapped_column(String(20), nullable=True)
    目标老师总数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际老师数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    班主任空缺职数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    班主任冗余职数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    目标中层与班主任配比: Mapped[str | None] = mapped_column(String(20), nullable=True)
    目标中层人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际中层人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    中层空缺职数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    中层冗余职数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

_columns_ensured = False
_columns_lock = threading.Lock()
_table_created = False

def _ensure_columns_once():
    global _columns_ensured
    if _columns_ensured:
        return
    with _columns_lock:
        if _columns_ensured:
            return
        _columns_ensured = True

def _migrate():
    global _table_created
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _table_created = True
        return
    ensure_teaching_quality_schema()
    if not _table_created:
        # 只在进程生命周期内执行一次建表检查，避免频繁 pg_class 探测
        AccountBase.metadata.create_all(bind=engine, tables=[教化司师资配比月度表.__table__], checkfirst=True)
        _table_created = True
    _ensure_columns_once()

def init_teacher_ratio_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[教化司师资配比月度表]:
    _migrate()
    return (
        db.query(教化司师资配比月度表)
        .filter(
            教化司师资配比月度表.神殿名称 == 神殿名称,
            教化司师资配比月度表.年份 == 年份,
        )
        .order_by(教化司师资配比月度表.月份)
        .all()
    )

def update_or_create_row(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    data: Dict[str, Any],
):
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
        db.query(教化司师资配比月度表)
        .filter(
            教化司师资配比月度表.神殿名称 == 神殿名称,
            教化司师资配比月度表.年份 == 年份,
            教化司师资配比月度表.月份 == 月份,
        )
        .first()
    )

    values = dict(
        # 学生总人数不保存，每次从班级档案表实时查询
        目标师生配比=_get(data, "目标师生配比", "targetStudentTeacherRatio"),
        目标老师总数=_to_int(_get(data, "目标老师总数", "targetTeacherCount")),
        实际老师数量=_to_int(_get(data, "实际老师数量", "actualTeacherCount")),
        班主任空缺职数=_to_int(_get(data, "班主任空缺职数", "headmasterVacancy")),
        班主任冗余职数=_to_int(_get(data, "班主任冗余职数", "headmasterRedundancy")),
        目标中层与班主任配比=_get(data, "目标中层与班主任配比", "targetMiddleManagementRatio"),
        目标中层人数=_to_int(_get(data, "目标中层人数", "targetMiddleManagementCount")),
        实际中层人数=_to_int(_get(data, "实际中层人数", "actualMiddleManagementCount")),
        中层空缺职数=_to_int(_get(data, "中层空缺职数", "middleManagementVacancy")),
        中层冗余职数=_to_int(_get(data, "中层冗余职数", "middleManagementRedundancy")),
    )

    if existing:
        for k, v in values.items():
            if v is not None:
                setattr(existing, k, v)
    else:
        db.add(
            教化司师资配比月度表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                **values,
            )
        )

    db.flush()

