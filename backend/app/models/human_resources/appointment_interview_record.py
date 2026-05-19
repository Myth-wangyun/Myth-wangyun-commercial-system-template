"""
集团人资基础 - 任命访谈记录表模型。
"""

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class AppointmentInterviewRecord(AccountBase):
    """任命访谈记录表主表。"""

    __tablename__ = "appointment_interview_records"
    __table_args__ = (
        Index("ix_appointment_interview_records_campus", "campus"),
        Index("ix_appointment_interview_records_interviewer", "interviewer"),
        Index("ix_appointment_interview_records_interviewee", "interviewee"),
        Index("ix_appointment_interview_records_status", "status"),
        Index("ix_appointment_interview_records_current_stage", "current_stage"),
        Index("ix_appointment_interview_records_interview_date", "interview_date"),
        Index(
            "ix_appointment_interview_records_source_application_id",
            "source_application_id",
        ),
        Index(
            "uq_appointment_interview_records_source_promotion_interview_id",
            "source_promotion_interview_id",
            unique=True,
        ),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_application_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="来源晋升申请ID"
    )
    source_promotion_interview_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="来源晋升面试ID"
    )
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    interviewer: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="访谈人员"
    )
    interviewee: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="被访谈人员"
    )
    location: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="访谈地点"
    )
    interview_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="访谈时间"
    )
    answers: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
        comment="访谈内容答案数组JSON",
    )
    suggestions: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="对集团/神殿的建议"
    )
    self_sign: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
        comment="本人签字信息JSON",
    )
    principal_approval: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
        comment="校长意见JSON",
    )
    principal_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="校长是否通过，1通过，0驳回"
    )
    hr_approval: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
        comment="人资意见JSON",
    )
    hr_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="人资是否通过，1通过，0驳回"
    )
    chairman_approval: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
        comment="董事长签批JSON",
    )
    chairman_passed: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True, comment="董事长是否通过，1通过，0驳回"
    )
    selected_approver_user_ids: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="本单自选审批人映射JSON"
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
        server_default=text("'draft'"),
        comment="状态",
    )
    current_stage: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="当前审批阶段"
    )
    rejection_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="驳回原因"
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="提交时间"
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="完成时间"
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

    approval_actions: Mapped[list["AppointmentInterviewRecordApprovalAction"]] = (
        relationship(
            "AppointmentInterviewRecordApprovalAction",
            back_populates="record",
            cascade="all, delete-orphan",
            lazy="selectin",
            order_by="AppointmentInterviewRecordApprovalAction.created_at.asc()",
        )
    )
    notifications: Mapped[list["AppointmentInterviewRecordNotification"]] = (
        relationship(
            "AppointmentInterviewRecordNotification",
            back_populates="record",
            cascade="all, delete-orphan",
            lazy="selectin",
            order_by="AppointmentInterviewRecordNotification.created_at.desc()",
        )
    )


class AppointmentInterviewRecordApprovalAction(AccountBase):
    """任命访谈记录审批动作。"""

    __tablename__ = "appointment_interview_record_approval_actions"
    __table_args__ = (
        Index(
            "ix_appointment_interview_record_approval_actions_record_id", "record_id"
        ),
        Index("ix_appointment_interview_record_approval_actions_stage", "stage"),
        Index(
            "ix_appt_interview_approval_actions_approver_uid",
            "approver_user_id",
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "humanresources.appointment_interview_records.id", ondelete="CASCADE"
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

    record: Mapped["AppointmentInterviewRecord"] = relationship(
        "AppointmentInterviewRecord", back_populates="approval_actions"
    )


class AppointmentInterviewRecordNotification(AccountBase):
    """任命访谈记录审批通知。"""

    __tablename__ = "appointment_interview_record_notifications"
    __table_args__ = (
        Index("ix_appointment_interview_record_notifications_record_id", "record_id"),
        Index(
            "ix_appointment_interview_record_notifications_recipient_user_id",
            "recipient_user_id",
        ),
        Index("ix_appointment_interview_record_notifications_is_read", "is_read"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    record_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "humanresources.appointment_interview_records.id", ondelete="CASCADE"
        ),
        nullable=False,
        comment="任命访谈记录ID",
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

    record: Mapped["AppointmentInterviewRecord"] = relationship(
        "AppointmentInterviewRecord", back_populates="notifications"
    )
