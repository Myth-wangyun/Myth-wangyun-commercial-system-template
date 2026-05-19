"""
班作业成绩表
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ClassAssignmentGrade(AccountBase):
    __tablename__ = "class_assignment_grades"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    major_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assignment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expected_submit: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    actual_submit: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unsubmitted_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pass_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    submit_rate: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    pass_rate: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    records: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
