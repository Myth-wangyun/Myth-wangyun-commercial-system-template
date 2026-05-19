"""
咨询量交接数据模型
用于祈福司向教化司交接报名和订座的学员
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .face_to_face_check import ConsultBase


class 咨询量交接记录(ConsultBase):
    """
    咨询量交接记录表 - 记录从祈福司交接到教化司的学员信息
    """

    __tablename__ = "咨询量交接记录"

    交接ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="交接ID")
    
    # 关联咨询量明细表
    咨询记录ID: Mapped[int] = mapped_column(Integer, nullable=False, comment="关联的咨询量明细表记录ID")
    
    # 学员基本信息（从咨询量明细表复制）
    姓名: Mapped[str] = mapped_column(String(50), comment="咨询者姓名")
    性别: Mapped[str] = mapped_column(String(10), comment="性别")
    电话: Mapped[str] = mapped_column(String(20), comment="电话")
    学历: Mapped[str] = mapped_column(String(20), comment="学历")
    报名专业: Mapped[str] = mapped_column(String(100), comment="报名专业")
    已交学费: Mapped[str] = mapped_column(String(50), comment="已交学费金额")
    
    # 来源信息
    量来源: Mapped[str] = mapped_column(String(50), comment="量来源")
    媒体来源: Mapped[str] = mapped_column(String(50), comment="媒体来源")
    咨询师: Mapped[str] = mapped_column(String(50), comment="咨询师")
    
    # 状态信息
    状态: Mapped[str] = mapped_column(String(20), comment="状态（报名/订座）")
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    
    # 交接信息
    交接人: Mapped[str] = mapped_column(String(50), comment="交接人（咨询师）")
    交接人ID: Mapped[int] = mapped_column(Integer, comment="交接人ID")
    交接时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="交接时间")
    交接备注: Mapped[str] = mapped_column(Text, comment="交接备注")
    
    # 教质处理信息
    处理状态: Mapped[str] = mapped_column(String(20), default="待分配", comment="处理状态：待分配/已分配/已完成")
    分配班级: Mapped[str] = mapped_column(String(100), comment="分配的班级名称")
    分配班主任: Mapped[str] = mapped_column(String(50), comment="分配的班主任")
    分配时间: Mapped[datetime] = mapped_column(DateTime, comment="分配时间")
    分配人: Mapped[str] = mapped_column(String(50), comment="分配操作人")
    分配人ID: Mapped[int] = mapped_column(Integer, comment="分配操作人ID")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询量交接记录(交接ID={self.交接ID}, 姓名={self.姓名}, 状态={self.状态})>"

    def to_dict(self):
        return {
            "交接ID": self.交接ID,
            "咨询记录ID": self.咨询记录ID,
            "姓名": self.姓名,
            "性别": self.性别,
            "电话": self.电话,
            "学历": self.学历,
            "报名专业": self.报名专业,
            "已交学费": self.已交学费,
            "量来源": self.量来源,
            "媒体来源": self.媒体来源,
            "咨询师": self.咨询师,
            "状态": self.状态,
            "神殿": self.神殿,
            "交接人": self.交接人,
            "交接人ID": self.交接人ID,
            "交接时间": self.交接时间.isoformat() if self.交接时间 else None,
            "交接备注": self.交接备注,
            "处理状态": self.处理状态,
            "分配班级": self.分配班级,
            "分配班主任": self.分配班主任,
            "分配时间": self.分配时间.isoformat() if self.分配时间 else None,
            "分配人": self.分配人,
            "分配人ID": self.分配人ID,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
