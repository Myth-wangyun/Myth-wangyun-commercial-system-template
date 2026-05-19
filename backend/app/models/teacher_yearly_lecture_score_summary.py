"""
教员年度听课打分汇总表
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TeacherYearlyLectureScoreSummary(AccountBase):
    __tablename__ = "teacher_yearly_lecture_score_summaries"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="神殿名称")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    summary_data: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment="汇总数据，JSONB格式，包含教员每月的分数")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

