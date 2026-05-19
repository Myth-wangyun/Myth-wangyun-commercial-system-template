"""
祈福司培训月度表
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 祈福司培训月度表(AccountBase):
    """祈福司培训月度表（按岗位和月份存储培训数据）
    
    用于存储4个培训月度汇总表的数据：
    - 01最高议事厅-祈福司 校长培训计划与成绩月度汇总表 - 岗位：校长
    - 02最高议事厅-祈福司 咨询经理培训计划与成绩月度汇总表 - 岗位：咨询经理
    - 03最高议事厅-祈福司咨询师培训计划与成绩月度汇总表 - 岗位：咨询师
    - 04最高议事厅-祈福司 运营管理培训计划与成绩月度汇总表 - 岗位：运营
    """
    __tablename__ = "祈福司培训月度表"

    # 主键
    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 年份和岗位
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份", index=True)
    岗位: Mapped[str] = mapped_column(String(50), nullable=False, comment="岗位名称（校长、咨询经理、咨询师、运营）", index=True)

    # 月度数据（JSON格式存储12个月的培训数据）
    # 每个月包含：valueTraining(价值观), campusKnowledge(神殿专业知识培训), positionTraining(岗位知识培训), careerDevelopment(职业素养), remarks(备注)
    月度数据: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, nullable=False, comment="12个月的培训数据JSON", default=dict)

    # 关联信息
    神殿: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="神殿")
    创建人ID: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="创建人ID")
    创建人姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="创建人姓名")

    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_培训月度_年份岗位", "年份", "岗位", unique=True),
        {"schema": "consult", "comment": "祈福司培训月度表"},
    )
