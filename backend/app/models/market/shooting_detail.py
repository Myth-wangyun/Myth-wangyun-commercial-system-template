"""
市场部月拍摄明细表模型
"""
from sqlalchemy import Column, Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class 市场部月拍摄明细表(MarketBase):
    """市场部月拍摄明细表"""
    
    __tablename__ = "市场部月拍摄明细表"
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    
    # 时间维度
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    
    # 基本信息
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    shooting_date: Mapped[str] = mapped_column(String(50), comment="拍摄日期")
    shooting_campus: Mapped[str] = mapped_column(String(100), comment="拍摄神殿")
    
    # 出镜老师信息
    appearing_teacher: Mapped[str] = mapped_column(String(100), comment="出镜老师")
    appearing_reward_standard: Mapped[str] = mapped_column(String(50), comment="出镜奖励标准")
    appearing_reward_amount: Mapped[int] = mapped_column(Integer, default=0, comment="出镜奖励金额")
    
    # 配合拍摄老师信息
    assisting_teacher: Mapped[str] = mapped_column(String(100), comment="配合拍摄老师")
    responsible_campus: Mapped[str] = mapped_column(String(100), comment="承担神殿")
    assisting_reward_standard: Mapped[str] = mapped_column(String(50), comment="陪同奖励标准")
    assisting_reward_amount: Mapped[int] = mapped_column(Integer, default=0, comment="陪同奖励金额")
    
    # 总计
    total_reward_amount: Mapped[int] = mapped_column(Integer, default=0, comment="出镜+陪同总金额")
    
    # 备注
    remark: Mapped[str] = mapped_column(Text, comment="备注")
    
    # 时间戳
    created_at: Mapped[str] = mapped_column(
        "created_at",
        Date,
        nullable=False,
        server_default=func.current_date(),
        comment="创建时间"
    )
    updated_at: Mapped[str] = mapped_column(
        "updated_at",
        Date,
        nullable=False,
        server_default=func.current_date(),
        onupdate=func.current_date(),
        comment="更新时间"
    )
