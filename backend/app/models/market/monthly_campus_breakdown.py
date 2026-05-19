"""市场部月度神殿分解表 - SQLAlchemy Model

市场部月度数据表的第一个TAB：神殿分解表
记录每月各神殿的运营数据，包括收入、运营、报名、上门、网推等数据

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部月度神殿分解表(MarketBase):
    """市场部月度神殿分解表"""
    __tablename__ = '市场部月度神殿分解表'
    __table_args__ = (
        Index('idx_月度神殿分解_年月神殿', 'year', 'month', 'campus'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')

    # 神殿收入
    plan_income: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划收入')
    actual_income: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际收入')
    income_completion_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='收入完成率')
    investment_ratio: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='投产比')
    roi: Mapped[int | None] = mapped_column(Integer, nullable=True, comment='ROI')

    # 神殿运营
    consult_conversion_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='咨询转化率')
    renewal_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='续费率')
    refund_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='退费率')

    # 神殿报名
    plan_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划报名')
    gross_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='毛报总数')
    order_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='订座数')
    net_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='净报名')
    enrollment_progress: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='报名进度')
    completion_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='完成本')

    # 神殿上门
    visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='上门人数')
    visit_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='上门率')

    # 市场网推数据
    plan_consult_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='计划咨询量')
    deadline30_consult_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='截止30日应完成咨询量')
    actual_consult_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际总量')
    baidu_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度量')
    new_media_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='新媒体量')
    consult_completion_progress: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='咨询量完成进度')
    monthly_consult_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='月计划消费')
    actual_cost: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际消费')
    consult_cost_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='咨询量成本')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')
