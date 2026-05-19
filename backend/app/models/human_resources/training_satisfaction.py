"""
集团人资基础 - 培训满意度调查模型。

存储约束：
- 业务数据存放在 `humanresources` schema
- 表名：`training_satisfaction_surveys`
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TrainingSatisfactionSurvey(AccountBase):
    """培训满意度调查主表。"""

    __tablename__ = "training_satisfaction_surveys"
    __table_args__ = (
        Index("ix_training_satisfaction_surveys_year", "year"),
        Index("ix_training_satisfaction_surveys_department", "department"),
        Index("ix_training_satisfaction_surveys_training_date", "training_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    training_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="培训日期"
    )
    training_location: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="培训地点"
    )
    course_content: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="课程内容"
    )
    trainer: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="培训讲师"
    )

    scores_json: Mapped[str] = mapped_column(
        Text, nullable=False, comment="14项评分JSON"
    )
    course_content_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="课程内容合计"
    )
    trainer_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="培训师合计"
    )
    training_method_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="培训方式合计"
    )
    total_score: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="总分"
    )

    open_q4: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="最大收获及需要改善的地方"
    )
    open_q5: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="希望多久接受一次培训"
    )
    open_q6: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="对当前培训工作的改进建议"
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
