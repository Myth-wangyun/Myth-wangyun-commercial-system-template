"""
教员功能分析上级听课表（academic schema）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 教员功能分析上级听课表(AccountBase):
    """存储上级听课成绩（行：月份，列：教员1-12对应 m1..m12）"""

    __tablename__ = "教员功能分析上级听课表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号（1-12，对应月份）")
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="姓名/预留")

    m1: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员1")
    m2: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员2")
    m3: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员3")
    m4: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员4")
    m5: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员5")
    m6: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员6")
    m7: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员7")
    m8: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员8")
    m9: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员9")
    m10: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员10")
    m11: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员11")
    m12: Mapped[float | None] = mapped_column(Float, nullable=True, comment="教员12")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_上级听课_神殿年份序号", "神殿名称", "年份", "序号", unique=True),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<教员功能分析上级听课表(神殿={self.神殿名称}, 年份={self.年份}, 序号={self.序号})>"
