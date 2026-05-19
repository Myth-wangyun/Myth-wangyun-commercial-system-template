from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Declarative base for account and public schema models."""


class UserRole(PyEnum):
    ADMIN = "admin"
    MANAGER = "manager"
    TEACHER = "teacher"
    CONSULTANT = "consultant"
    STAFF = "staff"
    VIEWER = "viewer"


class UserStatus(PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_campus", "campus"),
        Index("ix_users_status", "status"),
        Index("ix_users_department", "department"),
        {"schema": "public"},
    )

    user_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="用户ID"
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="用户名"
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="密码哈希"
    )
    real_name: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="真实姓名"
    )
    email: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, comment="邮箱"
    )
    phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="手机号"
    )
    department: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="部门"
    )
    position: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="岗位"
    )
    campus: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="神殿"
    )
    campus_access_list: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
        comment="可访问神殿列表",
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.STAFF, comment="用户角色"
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus),
        default=UserStatus.ACTIVE,
        comment="用户状态",
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, default=False, comment="是否超级用户"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
        comment="更新时间",
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="最后登录时间"
    )
    gender: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="性别"
    )
    entry_date: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, comment="入职时间"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    permissions: Mapped[list["UserPermissionDirect"]] = relationship(
        "UserPermissionDirect", back_populates="user", lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User(username='{self.username}', real_name='{self.real_name}', role='{self.role.value}')>"

    @staticmethod
    def normalize_campus_access_list(
        campus: str | None,
        campus_access_list: Sequence[object] | None,
    ) -> list[str]:
        normalized: list[str] = []

        if isinstance(campus, str):
            campus_name = campus.strip()
            if campus_name:
                normalized.append(campus_name)

        if isinstance(campus_access_list, list):
            for item in campus_access_list:
                if not isinstance(item, str):
                    continue
                campus_name = item.strip()
                if campus_name and campus_name not in normalized:
                    normalized.append(campus_name)

        return normalized

    def get_accessible_campuses(self) -> list[str]:
        return self.normalize_campus_access_list(self.campus, self.campus_access_list)

    def has_campus_access(self, campus_name: str) -> bool:
        return campus_name in self.get_accessible_campuses()

    def to_dict(self) -> dict[str, object | None]:
        return {
            "user_id": self.user_id,
            "username": self.username,
            "real_name": self.real_name,
            "email": self.email,
            "phone": self.phone,
            "department": self.department,
            "position": self.position,
            "campus": self.campus,
            "campus_access_list": self.get_accessible_campuses(),
            "role": self.role.value,
            "status": self.status.value,
            "is_superuser": self.is_superuser,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "gender": self.gender,
            "entry_date": self.entry_date.isoformat() if self.entry_date else None,
            "notes": self.notes,
        }


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = (
        Index("ix_user_sessions_user_id", "user_id"),
        Index("ix_user_sessions_expires_at", "expires_at"),
        Index("ix_user_sessions_is_active", "is_active"),
        {"schema": "public"},
    )

    session_id: Mapped[str] = mapped_column(
        String(255), primary_key=True, comment="会话ID"
    )
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="用户ID")
    token: Mapped[str] = mapped_column(String(500), nullable=False, comment="JWT Token")
    expires_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, comment="过期时间"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, comment="创建时间"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否激活")

    def __repr__(self) -> str:
        return f"<UserSession(user_id={self.user_id}, expires_at='{self.expires_at}')>"
