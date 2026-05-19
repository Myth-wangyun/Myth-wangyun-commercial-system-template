"""市场部会议记录表 - SQLAlchemy Model

落表 schema: market
表名: 市场部会议记录表
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class MarketMeetingRecord(MarketBase):
    __tablename__ = '市场部会议记录表'
    __table_args__ = (
        Index('idx_市场部会议记录_时间', 'meeting_time'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    meeting_time: Mapped[str] = mapped_column(String(100), nullable=False, default='', comment='时间')
    location: Mapped[str] = mapped_column(String(200), nullable=False, default='', comment='地点')
    host: Mapped[str] = mapped_column(String(100), nullable=False, default='', comment='主持人')
    important_leader: Mapped[str] = mapped_column(String(200), nullable=False, default='', comment='重要领导')
    participants: Mapped[str] = mapped_column(Text, nullable=False, default='', comment='参与人')
    agenda: Mapped[str] = mapped_column(Text, nullable=False, default='', comment='议题')
    issues_resolved: Mapped[str] = mapped_column(Text, nullable=False, default='', comment='会议记录人')
    issues_pending: Mapped[str] = mapped_column(Text, nullable=False, default='', comment='备注')
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, default='', comment='会议纪要文件路径')
    file_name: Mapped[str] = mapped_column(String(200), nullable=False, default='', comment='会议纪要文件名')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

