"""
当面标准化检查表数据模型 (consult schema)
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


# Consult schema 专用 Base
class ConsultBase(DeclarativeBase):
    __abstract__ = True


class 当面标准化检查表(ConsultBase):
    """当面标准化检查表主表 - 存储当面预案和复盘记录"""

    __tablename__ = "当面标准化检查表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    
    # 基本信息
    咨询日期: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="咨询日期")
    学员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="学员姓名")
    性别: Mapped[str] = mapped_column(String(10), comment="性别")
    年龄: Mapped[str] = mapped_column(String(10), comment="年龄")
    状态: Mapped[str] = mapped_column(String(20), comment="状态")
    需求: Mapped[str] = mapped_column(Text, comment="需求")
    关注点: Mapped[str] = mapped_column(Text, comment="关注点")
    抗拒点: Mapped[str] = mapped_column(Text, comment="抗拒点")
    陪同人: Mapped[str] = mapped_column(String(50), comment="陪同人")
    决策人: Mapped[str] = mapped_column(String(50), comment="决策人")
    地区: Mapped[str] = mapped_column(String(100), comment="地区")
    
    # 类型：预案/复盘
    记录类型: Mapped[str] = mapped_column(String(20), nullable=False, comment="记录类型（预案/复盘）")
    
    # 关联的预案ID（如果是复盘，关联到预案）
    关联预案ID: Mapped[int] = mapped_column(Integer, ForeignKey("consult.当面标准化检查表.记录ID"), comment="关联的预案ID")
    
    # 咨询步骤内容（JSON格式存储，允许灵活配置）
    咨询步骤内容: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, comment="咨询步骤内容")
    
    # 总结和反馈
    自我总结: Mapped[str] = mapped_column(Text, comment="自我总结")
    领导指正: Mapped[str] = mapped_column(Text, comment="领导指正")
    
    # 操作信息
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_face_to_face_咨询日期', '咨询日期'),
        Index('idx_face_to_face_学员姓名', '学员姓名'),
        Index('idx_face_to_face_记录类型', '记录类型'),
        Index('idx_face_to_face_神殿', '神殿'),
        Index('idx_face_to_face_关联预案ID', '关联预案ID'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<当面标准化检查表(记录ID={self.记录ID}, 学员姓名={self.学员姓名}, 记录类型={self.记录类型})>"

    def to_dict(self):
        return {
            "记录ID": self.记录ID,
            "咨询日期": self.咨询日期.isoformat() if self.咨询日期 else None,
            "学员姓名": self.学员姓名,
            "性别": self.性别,
            "年龄": self.年龄,
            "状态": self.状态,
            "需求": self.需求,
            "关注点": self.关注点,
            "抗拒点": self.抗拒点,
            "陪同人": self.陪同人,
            "决策人": self.决策人,
            "记录类型": self.记录类型,
            "关联预案ID": self.关联预案ID,
            "咨询步骤内容": self.咨询步骤内容,
            "自我总结": self.自我总结,
            "领导指正": self.领导指正,
            "创建人ID": self.创建人ID,
            "创建人姓名": self.创建人姓名,
            "神殿": self.神殿,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


class 当面标准化模板配置(ConsultBase):
    """当面标准化模板配置表 - 允许用户自定义表格模板"""

    __tablename__ = "当面标准化模板配置"

    模板ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="模板ID")
    模板名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="模板名称")
    模板类型: Mapped[str] = mapped_column(String(20), nullable=False, comment="模板类型（预案/复盘）")
    
    # 咨询步骤配置（JSON格式）
    咨询步骤配置: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, nullable=False, comment="咨询步骤配置")
    
    # 基本信息字段配置（JSON格式）
    基本信息字段配置: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, comment="基本信息字段配置")
    
    # 是否启用
    是否启用: Mapped[int] = mapped_column(Integer, default=1, comment="是否启用（0-禁用 1-启用）")
    
    # 是否默认模板
    是否默认: Mapped[int] = mapped_column(Integer, default=0, comment="是否默认模板（0-否 1-是）")
    
    # 排序序号
    排序序号: Mapped[int] = mapped_column(Integer, default=0, comment="排序序号")
    
    # 备注
    备注: Mapped[str] = mapped_column(Text, comment="备注")
    
    # 操作信息
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_face_template_模板类型', '模板类型'),
        Index('idx_face_template_是否启用', '是否启用'),
        Index('idx_face_template_是否默认', '是否默认'),
        Index('idx_face_template_神殿', '神殿'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<当面标准化模板配置(模板ID={self.模板ID}, 模板名称={self.模板名称}, 模板类型={self.模板类型})>"

    def to_dict(self):
        return {
            "模板ID": self.模板ID,
            "模板名称": self.模板名称,
            "模板类型": self.模板类型,
            "咨询步骤配置": self.咨询步骤配置,
            "基本信息字段配置": self.基本信息字段配置,
            "是否启用": self.是否启用,
            "是否默认": self.是否默认,
            "排序序号": self.排序序号,
            "备注": self.备注,
            "创建人ID": self.创建人ID,
            "创建人姓名": self.创建人姓名,
            "神殿": self.神殿,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
