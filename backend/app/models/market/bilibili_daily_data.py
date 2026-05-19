from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部B站日度数据表(MarketBase):
    """市场部B站日度数据表"""
    __tablename__ = '市场部B站日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    # 新媒体-B站汇总数据
    B站实际收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='B站实际收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    B站咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='B站咨询量')
    B站花费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='B站花费')

    # B站-基础数据
    展示量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='展示量')
    点击量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='点击量')
    单次点击价格: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='单次点击价格')
    千次展示价格: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='千次展示价格')

    # B站-转化数据
    表单: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='表单')
    转化数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='转化数')
    有效咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效咨询量')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部B站日度数据表_神殿_日期'),
        Index('idx_市场部B站日度数据表_神殿', '神殿'),
        Index('idx_市场部B站日度数据表_日期', '日期'),
        Index('idx_市场部B站日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            # 汇总数据
            'actual_income': float(self.B站实际收入) if self.B站实际收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报总数,
            'order_count': self.订座数,
            'visit_count': self.上门人数,
            'consult_count': self.B站咨询量,
            'consumption': float(self.B站花费) if self.B站花费 else 0.0,
            # 基础数据
            'display_count': self.展示量,
            'click_count': self.点击量,
            'single_click_price': float(self.单次点击价格) if self.单次点击价格 else 0.0,
            'thousand_display_price': float(self.千次展示价格) if self.千次展示价格 else 0.0,
            # 转化数据
            'table_count': self.表单,
            'conversion_count': self.转化数,
            'effective_consult_count': self.有效咨询量,
            # 审计字段
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

