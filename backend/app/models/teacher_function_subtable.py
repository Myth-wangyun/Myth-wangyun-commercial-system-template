"""
教员功能分析子表（按表类型存储12个月数据）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 教员功能分析子表(AccountBase):
    """存储教员功能分析下各子表（作业、考试、项目、满意度、违纪、听课）的月度数据"""

    __tablename__ = "教员功能分析子表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    表类型: Mapped[str] = mapped_column(String(100), nullable=False, comment="表类型标识，如 homework_submission/teacher_exam_pass")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="姓名或班级")

    m1: Mapped[float | None] = mapped_column(Float, nullable=True, comment="1月")
    m2: Mapped[float | None] = mapped_column(Float, nullable=True, comment="2月")
    m3: Mapped[float | None] = mapped_column(Float, nullable=True, comment="3月")
    m4: Mapped[float | None] = mapped_column(Float, nullable=True, comment="4月")
    m5: Mapped[float | None] = mapped_column(Float, nullable=True, comment="5月")
    m6: Mapped[float | None] = mapped_column(Float, nullable=True, comment="6月")
    m7: Mapped[float | None] = mapped_column(Float, nullable=True, comment="7月")
    m8: Mapped[float | None] = mapped_column(Float, nullable=True, comment="8月")
    m9: Mapped[float | None] = mapped_column(Float, nullable=True, comment="9月")
    m10: Mapped[float | None] = mapped_column(Float, nullable=True, comment="10月")
    m11: Mapped[float | None] = mapped_column(Float, nullable=True, comment="11月")
    m12: Mapped[float | None] = mapped_column(Float, nullable=True, comment="12月")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_教员功能子表_表神殿年", "表类型", "神殿名称", "年份"),
        {'schema': 'academic'},
    )

    def __repr__(self):
        return f"<教员功能分析子表({self.表类型}, {self.神殿名称}, {self.年份}, 序号={self.序号})>"
