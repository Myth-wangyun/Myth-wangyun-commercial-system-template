"""
神殿核心数据汇总表模型（academic schema）
存储神殿核心数据汇总的手填字段和API获取的数据
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿核心数据汇总表(AccountBase):
    """神殿核心数据汇总表 - 存储神殿核心数据（academic schema）"""
    
    __tablename__ = "神殿核心数据汇总表"
    __table_args__ = (
        Index('idx_神殿核心数据_神殿年份', '神殿', '年份'),
        UniqueConstraint('神殿', '年份', name='uq_神殿核心数据_神殿年份'),
        {"schema": "academic"},
    )
    
    # 主键
    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    
    # 自动计算字段（从API获取）
    在校生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="在校生人数（班档案-退费）")
    班级数量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="班级数量")
    就业班级数量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="就业班级数量")
    毕业生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="毕业生人数")
    就业率: Mapped[float | None] = mapped_column(Float, nullable=True, default=0, comment="就业率(%)")
    就业薪资: Mapped[float | None] = mapped_column(Float, nullable=True, default=0, comment="平均就业薪资(元)")
    薪资过万人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="薪资过万人数")
    口碑招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="口碑招生人数")
    口碑招生收入: Mapped[float | None] = mapped_column(Float, nullable=True, default=0, comment="口碑招生收入(元)")
    新生入学人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="新生入学人数（班档案人数）")
    新生流失人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="新生流失人数（退费人数）")
    
    # 手填字段
    智慧司人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="智慧司人数（手填）")
    干部人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="干部人数（手填）")
    员工人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="员工人数（手填）")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def to_dict(self):
        """转换为字典"""
        return {
            "记录ID": self.记录ID,
            "神殿": self.神殿,
            "年份": self.年份,
            "在校生人数": self.在校生人数 or 0,
            "班级数量": self.班级数量 or 0,
            "智慧司人数": self.智慧司人数 or 0,
            "干部人数": self.干部人数 or 0,
            "员工人数": self.员工人数 or 0,
            "就业班级数量": self.就业班级数量 or 0,
            "毕业生人数": self.毕业生人数 or 0,
            "就业率": self.就业率 or 0,
            "就业薪资": self.就业薪资 or 0,
            "薪资过万人数": self.薪资过万人数 or 0,
            "口碑招生人数": self.口碑招生人数 or 0,
            "口碑招生收入": self.口碑招生收入 or 0,
            "新生入学人数": self.新生入学人数 or 0,
            "新生流失人数": self.新生流失人数 or 0,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
