"""
神殿学术管理数据会议记录表（行=记录，academic schema）
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿学术管理数据会议记录表(AccountBase):
    __tablename__ = "神殿学术管理数据会议记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="会议日期")
    地点: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="地点")
    主持: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="主持")
    参与人: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="参与人")
    议题: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="议题")
    问题解决: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="问题解决")
    问题待解决: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="问题待解决")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_会议记录_神殿年份序号", "神殿名称", "年份", "序号", unique=True),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<神殿学术管理数据会议记录表(神殿={self.神殿名称}, 年份={self.年份}, 序号={self.序号})>"
