"""
智慧司教员访谈记录表（按神殿/年月存储整个表格内容）
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 智慧司访谈记录表(AccountBase):
    __tablename__ = "智慧司访谈记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    表格数据: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, nullable=False, comment="访谈表格 JSON")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_访谈记录_神殿年月", "神殿名称", "年份", "月份", unique=True),
        {"schema": "academic"},
    )
