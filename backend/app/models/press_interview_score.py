"""
Model for class press interview scores
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class PressInterviewScore(AccountBase):
    __tablename__ = "press_interview_scores"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    major_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    instructor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    student_id: Mapped[str] = mapped_column(String(100), nullable=False)
    student_name: Mapped[str] = mapped_column(String(100), nullable=False)
    project_scores: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)
    header_config: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True, default=dict)  # 表头配置：{project_number: {instructor1: "...", instructor2: "...", ...}}
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
