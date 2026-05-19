"""
Salary prediction sheet for classes
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class SalaryPrediction(AccountBase):
    __tablename__ = "salary_predictions"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    major_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_teacher_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reinforcement_teacher_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    records: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    exam_headers: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    project_pairs: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
