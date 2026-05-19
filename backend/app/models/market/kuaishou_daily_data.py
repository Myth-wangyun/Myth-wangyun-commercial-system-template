from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部快手日度数据表(MarketBase):
    """市场部快手日度数据表"""
    __tablename__ = '市场部快手日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    # 新媒体-快手汇总数据
    快手实际收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='快手实际收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    快手咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='快手咨询量')
    快手花费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='快手花费')

    # 快手-基础数据
    封面曝光数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='封面曝光数')
    封面点击数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='封面点击数')
    素材曝光数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='素材曝光数')
    行为数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='行为数')
    素材点击率: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='素材点击率')

    # 快手-转化数据
    转化数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='转化数')
    表单: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='表单')
    有效咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效咨询量')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部快手日度数据表_神殿_日期'),
        Index('idx_市场部快手日度数据表_神殿', '神殿'),
        Index('idx_市场部快手日度数据表_日期', '日期'),
        Index('idx_市场部快手日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            # 汇总数据
            'actual_income': float(self.快手实际收入) if self.快手实际收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报总数,
            'order_count': self.订座数,
            'visit_count': self.上门人数,
            'consult_count': self.快手咨询量,
            'consumption': float(self.快手花费) if self.快手花费 else 0.0,
            # 基础数据
            'seal_cover_count': self.封面曝光数,
            'seal_click_count': self.封面点击数,
            'material_display_count': self.素材曝光数,
            'action_count': self.行为数,
            'material_action_rate': float(self.素材点击率) if self.素材点击率 else 0.0,
            # 转化数据
            'conversion_count': self.转化数,
            'table_count': self.表单,
            'effective_consult_count': self.有效咨询量,
            # 审计字段
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

