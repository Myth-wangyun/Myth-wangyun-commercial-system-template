"""
CRUD helpers for audit logs.
"""

from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy.orm import Session, selectinload

from app.models.audit_log import LogEntry, LogResource


def search_logs(
    db: Session,
    *,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    action: Optional[str] = None,
    action_category: Optional[str] = None,
    module: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    table_name: Optional[str] = None,
    record_id: Optional[str] = None,
    success: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    include_resources: bool = True,
) -> Tuple[int, list[LogEntry]]:
    base_query = db.query(LogEntry.id, LogEntry.ts)

    if user_id is not None:
        base_query = base_query.filter(LogEntry.user_id == user_id)
    if username:
        base_query = base_query.filter(LogEntry.username == username)
    if action:
        base_query = base_query.filter(LogEntry.action == action)
    if action_category:
        base_query = base_query.filter(LogEntry.action_category == action_category)
    if module:
        base_query = base_query.filter(LogEntry.module == module)
    if start_time:
        base_query = base_query.filter(LogEntry.ts >= start_time)
    if end_time:
        base_query = base_query.filter(LogEntry.ts <= end_time)
    if success is not None:
        base_query = base_query.filter(LogEntry.success == success)

    if table_name or record_id:
        base_query = base_query.join(LogResource, LogResource.log_id == LogEntry.id)
        if table_name:
            base_query = base_query.filter(LogResource.table_name == table_name)
        if record_id:
            base_query = base_query.filter(LogResource.record_id == str(record_id))

    base_query = base_query.distinct()
    total = base_query.count()

    log_ids = [
        row[0]
        for row in base_query.order_by(LogEntry.ts.desc()).offset(offset).limit(limit).all()
    ]
    if not log_ids:
        return 0, []

    logs_query = db.query(LogEntry).filter(LogEntry.id.in_(log_ids))
    logs_query = logs_query.order_by(LogEntry.ts.desc())
    if include_resources:
        logs_query = logs_query.options(selectinload(LogEntry.resources))
    items = logs_query.all()

    return total, items


def get_log(db: Session, log_id: int, include_resources: bool = True) -> Optional[LogEntry]:
    query = db.query(LogEntry).filter(LogEntry.id == log_id)
    if include_resources:
        query = query.options(selectinload(LogEntry.resources))
    return query.first()
