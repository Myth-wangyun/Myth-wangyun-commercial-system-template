"""
Campus project plan model
"""

from datetime import date, datetime
from typing import Any

from sqlalchemy import Column, Date, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class CampusProjectPlan(AccountBase):
    """Campus project plan for academic reinforcement projects."""

    __tablename__ = "campus_project_plans"
    __table_args__ = (
        UniqueConstraint(
            "campus_name",
            "class_id",
            "project_number",
            name="uq_campus_project_plan",
        ),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    class_id: Mapped[str] = mapped_column(String(100), nullable=False, comment="班级ID")
    class_name: Mapped[str] = mapped_column(String(200), nullable=False, comment="班级名称")
    class_advisor: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="班主任")
    reinforcement_instructor: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="强化教员")
    project_number: Mapped[str] = mapped_column(String(50), nullable=False, comment="项目序号")
    project_name: Mapped[str] = mapped_column(String(200), nullable=False, comment="项目名称")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="项目开始日期")
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="项目结束日期")
    tasks: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment="任务明细(JSON)")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<CampusProjectPlan(campus={self.campus_name}, class={self.class_id}, "
            f"project={self.project_number})>"
        )
