"""
路由-权限映射模型
映射前端 routeKey 到后端 permission_code
"""
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from .user import Base, utcnow


class PermissionRouteMap(Base):
    """路由-权限映射表"""
    __tablename__ = "permission_route_map"
    __table_args__ = {"schema": "public"}

    route_key: Mapped[str] = mapped_column(
        String(200), primary_key=True, comment="前端路由key"
    )
    permission_code: Mapped[str] = mapped_column(
        String(200), primary_key=True, comment="权限代码"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, comment="创建时间"
    )

    def __repr__(self) -> str:
        return f"<PermissionRouteMap(route_key={self.route_key}, code={self.permission_code})>"
