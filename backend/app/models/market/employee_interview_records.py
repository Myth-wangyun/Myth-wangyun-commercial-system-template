from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class MarketEmployeeInterviewRecord(MarketBase):
    """市场部员工访谈记录表"""

    __tablename__ = "市场部员工访谈记录表"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    interview_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    interviewee: Mapped[str] = mapped_column(String(100), nullable=False, default="")

    jan_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    jan_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    feb_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    feb_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    mar_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    mar_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    apr_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    apr_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    may_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    may_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    jun_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    jun_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    jul_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    jul_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    aug_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    aug_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    sep_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    sep_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    oct_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    oct_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    nov_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    nov_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    dec_interviewer: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    dec_content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_市场部员工访谈记录表_year", "year"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "year": self.year,
            "interview_date": self.interview_date,
            "interviewee": self.interviewee,
            "jan_interviewer": self.jan_interviewer,
            "jan_content": self.jan_content,
            "feb_interviewer": self.feb_interviewer,
            "feb_content": self.feb_content,
            "mar_interviewer": self.mar_interviewer,
            "mar_content": self.mar_content,
            "apr_interviewer": self.apr_interviewer,
            "apr_content": self.apr_content,
            "may_interviewer": self.may_interviewer,
            "may_content": self.may_content,
            "jun_interviewer": self.jun_interviewer,
            "jun_content": self.jun_content,
            "jul_interviewer": self.jul_interviewer,
            "jul_content": self.jul_content,
            "aug_interviewer": self.aug_interviewer,
            "aug_content": self.aug_content,
            "sep_interviewer": self.sep_interviewer,
            "sep_content": self.sep_content,
            "oct_interviewer": self.oct_interviewer,
            "oct_content": self.oct_content,
            "nov_interviewer": self.nov_interviewer,
            "nov_content": self.nov_content,
            "dec_interviewer": self.dec_interviewer,
            "dec_content": self.dec_content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

