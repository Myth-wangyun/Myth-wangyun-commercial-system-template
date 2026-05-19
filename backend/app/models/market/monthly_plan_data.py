"""
市场部月度计划数据表模型
用于存储以下5个页面的计划数据：
1. 新媒体月度计划
2. SEM月度计划
3. 网络合作伙伴分解
4. 市场口碑
5. 免费推广
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部新媒体月度计划表(MarketBase):
    """新媒体月度计划数据（按平台明细存储）"""
    
    __tablename__ = "市场部新媒体月度计划表"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 年份、月份、神殿和平台
    year: Mapped[str] = mapped_column(String(4), nullable=False, comment="年份，格式YYYY")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份，1-12")
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    platform: Mapped[str] = mapped_column(String(50), nullable=False, default='', comment="平台名称，如抖音、快手、B站等")
    
    # 计划数据
    plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划收入")
    plan_enrollment: Mapped[int] = mapped_column(Integer, default=0, comment="计划报名")
    plan_consult_volume: Mapped[int] = mapped_column(Integer, default=0, comment="计划咨询量")
    plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划消费")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    __table_args__ = (
        UniqueConstraint('year', 'month', 'campus', 'platform', name='uq_newmedia_plan_year_month_campus_platform'),
        Index('idx_newmedia_plan_year', 'year'),
        Index('idx_newmedia_plan_campus', 'campus'),
        Index('idx_newmedia_plan_platform', 'platform'),
    )
    
    def __repr__(self):
        return f"<市场部新媒体月度计划表(id={self.id}, year={self.year}, month={self.month}, campus={self.campus}, platform={self.platform})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "campus": self.campus,
            "platform": self.platform or '',
            "plan_income": float(self.plan_income) if self.plan_income else 0,
            "plan_enrollment": self.plan_enrollment or 0,
            "plan_consult_volume": self.plan_consult_volume or 0,
            "plan_cost": float(self.plan_cost) if self.plan_cost else 0,
        }


class 市场部SEM月度计划表(MarketBase):
    """SEM月度计划数据（按渠道明细存储）"""
    
    __tablename__ = "市场部SEM月度计划表"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 年份、月份、神殿和渠道
    year: Mapped[str] = mapped_column(String(4), nullable=False, comment="年份，格式YYYY")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份，1-12")
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    channel: Mapped[str] = mapped_column(String(50), nullable=False, default='', comment="渠道名称，如百度推广、神殿网站等")
    
    # 计划数据
    plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划收入")
    plan_enrollment: Mapped[int] = mapped_column(Integer, default=0, comment="计划报名")
    plan_consult_volume: Mapped[int] = mapped_column(Integer, default=0, comment="计划咨询量")
    plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划消费")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    __table_args__ = (
        UniqueConstraint('year', 'month', 'campus', 'channel', name='uq_sem_plan_year_month_campus_channel'),
        Index('idx_sem_plan_year', 'year'),
        Index('idx_sem_plan_campus', 'campus'),
        Index('idx_sem_plan_channel', 'channel'),
    )
    
    def __repr__(self):
        return f"<市场部SEM月度计划表(id={self.id}, year={self.year}, month={self.month}, campus={self.campus}, channel={self.channel})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "campus": self.campus,
            "channel": self.channel or '',
            "plan_income": float(self.plan_income) if self.plan_income else 0,
            "plan_enrollment": self.plan_enrollment or 0,
            "plan_consult_volume": self.plan_consult_volume or 0,
            "plan_cost": float(self.plan_cost) if self.plan_cost else 0,
        }


class 市场部网络合作伙伴月度计划表(MarketBase):
    """网络合作伙伴月度计划数据（按合作伙伴明细存储）"""
    
    __tablename__ = "市场部网络合作伙伴月度计划表"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 年份、月份、神殿和合作伙伴
    year: Mapped[str] = mapped_column(String(4), nullable=False, comment="年份，格式YYYY")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份，1-12")
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    partner: Mapped[str] = mapped_column(String(50), nullable=False, default='', comment="合作伙伴名称，如知了好学、坦途网等")
    
    # 计划数据
    plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划收入")
    plan_enrollment: Mapped[int] = mapped_column(Integer, default=0, comment="计划报名")
    plan_consult_volume: Mapped[int] = mapped_column(Integer, default=0, comment="计划咨询量")
    plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划消费")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    __table_args__ = (
        UniqueConstraint('year', 'month', 'campus', 'partner', name='uq_network_partner_plan_year_month_campus_partner'),
        Index('idx_network_partner_plan_year', 'year'),
        Index('idx_network_partner_plan_campus', 'campus'),
        Index('idx_network_partner_plan_partner', 'partner'),
    )
    
    def __repr__(self):
        return f"<市场部网络合作伙伴月度计划表(id={self.id}, year={self.year}, month={self.month}, campus={self.campus}, partner={self.partner})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "campus": self.campus,
            "partner": self.partner or '',
            "plan_income": float(self.plan_income) if self.plan_income else 0,
            "plan_enrollment": self.plan_enrollment or 0,
            "plan_consult_volume": self.plan_consult_volume or 0,
            "plan_cost": float(self.plan_cost) if self.plan_cost else 0,
        }


class 市场部口碑月度计划表(MarketBase):
    """市场口碑月度计划数据"""
    
    __tablename__ = "市场部口碑月度计划表"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 年份、月份和神殿
    year: Mapped[str] = mapped_column(String(4), nullable=False, comment="年份，格式YYYY")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份，1-12")
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    
    # 计划数据
    plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划收入")
    plan_enrollment: Mapped[int] = mapped_column(Integer, default=0, comment="计划报名")
    plan_consult_volume: Mapped[int] = mapped_column(Integer, default=0, comment="计划咨询量")
    plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划消费")
    
    # 实际消费（手动录入）
    actual_expense: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="实际消费")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    __table_args__ = (
        UniqueConstraint('year', 'month', 'campus', name='uq_reputation_plan_year_month_campus'),
        Index('idx_reputation_plan_year', 'year'),
        Index('idx_reputation_plan_campus', 'campus'),
    )
    
    def __repr__(self):
        return f"<市场部口碑月度计划表(id={self.id}, year={self.year}, month={self.month}, campus={self.campus})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "campus": self.campus,
            "plan_income": float(self.plan_income) if self.plan_income else 0,
            "plan_enrollment": self.plan_enrollment or 0,
            "plan_consult_volume": self.plan_consult_volume or 0,
            "plan_cost": float(self.plan_cost) if self.plan_cost else 0,
            "actual_expense": float(self.actual_expense) if self.actual_expense else 0,
        }


class 市场部免费推广月度计划表(MarketBase):
    """免费推广月度计划数据"""
    
    __tablename__ = "市场部免费推广月度计划表"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 年份、月份和神殿
    year: Mapped[str] = mapped_column(String(4), nullable=False, comment="年份，格式YYYY")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份，1-12")
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    
    # 计划数据
    plan_income: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划收入")
    plan_enrollment: Mapped[int] = mapped_column(Integer, default=0, comment="计划报名")
    plan_consult_volume: Mapped[int] = mapped_column(Integer, default=0, comment="计划咨询量")
    plan_cost: Mapped[Decimal] = mapped_column(DECIMAL(14, 2), default=0, comment="计划消费")
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    __table_args__ = (
        UniqueConstraint('year', 'month', 'campus', name='uq_free_promotion_plan_year_month_campus'),
        Index('idx_free_promotion_plan_year', 'year'),
        Index('idx_free_promotion_plan_campus', 'campus'),
    )
    
    def __repr__(self):
        return f"<市场部免费推广月度计划表(id={self.id}, year={self.year}, month={self.month}, campus={self.campus})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "year": self.year,
            "month": self.month,
            "campus": self.campus,
            "plan_income": float(self.plan_income) if self.plan_income else 0,
            "plan_enrollment": self.plan_enrollment or 0,
            "plan_consult_volume": self.plan_consult_volume or 0,
            "plan_cost": float(self.plan_cost) if self.plan_cost else 0,
        }
