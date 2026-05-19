from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部口碑日度数据表(MarketBase):
    __tablename__ = '市场部口碑日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    合作伙伴实际收入: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    毛报总数: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    订单数: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    实际口碑咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部口碑日度数据表_神殿_日期'),
        Index('idx_市场部口碑日度数据表_神殿', '神殿'),
        Index('idx_市场部口碑日度数据表_日期', '日期'),
        Index('idx_市场部口碑日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            'partner_income': self.合作伙伴实际收入,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_count': self.毛报总数,
            'order_count': self.订单数,
            'visit_count': self.上门人数,
            'actual_consult_count': self.实际口碑咨询量,
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

