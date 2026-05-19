"""
Audit log models for tracking user actions and data changes.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class LogEntry(AccountBase):
    __tablename__ = "logs"
    __table_args__ = (
        Index("ix_logs_user_id_ts", "user_id", "ts"),
        Index("ix_logs_username_ts", "username", "ts"),
        Index("ix_logs_action_ts", "action", "ts"),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    username: Mapped[str | None] = mapped_column(String(50), nullable=True)
    real_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(200), nullable=False)
    action_display: Mapped[str | None] = mapped_column(String(200), nullable=True)
    action_category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    module: Mapped[str | None] = mapped_column(String(100), nullable=True)
    endpoint: Mapped[str | None] = mapped_column(String(200), nullable=True)
    method: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    resource_summary: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    extra: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )

    resources: Mapped[list["LogResource"]] = relationship(
        "LogResource",
        back_populates="log",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "ts": self.ts.isoformat() if self.ts else None,
            "user_id": self.user_id,
            "username": self.username,
            "real_name": self.real_name,
            "action": self.action,
            "action_display": self.action_display,
            "action_category": self.action_category,
            "module": self.module,
            "endpoint": self.endpoint,
            "method": self.method,
            "status_code": self.status_code,
            "latency_ms": self.latency_ms,
            "ip": self.ip,
            "user_agent": self.user_agent,
            "request_id": self.request_id,
            "success": self.success,
            "error_message": self.error_message,
            "resource_summary": self.resource_summary,
            "extra": self.extra,
        }


class LogResource(AccountBase):
    __tablename__ = "log_resources"
    __table_args__ = (
        Index("ix_log_resources_log_id", "log_id"),
        Index(
            "ix_log_resources_table_record", "schema_name", "table_name", "record_id"
        ),
        {"schema": "public"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    log_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("public.logs.id", ondelete="CASCADE"),
        nullable=False,
    )
    schema_name: Mapped[str] = mapped_column(String(50), nullable=False)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    record_pk: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    biz_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    op: Mapped[str] = mapped_column(String(16), nullable=False)
    before: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    after: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    diff: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    sensitivity_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    log: Mapped["LogEntry"] = relationship("LogEntry", back_populates="resources")

    def to_dict(self):
        return {
            "id": self.id,
            "log_id": self.log_id,
            "schema_name": self.schema_name,
            "table_name": self.table_name,
            "record_id": self.record_id,
            "record_pk": self.record_pk,
            "biz_key": self.biz_key,
            "op": self.op,
            "before": self.before,
            "after": self.after,
            "diff": self.diff,
            "sensitivity_level": self.sensitivity_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
