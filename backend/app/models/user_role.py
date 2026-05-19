"""
用户-角色关联模型
定义用户拥有哪些角色
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .user import Base


class UserRole(Base):
    """用户-角色关联模型"""
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='uix_user_role'),
        {"schema": "public"}
    )
    
    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    
    # 外键
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('public.users.user_id', ondelete='CASCADE'), nullable=False, comment="用户ID")
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey('public.roles.role_id', ondelete='CASCADE'), nullable=False, comment="角色ID")
    
    # 时间信息
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"
