"""
口碑招生月度个人目标与结果汇总表（academic schema）
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 口碑招生月度个人目标与结果汇总表(AccountBase):
    """口碑招生月度个人目标与结果汇总表"""

    __tablename__ = "口碑招生月度个人目标与结果汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份 (1-12)")
    姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")

    目标口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="目标口碑量")
    实际口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="实际口碑量")
    目标上门量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="目标上门量")
    实际上门量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="实际上门量")
    目标招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="目标招生人数")
    实际招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="实际招生人数")
    目标口碑收入: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="目标口碑收入")
    实际口碑收入: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="实际口碑收入")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "姓名", name="uq_口碑月度个人_神殿年月姓名"),
        Index("idx_口碑月度个人_神殿年月", "神殿名称", "年份", "月份"),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<口碑招生月度个人目标与结果汇总表(神殿={self.神殿名称}, 年份={self.年份}, 月份={self.月份}, 姓名={self.姓名})>"

