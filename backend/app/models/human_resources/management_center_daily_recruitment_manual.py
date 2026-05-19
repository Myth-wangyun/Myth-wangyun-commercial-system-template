"""
最高议事厅日度核心数据看板 - 招聘及入职手填数据模型。
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ManagementCenterDailyRecruitmentManual(AccountBase):
    """最高议事厅日度招聘及入职手填记录。"""

    __tablename__ = "management_center_daily_recruitment_manuals"
    __table_args__ = (
        UniqueConstraint(
            "stat_date",
            "department",
            name="uq_management_center_daily_recruitment_manuals_date_department",
        ),
        Index(
            "ix_management_center_daily_recruitment_manuals_stat_date",
            "stat_date",
        ),
        Index(
            "ix_management_center_daily_recruitment_manuals_department",
            "department",
        ),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    stat_date: Mapped[date] = mapped_column(Date, nullable=False, comment="统计日期")
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    authorized_posts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="编制职数")
    current_posts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="现有职数")
    planned_optimize_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="计划优化人数")
    actual_optimize_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="实际优化人数")
    transfer_names_json: Mapped[str | None] = mapped_column(Text, nullable=True, comment="调岗人员名单JSON")
    optimize_names_json: Mapped[str | None] = mapped_column(Text, nullable=True, comment="优化人员名单JSON")
    resign_names_json: Mapped[str | None] = mapped_column(Text, nullable=True, comment="离职人员名单JSON")
    updated_by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="最后更新人ID")
    updated_by_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="最后更新人姓名")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )
