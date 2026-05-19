"""
神殿后端新生维稳个人按月汇总表（academic schema）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿后端新生维稳个人按月汇总表(AccountBase):
    """神殿后端新生维稳个人按月汇总表"""

    __tablename__ = "神殿后端新生维稳个人按月汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份 (1-12)")
    教员序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="教员序号 (1-2)")
    教员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="教员姓名")
    交接人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="交接人数")
    入学人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="入学人数")
    退费人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="退费人数")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "教员序号", name="uq_新生维稳个人按月_神殿年月序号"),
        Index("idx_新生维稳个人按月_神殿年月", "神殿名称", "年份", "月份"),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<神殿后端新生维稳个人按月汇总表(神殿={self.神殿名称}, 年份={self.年份}, 月份={self.月份}, 序号={self.教员序号})>"

