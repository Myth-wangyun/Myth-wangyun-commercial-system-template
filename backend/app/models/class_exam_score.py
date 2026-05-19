"""
Model for class exam scores
"""

from datetime import date, datetime
from typing import Any

from sqlalchemy import Column, Date, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ClassExamScore(AccountBase):
    __tablename__ = "class_exam_scores"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    major_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    instructor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    first_exam_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    makeup_exam_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    class_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pass_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scores_first: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)
    scores_makeup: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)
    scores_final: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
