"""
教员年度听课打分表
"""

from datetime import date, datetime
from typing import Any

from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TeacherYearlyLectureScore(AccountBase):
    __tablename__ = "teacher_yearly_lecture_scores"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, comment="听课日期")
    class_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="班级名称")
    course_content: Mapped[str] = mapped_column(String(200), nullable=False, comment="授课内容")
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="授课教员")
    total_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="总分")
    suggestions: Mapped[str | None] = mapped_column(Text, nullable=True, comment="意见和建议")
    scores: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment="评分明细，JSONB格式")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

