"""市场部月度市场口碑表 - SQLAlchemy Model

市场部月度数据表的第五个TAB：市场口碑表
记录每月各神殿的口碑来源咨询量数据

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部月度市场口碑表(MarketBase):
    """市场部月度市场口碑表"""
    __tablename__ = '市场部月度市场口碑表'
    __table_args__ = (
        Index('idx_月度市场口碑_年月神殿', 'year', 'month', 'campus'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')

    # 口碑来源
    student_parent: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='生源地学员家长')
    student_friends: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='学员朋友介绍')
    online_reputation: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='线上口碑')
    campus_activity: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神殿活动')
    community_wechat: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='社区微信群')
    cross_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='跨专业报名')
    other_channels: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='其他渠道')

    # 合计
    total_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计咨询量')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')
