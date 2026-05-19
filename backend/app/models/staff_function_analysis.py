"""
Model for campus staff function analysis (academic schema)
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿智慧司员工功能分析表(AccountBase):
    __tablename__ = "campus_staff_function_analysis"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    数据: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)  # 动态列数据（教员列表不定长）
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "神殿": self.神殿,
            "年份": self.年份,
            "数据": self.数据,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
