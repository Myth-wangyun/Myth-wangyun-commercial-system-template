"""
Model for class project grade register
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ProjectGradeRegister(AccountBase):
    __tablename__ = "project_grade_registers"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    major_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False)
    project_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    class_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    actual_submissions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pass_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    project_names: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    project_attempt_dates: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    rater_names: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    students: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
