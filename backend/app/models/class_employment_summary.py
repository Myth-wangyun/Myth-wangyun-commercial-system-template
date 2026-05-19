"""
班级就业总结数据库模型（academic schema）
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DECIMAL,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 班级就业总结表(AccountBase):
    """班级就业总结表 - 记录各班级的就业总结数据（academic schema）"""
    
    __tablename__ = "班级就业总结表"
    __table_args__ = (
        UniqueConstraint('神殿', '班级名称', '年份', '月份', name='uq_class_employment_summary'),
        Index('idx_ces_campus_class', '神殿', '班级名称'),
        Index('idx_ces_year_month', '年份', '月份'),
        {"schema": "academic"},
    )
    
    # 主键
    总结ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="总结ID")
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="所属神殿")
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="班级名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    
    # 档案和就业人数
    档案人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="档案人数")
    需就业人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="需就业人数")
    目标就业人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="目标就业人数")
    实际就业人数: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="实际就业人数")
    
    # 就业率
    目标就业率: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), nullable=False, default=100, comment="目标就业率(%)")
    实际就业率: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), nullable=False, default=0, comment="实际就业率(%)")
    目标需就业率: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), nullable=False, default=100, comment="目标需就业率(%)")
    实际需就业率: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), nullable=False, default=0, comment="实际需就业率(%)")
    
    # 薪资
    目标平均薪资: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0, comment="目标平均薪资(元)")
    实际平均薪资: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0, comment="实际平均薪资(元)")
    
    # 备注
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    def __repr__(self):
        return f"<班级就业总结表(总结ID={self.总结ID}, 神殿={self.神殿}, 班级名称={self.班级名称})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "总结ID": self.总结ID,
            "神殿": self.神殿,
            "班级名称": self.班级名称,
            "年份": self.年份,
            "月份": self.月份,
            "档案人数": self.档案人数,
            "需就业人数": self.需就业人数,
            "目标就业人数": self.目标就业人数,
            "实际就业人数": self.实际就业人数,
            "目标就业率": float(self.目标就业率) if self.目标就业率 else 0,
            "实际就业率": float(self.实际就业率) if self.实际就业率 else 0,
            "目标需就业率": float(self.目标需就业率) if self.目标需就业率 else 0,
            "实际需就业率": float(self.实际需就业率) if self.实际需就业率 else 0,
            "目标平均薪资": float(self.目标平均薪资) if self.目标平均薪资 else 0,
            "实际平均薪资": float(self.实际平均薪资) if self.实际平均薪资 else 0,
            "备注": self.备注,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }

