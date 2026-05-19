"""市场部剪辑周度汇报表 - SQLAlchemy Model

市场部剪辑周度汇报表
记录每周各神殿的新媒体剪辑汇报数据，包括文案类、拍摄类、待剪类、结果类等统计信息

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部剪辑周度汇报表(MarketBase):
    """市场部剪辑周度汇报表"""
    __tablename__ = '市场部剪辑周度汇报表'
    __table_args__ = (
        Index('idx_剪辑周度_年月周', 'year', 'month', 'week'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    week: Mapped[int] = mapped_column(Integer, nullable=False, comment='周序号')

    # 行类型标识
    row_type: Mapped[str] = mapped_column(String(20), nullable=False, comment='行类型: month-summary月合计/summary周汇总/campus神殿')
    week_label: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='周标签，如: 第1周')
    week_date_range: Mapped[str | None] = mapped_column(String(50), nullable=True, default='', comment='周日期范围，如: 1月1日-1月7日')
    campus: Mapped[str | None] = mapped_column(String(50), nullable=True, default='', comment='神殿名称，合计行则为"合计"')

    # 文案类
    audience_type_count: Mapped[float | None] = mapped_column(Float, nullable=True, default=0, comment='人群类别数量(支持小数)')
    planned_articles: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划文案数')
    actual_articles: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际文案数')

    # 拍摄类
    planned_edit_demand: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划拍摄次数')
    completed_edit_demand: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='截止昨日应完成拍摄次数')
    actual_shoot_videos: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际拍摄次数')
    shoot_edit_completion_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='拍摄完成率')
    shoot_completion_progress: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='拍摄完成进度')

    # 待剪类
    monthly_edit_plans: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='本月计划剪辑数')
    completed_early_plans: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='截止昨日应完成剪辑次数')
    actual_edited_videos: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际完成剪辑数')
    edit_progress_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='剪辑完成进度')

    # 结果类
    released_video_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='发布视频数')
    release_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='发布率')
    audit_pass_video_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='审核通过数')
    audit_pass_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, default='', comment='审核通过率')
    group_activity: Mapped[str | None] = mapped_column(String(200), nullable=True, default='', comment='集团活动')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
