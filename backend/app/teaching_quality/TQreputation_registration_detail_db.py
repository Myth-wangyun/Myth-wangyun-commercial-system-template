"""
教学质量模块 - 神殿教化司口碑报名登记明细表（按月保存明细行，可编辑）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（按月覆盖写入全部行）
说明：使用“覆盖写入”策略，不依赖单行唯一键；可选地保存序号字段用于排序。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

# 避免在每次请求时都执行 DDL（ALTER TABLE/CREATE TABLE）导致表锁与卡顿
# 仅在进程生命周期内迁移一次
_MIGRATED = False

class 口碑报名登记明细表(AccountBase):
    __tablename__ = "口碑报名登记明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    序号: Mapped[int | None] = mapped_column(Integer, nullable=True)

    班主任姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    口碑量姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    口碑量电话: Mapped[str | None] = mapped_column(String(50), nullable=True)

    是否上门: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否报名: Mapped[str | None] = mapped_column(String(10), nullable=True)

    报名时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    报名专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    报名学制: Mapped[str | None] = mapped_column(String(50), nullable=True)

    应收学费: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实交学费: Mapped[int | None] = mapped_column(Integer, nullable=True)

    是否过课时: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否稳定: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否退费: Mapped[str | None] = mapped_column(String(10), nullable=True)

    咨询师: Mapped[str | None] = mapped_column(String(100), nullable=True)
    介绍人姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    口碑介绍关系: Mapped[str | None] = mapped_column(String(100), nullable=True)
    口碑来源: Mapped[str | None] = mapped_column(String(100), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        Index(None, "神殿名称", "年份", "月份"),
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
    AccountBase.metadata.create_all(bind=engine, tables=[口碑报名登记明细表.__table__], checkfirst=True)
    _MIGRATED = True

def init_reputation_registration_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[口碑报名登记明细表]:
    _migrate()
    return (
        db.query(口碑报名登记明细表)
        .filter(
            口碑报名登记明细表.神殿名称 == 神殿名称,
            口碑报名登记明细表.年份 == 年份,
            口碑报名登记明细表.月份 == 月份,
        )
        .order_by(口碑报名登记明细表.序号.asc().nullsfirst(), 口碑报名登记明细表.创建时间.asc())
        .all()
    )

def replace_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    db.query(口碑报名登记明细表).filter(
        口碑报名登记明细表.神殿名称 == 神殿名称,
        口碑报名登记明细表.年份 == 年份,
        口碑报名登记明细表.月份 == 月份,
    ).delete()

    def _to_int(v) -> Optional[int]:
        try:
            if v in (None, ""):
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for i, r in enumerate(行列表, start=1):
        db.add(
            口碑报名登记明细表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=_to_int(_get(r, "序号", "serialNumber")) or i,
                班主任姓名=_get(r, "班主任姓名", "instructorName", text_only=True),
                口碑量姓名=_get(r, "口碑量姓名", "reputationName", text_only=True),
                口碑量电话=_get(r, "口碑量电话", "reputationPhone", text_only=True),
                是否上门=_get(r, "是否上门", "isVisit", text_only=True),
                是否报名=_get(r, "是否报名", "isEnroll", text_only=True),
                报名时间=_get(r, "报名时间", "enrollmentTime", text_only=True),
                报名专业=_get(r, "报名专业", "enrollmentMajor", text_only=True),
                报名学制=_get(r, "报名学制", "enrollmentDuration", text_only=True),
                应收学费=_to_int(_get(r, "应收学费", "receivableTuition")),
                实交学费=_to_int(_get(r, "实交学费", "actualTuition")),
                是否过课时=_get(r, "是否过课时", "isExceededClassHours", text_only=True),
                是否稳定=_get(r, "是否稳定", "isStable", text_only=True),
                是否退费=_get(r, "是否退费", "isRefund", text_only=True),
                咨询师=_get(r, "咨询师", "consultant", text_only=True),
                介绍人姓名=_get(r, "介绍人姓名", "introducerName", text_only=True),
                口碑介绍关系=_get(r, "口碑介绍关系", "reputationRelationship", text_only=True),
                口碑来源=_get(r, "口碑来源", "reputationSource", text_only=True),
            )
        )
    db.flush()

