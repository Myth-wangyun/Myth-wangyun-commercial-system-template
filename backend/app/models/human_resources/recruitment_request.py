"""
集团人资基础 - 招聘需求申请与审批配置
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


class RecruitmentApprovalConfig(AccountBase):
    """招聘审批配置组"""

    __tablename__ = "recruitment_approval_configs"
    __table_args__ = (
        UniqueConstraint(
            "campus",
            "apply_department",
            "apply_position",
            "stage",
            name="uq_recruitment_approval_config_scope",
        ),
        Index("ix_recruitment_approval_configs_campus", "campus"),
        Index("ix_recruitment_approval_configs_stage", "stage"),
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

    approvers: Mapped[list["RecruitmentApprovalConfigApprover"]] = relationship(
        "RecruitmentApprovalConfigApprover",
        back_populates="config",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RecruitmentApprovalConfigApprover.sort_order.asc()",
    )


class RecruitmentApprovalConfigApprover(AccountBase):
    """招聘审批配置审批人"""

    __tablename__ = "recruitment_approval_config_approvers"
    __table_args__ = (
        UniqueConstraint(
            "config_id",
            "approver_user_id",
            name="uq_recruitment_approval_config_approver",
        ),
        Index("ix_recruitment_approval_config_approvers_config_id", "config_id"),
        Index(
            "ix_recruitment_approval_config_approvers_user_id",
            "approver_user_id",
        ),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    config_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.recruitment_approval_configs.id", ondelete="CASCADE"),
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

    config: Mapped["RecruitmentApprovalConfig"] = relationship(
        "RecruitmentApprovalConfig", back_populates="approvers"
    )


class RecruitmentRequest(AccountBase):
    """招聘需求申请主表"""

    __tablename__ = "recruitment_requests"
    __table_args__ = (
        UniqueConstraint("request_no", name="uq_recruitment_requests_request_no"),
        Index("ix_recruitment_requests_campus", "campus"),
        Index("ix_recruitment_requests_department", "department"),
        Index("ix_recruitment_requests_status", "status"),
        Index("ix_recruitment_requests_stage", "current_stage"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_no: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="申请单号"
    )
    campus: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="所属神殿"
    )
    apply_date: Mapped[date] = mapped_column(Date, nullable=False, comment="申请日期")
    department: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="申请部门"
    )
    position: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="申请职位"
    )
    headcount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, comment="申请人数"
    )
    reason: Mapped[str] = mapped_column(String(50), nullable=False, comment="申请原因")
    expected_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="希望到职日期"
    )
    gender: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="性别要求"
    )
    age: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="年龄要求"
    )
    marital_status: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="婚否要求"
    )
    education: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="学历要求"
    )
    major: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="专业要求"
    )
    skills_experience: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="技能及工作经验"
    )
    suggested_salary: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="建议薪金"
    )
    job_responsibilities: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="岗位职责"
    )
    analysis_and_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="工作分析及增员理由"
    )
    internal_candidate_has: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="内部有无人选"
    )
    internal_candidate_department: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="内部候选人部门"
    )
    internal_candidate_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="内部候选人姓名"
    )

    dept_manager_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="部门负责人意见"
    )
    principal_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="校长意见"
    )
    hr_director_opinion: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="人资总监意见"
    )
    chairman_approval: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="董事长签批"
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

    approval_actions: Mapped[list["RecruitmentRequestApprovalAction"]] = relationship(
        "RecruitmentRequestApprovalAction",
        back_populates="request",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RecruitmentRequestApprovalAction.created_at.asc()",
    )
    notifications: Mapped[list["RecruitmentRequestNotification"]] = relationship(
        "RecruitmentRequestNotification",
        back_populates="request",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RecruitmentRequestNotification.created_at.desc()",
    )


class RecruitmentRequestApprovalAction(AccountBase):
    """招聘需求申请审批动作"""

    __tablename__ = "recruitment_request_approval_actions"
    __table_args__ = (
        Index("ix_recruitment_request_approval_actions_request_id", "request_id"),
        Index("ix_recruitment_request_approval_actions_stage", "stage"),
        Index(
            "ix_recruitment_request_approval_actions_approver_user_id",
            "approver_user_id",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.recruitment_requests.id", ondelete="CASCADE"),
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

    request: Mapped["RecruitmentRequest"] = relationship(
        "RecruitmentRequest", back_populates="approval_actions"
    )


class RecruitmentRequestNotification(AccountBase):
    """招聘需求申请审批通知"""

    __tablename__ = "recruitment_request_notifications"
    __table_args__ = (
        Index("ix_recruitment_request_notifications_request_id", "request_id"),
        Index(
            "ix_recruitment_request_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index(
            "ix_recruitment_request_notifications_is_read",
            "is_read",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("humanresources.recruitment_requests.id", ondelete="CASCADE"),
        nullable=False,
        comment="招聘申请ID",
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

    request: Mapped["RecruitmentRequest"] = relationship(
        "RecruitmentRequest", back_populates="notifications"
    )
