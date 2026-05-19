"""
教学质量模块 - 神殿教化司个人宿舍管理统计表（手填，年维度）
Schema: teaching_quality

维度：神殿名称 + 年份 + 序号（唯一）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 个人宿舍管理手填表(AccountBase):
    __tablename__ = "个人宿舍管理手填表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    班主任姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)

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
        # 不显式命名，避免与历史对象或其他表的同名索引/约束冲突
        UniqueConstraint("神殿名称", "年份", "序号"),
        Index(None, "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[个人宿舍管理手填表.__table__], checkfirst=True)

def init_personal_dormitory_mgmt_manual_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[个人宿舍管理手填表]:
    _migrate()
    return (
        db.query(个人宿舍管理手填表)
        .filter(
            个人宿舍管理手填表.神殿名称 == 神殿名称,
            个人宿舍管理手填表.年份 == 年份,
        )
        .order_by(个人宿舍管理手填表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(个人宿舍管理手填表).filter(
        个人宿舍管理手填表.神殿名称 == 神殿名称,
        个人宿舍管理手填表.年份 == 年份,
    ).delete()

    def _to_int(val) -> Optional[int]:
        try:
            if val in (None, ""):
                return None
            return int(str(val))
        except Exception:
            try:
                return int(float(val))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for r in sorted(行列表, key=lambda x: _to_int(_get(x, "序号", "serialNumber")) or 0):
        db.add(
            个人宿舍管理手填表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                序号=_to_int(_get(r, "序号", "serialNumber")) or 0,
                班主任姓名=_get(r, "班主任姓名", "teacherName", text_only=True),
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
