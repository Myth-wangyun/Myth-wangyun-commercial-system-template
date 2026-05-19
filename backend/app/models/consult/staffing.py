"""
祈福司职数明细表数据模型 (consult schema)
记录各神殿咨询和渠道人员职数信息
"""

from datetime import datetime

from sqlalchemy import Column, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .face_to_face_check import ConsultBase


class 祈福司职数汇总表(ConsultBase):
    """祈福司职数汇总表 - 各神殿人员职数汇总"""

    __tablename__ = "祈福司职数汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    
    # 咨询师职数
    咨询总职数: Mapped[int] = mapped_column(Integer, default=0, comment="咨询总职数")
    咨询干部职数: Mapped[int] = mapped_column(Integer, default=0, comment="咨询干部职数")
    咨询员工职数: Mapped[int] = mapped_column(Integer, default=0, comment="咨询员工职数")
    
    # 渠道职数
    渠道总职数: Mapped[int] = mapped_column(Integer, default=0, comment="渠道总职数")
    县办: Mapped[int] = mapped_column(Integer, default=0, comment="县办职数")
    乡办: Mapped[int] = mapped_column(Integer, default=0, comment="乡办职数")
    信息员: Mapped[int] = mapped_column(Integer, default=0, comment="信息员职数")

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
        UniqueConstraint('年份', '神殿', name='uq_staffing_summary_year_campus'),
        Index('idx_staffing_summary_年份', '年份'),
        Index('idx_staffing_summary_神殿', '神殿'),
        {"schema": "consult", "comment": "祈福司职数汇总表"}
    )

    def __repr__(self):
        return f"<祈福司职数汇总表(记录ID={self.记录ID}, 年份={self.年份}, 神殿={self.神殿})>"


class 咨询师人员明细表(ConsultBase):
    """咨询师人员明细表 - 各神殿咨询师详细信息"""

    __tablename__ = "咨询师人员明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    
    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="姓名")
    岗位: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="岗位")
    思想: Mapped[str | None] = mapped_column(Text, nullable=True, comment="思想")
    管理: Mapped[str | None] = mapped_column(Text, nullable=True, comment="管理")
    业务: Mapped[str | None] = mapped_column(Text, nullable=True, comment="业务")

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
        UniqueConstraint('年份', '神殿', '序号', name='uq_consultant_detail_year_campus_seq'),
        Index('idx_consultant_detail_年份', '年份'),
        Index('idx_consultant_detail_神殿', '神殿'),
        {"schema": "consult", "comment": "咨询师人员明细表"}
    )

    def __repr__(self):
        return f"<咨询师人员明细表(记录ID={self.记录ID}, 年份={self.年份}, 神殿={self.神殿}, 姓名={self.姓名})>"


class 渠道人员明细表(ConsultBase):
    """渠道人员明细表 - 各神殿渠道人员详细信息"""

    __tablename__ = "渠道人员明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    
    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="姓名")
    岗位: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="岗位")
    思想: Mapped[str | None] = mapped_column(Text, nullable=True, comment="思想")
    管理: Mapped[str | None] = mapped_column(Text, nullable=True, comment="管理")
    业务: Mapped[str | None] = mapped_column(Text, nullable=True, comment="业务")

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
        UniqueConstraint('年份', '神殿', '序号', name='uq_channel_detail_year_campus_seq'),
        Index('idx_channel_detail_年份', '年份'),
        Index('idx_channel_detail_神殿', '神殿'),
        {"schema": "consult", "comment": "渠道人员明细表"}
    )

    def __repr__(self):
        return f"<渠道人员明细表(记录ID={self.记录ID}, 年份={self.年份}, 神殿={self.神殿}, 姓名={self.姓名})>"
