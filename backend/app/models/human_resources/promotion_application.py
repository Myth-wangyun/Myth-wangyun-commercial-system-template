"""
集团人资基础 - 晋升申请与审批
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


class PromotionApplication(AccountBase):
    """晋升申请主表"""

    __tablename__ = "promotion_applications"
    __table_args__ = (
        UniqueConstraint(
            "application_no", name="uq_promotion_applications_application_no"
        ),
        Index("ix_promotion_applications_campus", "campus"),
        Index("ix_promotion_applications_department", "department"),
        Index("ix_promotion_applications_status", "status"),
        Index("ix_promotion_applications_stage", "current_stage"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    fill_date: Mapped[date] = mapped_column(Date, nullable=False, comment="填表日期")
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    native_place: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="籍贯"
    )
    age: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="年龄")
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
    department: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="所在部门"
    )
    position: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="当前岗位"
    )
    work_overview: Mapped[str] = mapped_column(Text, nullable=False, comment="工作概况")
    promotion_reason: Mapped[str] = mapped_column(
        Text, nullable=False, comment="晋升理由"
    )
    confidence_and_expectation: Mapped[str] = mapped_column(
        Text, nullable=False, comment="晋升信心与期望"
    )
    original_level: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="原职级"
    )
    original_salary: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="原薪资标准"
    )
    promoted_level: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="晋升职级"
    )
    promoted_base_salary: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="晋升后基础薪资"
    )
    promoted_performance_salary: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="晋升后绩效薪资"
    )
    promoted_salary: Mapped[float | None] = mapped_column(
        Float, nullable=True, comment="晋升后薪资标准"
    )

    department_manager_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门主管意见"
    )
    department_manager_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="部门主管是否通过"
    )
    principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="校长意见"
    )
    principal_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="校长是否通过"
    )
    biz_director_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="业务条线总监意见"
    )
    biz_director_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="业务条线总监是否通过"
    )
    hr_director_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人资总监意见"
    )
    hr_director_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="人资总监是否通过"
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

    approval_actions: Mapped[list["PromotionApplicationApprovalAction"]] = relationship(
        "PromotionApplicationApprovalAction",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="PromotionApplicationApprovalAction.created_at.asc()",
    )
    notifications: Mapped[list["PromotionApplicationNotification"]] = relationship(
        "PromotionApplicationNotification",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="PromotionApplicationNotification.created_at.desc()",
    )


class PromotionApprovalConfig(AccountBase):
    """晋升申请审批配置组。"""

    __tablename__ = "promotion_approval_configs"
    __table_args__ = (
        UniqueConstraint(
            "campus",
            "apply_department",
            "apply_position",
            "stage",
            name="uq_promotion_approval_config_scope",
        ),
        Index("ix_promotion_approval_configs_campus", "campus"),
        Index("ix_promotion_approval_configs_stage", "stage"),
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

    approvers: Mapped[list["PromotionApprovalConfigApprover"]] = relationship(
        "PromotionApprovalConfigApprover",
        back_populates="config",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="PromotionApprovalConfigApprover.sort_order.asc()",
    )


class PromotionApprovalConfigApprover(AccountBase):
    """晋升申请审批配置审批人。"""

    __tablename__ = "promotion_approval_config_approvers"
    __table_args__ = (
        UniqueConstraint(
            "config_id",
            "approver_user_id",
            name="uq_promotion_approval_config_approver",
        ),
        Index("ix_promotion_approval_config_approvers_config_id", "config_id"),
        Index("ix_promotion_approval_config_approvers_user_id", "approver_user_id"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    config_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.promotion_approval_configs.id", ondelete="CASCADE"),
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

    config: Mapped["PromotionApprovalConfig"] = relationship(
        "PromotionApprovalConfig", back_populates="approvers"
    )


class PromotionApplicationApprovalAction(AccountBase):
    """晋升申请审批动作"""

    __tablename__ = "promotion_application_approval_actions"
    __table_args__ = (
        Index(
            "ix_promotion_application_approval_actions_application_id", "application_id"
        ),
        Index("ix_promotion_application_approval_actions_stage", "stage"),
        Index(
            "ix_promotion_application_approval_actions_approver_user_id",
            "approver_user_id",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.promotion_applications.id", ondelete="CASCADE"),
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

    application: Mapped["PromotionApplication"] = relationship(
        "PromotionApplication", back_populates="approval_actions"
    )


class PromotionApplicationNotification(AccountBase):
    """晋升申请审批通知"""

    __tablename__ = "promotion_application_notifications"
    __table_args__ = (
        Index(
            "ix_promotion_application_notifications_application_id", "application_id"
        ),
        Index(
            "ix_promotion_application_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index("ix_promotion_application_notifications_is_read", "is_read"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.promotion_applications.id", ondelete="CASCADE"),
        nullable=False,
        comment="晋升申请ID",
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

    application: Mapped["PromotionApplication"] = relationship(
        "PromotionApplication", back_populates="notifications"
    )
