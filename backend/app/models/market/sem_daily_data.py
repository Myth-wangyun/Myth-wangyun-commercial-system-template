from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部SEM百度推广日度数据表(MarketBase):
    """市场部SEM百度推广日度数据表"""
    __tablename__ = '市场部SEM百度推广日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    # SEM推广 百度核心数据汇总
    百度收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='百度收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报数')
    订座数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    百度咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='百度咨询量')
    百度消费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='百度消费')

    # 百度咨询量
    百度表单: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='百度表单')
    中心来电: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='中心来电')
    百度聊出: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='百度聊出')
    总咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='总咨询量')
    有效咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效咨询量')

    # 百度对话
    百度总对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='百度总对话')
    有效对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效对话')

    # 百度基础数据
    展现: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='展现')
    点击: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='点击')
    消费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='消费')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部SEM百度推广日度数据表_神殿_日期'),
        Index('idx_市场部SEM百度推广日度数据表_神殿', '神殿'),
        Index('idx_市场部SEM百度推广日度数据表_日期', '日期'),
        Index('idx_市场部SEM百度推广日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            # SEM推广 百度核心数据汇总
            'baidu_income': float(self.百度收入) if self.百度收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报数,
            'order_count': self.订座数,
            'visit_count': self.上门人数,
            'baidu_consult_count': self.百度咨询量,
            'baidu_consumption': float(self.百度消费) if self.百度消费 else 0.0,
            # 百度咨询量
            'baidu_form': self.百度表单,
            'center_come_in': self.中心来电,
            'baidu_chat_out': self.百度聊出,
            'total_consult_count': self.总咨询量,
            'valid_consult_count': self.有效咨询量,
            # 百度对话
            'baidu_total_dialogue': self.百度总对话,
            'valid_dialogue': self.有效对话,
            # 百度基础数据
            'impression_count': self.展现,
            'click_count': self.点击,
            'consumption': float(self.消费) if self.消费 else 0.0,
            # 审计字段
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }


class 市场部SEM其他平台日度数据表(MarketBase):
    """市场部SEM其他平台日度数据表"""
    __tablename__ = '市场部SEM其他平台日度数据表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')

    # SEM推广 其他核心数据汇总
    其他收入: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='其他收入')
    退费数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='净报名')
    毛报数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='毛报数')
    订座数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='上门人数')
    其他咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='其他咨询量')
    其他消费: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment='其他消费')

    # 其他咨询量
    神殿网站直接访问: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='神殿网站/直接访问')
    GEO: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='GEO')

    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint('神殿', '日期', name='uq_市场部SEM其他平台日度数据表_神殿_日期'),
        Index('idx_市场部SEM其他平台日度数据表_神殿', '神殿'),
        Index('idx_市场部SEM其他平台日度数据表_日期', '日期'),
        Index('idx_市场部SEM其他平台日度数据表_神殿_日期', '神殿', '日期'),
    )

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'campus': self.神殿,
            'date': self.日期.isoformat() if self.日期 else None,
            # SEM推广 其他核心数据汇总
            'other_income': float(self.其他收入) if self.其他收入 else 0.0,
            'refund_count': self.退费数,
            'net_signup': self.净报名,
            'gross_total': self.毛报数,
            'order_count': self.订座数,
            'visit_count': self.上门人数,
            'other_consult_count': self.其他咨询量,
            'other_consumption': float(self.其他消费) if self.其他消费 else 0.0,
            # 其他咨询量
            'campus_website_visit': self.神殿网站直接访问,
            'geo': self.GEO,
            # 审计字段
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }

