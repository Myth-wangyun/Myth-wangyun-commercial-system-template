from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部抖音日度数据表(MarketBase):
    """市场部抖音日度数据表"""
    __tablename__ = '市场部抖音日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    # 新媒体-抖音汇总数据
    抖音实际收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='抖音实际收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    抖音咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='抖音咨询量')
    抖音花费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='抖音花费')

    # 抖音-基础数据
    展示次数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='展示次数')
    点击次数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='点击次数')
    平均千次展示费用: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='平均千次展示费用')
    转化数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='转化数')

    # 抖音-转化数据
    表单提交数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='表单提交数')
    私信咨询数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='私信咨询数')
    电话拨打数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='电话拨打数')
    在线咨询数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='在线咨询数')
    卡券领取数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='卡券领取数')
    智能电话数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='智能电话数')
    有效咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效咨询量')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部抖音日度数据表_神殿_日期'),
        Index('idx_市场部抖音日度数据表_神殿', '神殿'),
        Index('idx_市场部抖音日度数据表_日期', '日期'),
        Index('idx_市场部抖音日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            # 汇总数据
            'actual_income': float(self.抖音实际收入) if self.抖音实际收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报总数,
            'order_count': self.订座数,
            'visit_count': self.上门人数,
            'consult_count': self.抖音咨询量,
            'consumption': float(self.抖音花费) if self.抖音花费 else 0.0,
            # 基础数据
            'display_count': self.展示次数,
            'click_count': self.点击次数,
            'avg_display_price': float(self.平均千次展示费用) if self.平均千次展示费用 else 0.0,
            'conversion_count': self.转化数,
            # 转化数据
            'form_submit_count': self.表单提交数,
            'private_message_count': self.私信咨询数,
            'phone_call_count': self.电话拨打数,
            'online_consult_count': self.在线咨询数,
            'coupon_receive_count': self.卡券领取数,
            'smart_phone_count': self.智能电话数,
            'effective_consult_count': self.有效咨询量,
            # 审计字段
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

