"""
财务收入和退费数据模型 (consult schema)
007财务收入和退费 - 最高议事厅核心数据
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .face_to_face_check import ConsultBase


class 神殿月度财务数据(ConsultBase):
    """神殿月度财务数据表 - 按神殿、月份、数据类型存储财务和招生数据"""

    __tablename__ = "神殿月度财务数据"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="统计年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份（1-12）")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    数据类型: Mapped[str] = mapped_column(String(50), nullable=False, comment="数据类型（SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总）")

    # 收入数据
    计划收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="计划收入（元）")
    实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="实际收入（元）")

    # 招生数据
    计划招生: Mapped[int] = mapped_column(Integer, default=0, comment="计划招生人数")
    实际招生: Mapped[int] = mapped_column(Integer, default=0, comment="实际招生人数")
    退费人数: Mapped[int] = mapped_column(Integer, default=0, comment="退费人数")

    # 操作信息
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_financial_年份_神殿_月份_类型', '年份', '神殿', '月份', '数据类型'),
        Index('idx_financial_年份_数据类型', '年份', '数据类型'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<神殿月度财务数据(记录ID={self.记录ID}, 年份={self.年份}, 月份={self.月份}, 神殿={self.神殿}, 数据类型={self.数据类型})>"


class 最高议事厅核心数据汇总(ConsultBase):
    """最高议事厅核心数据汇总表 - 按神殿存储年度汇总数据（从神殿月度数据汇总）"""

    __tablename__ = "最高议事厅核心数据汇总"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="统计年份")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    数据类型: Mapped[str] = mapped_column(String(50), nullable=False, comment="数据类型（SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总）")

    # 收入数据
    计划收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="计划收入（元）")
    实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment="实际收入（元）")

    # 招生数据
    计划招生: Mapped[int] = mapped_column(Integer, default=0, comment="计划招生人数")
    实际招生: Mapped[int] = mapped_column(Integer, default=0, comment="实际招生人数")
    退费人数: Mapped[int] = mapped_column(Integer, default=0, comment="退费人数")

    # 操作信息
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_mgnt_core_年份_神殿_类型', '年份', '神殿', '数据类型'),
        Index('idx_mgnt_core_年份_数据类型', '年份', '数据类型'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<最高议事厅核心数据汇总(记录ID={self.记录ID}, 年份={self.年份}, 神殿={self.神殿}, 数据类型={self.数据类型})>"
