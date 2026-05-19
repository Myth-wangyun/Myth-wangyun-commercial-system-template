from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部微信视频号日度数据表(MarketBase):
    """市场部微信视频号日度数据表"""
    __tablename__ = '市场部微信视频号日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    # 新媒体-微信视频号汇总数据
    微信视频号实际收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='微信视频号实际收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    微信视频号总量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='微信视频号总量')
    微信视频号消费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='微信视频号消费')

    # 微信视频号-基础数据
    曝光次数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='曝光次数')
    千次展现均价: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='千次展现均价')
    点击次数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='点击次数')

    # 微信视频号-转化数据
    目标转化量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='目标转化量')
    表单: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='表单')
    有效咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效咨询量')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部微信视频号日度数据表_神殿_日期'),
        Index('idx_市场部微信视频号日度数据表_神殿', '神殿'),
        Index('idx_市场部微信视频号日度数据表_日期', '日期'),
        Index('idx_市场部微信视频号日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            # 汇总数据
            'actual_income': float(self.微信视频号实际收入) if self.微信视频号实际收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报总数,
            'order_count': self.订座数,
            'visit_count': self.上门人数,
            'consult_count': self.微信视频号总量,
            'consumption': float(self.微信视频号消费) if self.微信视频号消费 else 0.0,
            # 基础数据
            'display_count': self.曝光次数,
            'thousand_display_price': float(self.千次展现均价) if self.千次展现均价 else 0.0,
            'click_count': self.点击次数,
            # 转化数据
            'target_conversion_count': self.目标转化量,
            'table_count': self.表单,
            'effective_consult_count': self.有效咨询量,
            # 审计字段
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

