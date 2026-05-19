"""
神殿后端新生维稳个人汇总表（年度按教员汇总）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿后端新生维稳个人汇总表(AccountBase):
    """神殿后端新生维稳个人汇总表（年度教员维度汇总）"""

    __tablename__ = "神殿后端新生维稳个人汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    教员序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="教员序号 (>=1)")
    教员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="教员姓名")
    交接人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="交接人数")
    入学人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="入学人数")
    退费人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="退费人数")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "教员序号", name="uq_新生维稳个人汇总_神殿年份序号"),
        Index("idx_新生维稳个人汇总_神殿年份", "神殿名称", "年份"),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<神殿后端新生维稳个人汇总表(神殿={self.神殿名称}, 年份={self.年份}, 序号={self.教员序号})>"
