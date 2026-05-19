"""
集团人资基础 - 转正申请与审批
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
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


class RegularizationApplication(AccountBase):
    """转正申请主表"""

    __tablename__ = "regularization_applications"
    __table_args__ = (
        UniqueConstraint(
            "application_no", name="uq_regularization_applications_application_no"
        ),
        Index("ix_regularization_applications_campus", "campus"),
        Index("ix_regularization_applications_department", "department"),
        Index("ix_regularization_applications_status", "status"),
        Index("ix_regularization_applications_stage", "current_stage"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    fill_date: Mapped[date] = mapped_column(Date, nullable=False, comment="填表日期")
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    department: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="所在部门"
    )
    position: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="试用岗位"
    )
    gender: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="性别"
    )
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
    regular_salary: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="转正工资"
    )
    probation_start: Mapped[date] = mapped_column(
        Date, nullable=False, comment="试用期开始日期"
    )
    probation_end: Mapped[date] = mapped_column(
        Date, nullable=False, comment="试用期结束日期"
    )
    probation_salary: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="试用期工资"
    )
    main_work: Mapped[str] = mapped_column(
        Text, nullable=False, comment="试用期主要工作"
    )
    suggestion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="对学校有何建议"
    )
    self_evaluation: Mapped[str] = mapped_column(
        Text, nullable=False, comment="自我鉴定"
    )

    department_head_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门负责人意见"
    )
    department_head_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="部门负责人是否通过"
    )
    vice_principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="副校长意见"
    )
    vice_principal_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="副校长是否通过"
    )
    hr_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="集团人力资源部意见"
    )
    hr_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="集团人力资源部是否通过"
    )
    principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="校长意见"
    )
    principal_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="校长是否通过"
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

    approval_actions: Mapped[list["RegularizationApplicationApprovalAction"]] = (
        relationship(
            "RegularizationApplicationApprovalAction",
            back_populates="application",
            cascade="all, delete-orphan",
            lazy="selectin",
            order_by="RegularizationApplicationApprovalAction.created_at.asc()",
        )
    )
    notifications: Mapped[list["RegularizationApplicationNotification"]] = relationship(
        "RegularizationApplicationNotification",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RegularizationApplicationNotification.created_at.desc()",
    )


class RegularizationApprovalConfig(AccountBase):
    """转正申请审批配置组。"""

    __tablename__ = "regularization_approval_configs"
    __table_args__ = (
        UniqueConstraint(
            "campus",
            "apply_department",
            "apply_position",
            "stage",
            name="uq_regularization_approval_config_scope",
        ),
        Index("ix_regularization_approval_configs_campus", "campus"),
        Index("ix_regularization_approval_configs_stage", "stage"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿")
    apply_department: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="申请部门，空表示全部",
    )
    apply_position: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="申请职位，空表示全部",
    )
    stage: Mapped[str] = mapped_column(String(50), nullable=False, comment="审批阶段")
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, comment="是否启用"
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

    approvers: Mapped[list["RegularizationApprovalConfigApprover"]] = relationship(
        "RegularizationApprovalConfigApprover",
        back_populates="config",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RegularizationApprovalConfigApprover.sort_order.asc()",
    )


class RegularizationApprovalConfigApprover(AccountBase):
    """转正申请审批配置审批人。"""

    __tablename__ = "regularization_approval_config_approvers"
    __table_args__ = (
        UniqueConstraint(
            "config_id",
            "approver_user_id",
            name="uq_regularization_approval_config_approver",
        ),
        Index("ix_regularization_approval_config_approvers_config_id", "config_id"),
        Index(
            "ix_regularization_approval_config_approvers_user_id", "approver_user_id"
        ),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    config_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.regularization_approval_configs.id", ondelete="CASCADE"),
        nullable=False,
    )
    approver_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="审批人用户ID",
    )
    approver_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="审批人姓名"
    )
    approver_department: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="审批人部门"
    )
    approver_position: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="审批人岗位"
    )
    approver_campus: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="审批人神殿"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="排序"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )

    config: Mapped["RegularizationApprovalConfig"] = relationship(
        "RegularizationApprovalConfig", back_populates="approvers"
    )


class RegularizationApplicationApprovalAction(AccountBase):
    """转正申请审批动作"""

    __tablename__ = "regularization_application_approval_actions"
    __table_args__ = (
        Index(
            "ix_regularization_application_approval_actions_application_id",
            "application_id",
        ),
        Index("ix_regularization_application_approval_actions_stage", "stage"),
        Index(
            "ix_regularization_application_approval_actions_approver_user_id",
            "approver_user_id",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.regularization_applications.id", ondelete="CASCADE"),
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

    application: Mapped["RegularizationApplication"] = relationship(
        "RegularizationApplication", back_populates="approval_actions"
    )


class RegularizationApplicationNotification(AccountBase):
    """转正申请审批通知"""

    __tablename__ = "regularization_application_notifications"
    __table_args__ = (
        Index(
            "ix_regularization_application_notifications_application_id",
            "application_id",
        ),
        Index(
            "ix_regularization_application_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index(
            "ix_regularization_application_notifications_is_read",
            "is_read",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.regularization_applications.id", ondelete="CASCADE"),
        nullable=False,
        comment="转正申请ID",
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

    application: Mapped["RegularizationApplication"] = relationship(
        "RegularizationApplication", back_populates="notifications"
    )
