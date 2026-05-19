"""
咨询量计算时间配置模型
用于配置不同时段的工作日结算截止时间

业务规则：
- 冬季（默认10月1日至次年5月1日）: 下午5:30后的咨询量算作第二天
- 夏季（默认5月1日至10月1日）: 下午6:00后的咨询量算作第二天
- 即"今日咨询量" = 昨天截止时间 → 今天截止时间 之间的咨询记录
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ConsultationScheduleConfig(AccountBase):
    """咨询量计算时段配置表"""

    __tablename__ = "consultation_schedule_config"
    __table_args__ = (
        Index("idx_schedule_period", "period_start", "period_end"),
        CheckConstraint("cutoff_hour >= 0 AND cutoff_hour <= 23", name="chk_cutoff_hour"),
        CheckConstraint("cutoff_minute >= 0 AND cutoff_minute <= 59", name="chk_cutoff_minute"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    period_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="时段名称，如：冬季、夏季")
    period_start: Mapped[date] = mapped_column(Date, nullable=False, comment="时段开始日期（含）")
    period_end: Mapped[date] = mapped_column(Date, nullable=False, comment="时段结束日期（含）")
    cutoff_hour: Mapped[int] = mapped_column(Integer, nullable=False, comment="截止小时（24小时制）")
    cutoff_minute: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="截止分钟")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="描述说明")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
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

    def __repr__(self) -> str:
        return (
            f"<ConsultationScheduleConfig("
            f"id={self.id}, name={self.period_name}, "
            f"{self.period_start}~{self.period_end}, "
            f"cutoff={self.cutoff_hour}:{self.cutoff_minute:02d})>"
        )
