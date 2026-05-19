"""
集团人资基础 - 员工档案关键字段变更日志
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class EmployeeArchiveChangeLog(AccountBase):
    """记录员工档案中基础薪资、绩效薪资、人事变动的每次变化。"""

    __tablename__ = "employee_archive_change_logs"
    __table_args__ = (
        Index("ix_employee_archive_change_logs_employee_id", "employee_id"),
        Index("ix_employee_archive_change_logs_field_name", "field_name"),
        Index("ix_employee_archive_change_logs_created_at", "created_at"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.employees.id", ondelete="CASCADE"),
        nullable=False,
        comment="员工档案ID",
    )
    field_name: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="变更字段名"
    )
    old_value: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="变更前值"
    )
    new_value: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="变更后值"
    )
    change_source: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="变更来源"
    )
    source_record_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="来源记录ID"
    )
    changed_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="变更操作人ID",
    )
    changed_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="变更操作人姓名"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )

