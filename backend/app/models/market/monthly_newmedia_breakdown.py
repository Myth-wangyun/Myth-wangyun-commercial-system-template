"""市场部月度新媒体分解表 - SQLAlchemy Model

市场部月度数据表的第二个TAB：新媒体分解表
记录每月各神殿在新媒体各平台（抖音、快手、小红书、视频号、B站）的咨询量、上门量、报名量

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部月度新媒体分解表(MarketBase):
    """市场部月度新媒体分解表"""
    __tablename__ = '市场部月度新媒体分解表'
    __table_args__ = (
        Index('idx_月度新媒体分解_年月神殿', 'year', 'month', 'campus'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')

    # 抖音
    douyin_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='抖音咨询量')
    douyin_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='抖音上门量')
    douyin_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='抖音报名量')

    # 快手
    kuaishou_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='快手咨询量')
    kuaishou_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='快手上门量')
    kuaishou_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='快手报名量')

    # 小红书
    xiaohongshu_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='小红书咨询量')
    xiaohongshu_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='小红书上门量')
    xiaohongshu_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='小红书报名量')

    # 视频号
    wechat_video_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='视频号咨询量')
    wechat_video_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='视频号上门量')
    wechat_video_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='视频号报名量')

    # B站
    bilibili_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='B站咨询量')
    bilibili_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='B站上门量')
    bilibili_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='B站报名量')

    # 合计
    total_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计咨询量')
    total_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计上门量')
    total_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计报名量')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')
