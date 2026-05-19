"""
Model for press interview header configuration
"""
from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class PressInterviewHeaderConfig(AccountBase):
    __tablename__ = "press_interview_header_configs"
    __table_args__ = (
        UniqueConstraint("campus_name", "class_name", "project_number", name="uq_header_config"),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    project_number: Mapped[int] = mapped_column(Integer, nullable=False)
    header_config: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)  # {instructor1: "张建新评分", instructor2: "...", ...}
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
