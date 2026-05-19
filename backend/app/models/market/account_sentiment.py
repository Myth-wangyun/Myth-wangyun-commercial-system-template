"""市场部各校新媒体账号舆情登记表 - SQLAlchemy Model

落表 schema: market
表名: 市场部各校新媒体账号舆情登记表
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class MarketAccountSentimentRegister(MarketBase):
    __tablename__ = '市场部各校新媒体账号舆情登记表'
    __table_args__ = (
        Index('idx_市场部新媒体账号舆情_神殿', 'campus_name'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False)

    inchargeInside: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    inchargeOutside: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    platform: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    accountId: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    nickname: Mapped[str] = mapped_column(String(200), nullable=False, default='')
    avatar: Mapped[str] = mapped_column(Text, nullable=False, default='')
    remark: Mapped[str] = mapped_column(Text, nullable=False, default='')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

