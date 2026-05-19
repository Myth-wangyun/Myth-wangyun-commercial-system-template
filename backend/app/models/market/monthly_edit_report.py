"""市场部剪辑月度汇报表 - SQLAlchemy Model

市场部剪辑月度汇报表
记录每月各神殿的新媒体剪辑汇报数据，包括文案类、拍摄类、待剪类、结果类等统计信息

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部剪辑月度汇报表(MarketBase):
    """市场部剪辑月度汇报表"""
    __tablename__ = '市场部剪辑月度汇报表'
    __table_args__ = (
        Index('idx_剪辑月度_年月', 'year', 'month'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')

    # 行类型标识: summary=合计, data=神殿
    row_type: Mapped[str] = mapped_column(String(20), nullable=False, comment='行类型: summary合计/data神殿')
    period: Mapped[str] = mapped_column(String(20), nullable=False, comment='period标识: all-year 或 1-12')
    period_label: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='period名称: 全年度 或 1月')
    campus: Mapped[str | None] = mapped_column(String(50), nullable=True, default='', comment='神殿名称，合计行则为"合计"')

    # 文案类
    audience_type_count: Mapped[str | None] = mapped_column(String(100), nullable=True, default='', comment='人群类别(文本输入)')
    planned_articles: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划文案数')
    actual_articles: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际文案数')

    # 拍摄类
    planned_edit_demand: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划拍摄次数')
    completed_edit_demand: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='截止昨日应完成拍摄次数')
    actual_shoot_videos: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际拍摄次数')
    shoot_completion_progress: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='拍摄完成进度')

    # 待剪类
    monthly_edit_plans: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='本月计划剪辑数')
    completed_early_plans: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='截止昨日应完成剪辑次数')
    actual_edited_videos: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际完成剪辑数')
    edit_progress_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='剪辑完成进度')

    # 结果类
    audit_pass_video_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='审核通过数')
    audit_pass_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='审核通过率')

    # 集团活动
    group_activity: Mapped[str | None] = mapped_column(Text, nullable=True, comment='集团活动')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')
