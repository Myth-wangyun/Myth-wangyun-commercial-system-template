"""
口碑报名明细表（academic schema）
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 口碑报名明细表(AccountBase):
    """口碑报名明细表"""

    __tablename__ = "口碑报名明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份 (1-12)")
    教员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="教员姓名")
    报名者姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="报名者姓名")
    报名时间: Mapped[date] = mapped_column(Date, nullable=False, comment="报名时间")
    报名专业: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="报名专业")
    报名学制: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="报名学制")
    应收学费: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="应收学费")
    实交学费: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="实交学费")
    是否过课时: Mapped[str | None] = mapped_column(String(10), nullable=True, default='否', comment="是否过课时")
    是否稳定: Mapped[str | None] = mapped_column(String(10), nullable=True, default='稳定', comment="是否稳定")
    咨询师: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="咨询师")
    介绍人姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="介绍人姓名")
    口碑介绍关系: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="口碑介绍关系")
    口碑来源: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="口碑来源")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_口碑报名_神殿年月", "神殿名称", "年份", "月份"),
        Index("idx_口碑报名_教员", "神殿名称", "年份", "月份", "教员姓名"),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<口碑报名明细表(神殿={self.神殿名称}, 年份={self.年份}, 月份={self.月份}, 报名者={self.报名者姓名})>"

