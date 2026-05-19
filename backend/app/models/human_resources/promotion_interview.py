"""
集团人资基础 - 晋升面试评价表模型。
"""

from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, Column, Date, DateTime, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class PromotionInterview(AccountBase):
    """晋升面试评价表主表。"""

    __tablename__ = "promotion_interviews"
    __table_args__ = (
        Index("ix_promotion_interviews_campus", "campus"),
        Index("ix_promotion_interviews_department", "department"),
        Index("ix_promotion_interviews_status", "status"),
        Index("ix_promotion_interviews_interview_date", "interview_date"),
        Index("ix_promotion_interviews_name", "name"),
        Index(
            "uq_promotion_interviews_source_application_id",
            "source_application_id",
            unique=True,
        ),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_application_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="来源晋升申请ID"
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    position: Mapped[str] = mapped_column(String(100), nullable=False, comment="岗位")
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    interview_date: Mapped[date] = mapped_column(Date, nullable=False, comment="面试日期")
    interviewer: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="面试评价人")
    performance_type: Mapped[str] = mapped_column(String(10), nullable=False, comment="业绩考核类型")
    scores: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
        comment="评分明细JSON",
    )
    total_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", comment="总分")
    is_qualified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="FALSE",
        comment="是否符合晋升条件",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
        server_default=text("'draft'"),
        comment="状态",
    )
    created_by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="创建人ID")
    created_by_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建人姓名")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )
