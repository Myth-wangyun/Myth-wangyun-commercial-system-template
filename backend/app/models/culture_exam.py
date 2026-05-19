"""
企业文化考试计划表数据库模型
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 企业文化考试计划表(AccountBase):
    """企业文化考试计划表 - 存储考试计划数据"""
    
    __tablename__ = "企业文化考试计划表"
    
    # 主键
    计划ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="计划ID")
    
    # 基本信息
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    
    # 计划明细
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    考试时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="考试时间")
    考试地点: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="考试地点")
    考试方式: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="考试方式")
    考试主题: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="考试主题")
    考试内容概述: Mapped[str | None] = mapped_column(Text, nullable=True, comment="考试内容概述")
    考试对象: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="考试对象")
    监考人: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="监考人")
    考场布置: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="考场布置")
    需准备资料: Mapped[str | None] = mapped_column(Text, nullable=True, comment="需准备资料")
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引
    __table_args__ = (
        Index('idx_考试计划_神殿年份月份', '神殿名称', '年份', '月份'),
        Index('idx_考试计划_神殿名称', '神殿名称'),
        Index('idx_考试计划_年份月份', '年份', '月份'),
        {'schema': 'academic'},
    )
    
    def __repr__(self):
        return f"<企业文化考试计划表(计划ID={self.计划ID}, 神殿名称={self.神殿名称}, {self.年份}年{self.月份}月, 序号={self.序号})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "计划ID": self.计划ID,
            "神殿名称": self.神殿名称,
            "年份": self.年份,
            "月份": self.月份,
            "序号": self.序号,
            "考试时间": self.考试时间.isoformat() if self.考试时间 else None,
            "考试地点": self.考试地点,
            "考试方式": self.考试方式,
            "考试主题": self.考试主题,
            "考试内容概述": self.考试内容概述,
            "考试对象": self.考试对象,
            "监考人": self.监考人,
            "考场布置": self.考场布置,
            "需准备资料": self.需准备资料,
            "备注": self.备注,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
