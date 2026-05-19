"""
咨询沟通记录模型 (consult schema)
记录每次与咨询者的沟通详情（电话/网聊/当面）
与咨询量明细表深度绑定
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

# 使用共享的 ConsultBase
from .face_to_face_check import ConsultBase


class 咨询沟通记录表(ConsultBase):
    """
    咨询沟通记录表 - 记录每次与咨询者的沟通详情
    与咨询量明细表关联，一个咨询量可以有多条沟通记录
    """

    __tablename__ = "咨询沟通记录表"

    沟通ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="沟通记录ID")
    
    # 关联咨询量明细
    记录ID: Mapped[int] = mapped_column(Integer, nullable=False, comment="关联的咨询量明细记录ID")
    对象ID: Mapped[int] = mapped_column(Integer, nullable=False, comment="关联的咨询对象ID")
    
    # 沟通基本信息
    沟通时间: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="沟通时间")
    用时: Mapped[int] = mapped_column(Integer, default=0, comment="沟通用时（分钟）")
    咨询师: Mapped[str] = mapped_column(String(50), comment="咨询师（沟通人）")
    
    # 沟通方式：网聊、电话、当面
    沟通方式: Mapped[str] = mapped_column(String(20), nullable=False, comment="沟通方式：网聊、电话、当面")
    
    # 沟通内容分析
    需求点: Mapped[str] = mapped_column(String(200), comment="需求点")
    关注点: Mapped[str] = mapped_column(String(200), comment="关注点")
    抗拒点: Mapped[str] = mapped_column(String(200), comment="抗拒点")
    
    # 咨询内容与结果
    咨询内容: Mapped[str] = mapped_column(Text, comment="咨询内容详情")
    咨询结果: Mapped[str] = mapped_column(Text, comment="咨询结果")
    
    # 报名意愿评估
    报名意愿: Mapped[str] = mapped_column(String(20), comment="报名意愿等级：A/B/C/D类")
    有需求: Mapped[int] = mapped_column(Integer, default=0, comment="是否有需求：0-否，1-是")
    有钱: Mapped[int] = mapped_column(Integer, default=0, comment="是否有钱：0-否，1-是")
    有时间: Mapped[int] = mapped_column(Integer, default=0, comment="是否有时间：0-否，1-是")
    有支持: Mapped[int] = mapped_column(Integer, default=0, comment="是否有支持：0-否，1-是")
    
    # 具备条件
    具备条件: Mapped[str] = mapped_column(String(100), comment="具备条件描述")
    课程意向: Mapped[str] = mapped_column(String(100), comment="课程意向")
    
    # 是否联系不上
    联系不上: Mapped[int] = mapped_column(Integer, default=0, comment="是否联系不上：0-否，1-是")
    
    # 预定下次回访
    预定回访时间: Mapped[datetime] = mapped_column(DateTime, comment="预定下次回访时间")
    
    # 创建信息
    创建人: Mapped[str] = mapped_column(String(50), comment="创建人")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_comm_记录ID', '记录ID'),
        Index('idx_comm_对象ID', '对象ID'),
        Index('idx_comm_沟通时间', '沟通时间'),
        Index('idx_comm_咨询师', '咨询师'),
        Index('idx_comm_沟通方式', '沟通方式'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询沟通记录表(沟通ID={self.沟通ID}, 记录ID={self.记录ID}, 沟通方式={self.沟通方式})>"

    def to_dict(self):
        return {
            "沟通ID": self.沟通ID,
            "记录ID": self.记录ID,
            "对象ID": self.对象ID,
            "沟通时间": self.沟通时间.isoformat() if self.沟通时间 else None,
            "用时": self.用时,
            "咨询师": self.咨询师,
            "沟通方式": self.沟通方式,
            "需求点": self.需求点,
            "关注点": self.关注点,
            "抗拒点": self.抗拒点,
            "咨询内容": self.咨询内容,
            "咨询结果": self.咨询结果,
            "报名意愿": self.报名意愿,
            "有需求": self.有需求,
            "有钱": self.有钱,
            "有时间": self.有时间,
            "有支持": self.有支持,
            "具备条件": self.具备条件,
            "课程意向": self.课程意向,
            "联系不上": self.联系不上,
            "预定回访时间": self.预定回访时间.isoformat() if self.预定回访时间 else None,
            "创建人": self.创建人,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
