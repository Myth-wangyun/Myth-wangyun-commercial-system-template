"""
智慧司教员标准化检查表（按日期记录每日检查项的完成情况）
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 智慧司标准化检查表(AccountBase):
    __tablename__ = "智慧司标准化检查表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="项目序号")
    项目名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="检查项目")

    需要日期JSON: Mapped[str | None] = mapped_column(Text, nullable=True, comment="该项目哪些日期需要检查（JSON，默认全需要）")

    问题JSON: Mapped[str | None] = mapped_column(Text, nullable=True, comment="每日问题/备注（JSON，例如：{\"day3\":\"迟到\"}；为空表示无问题）")

    day1: Mapped[bool] = mapped_column(Boolean, default=False, comment="1日")
    day2: Mapped[bool] = mapped_column(Boolean, default=False, comment="2日")
    day3: Mapped[bool] = mapped_column(Boolean, default=False, comment="3日")
    day4: Mapped[bool] = mapped_column(Boolean, default=False, comment="4日")
    day5: Mapped[bool] = mapped_column(Boolean, default=False, comment="5日")
    day6: Mapped[bool] = mapped_column(Boolean, default=False, comment="6日")
    day7: Mapped[bool] = mapped_column(Boolean, default=False, comment="7日")
    day8: Mapped[bool] = mapped_column(Boolean, default=False, comment="8日")
    day9: Mapped[bool] = mapped_column(Boolean, default=False, comment="9日")
    day10: Mapped[bool] = mapped_column(Boolean, default=False, comment="10日")
    day11: Mapped[bool] = mapped_column(Boolean, default=False, comment="11日")
    day12: Mapped[bool] = mapped_column(Boolean, default=False, comment="12日")
    day13: Mapped[bool] = mapped_column(Boolean, default=False, comment="13日")
    day14: Mapped[bool] = mapped_column(Boolean, default=False, comment="14日")
    day15: Mapped[bool] = mapped_column(Boolean, default=False, comment="15日")
    day16: Mapped[bool] = mapped_column(Boolean, default=False, comment="16日")
    day17: Mapped[bool] = mapped_column(Boolean, default=False, comment="17日")
    day18: Mapped[bool] = mapped_column(Boolean, default=False, comment="18日")
    day19: Mapped[bool] = mapped_column(Boolean, default=False, comment="19日")
    day20: Mapped[bool] = mapped_column(Boolean, default=False, comment="20日")
    day21: Mapped[bool] = mapped_column(Boolean, default=False, comment="21日")
    day22: Mapped[bool] = mapped_column(Boolean, default=False, comment="22日")
    day23: Mapped[bool] = mapped_column(Boolean, default=False, comment="23日")
    day24: Mapped[bool] = mapped_column(Boolean, default=False, comment="24日")
    day25: Mapped[bool] = mapped_column(Boolean, default=False, comment="25日")
    day26: Mapped[bool] = mapped_column(Boolean, default=False, comment="26日")
    day27: Mapped[bool] = mapped_column(Boolean, default=False, comment="27日")
    day28: Mapped[bool] = mapped_column(Boolean, default=False, comment="28日")
    day29: Mapped[bool] = mapped_column(Boolean, default=False, comment="29日")
    day30: Mapped[bool] = mapped_column(Boolean, default=False, comment="30日")
    day31: Mapped[bool] = mapped_column(Boolean, default=False, comment="31日")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_标准化检查_神殿日期序号", "神殿名称", "日期", "序号", unique=True),
        {"schema": "academic"},
    )
