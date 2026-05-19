"""
咨询师月度计划数据模型 (consult schema)
003神殿各咨询师数据汇总 - 咨询师月度计划收入和计划招生
按 咨询师 × 量来源 两个维度组合存储
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .face_to_face_check import ConsultBase


class 咨询师月度计划数据(ConsultBase):
    """
    咨询师月度计划数据表 - 按神殿、年份、月份、咨询师、数据类型存储计划收入和计划招生数据
    
    两个维度：
    1. 咨询师维度：每个咨询师单独设置计划
    2. 数据类型维度：SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体
    """

    __tablename__ = "咨询师月度计划数据"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="统计年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份（1-12）")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    咨询师: Mapped[str] = mapped_column(String(50), nullable=False, comment="咨询师姓名")
    数据类型: Mapped[str] = mapped_column(String(50), nullable=False, default='汇总', comment="数据类型/量来源：SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总")

    # 计划数据
    计划收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="计划收入（元）")
    计划招生: Mapped[int] = mapped_column(Integer, default=0, comment="计划招生人数")
    费用投入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="费用投入/市场投入（元）")

    # 操作信息
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引和约束 - 五元组唯一：年份+月份+神殿+咨询师+数据类型
    __table_args__ = (
        UniqueConstraint('年份', '月份', '神殿', '咨询师', '数据类型', name='uq_consultant_plan_year_month_campus_consultant_type'),
        Index('idx_consultant_plan_年份_神殿_月份', '年份', '神殿', '月份'),
        Index('idx_consultant_plan_年份_神殿_咨询师', '年份', '神殿', '咨询师'),
        Index('idx_consultant_plan_年份_神殿_数据类型', '年份', '神殿', '数据类型'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询师月度计划数据(记录ID={self.记录ID}, 年份={self.年份}, 月份={self.月份}, 神殿={self.神殿}, 咨询师={self.咨询师}, 数据类型={self.数据类型})>"
