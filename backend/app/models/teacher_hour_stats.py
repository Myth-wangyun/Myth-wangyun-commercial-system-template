"""
Teacher hour monthly statistics model (academic schema)
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TeacherHourMonthlyStat(AccountBase):
    """Monthly teacher hour statistics stored as JSON."""

    __tablename__ = "teacher_hour_monthly_stats"
    __table_args__ = (
        UniqueConstraint(
            "campus_name",
            "year",
            "month",
            "teacher_name",
            name="uq_teacher_hour_monthly_stat",
        ),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="教员姓名")
    schedule_data: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, comment="课时统计表内容(JSON)")
    teacher_names: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True, comment="当月涉及教员姓名列表")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<TeacherHourMonthlyStat(campus={self.campus_name}, teacher={self.teacher_name}, "
            f"year={self.year}, month={self.month})>"
        )
