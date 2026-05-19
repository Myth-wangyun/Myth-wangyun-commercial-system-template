"""
市场部网络计划表模型
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class MarketNetworkPlan(MarketBase):
    """市场部网络计划表 - 年度市场计划信息"""
    
    __tablename__ = "市场部网络计划表"
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 年份、月份和神殿
    year: Mapped[str] = mapped_column(String(4), nullable=False, comment="年份，格式YYYY")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份，0=总计，1-12=各月")
    campus: Mapped[str] = mapped_column(String(50), nullable=False, default='', comment="神殿名称，空字符串表示总计划")
    
    # 计划收入
    network_plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), nullable=False, default=0, comment="网络计划收入")
    sem_plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), nullable=False, default=0, comment="SEM计划收入")
    newmedia_plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), nullable=False, default=0, comment="新媒体计划收入")
    
    # 计划报名
    network_plan_signup: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="网络计划报名")
    sem_plan_signup: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="SEM计划报名")
    newmedia_plan_signup: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="新媒体计划报名")
    
    # 转化率和总量
    conversion_rate: Mapped[Decimal] = mapped_column(DECIMAL(6, 4), nullable=False, default=0, comment="转化率指标")
    network_plan_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="网络计划总量")
    
    # 咨询量
    newmedia_plan_consult: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="新媒体计划咨询量")
    sem_plan_consult: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="SEM计划咨询量")
    
    # 成本
    consult_cost: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0, comment="咨询量成本")
    
    # 消费
    network_plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), nullable=False, default=0, comment="网络计划消费")
    newmedia_plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), nullable=False, default=0, comment="新媒体计划消费")
    sem_plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), nullable=False, default=0, comment="SEM计划消费")
    
    # 招生实际成本
    actual_enrollment_cost: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0, comment="招生实际成本")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引和约束
    __table_args__ = (
        UniqueConstraint('year', 'month', 'campus', name='uq_market_network_plan_year_month_campus'),
        Index('idx_market_network_plan_year', 'year'),
        Index('idx_market_network_plan_campus', 'campus'),
    )
    
    def __repr__(self):
        return f"<MarketNetworkPlan(id={self.id}, year={self.year}, month={self.month})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "campus": self.campus or '',
            "network_plan_income": float(self.network_plan_income) if self.network_plan_income else 0,
            "sem_plan_income": float(self.sem_plan_income) if self.sem_plan_income else 0,
            "newmedia_plan_income": float(self.newmedia_plan_income) if self.newmedia_plan_income else 0,
            "network_plan_signup": self.network_plan_signup or 0,
            "sem_plan_signup": self.sem_plan_signup or 0,
            "newmedia_plan_signup": self.newmedia_plan_signup or 0,
            "conversion_rate": float(self.conversion_rate) if self.conversion_rate else 0,
            "network_plan_total": self.network_plan_total or 0,
            "newmedia_plan_consult": self.newmedia_plan_consult or 0,
            "sem_plan_consult": self.sem_plan_consult or 0,
            "consult_cost": float(self.consult_cost) if self.consult_cost else 0,
            "network_plan_cost": float(self.network_plan_cost) if self.network_plan_cost else 0,
            "newmedia_plan_cost": float(self.newmedia_plan_cost) if self.newmedia_plan_cost else 0,
            "sem_plan_cost": float(self.sem_plan_cost) if self.sem_plan_cost else 0,
            "actual_enrollment_cost": float(self.actual_enrollment_cost) if self.actual_enrollment_cost else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

