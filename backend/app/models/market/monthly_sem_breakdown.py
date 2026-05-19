"""市场部月度SEM推广分解表 - SQLAlchemy Model

市场部月度数据表的第三个TAB：SEM推广分解表
记录每月各神殿在各SEM平台（百度、360、搜狗、神马）的推广数据

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部月度SEM推广分解表(MarketBase):
    """市场部月度SEM推广分解表"""
    __tablename__ = '市场部月度SEM推广分解表'
    __table_args__ = (
        Index('idx_月度SEM分解_年月神殿', 'year', 'month', 'campus'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')

    # 百度推广
    baidu_plan_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度计划咨询量')
    baidu_deadline_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度截止30日应完成')
    baidu_actual_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度实际咨询量')
    baidu_plan_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度计划消费')
    baidu_actual_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度实际消费')
    baidu_consult_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度咨询成本')

    # 360推广
    so360_plan_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='360计划咨询量')
    so360_deadline_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='360截止30日应完成')
    so360_actual_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='360实际咨询量')
    so360_plan_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='360计划消费')
    so360_actual_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='360实际消费')
    so360_consult_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='360咨询成本')

    # 搜狗推广
    sogou_plan_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='搜狗计划咨询量')
    sogou_deadline_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='搜狗截止30日应完成')
    sogou_actual_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='搜狗实际咨询量')
    sogou_plan_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='搜狗计划消费')
    sogou_actual_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='搜狗实际消费')
    sogou_consult_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='搜狗咨询成本')

    # 神马推广
    shenma_plan_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神马计划咨询量')
    shenma_deadline_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神马截止30日应完成')
    shenma_actual_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神马实际咨询量')
    shenma_plan_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神马计划消费')
    shenma_actual_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神马实际消费')
    shenma_consult_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='神马咨询成本')

    # 合计
    total_plan_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计计划咨询量')
    total_deadline_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计截止30日应完成')
    total_actual_consult: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计实际咨询量')
    total_plan_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计计划消费')
    total_actual_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计实际消费')
    total_consult_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计咨询成本')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')
