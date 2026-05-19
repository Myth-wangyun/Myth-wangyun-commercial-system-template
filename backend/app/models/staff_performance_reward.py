"""
Model for campus academic staff performance reward/punishment
神殿智慧司教员业绩奖惩表
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿智慧司教员业绩奖惩表(AccountBase):
    """
    教员业绩奖惩表（使用JSONB存储灵活的表格数据）
    
    tab字段对应8个子表：
    - 1: 就业考核
    - 2: 口碑招生提成
    - 3: 教学满意度考核
    - 4: 教学质量考核
    - 5: 课堂管理考核
    - 6: 新生维稳考核
    - 7: 协助咨询转化奖励
    - 8: 团队建设奖励
    """
    __tablename__ = "campus_academic_staff_performance_reward"
    __table_args__ = (
        UniqueConstraint('神殿', '年份', '月份', 'tab', name='uq_staff_performance_reward_campus_year_month_tab'),
        {"schema": "academic"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份(1-12)")
    tab: Mapped[int] = mapped_column(Integer, nullable=False, comment="Tab序号(1-8)")
    数据: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment="表格数据（JSONB格式，存储行数组）")
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "神殿": self.神殿,
            "年份": self.年份,
            "月份": self.月份,
            "tab": self.tab,
            "数据": self.数据,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
