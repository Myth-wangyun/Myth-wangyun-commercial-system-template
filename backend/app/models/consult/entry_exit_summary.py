"""
祈福司入职离职汇总表数据模型 (consult schema)
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .face_to_face_check import ConsultBase


class 祈福司入职离职汇总表(ConsultBase):
    """祈福司入职离职汇总表 - 按岗位统计每月招聘和离职人数"""

    __tablename__ = "祈福司入职离职汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 基本信息
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="统计年份")
    岗位: Mapped[str] = mapped_column(String(50), nullable=False, comment="岗位名称（咨询干部/咨询/咨询助理/渠道）")
    指标类型: Mapped[str] = mapped_column(String(20), nullable=False, comment="指标类型（实际招聘人数/离职人数）")

    # 各月数据
    一月: Mapped[int] = mapped_column(Integer, default=0, comment="1月数据")
    二月: Mapped[int] = mapped_column(Integer, default=0, comment="2月数据")
    三月: Mapped[int] = mapped_column(Integer, default=0, comment="3月数据")
    四月: Mapped[int] = mapped_column(Integer, default=0, comment="4月数据")
    五月: Mapped[int] = mapped_column(Integer, default=0, comment="5月数据")
    六月: Mapped[int] = mapped_column(Integer, default=0, comment="6月数据")
    七月: Mapped[int] = mapped_column(Integer, default=0, comment="7月数据")
    八月: Mapped[int] = mapped_column(Integer, default=0, comment="8月数据")
    九月: Mapped[int] = mapped_column(Integer, default=0, comment="9月数据")
    十月: Mapped[int] = mapped_column(Integer, default=0, comment="10月数据")
    十一月: Mapped[int] = mapped_column(Integer, default=0, comment="11月数据")
    十二月: Mapped[int] = mapped_column(Integer, default=0, comment="12月数据")

    # 合计
    合计: Mapped[int] = mapped_column(Integer, default=0, comment="全年合计")

    # 操作信息
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_entry_exit_年份_岗位_指标', '年份', '岗位', '指标类型'),
        Index('idx_entry_exit_神殿', '神殿'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<祈福司入职离职汇总表(记录ID={self.记录ID}, 年份={self.年份}, 岗位={self.岗位}, 指标类型={self.指标类型})>"