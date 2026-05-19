"""
Model for daily new student arrangements
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class NewStudentArrangement(AccountBase):
    __tablename__ = "new_student_arrangements"
    __table_args__ = (
        Index(
            "ix_academic_new_student_arrangements_campus",
            "campus",
            postgresql_using="btree",
        ),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    major: Mapped[str] = mapped_column(String(100), nullable=False)
    duration: Mapped[str] = mapped_column(String(50), nullable=False)
    concerns: Mapped[str | None] = mapped_column(Text, nullable=True)
    receivable_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    received_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    owed_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    expected_payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    teaching_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    teaching_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    enrollment_date: Mapped[date] = mapped_column(Date, nullable=False)
    class_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    planner: Mapped[str | None] = mapped_column(String(100), nullable=True)
    homeroom_teacher: Mapped[str | None] = mapped_column(String(100), nullable=True)
    instructor: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorder: Mapped[str | None] = mapped_column(String(100), nullable=True)
    record_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    arrangement_date: Mapped[date] = mapped_column(Date, nullable=False)
    campus: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<NewStudentArrangement(student={self.student_name}, date={self.arrangement_date})>"
        )
