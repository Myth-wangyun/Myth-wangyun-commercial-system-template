"""
神殿智慧司口碑招生汇总表（academic schema）
按月份汇总（不分姓名）
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿智慧司口碑招生汇总表(AccountBase):
    """神殿智慧司口碑招生汇总表（按月份汇总）"""

    __tablename__ = "神殿智慧司口碑招生汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份 (1-12)")

    目标口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="目标口碑量（当月合计）")
    实际口碑量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="实际口碑量（当月合计）")
    目标上门量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="目标上门量（当月合计）")
    实际上门量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="实际上门量（当月合计）")
    目标招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="目标招生人数（当月合计）")
    实际招生人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="实际招生人数（当月合计）")
    目标口碑收入: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="目标口碑收入（当月合计）")
    实际口碑收入: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, default=0, comment="实际口碑收入（当月合计）")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", name="uq_口碑神殿汇总_神殿年月"),
        Index("idx_口碑神殿汇总_神殿年", "神殿名称", "年份"),
        {"schema": "academic"},
    )

    def __repr__(self):
        return f"<神殿智慧司口碑招生汇总表(神殿={self.神殿名称}, 年份={self.年份}, 月份={self.月份})>"

