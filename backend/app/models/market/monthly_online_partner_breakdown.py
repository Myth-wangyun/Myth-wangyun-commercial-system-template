"""市场部月度网络合作伙伴分解表 - SQLAlchemy Model

市场部月度数据表的第四个TAB：网络合作伙伴分解表
记录每月各神殿在各网络合作伙伴平台（赶集网、58同城、百度爱采购、1688）的咨询量、上门量、报名量

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase


class 市场部月度网络合作伙伴分解表(MarketBase):
    """市场部月度网络合作伙伴分解表"""
    __tablename__ = '市场部月度网络合作伙伴分解表'
    __table_args__ = (
        Index('idx_月度网络合作伙伴分解_年月神殿', 'year', 'month', 'campus'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment='年份')
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment='月份')
    campus: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')

    # 赶集网
    ganji_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='赶集网咨询量')
    ganji_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='赶集网上门量')
    ganji_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='赶集网报名量')

    # 58同城
    tongcheng_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='58同城咨询量')
    tongcheng_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='58同城上门量')
    tongcheng_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='58同城报名量')

    # 百度爱采购
    baidu_caigou_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度爱采购咨询量')
    baidu_caigou_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度爱采购上门量')
    baidu_caigou_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='百度爱采购报名量')

    # 1688
    alibaba_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='1688咨询量')
    alibaba_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='1688上门量')
    alibaba_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='1688报名量')

    # 合计
    total_consult_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计咨询量')
    total_visit_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计上门量')
    total_enrollment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment='合计报名量')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment='创建时间')
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment='更新时间')
