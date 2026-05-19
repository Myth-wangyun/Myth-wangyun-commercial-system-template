"""
集团人资基础 - 员工社保办理申请与审批配置模型。

存储约束：
- 业务主表存放在 `humanresources` schema
- 审批配置存放在 `config` schema
- 审批动作与通知存放在 `public` schema
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


class SocialInsuranceApprovalConfig(AccountBase):
    """社保办理审批配置组。"""

    __tablename__ = "social_insurance_approval_configs"
    __table_args__ = (
        UniqueConstraint(
            "campus",
            "apply_department",
            "apply_position",
            "stage",
            name="uq_social_insurance_approval_config_scope",
        ),
        Index("ix_social_insurance_approval_configs_campus", "campus"),
        Index("ix_social_insurance_approval_configs_stage", "stage"),
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

    approvers: Mapped[list["SocialInsuranceApprovalConfigApprover"]] = relationship(
        "SocialInsuranceApprovalConfigApprover",
        back_populates="config",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SocialInsuranceApprovalConfigApprover.sort_order.asc()",
    )


class SocialInsuranceApprovalConfigApprover(AccountBase):
    """社保办理审批配置审批人。"""

    __tablename__ = "social_insurance_approval_config_approvers"
    __table_args__ = (
        UniqueConstraint(
            "config_id",
            "approver_user_id",
            name="uq_social_insurance_approval_config_approver",
        ),
        Index("ix_social_insurance_approval_config_approvers_config_id", "config_id"),
        Index(
            "ix_social_insurance_approval_config_approvers_user_id", "approver_user_id"
        ),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    config_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.social_insurance_approval_configs.id", ondelete="CASCADE"),
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

    config: Mapped["SocialInsuranceApprovalConfig"] = relationship(
        "SocialInsuranceApprovalConfig", back_populates="approvers"
    )


class SocialInsuranceApplication(AccountBase):
    """员工社保办理申请主表。"""

    __tablename__ = "social_insurance_applications"
    __table_args__ = (
        UniqueConstraint(
            "application_no",
            name="uq_social_insurance_applications_application_no",
        ),
        Index("ix_social_insurance_applications_campus", "campus"),
        Index("ix_social_insurance_applications_department", "department"),
        Index("ix_social_insurance_applications_status", "status"),
        Index("ix_social_insurance_applications_stage", "current_stage"),
        Index("ix_social_insurance_applications_fill_date", "fill_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    fill_date: Mapped[date] = mapped_column(Date, nullable=False, comment="填单日期")
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    account_no: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="户号"
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    position: Mapped[str] = mapped_column(String(100), nullable=False, comment="职位")
    phone: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="手机号（本人名下）"
    )
    id_number: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="身份证号"
    )
    household_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="户口性质"
    )
    id_expiry: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="身份证有效期"
    )
    hire_date: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
    registered_address: Mapped[str] = mapped_column(
        Text, nullable=False, comment="户籍所在地"
    )
    prev_payment_place: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="原缴费地"
    )
    prev_payment_type: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="原缴费类型"
    )
    prev_payment_base: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="原缴费基数"
    )
    insurance_type: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="缴费类型"
    )

    dept_manager_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门主管意见"
    )
    hr_payment_content: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="缴费内容"
    )
    hr_payment_base: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="缴费基数"
    )
    hr_start_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="缴费起始日期"
    )
    hr_insurance_place: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="社保办理地"
    )
    hr_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人事部意见"
    )
    principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="校长意见"
    )
    chairman_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="董事长意见"
    )
    selected_approver_user_ids: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="本单自选审批人映射JSON"
    )

    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
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

    approval_actions: Mapped[list["SocialInsuranceApplicationApprovalAction"]] = (
        relationship(
            "SocialInsuranceApplicationApprovalAction",
            back_populates="application",
            cascade="all, delete-orphan",
            lazy="selectin",
            order_by="SocialInsuranceApplicationApprovalAction.created_at.asc()",
        )
    )
    notifications: Mapped[list["SocialInsuranceApplicationNotification"]] = (
        relationship(
            "SocialInsuranceApplicationNotification",
            back_populates="application",
            cascade="all, delete-orphan",
            lazy="selectin",
            order_by="SocialInsuranceApplicationNotification.created_at.desc()",
        )
    )


class SocialInsuranceApplicationApprovalAction(AccountBase):
    """员工社保办理申请审批动作。"""

    __tablename__ = "social_insurance_application_approval_actions"
    __table_args__ = (
        Index(
            "ix_social_insurance_application_approval_actions_app_id", "application_id"
        ),
        Index("ix_social_insurance_application_approval_actions_stage", "stage"),
        Index(
            "ix_si_app_approval_actions_approver_uid",
            "approver_user_id",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "humanresources.social_insurance_applications.id", ondelete="CASCADE"
        ),
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

    application: Mapped["SocialInsuranceApplication"] = relationship(
        "SocialInsuranceApplication", back_populates="approval_actions"
    )


class SocialInsuranceApplicationNotification(AccountBase):
    """员工社保办理申请审批通知。"""

    __tablename__ = "social_insurance_application_notifications"
    __table_args__ = (
        Index("ix_social_insurance_application_notifications_app_id", "application_id"),
        Index(
            "ix_social_insurance_application_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index(
            "ix_social_insurance_application_notifications_is_read",
            "is_read",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "humanresources.social_insurance_applications.id", ondelete="CASCADE"
        ),
        nullable=False,
        comment="社保申请ID",
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
        comment="触发通知的操作人ID",
    )
    action_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="触发通知的操作人姓名"
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="是否已读"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="已读时间"
    )

    application: Mapped["SocialInsuranceApplication"] = relationship(
        "SocialInsuranceApplication", back_populates="notifications"
    )
