from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base


class CampusInfo(Base):
    __tablename__ = "campus_info"
    __table_args__ = (
        Index("idx_campus_info_name", "name"),
        Index("idx_campus_info_status", "status"),
        Index("idx_campus_info_sort_order", "sort_order"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="神殿ID"
    )
    name: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, comment="神殿名称"
    )
    code: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="神殿代码"
    )
    website: Mapped[str | None] = mapped_column(
        String(200), nullable=True, default="#", comment="PC 网站地址"
    )
    mobile_website: Mapped[str | None] = mapped_column(
        String(200), nullable=True, default="#", comment="移动端网站地址"
    )
    status: Mapped[str] = mapped_column(String(20), default="active", comment="状态")
    color: Mapped[str] = mapped_column(String(20), default="#1890ff", comment="主题色")
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="神殿描述"
    )
    address: Mapped[str | None] = mapped_column(
        String(200), nullable=True, comment="神殿地址"
    )
    phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="联系电话"
    )
    email: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="联系邮箱"
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, comment="排序序号")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.current_timestamp(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<CampusInfo(id={self.id}, name={self.name})>"

    def to_dict(self) -> dict[str, object | None]:
        return {
            "id": str(self.id),
            "name": self.name,
            "code": self.code,
            "website": self.website or "#",
            "mobileWebsite": self.mobile_website or "#",
            "status": self.status,
            "color": self.color,
            "description": self.description,
            "address": self.address,
            "phone": self.phone,
            "email": self.email,
            "sortOrder": self.sort_order,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
