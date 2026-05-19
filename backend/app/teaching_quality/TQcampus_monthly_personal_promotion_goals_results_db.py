"""
教学质量模块 - 神殿教化司每月个人升学目标与结果表（按年/月保存明细行）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 序号（唯一）
仅存明细行（不存合计），前端自行统计展示。

此表为个人维度的升学目标与结果记录，是视图 v_personal_promotion_summary 和 
v_campus_promotion_plan_summary 的数据来源。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 每月个人升学目标与结果表(AccountBase):
    __tablename__ = "每月个人升学目标与结果表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    升学班级总数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    在档总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    预计升学总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际升学总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    应收: Mapped[int | None] = mapped_column(Integer, nullable=True)
    预计升学收入: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际升学收入: Mapped[int | None] = mapped_column(Integer, nullable=True)

    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_每月个人升学_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_每月个人升学_神殿年月", "神殿名称", "年份", "月份"),
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
    AccountBase.metadata.create_all(bind=engine, tables=[每月个人升学目标与结果表.__table__], checkfirst=True)
    _MIGRATED = True

def init_monthly_personal_promotion_tables():
    """初始化表结构"""
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[每月个人升学目标与结果表]:
    _migrate()
    return (
        db.query(每月个人升学目标与结果表)
        .filter(
            每月个人升学目标与结果表.神殿名称 == 神殿名称,
            每月个人升学目标与结果表.年份 == 年份,
            每月个人升学目标与结果表.月份 == 月份,
        )
        .order_by(每月个人升学目标与结果表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年某月的所有明细行。"""
    _migrate()
    db.query(每月个人升学目标与结果表).filter(
        每月个人升学目标与结果表.神殿名称 == 神殿名称,
        每月个人升学目标与结果表.年份 == 年份,
        每月个人升学目标与结果表.月份 == 月份,
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
        序号 = _to_int(_get(r, "序号", "serialNumber")) or 0
        if not 序号:
            continue
        db.add(
            每月个人升学目标与结果表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=序号,
                姓名=_get(r, "姓名", "teacherName", "name", text_only=True),
                升学班级总数=_to_int(_get(r, "升学班级总数", "classCount")),
                在档总人数=_to_int(_get(r, "在档总人数", "fileCount")),
                预计升学总人数=_to_int(_get(r, "预计升学总人数", "expectedPromotionCount")),
                实际升学总人数=_to_int(_get(r, "实际升学总人数", "actualPromotionCount")),
                应收=_to_int(_get(r, "应收", "receivableAmount")),
                预计升学收入=_to_int(_get(r, "预计升学收入", "expectedPromotionRevenue")),
                实际升学收入=_to_int(_get(r, "实际升学收入", "actualPromotionRevenue")),
                备注=_get(r, "备注", "remark", text_only=True),
            )
        )
    db.commit()
