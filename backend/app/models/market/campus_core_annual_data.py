"""神殿核心年度数据表 - SQLAlchemy Model

01核心数据看板 - 2026年度河北主神殿市场网络中心数据表
记录每月各神殿的核心运营数据，包括收入、运营、报名、上门、网推等数据
数据来源：汇总自新媒体、SEM、网络合作伙伴、口碑、免费推广5个表

落表 schema: market
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 神殿核心年度数据表(MarketBase):
    """神殿核心年度数据表 - 01核心数据看板"""
    __tablename__ = '神殿核心年度数据表'
    __table_args__ = (
        Index('idx_核心年度_年月神殿', 'year', 'month', 'campus'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份(1-12)')
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')

    # 网络中心收入
    plan_income: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment='网络中心计划收入')
    actual_income: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment='网络中心实际收入')
    investment_ratio: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='投产比')

    # 神殿运营
    enrollment_conversion_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='报名转化率')
    refund_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='退费数')
    refund_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='退费率')

    # 网络中心计划报名
    plan_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='网络中心计划报名')

    # 神殿报名
    gross_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='毛报总数')
    net_enrollment: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='净报名')
    order_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='订座数')
    enrollment_progress: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='报名进度')
    net_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment='净成本')

    # 神殿上门
    visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='上门人数')
    visit_rate: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='上门率')

    # 网络中心计划咨询量
    plan_consult_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='网络中心计划咨询量')

    # 网络中心数据
    actual_consult_volume: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='实际总量')
    consult_completion_progress: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='咨询量完成进度')
    consult_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment='咨询量成本')

    # 网络中心计划消费
    plan_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment='网络中心计划消费')
    
    # 实际消费
    actual_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment='实际消费')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')

    def __repr__(self):
        return f"<神殿核心年度数据表(id={self.id}, year={self.year}, month={self.month}, campus={self.campus})>"

