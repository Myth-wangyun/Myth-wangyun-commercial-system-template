from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base for public schema models."""
    pass


class GodRole(PyEnum):
    """神祇角色枚举"""
    SUPREME = "supreme"           # 至高神
    BUDDHA = "buddha"             # 佛祖
    BODHISATTVA = "bodhisattva"   # 菩萨


class GodStatus(PyEnum):
    """神祇状态枚举"""
    ACTIVE = "active"             # 在位
    RESTING = "resting"           # 休养中
    ASCENDED = "ascended"         # 升天


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class God(Base):
    """神祇表"""
    __tablename__ = "gods"
    __table_args__ = (
        Index("ix_gods_role", "role"),
        Index("ix_gods_status", "status"),
        {"schema": "public"},
    )

    god_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="神祇ID"
    )
    name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="神祇名称"
    )
    title: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="神祇称号"
    )
    role: Mapped[GodRole] = mapped_column(
        Enum(GodRole), default=GodRole.SUPREME, comment="神祇角色"
    )
    status: Mapped[GodStatus] = mapped_column(
        Enum(GodStatus), default=GodStatus.ACTIVE, comment="神祇状态"
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="神祇描述"
    )
    power_level: Mapped[int] = mapped_column(
        Integer, default=100, comment="神力等级(1-100)"
    )
    avatar: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="神祇头像URL"
    )
    temple_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="神殿名称"
    )
    blessing: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="神祇祝福语"
    )
    is_eternal: Mapped[bool] = mapped_column(
        Boolean, default=True, comment="是否永恒"
    )
    reign_years: Mapped[int] = mapped_column(
        Integer, default=0, comment="统治年数"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, comment="更新时间"
    )

    def __repr__(self) -> str:
        return f"<God(name='{self.name}', title='{self.title}')>"


class AdminUser(Base):
    """管理员表"""
    __tablename__ = "admin_users"
    __table_args__ = (
        Index("ix_admin_username", "username"),
        {"schema": "public"},
    )

    admin_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="管理员ID"
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="管理员用户名"
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="密码哈希"
    )
    nickname: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="管理员昵称"
    )
    role: Mapped[str] = mapped_column(
        String(20), default="admin", comment="管理员角色"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, comment="是否激活"
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="最后登录时间"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, comment="更新时间"
    )

    def __repr__(self) -> str:
        return f"<AdminUser(username='{self.username}')>"
