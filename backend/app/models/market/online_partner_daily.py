from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部网络合作伙伴日度数据表(MarketBase):
    __tablename__ = '市场部网络合作伙伴日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    合作伙伴: Mapped[str] = mapped_column(String(50), nullable=False, comment='合作伙伴名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    合作伙伴实际收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='合作伙伴实际收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报总数')
    订单数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订单数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    实际总咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='实际总咨询量')
    合作伙伴消费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='合作伙伴消费')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '合作伙伴', '日期', name='uq_市场部网络合作伙伴日度数据表_神殿_合作伙伴_日期'),
        Index('idx_市场部网络合作伙伴日度数据表_神殿', '神殿'),
        Index('idx_市场部网络合作伙伴日度数据表_合作伙伴', '合作伙伴'),
        Index('idx_市场部网络合作伙伴日度数据表_日期', '日期'),
        Index('idx_市场部网络合作伙伴日度数据表_神殿_合作伙伴_日期', '神殿', '合作伙伴', '日期'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'campus': self.神殿,
            'partner': self.合作伙伴,
            'date': self.日期.isoformat() if self.日期 else None,
            'partner_actual_income': float(self.合作伙伴实际收入) if self.合作伙伴实际收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报总数,
            'order_count': self.订单数,
            'visit_count': self.上门人数,
            'actual_consult_count': self.实际总咨询量,
            'partner_cost': float(self.合作伙伴消费) if self.合作伙伴消费 else 0.0,
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

