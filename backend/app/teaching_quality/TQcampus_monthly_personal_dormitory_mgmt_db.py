"""
教学质量模块 - 神殿教化司每月个人宿舍管理统计表（单表，年维度保存明细行）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 姓名（唯一）
仅存明细行（不存月合计/总合计），前端自行计算展示。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 每月个人宿舍管理统计表(AccountBase):
    __tablename__ = "每月个人宿舍管理统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    姓名: Mapped[str] = mapped_column(String(100), nullable=False)

    带班人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    宿舍管理总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    住宿总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    男宿总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    男宿总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    男宿空床位总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    适合男新生床位数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    女宿总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    女宿总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    女宿空床位总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    适合女新生住宿床位: Mapped[int | None] = mapped_column(Integer, nullable=True)

    计划租宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际租宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    计划退宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际退宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)

    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "姓名", name="uq_每月个人宿管_神殿年份月份姓名"),
        Index("idx_每月个人宿管_神殿年份月份", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[每月个人宿舍管理统计表.__table__])

def init_campus_monthly_personal_dorm_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[每月个人宿舍管理统计表]:
    _migrate()
    return (
        db.query(每月个人宿舍管理统计表)
        .filter(
            每月个人宿舍管理统计表.神殿名称 == 神殿名称,
            每月个人宿舍管理统计表.年份 == 年份,
        )
        .order_by(每月个人宿舍管理统计表.月份, 每月个人宿舍管理统计表.姓名)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年的所有明细行（仅存明细）。"""
    _migrate()
    db.query(每月个人宿舍管理统计表).filter(
        每月个人宿舍管理统计表.神殿名称 == 神殿名称,
        每月个人宿舍管理统计表.年份 == 年份,
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

    for r in 行列表:
        月份 = _to_int(_get(r, "月份", "month")) or 0
        姓名 = _get(r, "姓名", "name", text_only=True) or ""
        if not 月份 or not 姓名:
            continue
        db.add(
            每月个人宿舍管理统计表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                姓名=姓名,
                带班人数=_to_int(_get(r, "带班人数", "classStudentCount")),
                宿舍管理总数量=_to_int(_get(r, "宿舍管理总数量", "dormManageCount")),
                住宿总人数=_to_int(_get(r, "住宿总人数", "dormResidentCount")),
                男宿总数量=_to_int(_get(r, "男宿总数量", "maleDormCount")),
                男宿总人数=_to_int(_get(r, "男宿总人数", "maleDormResidentCount")),
                男宿空床位总数量=_to_int(_get(r, "男宿空床位总数量", "maleEmptyBedCount")),
                适合男新生床位数=_to_int(_get(r, "适合男新生床位数", "maleNewStudentBedCount")),
                女宿总数量=_to_int(_get(r, "女宿总数量", "femaleDormCount")),
                女宿总人数=_to_int(_get(r, "女宿总人数", "femaleDormResidentCount")),
                女宿空床位总数量=_to_int(_get(r, "女宿空床位总数量", "femaleEmptyBedCount")),
                适合女新生住宿床位=_to_int(_get(r, "适合女新生住宿床位", "femaleNewStudentBedCount")),
                计划租宿舍数量=_to_int(_get(r, "计划租宿舍数量", "planRentDormCount")),
                实际租宿舍数量=_to_int(_get(r, "实际租宿舍数量", "actualRentDormCount")),
                计划退宿舍数量=_to_int(_get(r, "计划退宿舍数量", "planQuitDormCount")),
                实际退宿舍数量=_to_int(_get(r, "实际退宿舍数量", "actualQuitDormCount")),
                备注=_get(r, "备注", "remark", text_only=True),
            )
        )
    db.flush()

