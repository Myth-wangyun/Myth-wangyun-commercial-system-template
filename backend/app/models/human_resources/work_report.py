"""
集团人资基础 - 转正述职报告
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class WorkReport(AccountBase):
    """员工转正述职报告。"""

    __tablename__ = "work_reports"
    __table_args__ = (
        Index("ix_work_reports_reporter_user_id", "reporter_user_id"),
        Index("ix_work_reports_report_date", "report_date"),
        Index("ix_work_reports_reporter_department", "reporter_department"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reporter_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="填写人ID",
    )
    reporter_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="填写人姓名"
    )
    reporter_department: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="填写人部门"
    )
    reporter_position: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="填写人岗位"
    )
    reporter_campus: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="填写人神殿"
    )
    report_date: Mapped[date] = mapped_column(Date, nullable=False, comment="日期")
    work_description: Mapped[str] = mapped_column(
        Text, nullable=False, comment="精彩工作评述"
    )
    difficulties: Mapped[str] = mapped_column(
        Text, nullable=False, comment="工作困难与解决方式"
    )
    achievements: Mapped[str] = mapped_column(
        Text, nullable=False, comment="成功经验总结"
    )
    improvements: Mapped[str] = mapped_column(
        Text, nullable=False, comment="改进方向与措施"
    )
    future_plan: Mapped[str] = mapped_column(
        Text, nullable=False, comment="转正后工作计划"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )
