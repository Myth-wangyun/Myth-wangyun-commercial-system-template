"""
Reputation key point detail model
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ReputationKeyPointDetail(AccountBase):
    """口碑招生关键点结果明细"""

    __tablename__ = "reputation_key_point_details"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="教员姓名")
    wechat_moments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="朋友圈数量")
    douyin_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="抖音数量")
    kuaishou_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="快手数量")
    xiaohongshu_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="小红书数量")
    current_student_interview_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="在校生访谈")
    graduate_interview_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="毕业生访谈")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<ReputationKeyPointDetail(campus={self.campus_name}, "
            f"year={self.year}, month={self.month}, teacher={self.teacher_name})>"
        )
