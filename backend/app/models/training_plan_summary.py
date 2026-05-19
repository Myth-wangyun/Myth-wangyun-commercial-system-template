"""
Model for campus academic training plan summary (academic schema)
神殿智慧司培训计划与成绩汇总表
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿智慧司培训计划与成绩汇总表(AccountBase):
    __tablename__ = "campus_academic_training_plan_summary"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[str] = mapped_column(String(10), nullable=False, comment="月份，格式 YYYY-MM")
    培训目标: Mapped[str | None] = mapped_column(Text, nullable=True, comment="培训目标")
    主要内容: Mapped[str | None] = mapped_column(Text, nullable=True, comment="主要内容")
    培训方式: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="培训方式")
    负责人: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="负责人")
    培训人数: Mapped[int] = mapped_column(Integer, default=0, comment="培训人数")
    合格人数: Mapped[int] = mapped_column(Integer, default=0, comment="合格人数")
    考试合格率: Mapped[float] = mapped_column(Float, default=0, comment="考试合格率(%)")
    平均成绩: Mapped[float] = mapped_column(Float, default=0, comment="平均成绩")
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "神殿名称": self.神殿名称,
            "年份": self.年份,
            "月份": self.月份,
            "培训目标": self.培训目标,
            "主要内容": self.主要内容,
            "培训方式": self.培训方式,
            "负责人": self.负责人,
            "培训人数": self.培训人数,
            "合格人数": self.合格人数,
            "考试合格率": self.考试合格率,
            "平均成绩": self.平均成绩,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
