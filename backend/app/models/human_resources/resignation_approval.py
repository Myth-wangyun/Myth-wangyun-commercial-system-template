"""
集团人资基础 - 离职审批单与审批
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ResignationApproval(AccountBase):
    """离职审批单主表"""

    __tablename__ = "resignation_approvals"
    __table_args__ = (
        UniqueConstraint(
            "application_no", name="uq_resignation_approvals_application_no"
        ),
        Index("ix_resignation_approvals_campus", "campus"),
        Index("ix_resignation_approvals_department", "department"),
        Index("ix_resignation_approvals_status", "status"),
        Index("ix_resignation_approvals_stage", "current_stage"),
        Index("ix_resignation_approvals_leave_date", "leave_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    fill_date: Mapped[date] = mapped_column(Date, nullable=False, comment="填表日期")
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    gender: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="性别"
    )
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    position: Mapped[str] = mapped_column(String(100), nullable=False, comment="岗位")
    entry_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="入职日期"
    )
    contract_end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="合同到期日"
    )
    leave_date: Mapped[date] = mapped_column(Date, nullable=False, comment="离职日期")
    leave_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="离职种类"
    )
    leave_type_other: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="离职种类其他说明"
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False, comment="离职原因")
    employee_sign: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="员工签字"
    )
    employee_sign_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="员工签字日期"
    )

    department_head_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门负责人意见"
    )
    department_head_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="部门负责人是否通过"
    )
    department_head_salary_end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="部门工资结算至"
    )
    hr_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人力资源部意见"
    )
    hr_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="人力资源部是否通过"
    )
    hr_salary_end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="人力资源部工资结算至"
    )
    principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="校长意见"
    )
    principal_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="校长是否通过"
    )
    operations_review_opinion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="最高议事厅运营部总监审批意见",
    )
    operations_review_passed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        comment="最高议事厅运营部总监审批是否通过",
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
        Text, nullable=True, comment="本单自选审批人映射JSON"
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

    approval_actions: Mapped[list["ResignationApprovalAction"]] = relationship(
        "ResignationApprovalAction",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ResignationApprovalAction.created_at.asc()",
    )
    notifications: Mapped[list["ResignationApprovalNotification"]] = relationship(
        "ResignationApprovalNotification",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ResignationApprovalNotification.created_at.desc()",
    )


class ResignationApprovalAction(AccountBase):
    """离职审批单审批动作"""

    __tablename__ = "resignation_approval_actions"
    __table_args__ = (
        Index("ix_resignation_approval_actions_app_id", "application_id"),
        Index("ix_resignation_approval_actions_stage", "stage"),
        Index("ix_resignation_approval_actions_approver_user_id", "approver_user_id"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.resignation_approvals.id", ondelete="CASCADE"),
        nullable=False,
    )
    stage: Mapped[str] = mapped_column(String(50), nullable=False, comment="审批阶段")
    action: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="动作：submit/approve/reject"
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

    application: Mapped["ResignationApproval"] = relationship(
        "ResignationApproval", back_populates="approval_actions"
    )


class ResignationApprovalNotification(AccountBase):
    """离职审批单审批通知"""

    __tablename__ = "resignation_approval_notifications"
    __table_args__ = (
        Index("ix_resignation_approval_notifications_app_id", "application_id"),
        Index(
            "ix_resignation_approval_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index("ix_resignation_approval_notifications_is_read", "is_read"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.resignation_approvals.id", ondelete="CASCADE"),
        nullable=False,
        comment="离职审批单ID",
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

    application: Mapped["ResignationApproval"] = relationship(
        "ResignationApproval", back_populates="notifications"
    )
