"""
集团人资基础 - 培训目标模型。

存储约束：
- 业务数据存放在 `humanresources` schema
- 表名：`training_goals`
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TrainingGoal(AccountBase):
    """培训目标主表。"""

    __tablename__ = "training_goals"
    __table_args__ = (
        Index("ix_training_goals_year", "year"),
        Index("ix_training_goals_parent_category", "parent_category"),
        Index("ix_training_goals_level", "level"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parent_category: Mapped[str] = mapped_column(String(50), nullable=False, comment="一级分类")
    sub_category: Mapped[str] = mapped_column(String(100), nullable=False, comment="二级分类")
    level: Mapped[str] = mapped_column(String(50), nullable=False, comment="培训级别")
    objectives_json: Mapped[str] = mapped_column(Text, nullable=False, comment="培训目标JSON数组")
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment="年度")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    created_by_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="创建人ID")
    created_by_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建人姓名")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )
