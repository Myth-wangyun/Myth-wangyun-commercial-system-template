"""
合作方联系方式模块数据库模型
"""

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .market import MarketBase


class 合作方联系方式表(MarketBase):
    """合作方联系方式表"""
    
    __tablename__ = "合作方联系方式表"
    
    # 主键
    合作方ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="合作方ID")
    
    # 基本信息
    公司名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="公司名称")
    合作方类型: Mapped[str] = mapped_column(String(30), nullable=False, comment="合作方类型")
    电话: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="电话")
    网站: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="网站")
    地址: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="地址")
    
    # 联系人信息
    联系人: Mapped[str] = mapped_column(String(50), nullable=False, comment="联系人")
    联系人手机: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="联系人手机")
    QQ: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="QQ")
    微信: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="微信")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引
    __table_args__ = (
        Index('idx_公司名称', '公司名称'),
        Index('idx_合作方类型', '合作方类型'),
    )
    
    def __repr__(self):
        return f"<合作方联系方式表(合作方ID={self.合作方ID}, 公司名称={self.公司名称})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "合作方ID": self.合作方ID,
            "公司名称": self.公司名称,
            "合作方类型": self.合作方类型,
            "电话": self.电话,
            "网站": self.网站,
            "地址": self.地址,
            "联系人": self.联系人,
            "联系人手机": self.联系人手机,
            "QQ": self.QQ,
            "微信": self.微信,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
