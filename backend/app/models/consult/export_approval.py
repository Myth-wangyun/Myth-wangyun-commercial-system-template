"""
咨询量导出审批模型
"""

from datetime import datetime
from typing import TypeAlias

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.consult.face_to_face_check import ConsultBase

导出筛选值: TypeAlias = str | int | bool | None
导出筛选参数: TypeAlias = dict[str, 导出筛选值]


class 导出审批人(ConsultBase):
    """导出审批人配置表"""
    __tablename__ = "咨询量导出审批人"
    __table_args__ = {'schema': 'consult'}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="用户ID")
    user_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="用户名")
    real_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="真实姓名")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment="创建时间")
    created_by: Mapped[int] = mapped_column(Integer, comment="创建人ID")


class 导出申请(ConsultBase):
    """导出申请表"""
    __tablename__ = "咨询量导出申请"
    __table_args__ = {'schema': 'consult'}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    applicant_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="申请人ID")
    applicant_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="申请人姓名")
    applicant_campus: Mapped[str | None] = mapped_column(String(50), comment="申请人神殿")
    reason: Mapped[str] = mapped_column(Text, nullable=False, comment="申请原因")
    filters: Mapped[导出筛选参数 | None] = mapped_column(JSON, comment="筛选条件")
    total_records: Mapped[int] = mapped_column(Integer, default=0, comment="记录总数")
    status: Mapped[str] = mapped_column(String(20), default='pending', comment="状态: pending/approved/rejected")
    approver_id: Mapped[int | None] = mapped_column(Integer, comment="审批人ID")
    approver_name: Mapped[str | None] = mapped_column(String(50), comment="审批人姓名")
    approval_time: Mapped[datetime | None] = mapped_column(DateTime, comment="审批时间")
    approval_comment: Mapped[str | None] = mapped_column(Text, comment="审批意见")
    download_url: Mapped[str | None] = mapped_column(String(500), comment="下载地址")
    download_expires_at: Mapped[datetime | None] = mapped_column(DateTime, comment="下载过期时间")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
