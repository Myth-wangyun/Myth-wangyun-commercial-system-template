"""
集团人资基础 - 社保费用汇总表模型。
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.user import Base as AccountBase


class SocialInsuranceCostSummary(AccountBase):
    """社保费用汇总表。"""

    __tablename__ = "social_insurance_cost_summaries"
    __table_args__ = (
        Index("ix_social_insurance_cost_summaries_campus", "campus"),
        Index("ix_social_insurance_cost_summaries_period", "period"),
        Index("ix_social_insurance_cost_summaries_updated_at", "updated_at"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="所属神殿")
    unit_name: Mapped[str] = mapped_column(String(200), nullable=False, comment="单位名称")
    period: Mapped[str] = mapped_column(String(20), nullable=False, comment="期间")
    injury_enterprise_rate: Mapped[float] = mapped_column(
        Float, nullable=False, comment="工伤企业缴费比例"
    )
    employees_json: Mapped[str] = mapped_column(Text, nullable=False, comment="员工明细JSON")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
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
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
        comment="创建时间",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.utcnow,
        comment="更新时间",
    )