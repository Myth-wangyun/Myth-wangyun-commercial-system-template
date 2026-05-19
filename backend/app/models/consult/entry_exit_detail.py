"""
祈福司入职离职明细表数据模型 (consult schema)
记录每个员工的入职和离职详细信息
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .face_to_face_check import ConsultBase


class 祈福司入职离职明细表(ConsultBase):
    """祈福司入职离职明细表 - 记录每个员工的入职离职明细"""

    __tablename__ = "祈福司入职离职明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    板块: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="板块")
    岗位: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="岗位")
    类别: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="类别")
    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="姓名")
    入职时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="入职时间")
    离职时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="离职时间")
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    创建时间: Mapped[str] = mapped_column(
        String(50),
        default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        comment="创建时间"
    )
    更新时间: Mapped[str] = mapped_column(
        String(50),
        default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        onupdate=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        comment="更新时间"
    )

    __table_args__ = (
        Index('idx_entry_exit_detail_年份', '年份'),
        Index('idx_entry_exit_detail_岗位', '岗位'),
        Index('idx_entry_exit_detail_姓名', '姓名'),
        {"schema": "consult", "comment": "祈福司入职离职明细表"}
    )

    def __repr__(self):
        return f"<祈福司入职离职明细表(记录ID={self.记录ID}, 年份={self.年份}, 姓名={self.姓名}, 岗位={self.岗位})>"
