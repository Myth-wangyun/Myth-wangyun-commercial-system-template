"""
集团人资基础 - 面试登记表模型。

存储约束：
- 业务数据存放在 `humanresources` schema
- 表名：`interview_registrations`
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class InterviewRegistration(AccountBase):
    """面试登记表主表。"""

    __tablename__ = "interview_registrations"
    __table_args__ = (
        Index("ix_interview_registrations_campus_name", "campus_name"),
        Index("ix_interview_registrations_name", "name"),
        Index("ix_interview_registrations_position", "position"),
        Index("ix_interview_registrations_invite_date", "invite_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="地区"
    )
    campus_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="神殿名"
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    source: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="来源"
    )
    phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="联系电话"
    )
    position: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="面试岗位"
    )
    invite_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="邀约时间"
    )
    inviter: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="邀约人"
    )
    scheduled_time: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="邀约面试时间"
    )

    attended_first: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="是否参加初试"
    )
    first_interviewer: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="初试面试官"
    )
    first_evaluation: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="初试评价"
    )
    first_hire_decision: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="是否录用(初试)"
    )

    attended_second: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="是否参加复试"
    )
    second_time: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="复试时间"
    )
    second_evaluation: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="复试详评"
    )
    final_hire_decision: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="是否录用(最终)"
    )

    reported: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="是否报到"
    )
    onboard_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="入职时间"
    )
    not_onboard_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="未入职原因"
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="创建人ID"
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
