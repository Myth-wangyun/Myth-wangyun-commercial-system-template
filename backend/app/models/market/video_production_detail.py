"""市场部视频剪辑制作明细 - SQLAlchemy Model

市场部 X月视频剪辑制作明细表
记录每条视频的序号、文案日期、主题、针对人群、神殿、实际拍摄日期、短视频名称、时长、备注链接等信息

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部视频制作明细表(MarketBase):
    """市场部视频制作明细表"""
    __tablename__ = '市场部视频制作明细表'
    __table_args__ = (
        Index('idx_视频制作_年月', 'year', 'month'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    
    # 视频信息字段
    sequence: Mapped[int | None] = mapped_column(Integer, nullable=True, comment='序号')
    copywriting_date: Mapped[str | None] = mapped_column(String(50), nullable=True, default='', comment='文案日期')
    theme: Mapped[str | None] = mapped_column(String(200), nullable=True, default='', comment='主题')
    target_audience: Mapped[str | None] = mapped_column(String(50), nullable=True, default='', comment='针对人群')
    campus: Mapped[str | None] = mapped_column(String(50), nullable=True, default='', comment='神殿')
    actual_shooting_date: Mapped[str | None] = mapped_column(String(200), nullable=True, default='', comment='实际拍摄日期')
    video_name: Mapped[str | None] = mapped_column(String(200), nullable=True, default='', comment='短视频名称')
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True, comment='时长(秒)')
    remark_link: Mapped[str | None] = mapped_column(Text, nullable=True, default='', comment='备注链接')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
