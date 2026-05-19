"""
电话标准化检查表数据模型 (consult schema)
"""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.consult.face_to_face_check import ConsultBase


class 电话标准化检查表(ConsultBase):
    """电话标准化检查表主表 - 存储电话咨询录音分析记录"""

    __tablename__ = "电话标准化检查表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), comment="神殿")
    咨询师: Mapped[str] = mapped_column(String(50), nullable=False, comment="咨询师")
    审核人: Mapped[str] = mapped_column(String(50), comment="审核人")
    日期: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="日期")
    
    # 咨询对象信息
    学员姓名: Mapped[str] = mapped_column(String(50), comment="学员姓名")
    联系方式: Mapped[str] = mapped_column(String(50), comment="联系方式")
    
    # 检查内容（JSON格式存储三层结构）
    # 结构: [{ 步骤: "步一", 子结构: [...], 次子结构: [...], 完成情况: true/false, 完成情况对比: true/false }]
    检查内容: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, comment="检查内容（含步骤、子结构、次子结构）")
    
    # 总结和备注
    总结: Mapped[str] = mapped_column(Text, comment="总结")
    备注: Mapped[str] = mapped_column(Text, comment="备注")
    
    # 评分
    总分: Mapped[int] = mapped_column(Integer, comment="总分")
    得分: Mapped[int] = mapped_column(Integer, comment="得分")
    
    # 操作信息
    创建人ID: Mapped[int] = mapped_column(Integer, comment="创建人ID")
    创建人姓名: Mapped[str] = mapped_column(String(50), comment="创建人姓名")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_phone_check_日期', '日期'),
        Index('idx_phone_check_咨询师', '咨询师'),
        Index('idx_phone_check_神殿', '神殿'),
        Index('idx_phone_check_创建时间', '创建时间'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<电话标准化检查表(记录ID={self.记录ID}, 咨询师={self.咨询师}, 日期={self.日期})>"

    def to_dict(self):
        return {
            "记录ID": self.记录ID,
            "神殿": self.神殿,
            "咨询师": self.咨询师,
            "审核人": self.审核人,
            "日期": self.日期.isoformat() if self.日期 else None,
            "学员姓名": self.学员姓名,
            "联系方式": self.联系方式,
            "检查内容": self.检查内容,
            "总结": self.总结,
            "备注": self.备注,
            "总分": self.总分,
            "得分": self.得分,
            "创建人ID": self.创建人ID,
            "创建人姓名": self.创建人姓名,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


class 电话标准化模板配置(ConsultBase):
    """电话标准化模板配置表 - 允许用户自定义检查模板，特别是次子结构"""

    __tablename__ = "电话标准化模板配置"

    模板ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="模板ID")
    模板名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="模板名称")
    
    # 模板内容（JSON格式）
    # 结构: [
    #   {
    #     步骤: "步一：拿问题",
    #     子结构: [
    #       {
    #         名称: "礼貌称呼",
    #         是否必选: true,
    #         次子结构: [
    #           { 名称: "礼貌称呼", 是否必选: true, 可编辑: true },
    #           { 名称: "不说脏话坏话", 是否必选: true, 可编辑: true }
    #         ]
    #       }
    #     ]
    #   }
    # ]
    模板内容: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSON, nullable=False, comment="模板内容（步骤、子结构、次子结构）")
    
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
        Index('idx_phone_template_是否启用', '是否启用'),
        Index('idx_phone_template_是否默认', '是否默认'),
        Index('idx_phone_template_神殿', '神殿'),
        {'schema': 'consult'},
    )

    def __repr__(self):
        return f"<电话标准化模板配置(模板ID={self.模板ID}, 模板名称={self.模板名称})>"

    def to_dict(self):
        return {
            "模板ID": self.模板ID,
            "模板名称": self.模板名称,
            "模板内容": self.模板内容,
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
