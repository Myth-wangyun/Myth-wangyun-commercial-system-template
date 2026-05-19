"""
咨询缴费记录模型 (consult schema)
与咨询量明细表(咨询量明细表_v2)深度绑定
设计目的：
1. 记录每个咨询量的缴费情况（应交、首款、后续交费）
2. 方便教质班主任查看学生缴费细节
3. 支持分期付款跟踪
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

# 使用共享的 ConsultBase
from .face_to_face_check import ConsultBase


class 咨询缴费记录表(ConsultBase):
    """
    咨询缴费记录表 - 与咨询量明细表一对一绑定
    记录每个咨询量的缴费汇总信息
    """

    __tablename__ = "咨询缴费记录表"

    缴费ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="缴费记录ID")
    
    # 深度绑定咨询量明细（外键关系）
    记录ID: Mapped[int] = mapped_column(Integer, nullable=False, unique=True, comment="关联的咨询量明细记录ID(唯一)")
    对象ID: Mapped[int] = mapped_column(Integer, nullable=False, comment="关联的咨询对象ID")
    
    # 应交金额（报名时确定）
    应交金额: Mapped[int] = mapped_column(Integer, default=0, comment="应交金额（元）")
    
    # 首款信息
    首款金额: Mapped[int] = mapped_column(Integer, default=0, comment="首款金额（元）")
    首款时间: Mapped[datetime] = mapped_column(DateTime, comment="首款时间")
    首款方式: Mapped[str] = mapped_column(String(50), comment="首款方式：现金、微信、支付宝、银行卡等")
    首款收款人: Mapped[str] = mapped_column(String(50), comment="首款收款人")
    首款凭证号: Mapped[str] = mapped_column(String(100), comment="首款凭证号/流水号")
    首款备注: Mapped[str] = mapped_column(String(500), comment="首款备注")
    
    # 已交总额（自动计算：首款 + 所有后续缴费）
    已交总额: Mapped[int] = mapped_column(Integer, default=0, comment="已交总额（元）")
    
    # 欠费金额（自动计算：应交 - 已交）
    欠费金额: Mapped[int] = mapped_column(Integer, default=0, comment="欠费金额（元）")
    
    # 缴费状态
    缴费状态: Mapped[str] = mapped_column(String(20), default='未缴费', comment="缴费状态：未缴费、部分缴费、已缴清")
    
    # 后续缴费次数（自动计算）
    后续缴费次数: Mapped[int] = mapped_column(Integer, default=0, comment="后续缴费次数")
    
    # 教质班主任关注的信息
    班主任: Mapped[str] = mapped_column(String(50), comment="分配的班主任")
    班级: Mapped[str] = mapped_column(String(100), comment="分配的班级")
    催缴状态: Mapped[str] = mapped_column(String(50), comment="催缴状态：无需催缴、待催缴、催缴中、已催缴")
    催缴备注: Mapped[str] = mapped_column(Text, comment="催缴备注")
    最后催缴时间: Mapped[datetime] = mapped_column(DateTime, comment="最后催缴时间")
    
    # 创建信息
    创建人: Mapped[str] = mapped_column(String(50), comment="创建人")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_payment_record_id', '记录ID'),
        Index('idx_payment_object_id', '对象ID'),
        Index('idx_payment_status', '缴费状态'),
        Index('idx_payment_班主任', '班主任'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询缴费记录表(缴费ID={self.缴费ID}, 记录ID={self.记录ID}, 应交={self.应交金额}, 已交={self.已交总额})>"

    def to_dict(self):
        return {
            "缴费ID": self.缴费ID,
            "记录ID": self.记录ID,
            "对象ID": self.对象ID,
            "应交金额": self.应交金额 or 0,
            "首款金额": self.首款金额 or 0,
            "首款时间": self.首款时间.isoformat() if self.首款时间 else None,
            "首款方式": self.首款方式,
            "首款收款人": self.首款收款人,
            "首款凭证号": self.首款凭证号,
            "首款备注": self.首款备注,
            "已交总额": self.已交总额 or 0,
            "欠费金额": self.欠费金额 or 0,
            "缴费状态": self.缴费状态,
            "后续缴费次数": self.后续缴费次数 or 0,
            "班主任": self.班主任,
            "班级": self.班级,
            "催缴状态": self.催缴状态,
            "催缴备注": self.催缴备注,
            "最后催缴时间": self.最后催缴时间.isoformat() if self.最后催缴时间 else None,
            "创建人": self.创建人,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


class 咨询缴费明细表(ConsultBase):
    """
    咨询缴费明细表 - 记录每次后续缴费的详细信息
    与咨询缴费记录表一对多关系
    """

    __tablename__ = "咨询缴费明细表"

    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 关联缴费记录
    缴费ID: Mapped[int] = mapped_column(Integer, nullable=False, comment="关联的缴费记录ID")
    
    # 缴费金额
    缴费金额: Mapped[int] = mapped_column(Integer, nullable=False, comment="本次缴费金额（元）")
    
    # 缴费时间
    缴费时间: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="缴费时间")
    
    # 缴费方式
    缴费方式: Mapped[str] = mapped_column(String(50), comment="缴费方式：现金、微信、支付宝、银行卡等")
    
    # 收款人
    收款人: Mapped[str] = mapped_column(String(50), comment="收款人")
    
    # 凭证号（收据号）
    凭证号: Mapped[str] = mapped_column(String(100), comment="收据/凭证号")
    
    # 备注
    备注: Mapped[str] = mapped_column(String(500), comment="缴费备注")
    
    # 创建信息
    创建人: Mapped[str] = mapped_column(String(50), comment="创建人")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")

    __table_args__ = (
        Index('idx_payment_detail_payment_id', '缴费ID'),
        Index('idx_payment_detail_time', '缴费时间'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<咨询缴费明细表(明细ID={self.明细ID}, 缴费ID={self.缴费ID}, 金额={self.缴费金额})>"

    def to_dict(self):
        return {
            "明细ID": self.明细ID,
            "缴费ID": self.缴费ID,
            "缴费金额": self.缴费金额 or 0,
            "缴费时间": self.缴费时间.isoformat() if self.缴费时间 else None,
            "缴费方式": self.缴费方式,
            "收款人": self.收款人,
            "凭证号": self.凭证号,
            "备注": self.备注,
            "创建人": self.创建人,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
        }
