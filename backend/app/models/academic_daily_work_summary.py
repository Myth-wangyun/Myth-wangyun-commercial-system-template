"""
智慧司日工作总结表（行=任务，含班级/备注，academic schema）
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 智慧司日工作总结表(AccountBase):
    __tablename__ = "智慧司日工作总结表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期")
    星期: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="星期")
    执行人: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="执行人")
    班级: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班级")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="任务序号")
    任务名称: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="任务名称")
    任务描述: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="任务描述")
    任务目标: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="任务目标")
    执行时间: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="执行时间")
    最后完成期限: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="最后完成期限")
    权重: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="权重")
    结果: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="结果")
    备注: Mapped[str | None] = mapped_column(String(2000), nullable=True, comment="备注（问题/说明）")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index(
            "idx_日工作总结_神殿日期执行人班级序号",
            "神殿名称",
            "日期",
            "执行人",
            "班级",
            "序号",
            unique=True,
        ),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<智慧司日工作总结表(神殿={self.神殿名称}, 日期={self.日期}, 序号={self.序号})>"
