"""
咨询模块数据模型
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base


class 咨询量明细表(Base):
    """咨询量明细表 - 详细记录每次咨询信息"""

    __tablename__ = "咨询量明细表"

    咨询ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="咨询ID")
    咨询日期: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="咨询日期")
    学员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="学员姓名")
    联系电话: Mapped[str] = mapped_column(String(20), nullable=False, comment="联系电话")
    咨询方式: Mapped[str] = mapped_column(String(20), nullable=False, comment="咨询方式（在线/电话/到访）")
    意向等级: Mapped[str] = mapped_column(String(10), nullable=False, comment="意向等级（高/中/低）")
    咨询状态: Mapped[str] = mapped_column(String(20), nullable=False, comment="咨询状态（待跟进/跟进中/已报名/已放弃）")
    转化状态: Mapped[str] = mapped_column(String(20), default="未转化", comment="转化状态（未转化/已转化/流失）")
    备注: Mapped[str] = mapped_column(Text, comment="备注信息")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_咨询日期', '咨询日期'),
        Index('idx_学员姓名', '学员姓名'),
        Index('idx_咨询状态', '咨询状态'),
        Index('idx_转化状态', '转化状态'),
    )

    def __repr__(self):
        return f"<咨询量明细表(咨询ID={self.咨询ID}, 学员姓名={self.学员姓名}, 咨询日期={self.咨询日期})>"

    def to_dict(self):
        return {
            "咨询ID": self.咨询ID,
            "咨询日期": self.咨询日期.isoformat() if self.咨询日期 else None,
            "学员姓名": self.学员姓名,
            "联系电话": self.联系电话,
            "咨询方式": self.咨询方式,
            "意向等级": self.意向等级,
            "咨询状态": self.咨询状态,
            "转化状态": self.转化状态,
            "备注": self.备注,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
