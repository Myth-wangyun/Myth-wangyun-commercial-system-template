"""
Model for manager function evaluation (academic schema)
最高议事厅智慧司学术经理功能评价表
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 最高议事厅学术经理功能评价表(AccountBase):
    __tablename__ = "manager_function_evaluation"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM 格式
    数据: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=dict)  # 包含评分人列表和详细评分
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "神殿": self.神殿,
            "年份": self.年份,
            "月份": self.月份,
            "数据": self.数据,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
