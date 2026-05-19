"""
集团人资基础 - 工作交接表与审批
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


class WorkHandover(AccountBase):
    """工作交接表主表"""

    __tablename__ = "work_handovers"
    __table_args__ = (
        UniqueConstraint("application_no", name="uq_work_handovers_application_no"),
        Index("ix_work_handovers_campus", "campus"),
        Index("ix_work_handovers_department", "department"),
        Index("ix_work_handovers_status", "status"),
        Index("ix_work_handovers_stage", "current_stage"),
        Index("ix_work_handovers_leave_date", "leave_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    department: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="原部门"
    )
    position: Mapped[str] = mapped_column(String(100), nullable=False, comment="原职务")
    entry_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="入职时间"
    )
    phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="联系方式"
    )
    email: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="常用邮箱"
    )
    leave_date: Mapped[date] = mapped_column(Date, nullable=False, comment="离职时间")
    leave_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="离职类型"
    )
    leave_type_other: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="离职类型其他说明"
    )
    leave_reason_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="离职原因JSON"
    )
    leave_reason_other: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="离职原因其他说明"
    )
    address: Mapped[str | None] = mapped_column(Text, nullable=True, comment="联系地址")
    dept_handover_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="所属部门工作交接JSON"
    )
    finance_handover_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="神藏司交接JSON"
    )
    hr_handover_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人事行政部交接JSON"
    )
    all_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="全部手续办理完毕"
    )
    principal_sign: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="校长签字"
    )
    principal_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="校长签字日期"
    )

    department_head_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门负责人意见"
    )
    department_head_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="部门负责人是否通过"
    )
    operations_review_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="最高议事厅运营部总监审批意见"
    )
    operations_review_passed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        comment="最高议事厅运营部总监审批是否通过",
    )
    academic_review_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="最高议事厅智慧司总监审批意见"
    )
    academic_review_passed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        comment="最高议事厅智慧司总监审批是否通过",
    )
    teaching_quality_review_opinion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="最高议事厅教化司总监审批意见",
    )
    teaching_quality_review_passed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        comment="最高议事厅教化司总监审批是否通过",
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

    approval_actions: Mapped[list["WorkHandoverApprovalAction"]] = relationship(
        "WorkHandoverApprovalAction",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="WorkHandoverApprovalAction.created_at.asc()",
    )
    notifications: Mapped[list["WorkHandoverNotification"]] = relationship(
        "WorkHandoverNotification",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="WorkHandoverNotification.created_at.desc()",
    )


class WorkHandoverApprovalAction(AccountBase):
    """工作交接表审批动作"""

    __tablename__ = "work_handover_approval_actions"
    __table_args__ = (
        Index("ix_work_handover_approval_actions_app_id", "application_id"),
        Index("ix_work_handover_approval_actions_stage", "stage"),
        Index("ix_work_handover_approval_actions_approver_user_id", "approver_user_id"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.work_handovers.id", ondelete="CASCADE"),
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

    application: Mapped["WorkHandover"] = relationship(
        "WorkHandover", back_populates="approval_actions"
    )


class WorkHandoverNotification(AccountBase):
    """工作交接表审批通知"""

    __tablename__ = "work_handover_notifications"
    __table_args__ = (
        Index("ix_work_handover_notifications_app_id", "application_id"),
        Index("ix_work_handover_notifications_recipient_user_id", "recipient_user_id"),
        Index("ix_work_handover_notifications_is_read", "is_read"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.work_handovers.id", ondelete="CASCADE"),
        nullable=False,
        comment="工作交接表ID",
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

    application: Mapped["WorkHandover"] = relationship(
        "WorkHandover", back_populates="notifications"
    )
