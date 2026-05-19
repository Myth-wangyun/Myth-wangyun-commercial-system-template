"""
角色-权限关联模型
定义角色拥有哪些权限
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .user import Base


class RolePermission(Base):
    """角色-权限关联模型"""
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint('role_id', 'permission_id', name='uix_role_permission'),
        {"schema": "public"}
    )
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    
    # 外键
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey('public.roles.role_id', ondelete='CASCADE'), nullable=False, comment="角色ID")
    permission_id: Mapped[int] = mapped_column(Integer, ForeignKey('public.permissions.permission_id', ondelete='CASCADE'), nullable=False, comment="权限ID")
    
    # 数据范围：all=全部数据, campus=本神殿数据, self=仅自己的数据
    data_scope: Mapped[str] = mapped_column(String(20), default='all', nullable=False, comment="数据范围: all/campus/self")
    
    # 时间信息
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    def __repr__(self):
        return f"<RolePermission(role_id={self.role_id}, permission_id={self.permission_id}, data_scope={self.data_scope})>"
