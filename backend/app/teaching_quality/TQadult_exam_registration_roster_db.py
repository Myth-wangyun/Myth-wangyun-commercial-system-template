"""
教学质量模块 - 成考学籍注册花名册（单表，按月）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 序号（唯一）
字段参考前端 4-adult-exam-registration-roster.tsx
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 成考学籍注册花名册(AccountBase):
    __tablename__ = "成考学籍注册花名册"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    身份证号: Mapped[str | None] = mapped_column(String(32), nullable=True)
    学校名称: Mapped[str | None] = mapped_column(String(200), nullable=True)
    注册时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    毕业时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    学号: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学籍号: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    学习形式: Mapped[str | None] = mapped_column(String(50), nullable=True)
    联系电话: Mapped[str | None] = mapped_column(String(30), nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_成考花名册_神殿年份月份序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_成考花名册_神殿年份月份", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[成考学籍注册花名册.__table__])
def init_adult_exam_registration_roster_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[成考学籍注册花名册]:
    _migrate()
    return (
        db.query(成考学籍注册花名册)
        .filter(
            成考学籍注册花名册.神殿名称 == 神殿名称,
            成考学籍注册花名册.年份 == 年份,
            成考学籍注册花名册.月份 == 月份,
        )
        .order_by(成考学籍注册花名册.序号)
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
    _migrate()
    db.query(成考学籍注册花名册).filter(
        成考学籍注册花名册.神殿名称 == 神殿名称,
        成考学籍注册花名册.年份 == 年份,
        成考学籍注册花名册.月份 == 月份,
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
        db.add(
            成考学籍注册花名册(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=_to_int(_get(r, "序号", "serialNumber")) or 0,
                姓名=_get(r, "姓名", "studentName", text_only=True),
                性别=_get(r, "性别", "gender", text_only=True),
                身份证号=_get(r, "身份证件号", "idCardNumber", text_only=True),
                学校名称=_get(r, "学校名称", "schoolName", text_only=True),
                注册时间=_get(r, "注册时间", "registrationTime", text_only=True),
                毕业时间=_get(r, "毕业时间", "graduationTime", text_only=True),
                学号=_get(r, "学号", "studentNumber", text_only=True),
                学籍号=_get(r, "学籍号", "studentRecordNumber", text_only=True),
                学制=_get(r, "学制", "educationSystem", text_only=True),
                学习形式=_get(r, "学习形式", "studyMode", text_only=True),
                联系电话=_get(r, "联系电话", "contactPhone", text_only=True),
                班主任=_get(r, "班主任", "headTeacher", text_only=True),
            )
        )
    db.flush()
