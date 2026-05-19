"""
集团人资基础 - 培训成绩汇总表模型。
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TrainingResult(AccountBase):
    """培训成绩汇总表主表。"""

    __tablename__ = "training_results"
    __table_args__ = (
        Index("ix_training_results_year", "year"),
        Index("ix_training_results_campus", "campus"),
        Index("ix_training_results_department", "department"),
        Index("ix_training_results_training_date", "training_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿")
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    training_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="培训日期"
    )
    training_hours: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, comment="培训时长（小时）"
    )
    expected_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="应参加人数"
    )
    actual_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="实际参加人数"
    )
    pass_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="合格人数"
    )
    fail_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="不合格人数"
    )
    average_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, comment="平均分"
    )
    total_cost: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, comment="总花费"
    )
    average_cost: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, comment="人均成本"
    )
    pass_rate: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, comment="合格率"
    )
    trainees_json: Mapped[str] = mapped_column(
        Text, nullable=False, comment="参训人员成绩明细 JSON"
    )
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment="年度")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="创建人ID"
    )
    created_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="创建人姓名"
    )
    source_application_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("humanresources.training_applications.id", ondelete="SET NULL"),
        nullable=True,
        comment="来源培训申请ID",
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
