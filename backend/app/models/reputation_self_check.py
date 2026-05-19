"""Reputation self check model"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ReputationSelfCheck(AccountBase):
    __tablename__ = "reputation_self_checks"
    __table_args__ = (
        UniqueConstraint(
            "campus_name", "teacher_name", "year", "month", name="uq_reputation_self_check"
        ),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    daily_data: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<ReputationSelfCheck(campus={self.campus_name}, teacher={self.teacher_name}, "
            f"period={self.year}-{self.month})>"
        )
