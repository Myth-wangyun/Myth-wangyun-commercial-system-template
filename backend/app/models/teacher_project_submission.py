"""
教员功能分析 - 项目提交率表（每行一个教员，m1..m12 为各月提交率，academic schema）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 教员功能分析项目提交率表(AccountBase):
    __tablename__ = "教员功能分析项目提交率表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="教员序号")
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="教员姓名")

    m1: Mapped[float | None] = mapped_column(Float, nullable=True, comment="1月")
    m2: Mapped[float | None] = mapped_column(Float, nullable=True, comment="2月")
    m3: Mapped[float | None] = mapped_column(Float, nullable=True, comment="3月")
    m4: Mapped[float | None] = mapped_column(Float, nullable=True, comment="4月")
    m5: Mapped[float | None] = mapped_column(Float, nullable=True, comment="5月")
    m6: Mapped[float | None] = mapped_column(Float, nullable=True, comment="6月")
    m7: Mapped[float | None] = mapped_column(Float, nullable=True, comment="7月")
    m8: Mapped[float | None] = mapped_column(Float, nullable=True, comment="8月")
    m9: Mapped[float | None] = mapped_column(Float, nullable=True, comment="9月")
    m10: Mapped[float | None] = mapped_column(Float, nullable=True, comment="10月")
    m11: Mapped[float | None] = mapped_column(Float, nullable=True, comment="11月")
    m12: Mapped[float | None] = mapped_column(Float, nullable=True, comment="12月")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_项目提交率_神殿年份序号", "神殿名称", "年份", "序号", unique=True),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<教员功能分析项目提交率表(神殿={self.神殿名称}, 年份={self.年份}, 序号={self.序号})>"
