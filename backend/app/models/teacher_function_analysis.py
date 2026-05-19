"""
教员功能分析总表数据库模型
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 教员功能分析总表(AccountBase):
    """存储各神殿各年月的教员功能分析数据"""

    __tablename__ = "教员功能分析总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="教师姓名")

    就业率: Mapped[float | None] = mapped_column(Float, nullable=True, comment="就业率")
    就业薪资: Mapped[float | None] = mapped_column(Float, nullable=True, comment="就业薪资")
    口碑人数: Mapped[float | None] = mapped_column(Float, nullable=True, comment="口碑人数")
    口碑收入: Mapped[float | None] = mapped_column(Float, nullable=True, comment="口碑收入")
    带新生人数: Mapped[float | None] = mapped_column(Float, nullable=True, comment="带新生人数")
    新生流失人数: Mapped[float | None] = mapped_column(Float, nullable=True, comment="新生流失人数")
    作业提交率: Mapped[float | None] = mapped_column(Float, nullable=True, comment="作业提交率")
    作业合格率: Mapped[float | None] = mapped_column(Float, nullable=True, comment="作业合格率")
    考试合格率: Mapped[float | None] = mapped_column(Float, nullable=True, comment="考试合格率")
    项目提交率: Mapped[float | None] = mapped_column(Float, nullable=True, comment="项目提交率")
    项目合格率: Mapped[float | None] = mapped_column(Float, nullable=True, comment="项目合格率")
    学员满意度: Mapped[float | None] = mapped_column(Float, nullable=True, comment="学员满意度")
    学员违纪: Mapped[float | None] = mapped_column(Float, nullable=True, comment="学员违纪")
    上级听课: Mapped[float | None] = mapped_column(Float, nullable=True, comment="上级听课")
    教员平均: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员平均")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_教员功能分析_神殿年月", "神殿名称", "年份", "月份"),
        Index("idx_教员功能分析_神殿", "神殿名称"),
        {'schema': 'academic'},
    )

    def __repr__(self):
        return f"<教员功能分析总表(记录ID={self.记录ID}, 神殿={self.神殿名称}, {self.年份}-{self.月份}, 序号={self.序号})>"
