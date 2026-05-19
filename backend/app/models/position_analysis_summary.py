"""
Model for academic position analysis report summary (academic schema)
智慧司岗位分析报告汇总表 - 支持动态列
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 智慧司岗位分析报告汇总表(AccountBase):
    """
    岗位分析报告汇总表 - 支持动态列
    
    数据结构说明:
    - columns: 列配置数组 [{"key": "network", "label": "网络工程"}, ...]
    - rows: 各神殿数据 [{"campus": "盛邦", "data": {"network": 10, "server": 5, ...}}, ...]
    """
    __tablename__ = "academic_position_analysis_summary"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    # 列配置（动态列）: [{"key": "network", "label": "网络工程"}, {"key": "server", "label": "服务器运维"}, ...]
    columns: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list, comment="列配置（JSONB数组）")
    # 行数据: [{"campus": "盛邦", "data": {"network": 10, "server": 5}}, ...]
    rows: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list, comment="各神殿数据（JSONB数组）")
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "年份": self.年份,
            "columns": self.columns,
            "rows": self.rows,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
