"""
市场部培训月度表数据库模型
用于存储月度表的备注信息（汇总数据从周度表实时计算）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class MarketMonthlyTraining(MarketBase):
    """市场部培训月度表（存储备注）"""
    __tablename__ = '市场部培训月度表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 年份
    year: Mapped[str] = mapped_column(String(4), nullable=False, index=True, comment='年份，格式 YYYY')

    # 月份（1-12，0表示汇总行）
    month: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='月份，1-12，0表示汇总行')

    # 岗位：网推、网聊、AI研发、线上
    position: Mapped[str] = mapped_column(String(50), nullable=False, index=True, comment='岗位')

    # 备注
    remarks: Mapped[str] = mapped_column(Text, nullable=False, default='', comment='备注')

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_市场部培训月度表_year_month_position', 'year', 'month', 'position', unique=True),
    )

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "position": self.position,
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

