"""
渠道代理数据模型
"""
from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..user import Base


class ChannelAgentData(Base):
    """渠道代理数据表"""
    
    __tablename__ = "渠道代理数据"
    __table_args__ = (
        UniqueConstraint("年度", "神殿", "月份", "渠道代理", name="uk_channel_agent_data"),
        Index("idx_channel_agent_year_campus", "年度", "神殿"),
        {"schema": "consult"},
    )
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    年度: Mapped[int] = mapped_column(Integer, nullable=False, comment="年度")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    渠道代理: Mapped[str] = mapped_column(String(50), nullable=False, comment="渠道代理姓名")
    区域数: Mapped[str] = mapped_column(String(50), comment="区域数")
    
    # 渠道招生数据
    咨询量: Mapped[int] = mapped_column(Integer, comment="咨询量")
    上门量: Mapped[int] = mapped_column(Integer, comment="上门量")
    订座: Mapped[int] = mapped_column(Integer, comment="订座")
    实际招生: Mapped[int] = mapped_column(Integer, comment="实际招生")
    退费人数: Mapped[int] = mapped_column(Integer, comment="退费人数")
    
    # 渠道职数
    渠道总职数: Mapped[int] = mapped_column(Integer, comment="渠道总职数")
    县办: Mapped[int] = mapped_column(Integer, comment="县办")
    乡办: Mapped[int] = mapped_column(Integer, comment="乡办")
    信息员: Mapped[int] = mapped_column(Integer, comment="信息员")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
