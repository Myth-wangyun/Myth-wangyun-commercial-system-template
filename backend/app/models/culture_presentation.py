"""
企业文化宣讲计划表数据库模型
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 企业文化宣讲计划表(AccountBase):
    """企业文化宣讲计划表 - 存储宣讲计划数据"""
    
    __tablename__ = "企业文化宣讲计划表"
    
    # 主键
    计划ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="计划ID")
    
    # 基本信息
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    
    # 计划明细
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    宣讲时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="宣讲时间")
    宣讲地点: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="宣讲地点")
    宣讲方式: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="宣讲方式")
    宣讲主题: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="宣讲主题")
    宣讲内容概述: Mapped[str | None] = mapped_column(Text, nullable=True, comment="宣讲内容概述")
    宣讲对象: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="宣讲对象")
    主讲人: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="主讲人")
    需准备资料: Mapped[str | None] = mapped_column(Text, nullable=True, comment="需准备资料")
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引
    __table_args__ = (
        Index('idx_神殿年份月份', '神殿名称', '年份', '月份'),
        Index('idx_神殿名称', '神殿名称'),
        Index('idx_年份月份', '年份', '月份'),
        {'schema': 'academic'},
    )
    
    def __repr__(self):
        return f"<企业文化宣讲计划表(计划ID={self.计划ID}, 神殿名称={self.神殿名称}, {self.年份}年{self.月份}月, 序号={self.序号})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "计划ID": self.计划ID,
            "神殿名称": self.神殿名称,
            "年份": self.年份,
            "月份": self.月份,
            "序号": self.序号,
            "宣讲时间": self.宣讲时间.isoformat() if self.宣讲时间 else None,
            "宣讲地点": self.宣讲地点,
            "宣讲方式": self.宣讲方式,
            "宣讲主题": self.宣讲主题,
            "宣讲内容概述": self.宣讲内容概述,
            "宣讲对象": self.宣讲对象,
            "主讲人": self.主讲人,
            "需准备资料": self.需准备资料,
            "备注": self.备注,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
