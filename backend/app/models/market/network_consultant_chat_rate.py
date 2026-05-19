"""
网络咨询师报表 - A组和B组聊出率数据表
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 网络咨询师A组聊出率表(MarketBase):
    """网络咨询师A组聊出率数据表"""
    
    __tablename__ = '网络咨询师A组聊出率表'
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment='主键ID')
    
    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')
    星期: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='星期几')
    班次: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='班次（早班/晚班/全体）')
    网聊姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment='网聊咨询师姓名')
    
    # 数据指标
    进线量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='进线量')
    总对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='总对话数')
    无效对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='无效对话量')
    有效对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效对话量（总对话-无效对话）')
    有效对话率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment='有效对话率（%）')
    有效干预对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效干预对话量')
    干预对话率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment='干预对话率（%）')
    聊出量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='聊出量')
    聊出率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment='聊出率（%）')
    
    # 标记字段
    是否汇总: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='是否为汇总行（0-否，1-是）')
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), comment='创建时间')
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp(), comment='更新时间')
    
    # 索引和约束
    __table_args__ = (
        UniqueConstraint('年份', '月份', '日期', '网聊姓名', '班次', name='uq_网络咨询师A组_年月日姓名班次'),
        Index('idx_网络咨询师A组_年份月份', '年份', '月份'),
        Index('idx_网络咨询师A组_日期', '日期'),
        Index('idx_网络咨询师A组_姓名', '网聊姓名'),
        Index('idx_网络咨询师A组_是否汇总', '是否汇总'),
    )
    
    def __repr__(self):
        return f"<网络咨询师A组聊出率表(id={self.id}, 日期={self.日期}, 姓名={self.网聊姓名})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'year': self.年份,
            'month': self.月份,
            'date': self.日期.isoformat() if self.日期 else None,
            'week_day': self.星期,
            'shift': self.班次,
            'employee_name': self.网聊姓名,
            'incoming_calls': self.进线量,
            'total_dialogs': self.总对话,
            'invalid_dialogs': self.无效对话量,
            'valid_dialogs': self.有效对话量,
            'valid_dialog_rate': float(self.有效对话率) if self.有效对话率 else None,
            'valid_intervention_dialogs': self.有效干预对话量,
            'intervention_dialog_rate': float(self.干预对话率) if self.干预对话率 else None,
            'chat_output': self.聊出量,
            'chat_output_rate': float(self.聊出率) if self.聊出率 else None,
            'is_summary': bool(self.是否汇总),
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }


class 网络咨询师B组聊出率表(MarketBase):
    """网络咨询师B组聊出率数据表"""
    
    __tablename__ = '网络咨询师B组聊出率表'
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment='主键ID')
    
    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='日期（年月日）')
    星期: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='星期几')
    班次: Mapped[str | None] = mapped_column(String(20), nullable=True, comment='班次（早班/晚班/全体）')
    网聊姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment='网聊咨询师姓名')
    
    # 数据指标
    进线量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='进线量')
    总对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='总对话数')
    无效对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='无效对话量')
    有效对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效对话量（总对话-无效对话）')
    有效对话率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment='有效对话率（%）')
    有效干预对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='有效干预对话量')
    干预对话率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment='干预对话率（%）')
    聊出量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='聊出量')
    聊出率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment='聊出率（%）')
    
    # 标记字段
    是否汇总: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='是否为汇总行（0-否，1-是）')
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), comment='创建时间')
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp(), comment='更新时间')
    
    # 索引和约束
    __table_args__ = (
        UniqueConstraint('年份', '月份', '日期', '网聊姓名', '班次', name='uq_网络咨询师B组_年月日姓名班次'),
        Index('idx_网络咨询师B组_年份月份', '年份', '月份'),
        Index('idx_网络咨询师B组_日期', '日期'),
        Index('idx_网络咨询师B组_姓名', '网聊姓名'),
        Index('idx_网络咨询师B组_是否汇总', '是否汇总'),
    )
    
    def __repr__(self):
        return f"<网络咨询师B组聊出率表(id={self.id}, 日期={self.日期}, 姓名={self.网聊姓名})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'year': self.年份,
            'month': self.月份,
            'date': self.日期.isoformat() if self.日期 else None,
            'week_day': self.星期,
            'shift': self.班次,
            'employee_name': self.网聊姓名,
            'incoming_calls': self.进线量,
            'total_dialogs': self.总对话,
            'invalid_dialogs': self.无效对话量,
            'valid_dialogs': self.有效对话量,
            'valid_dialog_rate': float(self.有效对话率) if self.有效对话率 else None,
            'valid_intervention_dialogs': self.有效干预对话量,
            'intervention_dialog_rate': float(self.干预对话率) if self.干预对话率 else None,
            'chat_output': self.聊出量,
            'chat_output_rate': float(self.聊出率) if self.聊出率 else None,
            'is_summary': bool(self.是否汇总),
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }


class 网络咨询师组别人员配置表(MarketBase):
    """网络咨询师组别人员配置表 - 存储每月的人员配置"""
    
    __tablename__ = '网络咨询师组别人员配置表'
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment='主键ID')
    
    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    组别: Mapped[str] = mapped_column(String(10), nullable=False, comment='组别（A组/B组）')
    员工姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment='员工姓名')
    排序序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='排序序号')
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), comment='创建时间')
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp(), comment='更新时间')
    
    # 索引和约束
    __table_args__ = (
        UniqueConstraint('年份', '月份', '组别', '员工姓名', name='uq_网络咨询师配置_年月组别姓名'),
        Index('idx_网络咨询师配置_年份月份组别', '年份', '月份', '组别'),
    )
    
    def __repr__(self):
        return f"<网络咨询师组别人员配置表(id={self.id}, 年月={self.年份}-{self.月份}, 组别={self.组别}, 姓名={self.员工姓名})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'year': self.年份,
            'month': self.月份,
            'group': self.组别,
            'employee_name': self.员工姓名,
            'sort_order': self.排序序号,
            'created_at': self.创建时间.isoformat() if self.创建时间 else None,
            'updated_at': self.更新时间.isoformat() if self.更新时间 else None,
        }


__all__ = [
    '网络咨询师A组聊出率表',
    '网络咨询师B组聊出率表',
    '网络咨询师组别人员配置表',
]

