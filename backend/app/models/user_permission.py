"""
用户-权限直接关联模型
允许管理员直接给用户分配/取消功能权限，无需经过角色中转
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .user import Base, utcnow


class UserPermissionDirect(Base):
    """用户-权限直接关联模型"""
    __tablename__ = "user_permissions_direct"
    __table_args__ = (
        UniqueConstraint('user_id', 'permission_code', name='uix_user_perm_direct'),
        {"schema": "public"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="ID")
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('public.users.user_id', ondelete='CASCADE'), nullable=False, comment="用户ID")
    permission_code: Mapped[str] = mapped_column(String(200), nullable=False, comment="权限代码(即路由key)")
    granted_by: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="授权人")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, comment="创建时间")

    user: Mapped["User"] = relationship("User", back_populates="permissions", lazy="select")

    def __repr__(self) -> str:
        return f"<UserPermissionDirect(user_id={self.user_id}, code={self.permission_code})>"
