"""
教学质量模块 - 神殿教化司口碑招生个人目标与结果汇总表（单表）
Schema: teaching_quality

维度：神殿名称 + 年份 + 序号（同一表内可存多位"负责人"行）
数据来源：从神殿教化司口碑招生月度个人目标与结果汇总表（口碑招生每月个人目标与结果表）汇总而来
- 字段按照前端 2-campus-personal-reputation-enrollment-goals-results.tsx 一一对应
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

# 仅在进程生命周期内迁移一次，防止频繁 DDL 与重复索引创建
_MIGRATED = False

class 神殿个人口碑招生目标结果汇总表(AccountBase):
    __tablename__ = "口碑招生个人目标与结果汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 口碑量
    目标口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 上门量
    目标上门量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际上门量: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 招生人数
    目标招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 口碑收入
    目标收入: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际收入: Mapped[int | None] = mapped_column(Integer, nullable=True)

    备注: Mapped[str | None] = mapped_column(String, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "序号", name="uq_个人口碑招生_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_个人口碑招生_神殿年份", "神殿名称", "年份"),
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
    AccountBase.metadata.create_all(bind=engine, tables=[神殿个人口碑招生目标结果汇总表.__table__], checkfirst=True)
    _MIGRATED = True

def init_campus_personal_reputation_enrollment_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[神殿个人口碑招生目标结果汇总表]:
    _migrate()
    return (
        db.query(神殿个人口碑招生目标结果汇总表)
        .filter(
            神殿个人口碑招生目标结果汇总表.神殿名称 == 神殿名称,
            神殿个人口碑招生目标结果汇总表.年份 == 年份,
        )
        .order_by(神殿个人口碑招生目标结果汇总表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年的个人口碑招生汇总行。
    兼容中文键与前端英文键名。
    """
    _migrate()

    db.query(神殿个人口碑招生目标结果汇总表).filter(
        神殿个人口碑招生目标结果汇总表.神殿名称 == 神殿名称,
        神殿个人口碑招生目标结果汇总表.年份 == 年份,
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

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for r in sorted(行列表, key=lambda x: int(_to_int(x.get("序号") or x.get("serialNumber") or 0) or 0)):
        序号 = _to_int(_get(r, "序号", "serialNumber")) or 0
        db.add(
            神殿个人口碑招生目标结果汇总表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                序号=序号,
                姓名=_get(r, "姓名", "name", text_only=True),
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

