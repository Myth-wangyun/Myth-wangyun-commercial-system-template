"""
角色模型
用于定义系统中的角色，如董事长、学术总监等
"""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .user import Base


class Role(Base):
    """角色模型"""
    __tablename__ = "roles"
    __table_args__ = {"schema": "public"}
    
    # 主键
    role_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="角色ID")
    
    # 基本信息
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="角色代码，如：chairman, academic_director")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="角色名称，如：董事长、学术总监")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, comment="角色描述")
    
    # 配置
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否系统内置角色（不可删除）")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    
    # 时间信息
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    def __repr__(self):
        return f"<Role(code='{self.code}', name='{self.name}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "role_id": self.role_id,
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "is_system": self.is_system,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
