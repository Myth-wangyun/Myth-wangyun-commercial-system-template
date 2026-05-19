"""
教学质量模块 - 神殿教化司新生维稳月度个人统计表（年维度保存明细行）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 姓名（唯一）
仅存明细行（不存合计），前端自行统计展示。
"""
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

_init_lock = threading.Lock()
_initialized = False

class 每月个人新生维稳统计表(AccountBase):
    __tablename__ = "每月个人新生维稳统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    姓名: Mapped[str] = mapped_column(String(100), nullable=False)

    交接人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    报到人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    稳定过课时人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    未过课时人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    回全款人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    仍欠费人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    欠费总金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    退费人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    退费情况说明: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "姓名"),
        # Index 移至 _migrate() 中手动创建，避免重复定义
        Index("ix_teaching_quality_每月个人新生维稳统计表_神殿名称", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    global _initialized
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _initialized = True
        return
    with _init_lock:
        if _initialized:
            return
        ensure_teaching_quality_schema()
        AccountBase.metadata.create_all(bind=engine, tables=[每月个人新生维稳统计表.__table__], checkfirst=True)
        _initialized = True

def init_monthly_personal_new_stu_stability_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[每月个人新生维稳统计表]:
    _migrate()
    return (
        db.query(每月个人新生维稳统计表)
        .filter(
            每月个人新生维稳统计表.神殿名称 == 神殿名称,
            每月个人新生维稳统计表.年份 == 年份,
        )
        .order_by(每月个人新生维稳统计表.月份, 每月个人新生维稳统计表.姓名)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年的所有明细行。"""
    _migrate()
    db.query(每月个人新生维稳统计表).filter(
        每月个人新生维稳统计表.神殿名称 == 神殿名称,
        每月个人新生维稳统计表.年份 == 年份,
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

    for r in 行列表:
        月份 = _to_int(_get(r, "月份", "month")) or 0
        姓名 = _get(r, "姓名", "name", text_only=True) or ""
        if not 月份 or not 姓名:
            continue
        db.add(
            每月个人新生维稳统计表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                姓名=姓名,
                交接人数=_to_int(_get(r, "交接人数", "transferCount")),
                报到人数=_to_int(_get(r, "报到人数", "reportedCount")),
                稳定过课时人数=_to_int(_get(r, "稳定过课时人数", "stableCount")),
                未过课时人数=_to_int(_get(r, "未过课时人数", "unstableCount")),
                回全款人数=_to_int(_get(r, "回全款人数", "fullRefundCount")),
                仍欠费人数=_to_int(_get(r, "仍欠费人数", "arrearsCount")),
                欠费总金额=_to_int(_get(r, "欠费总金额", "arrearsAmount")),
                退费人数=_to_int(_get(r, "退费人数", "refundCount")),
                退费情况说明=_get(r, "退费情况说明", "refundNote", text_only=True),
            )
        )
    db.flush()

