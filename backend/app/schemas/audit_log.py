"""
Pydantic schemas for audit logs.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class LogResourceBase(BaseModel):
    schema_name: str = Field(..., description="Schema name")
    table_name: str = Field(..., description="Table name")
    record_id: Optional[str] = Field(None, description="Primary key as string")
    record_pk: Optional[dict] = Field(None, description="Composite primary key")
    biz_key: Optional[str] = Field(None, description="Business key")
    op: str = Field(..., description="Operation code")
    before: Optional[Any] = None
    after: Optional[Any] = None
    diff: Optional[Any] = None
    sensitivity_level: int = Field(0, ge=0, le=2)


class LogResourceCreate(LogResourceBase):
    pass


class LogResourceOut(LogResourceBase):
    id: int
    log_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class LogEntryBase(BaseModel):
    ts: Optional[datetime] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    real_name: Optional[str] = None
    action: str
    action_display: Optional[str] = None
    action_category: Optional[str] = None
    module: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    status_code: Optional[int] = None
    latency_ms: Optional[int] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    resource_summary: Optional[Any] = None
    extra: Optional[Any] = None


class LogEntryCreate(LogEntryBase):
    resources: list[LogResourceCreate] = Field(default_factory=list)


class LogEntryOut(LogEntryBase):
    id: int
    resources: Optional[list[LogResourceOut]] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class LogListResponse(BaseModel):
    total: int
    items: list[LogEntryOut]
