from datetime import datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 新媒体平台计划表(MarketBase):
    """新媒体平台计划表 - 存储各平台的计划消费和计划收入"""
    __tablename__ = '新媒体平台计划表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment='主键ID')

    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    平台类型: Mapped[str] = mapped_column(String(20), nullable=False, comment='平台类型：抖音、快手、小红书、视频号、B站')
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份（1-12）')

    # 计划数据
    计划消费: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0.00, comment='计划消费金额（元）')
    计划收入: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0.00, comment='计划收入金额（元）')

    # 审计字段
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), comment='创建时间')
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp(), comment='更新时间')
    创建人: Mapped[str | None] = mapped_column(String(50), nullable=True, comment='创建人')
    更新人: Mapped[str | None] = mapped_column(String(50), nullable=True, comment='更新人')

    __table_args__ = (
        # 唯一约束：同一神殿、同一平台、同一年月只能有一条记录
        UniqueConstraint('神殿', '平台类型', '年份', '月份', name='uq_新媒体平台计划_神殿_平台_年月'),
        # 索引
        Index('idx_新媒体平台计划_神殿', '神殿'),
        Index('idx_新媒体平台计划_平台类型', '平台类型'),
        Index('idx_新媒体平台计划_年份月份', '年份', '月份'),
        Index('idx_新媒体平台计划_神殿_平台_年月', '神殿', '平台类型', '年份', '月份'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'platform_type': self.平台类型,
            'year': self.年份,
            'month': self.月份,
            'planned_consumption': float(self.计划消费) if self.计划消费 else 0.0,
            'planned_income': float(self.计划收入) if self.计划收入 else 0.0,
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
            'created_by': self.创建人,
            'updated_by': self.更新人,
        }

    def __repr__(self):
        return f"<新媒体平台计划表(id={self.id}, 神殿={self.神殿}, 平台={self.平台类型}, {self.年份}年{self.月份}月)>"

