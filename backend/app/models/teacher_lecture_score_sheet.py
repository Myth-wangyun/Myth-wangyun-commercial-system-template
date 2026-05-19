"""
神殿教员听课成绩表（月度明细）
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TeacherLectureScoreSheet(AccountBase):
    __tablename__ = "teacher_lecture_score_sheets"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿")
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="教员姓名")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    rows: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment="评分明细行（包含1-12月与平均分）")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
