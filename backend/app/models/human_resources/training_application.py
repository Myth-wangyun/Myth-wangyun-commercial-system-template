"""
集团人资基础 - 培训申请表与审批
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TrainingApplication(AccountBase):
    __tablename__ = "training_applications"
    __table_args__ = (
        UniqueConstraint(
            "application_no", name="uq_training_applications_application_no"
        ),
        Index("ix_training_applications_campus", "campus"),
        Index("ix_training_applications_department", "department"),
        Index("ix_training_applications_status", "status"),
        Index("ix_training_applications_stage", "current_stage"),
        Index("ix_training_applications_start_date", "start_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    department: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="申请部门"
    )
    category: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="培训类别"
    )
    objective: Mapped[str] = mapped_column(Text, nullable=False, comment="培训目标")
    trainees: Mapped[str] = mapped_column(Text, nullable=False, comment="参训人员")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="培训内容")
    start_date: Mapped[date] = mapped_column(Date, nullable=False, comment="开始日期")
    end_date: Mapped[date] = mapped_column(Date, nullable=False, comment="结束日期")
    total_hours: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=0, comment="总课时"
    )
    training_format: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="培训形式"
    )
    exam_method: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="考试方式"
    )
    trainer: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="培训讲师"
    )
    expected_pass_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True, comment="拟定通过率"
    )
    cost_per_person: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="培训费单价"
    )
    cost_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="培训人数"
    )
    cost_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="培训费总计"
    )
    cost_other: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="其他费用"
    )
    is_internal_training: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="是否神殿内部培训"
    )
    is_key_staff_training: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="是否干部及骨干员工培训"
    )
    include_chairman_approval: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="是否启用董事长审批"
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    department_head_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="申请部门意见"
    )
    department_head_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="申请部门是否通过"
    )
    principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="校长意见"
    )
    principal_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="校长是否通过"
    )
    group_department_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="集团主管部门意见"
    )
    group_department_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="集团主管部门是否通过"
    )
    hr_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人事部意见"
    )
    hr_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="人事部是否通过"
    )
    chairman_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="董事长意见"
    )
    chairman_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="董事长是否通过"
    )
    is_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="最终是否通过"
    )
    selected_approver_user_ids: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="审批人映射JSON"
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="draft", comment="状态"
    )
    current_stage: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="当前审批阶段"
    )
    rejection_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="驳回原因"
    )
    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="创建人ID",
    )
    created_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="创建人姓名"
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="提交时间"
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="审批完成时间"
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

    approval_actions: Mapped[list["TrainingApplicationApprovalAction"]] = relationship(
        "TrainingApplicationApprovalAction",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="TrainingApplicationApprovalAction.created_at.asc()",
    )
    notifications: Mapped[list["TrainingApplicationNotification"]] = relationship(
        "TrainingApplicationNotification",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="TrainingApplicationNotification.created_at.desc()",
    )


class TrainingApplicationApprovalAction(AccountBase):
    __tablename__ = "training_application_approval_actions"
    __table_args__ = (
        Index("ix_training_application_actions_app_id", "application_id"),
        Index("ix_training_application_actions_stage", "stage"),
        Index("ix_training_application_actions_user_id", "approver_user_id"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.training_applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    stage: Mapped[str] = mapped_column(String(50), nullable=False, comment="审批阶段")
    action: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="submit/approve/reject"
    )
    approver_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="审批人ID",
    )
    approver_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="审批人姓名"
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True, comment="审批意见")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )

    application: Mapped["TrainingApplication"] = relationship(
        "TrainingApplication", back_populates="approval_actions"
    )


class TrainingApplicationNotification(AccountBase):
    __tablename__ = "training_application_notifications"
    __table_args__ = (
        Index("ix_training_application_notifications_app_id", "application_id"),
        Index("ix_training_application_notifications_user_id", "recipient_user_id"),
        Index("ix_training_application_notifications_read", "is_read"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.training_applications.id", ondelete="CASCADE"),
        nullable=False,
        comment="培训申请表ID",
    )
    recipient_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="通知接收人ID",
    )
    notification_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="通知类型"
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="通知标题")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="通知内容")
    stage: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="关联审批阶段"
    )
    action_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="操作人ID",
    )
    action_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="操作人姓名"
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="是否已读"
    )
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="已读时间"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )

    application: Mapped["TrainingApplication"] = relationship(
        "TrainingApplication", back_populates="notifications"
    )
