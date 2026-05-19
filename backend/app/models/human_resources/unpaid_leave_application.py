"""
集团人资基础 - 停薪留职申请与审批
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


class UnpaidLeaveApplication(AccountBase):
    """停薪留职申请主表"""

    __tablename__ = "unpaid_leave_applications"
    __table_args__ = (
        UniqueConstraint(
            "application_no", name="uq_unpaid_leave_applications_application_no"
        ),
        Index("ix_unpaid_leave_applications_campus", "campus"),
        Index("ix_unpaid_leave_applications_department", "department"),
        Index("ix_unpaid_leave_applications_status", "status"),
        Index("ix_unpaid_leave_applications_stage", "current_stage"),
        Index("ix_unpaid_leave_applications_fill_date", "fill_date"),
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
    position: Mapped[str] = mapped_column(String(100), nullable=False, comment="职位")
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
    birth_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="出生年月"
    )
    phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="联系方式"
    )
    email: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="电子邮箱"
    )
    home_address: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="家庭住址"
    )
    current_address: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="现住址"
    )
    reason: Mapped[str] = mapped_column(
        Text, nullable=False, comment="申请停薪留职的理由以及期限"
    )

    department_head_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门主管意见"
    )
    department_head_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="部门主管是否通过"
    )
    biz_director_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="业务条线总监意见"
    )
    biz_director_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="业务条线总监是否通过"
    )
    hr_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人资部意见"
    )
    hr_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="人资部是否通过"
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

    approval_actions: Mapped[list["UnpaidLeaveApplicationApprovalAction"]] = (
        relationship(
            "UnpaidLeaveApplicationApprovalAction",
            back_populates="application",
            cascade="all, delete-orphan",
            lazy="selectin",
            order_by="UnpaidLeaveApplicationApprovalAction.created_at.asc()",
        )
    )
    notifications: Mapped[list["UnpaidLeaveApplicationNotification"]] = relationship(
        "UnpaidLeaveApplicationNotification",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="UnpaidLeaveApplicationNotification.created_at.desc()",
    )


class UnpaidLeaveApplicationApprovalAction(AccountBase):
    """停薪留职申请审批动作"""

    __tablename__ = "unpaid_leave_application_approval_actions"
    __table_args__ = (
        Index("ix_unpaid_leave_application_approval_actions_app_id", "application_id"),
        Index("ix_unpaid_leave_application_approval_actions_stage", "stage"),
        Index(
            "ix_unpaid_leave_application_approval_actions_approver_user_id",
            "approver_user_id",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.unpaid_leave_applications.id", ondelete="CASCADE"),
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

    application: Mapped["UnpaidLeaveApplication"] = relationship(
        "UnpaidLeaveApplication", back_populates="approval_actions"
    )


class UnpaidLeaveApplicationNotification(AccountBase):
    """停薪留职申请审批通知"""

    __tablename__ = "unpaid_leave_application_notifications"
    __table_args__ = (
        Index("ix_unpaid_leave_application_notifications_app_id", "application_id"),
        Index(
            "ix_unpaid_leave_application_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index(
            "ix_unpaid_leave_application_notifications_is_read",
            "is_read",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.unpaid_leave_applications.id", ondelete="CASCADE"),
        nullable=False,
        comment="停薪留职申请ID",
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

    application: Mapped["UnpaidLeaveApplication"] = relationship(
        "UnpaidLeaveApplication", back_populates="notifications"
    )
