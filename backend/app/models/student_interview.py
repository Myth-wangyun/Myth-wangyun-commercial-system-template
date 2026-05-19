"""
Student interview record model
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class StudentInterviewRecord(AccountBase):
    """学员访谈记录表"""

    __tablename__ = "student_interview_records"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    class_code: Mapped[str] = mapped_column(String(50), nullable=False, comment="班级编码")
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="班级名称")
    student_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="学员姓名")
    student_id: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="学员编号")
    interviewer: Mapped[str] = mapped_column(String(100), nullable=False, comment="访谈人")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="访谈月份")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="访谈年份")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="访谈内容")
    interview_date: Mapped[date] = mapped_column(Date, nullable=False, comment="访谈日期")
    major_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="专业名称")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<StudentInterviewRecord(campus={self.campus_name}, class={self.class_code}, "
            f"student={self.student_name}, date={self.interview_date})>"
        )
