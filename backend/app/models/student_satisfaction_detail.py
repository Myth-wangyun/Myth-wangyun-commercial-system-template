"""
学员满意度个人详细表
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class StudentSatisfactionDetail(AccountBase):
    __tablename__ = "student_satisfaction_details"
    __table_args__ = (
        UniqueConstraint(
            "campus_name",
            "year",
            "teacher_name",
            "class_name",
            name="uq_student_satisfaction_details_campus_year_teacher_class",
        ),
        {"schema": "academic"},
    )

    class_name: Mapped[str] = mapped_column(String(100), nullable=False, default='')

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False, default=2025)
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False)
    rows: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
