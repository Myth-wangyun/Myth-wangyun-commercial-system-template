"""
Audit log query APIs.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import audit_log as crud
from ....schemas.audit_log import LogEntryOut, LogListResponse

router = APIRouter()


@router.get("/", response_model=LogListResponse, summary="List audit logs")
def list_logs(
    user_id: Optional[int] = Query(None, description="User ID"),
    username: Optional[str] = Query(None, description="Username"),
    action: Optional[str] = Query(None, description="Action code"),
    action_category: Optional[str] = Query(None, description="Action category"),
    module: Optional[str] = Query(None, description="Module"),
    table_name: Optional[str] = Query(None, description="Table name"),
    record_id: Optional[str] = Query(None, description="Record ID"),
    start_time: Optional[datetime] = Query(None, description="Start time (ISO8601)"),
    end_time: Optional[datetime] = Query(None, description="End time (ISO8601)"),
    success: Optional[bool] = Query(None, description="Success flag"),
    limit: int = Query(50, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Offset"),
    include_resources: bool = Query(True, description="Include resource details"),
    db: Session = Depends(get_db),
):
    total, items = crud.search_logs(
        db,
        user_id=user_id,
        username=username,
        action=action,
        action_category=action_category,
        module=module,
        start_time=start_time,
        end_time=end_time,
        table_name=table_name,
        record_id=record_id,
        success=success,
        limit=limit,
        offset=offset,
        include_resources=include_resources,
    )
    if not include_resources:
        items = [item.to_dict() for item in items]
    return LogListResponse(total=total, items=items)


@router.get("/{log_id}", response_model=LogEntryOut, summary="Get audit log")
def get_log(
    log_id: int = Path(..., description="Log ID"),
    include_resources: bool = Query(True, description="Include resource details"),
    db: Session = Depends(get_db),
):
    log_entry = crud.get_log(db, log_id, include_resources=include_resources)
    if not log_entry:
        raise HTTPException(status_code=404, detail="日志不存在")
    if not include_resources:
        return LogEntryOut(**log_entry.to_dict())
    return log_entry
