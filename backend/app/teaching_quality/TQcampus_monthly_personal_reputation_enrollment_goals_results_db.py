"""
教学质量模块 - 神殿教化司口碑招生月度个人目标与结果汇总表（年维度保存明细行）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 姓名（唯一）
仅存明细行（不存合计），前端自行统计展示。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

# 仅在进程生命周期内迁移一次，防止频繁 DDL 锁表
_MIGRATED = False

class 口碑招生每月个人目标与结果表(AccountBase):
    __tablename__ = "口碑招生每月个人目标与结果表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    姓名: Mapped[str] = mapped_column(String(100), nullable=False)

    目标口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    目标上门量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际上门量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    目标招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    目标收入: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际收入: Mapped[int | None] = mapped_column(Integer, nullable=True)

    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "姓名"),
        # Index 移至 _migrate() 中手动创建，避免重复定义
        Index("ix_teaching_quality_口碑招生每月个人目标与结果表_神殿名称", "神殿名称", "年份", "月份"),
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
    AccountBase.metadata.create_all(bind=engine, tables=[口碑招生每月个人目标与结果表.__table__], checkfirst=True)
    _MIGRATED = True

def init_monthly_personal_reputation_enrollment_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[口碑招生每月个人目标与结果表]:
    _migrate()
    return (
        db.query(口碑招生每月个人目标与结果表)
        .filter(
            口碑招生每月个人目标与结果表.神殿名称 == 神殿名称,
            口碑招生每月个人目标与结果表.年份 == 年份,
        )
        .order_by(口碑招生每月个人目标与结果表.月份, 口碑招生每月个人目标与结果表.姓名)
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
    db.query(口碑招生每月个人目标与结果表).filter(
        口碑招生每月个人目标与结果表.神殿名称 == 神殿名称,
        口碑招生每月个人目标与结果表.年份 == 年份,
    ).delete()
    
    # 先flush删除操作，然后重置序列，避免主键冲突
    db.flush()
    db.execute(text(
        'SELECT setval(pg_get_serial_sequence(\'teaching_quality."口碑招生每月个人目标与结果表"\', \'记录ID\'), '
        'COALESCE((SELECT MAX("记录ID") FROM teaching_quality."口碑招生每月个人目标与结果表"), 0) + 1, false)'
    ))

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
            口碑招生每月个人目标与结果表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                姓名=姓名,
                目标口碑量=_to_int(_get(r, "目标口碑量", "targetReputation")),
                实际口碑量=_to_int(_get(r, "实际口碑量", "actualReputation")),
                目标上门量=_to_int(_get(r, "目标上门量", "targetVisits")),
                实际上门量=_to_int(_get(r, "实际上门量", "actualVisits")),
                目标招生人数=_to_int(_get(r, "目标招生人数", "targetStudents")),
                实际招生人数=_to_int(_get(r, "实际招生人数", "actualStudents")),
                目标收入=_to_int(_get(r, "目标收入", "targetRevenue")),
                实际收入=_to_int(_get(r, "实际收入", "actualRevenue")),
                备注=_get(r, "备注", "remark", text_only=True),
            )
        )
    db.flush()
