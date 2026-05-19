"""
神殿智慧司员工业绩逐月统计表（academic schema）
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿智慧司员工业绩逐月统计表(AccountBase):
    """神殿智慧司员工业绩逐月统计表"""

    __tablename__ = "神殿智慧司员工业绩逐月统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份 (1-12)")
    教员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="教员姓名")
    
    # 作业相关
    作业提交率: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, default=0, comment="作业提交率 (%)")
    作业合格率: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, default=0, comment="作业合格率 (%)")
    
    # 考试相关
    考试合格率: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, default=0, comment="考试合格率 (%)")
    
    # 项目相关
    项目合格率: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, default=0, comment="项目合格率 (%)")
    
    # 满意度
    学员满意度: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, default=0, comment="学员满意度 (%)")
    
    # 违纪
    学员违纪: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="学员违纪次数")
    
    # 就业相关
    就业率: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, default=0, comment="就业率 (%)")
    就业薪资: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, default=0, comment="就业薪资 (元)")
    
    # 口碑相关
    口碑报名: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="口碑报名人数")
    口碑收入: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="口碑收入 (元)")
    
    # 新生相关
    带新生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="带新生人数")
    退费人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="退费人数")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "教员姓名", name="uq_员工业绩逐月_神殿年月教员"),
        Index("idx_员工业绩逐月_神殿年月", "神殿名称", "年份", "月份"),
        Index("idx_员工业绩逐月_教员", "教员姓名"),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<神殿智慧司员工业绩逐月统计表(神殿={self.神殿名称}, 年份={self.年份}, 月份={self.月份}, 教员={self.教员姓名})>"
