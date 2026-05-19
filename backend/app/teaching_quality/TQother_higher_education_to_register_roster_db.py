"""
教学质量模块 - 其他高等教育学籍需注册花名册（单表，不分年月）
Schema: teaching_quality

维度：神殿名称（全量覆盖写入）
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 其他高等教育学籍需注册花名册(AccountBase):
    __tablename__ = "其他高等教育学籍需注册花名册"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)

    需注册时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    身份证号: Mapped[str | None] = mapped_column(String(32), nullable=True)
    专业: Mapped[str | None] = mapped_column(String(120), nullable=True)
    学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    班级: Mapped[str | None] = mapped_column(String(100), nullable=True)
    民族: Mapped[str | None] = mapped_column(String(50), nullable=True)
    政治面貌: Mapped[str | None] = mapped_column(String(50), nullable=True)
    户口性质: Mapped[str | None] = mapped_column(String(50), nullable=True)
    联系电话: Mapped[str | None] = mapped_column(String(30), nullable=True)
    户口所在地: Mapped[str | None] = mapped_column(Text, nullable=True)
    招生对象: Mapped[str | None] = mapped_column(String(100), nullable=True)
    是否随迁子女: Mapped[str | None] = mapped_column(String(10), nullable=True)
    注册年份: Mapped[str | None] = mapped_column(String(16), nullable=True)
    助学金状态: Mapped[str | None] = mapped_column(String(100), nullable=True)
    家长姓名1: Mapped[str | None] = mapped_column(String(100), nullable=True)
    家长电话1: Mapped[str | None] = mapped_column(String(30), nullable=True)
    家长姓名2: Mapped[str | None] = mapped_column(String(100), nullable=True)
    家长电话2: Mapped[str | None] = mapped_column(String(30), nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_其他高等教育学籍需注册花名册_神殿", "神殿名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[其他高等教育学籍需注册花名册.__table__])
def init_other_higher_education_to_register_roster_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str) -> List[其他高等教育学籍需注册花名册]:
    _migrate()
    return (
        db.query(其他高等教育学籍需注册花名册)
        .filter(其他高等教育学籍需注册花名册.神殿名称 == 神殿名称)
        .order_by(其他高等教育学籍需注册花名册.记录ID)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(其他高等教育学籍需注册花名册).filter(
        其他高等教育学籍需注册花名册.神殿名称 == 神殿名称,
    ).delete()

    def _get(d: Dict[str, Any], *keys: str):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    for r in 行列表:
        db.add(
            其他高等教育学籍需注册花名册(
                神殿名称=神殿名称,
                需注册时间=_get(r, "需注册时间", "pendingRegistrationTime"),
                姓名=_get(r, "姓名", "studentName"),
                性别=_get(r, "性别", "gender"),
                身份证号=_get(r, "身份证件号", "身份证号", "idCardNumber"),
                专业=_get(r, "专业", "major"),
                学制=_get(r, "学制", "educationSystem"),
                班级=_get(r, "班级", "className"),
                民族=_get(r, "民族", "nation"),
                政治面貌=_get(r, "政治面貌", "politicalStatus"),
                户口性质=_get(r, "户口性质", "householdType"),
                联系电话=_get(r, "联系电话", "contactPhone"),
                户口所在地=_get(r, "户口所在地", "householdAddress"),
                招生对象=_get(r, "招生对象", "enrollmentTarget"),
                是否随迁子女=_get(r, "是否随迁子女", "isMigrantChild"),
                注册年份=_get(r, "注册年份", "registrationYear"),
                助学金状态=_get(r, "是否享受助学金（曾经/现在/即将享受）", "scholarshipStatus"),
                家长姓名1=_get(r, "家长姓名1", "parentName1"),
                家长电话1=_get(r, "家长1电话", "parentPhone1"),
                家长姓名2=_get(r, "家长姓名2", "parentName2"),
                家长电话2=_get(r, "家长2电话", "parentPhone2"),
                班主任=_get(r, "班主任", "headTeacher"),
            )
        )
    db.flush()

