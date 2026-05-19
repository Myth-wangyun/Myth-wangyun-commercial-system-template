"""
权限模型
定义系统中的各种权限，如查看企业文化宣讲计划、编辑企业文化考试计划等
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .user import Base


class Permission(Base):
    """权限模型"""
    __tablename__ = "permissions"
    __table_args__ = {"schema": "public"}
    
    # 主键
    permission_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="权限ID")
    
    # 基本信息
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="权限代码，如：academic.enterprise_culture.presentation.view")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="权限名称")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, comment="权限描述")
    
    # 分类
    module: Mapped[str] = mapped_column(String(50), nullable=False, comment="所属模块，如：academic, management, teaching_quality")
    resource: Mapped[str] = mapped_column(String(50), nullable=False, comment="资源类型，如：enterprise_culture, meeting_record")
    action: Mapped[str] = mapped_column(String(50), nullable=False, comment="操作类型，如：view, edit, delete, export")
    
    # 配置
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否系统内置权限（不可删除）")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    
    # 时间信息
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    def __repr__(self):
        return f"<Permission(code='{self.code}', name='{self.name}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "permission_id": self.permission_id,
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "module": self.module,
            "resource": self.resource,
            "action": self.action,
            "is_system": self.is_system,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
