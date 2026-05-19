from __future__ import annotations

import logging
from datetime import date
from time import perf_counter
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.crud.human_resources.dashboard_scope import normalize_scope, resolve_scope

from .archive_snapshot import refresh_employee_archive_snapshot
from .refresh_state import (
    complete_refresh,
    fail_refresh,
    is_dashboard_dirty,
    list_due_refresh_states,
    mark_scope_dashboard_dirty,
    reset_timed_out_refreshes,
    try_start_refresh,
)
from .rollups import (
    build_daily_dashboard,
    build_monthly_dashboard,
    build_yearly_dashboard,
    read_daily_dashboard,
    read_monthly_dashboard,
    read_yearly_dashboard,
)

logger = logging.getLogger("human_resources.dashboard.refresh")


def rebuild_daily_dashboard(
    db: Session,
    *,
    scope: str,
    month: str,
    source: str = "manual",
) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    if not try_start_refresh(
        db,
        scope=normalized_scope,
        granularity="daily",
        period=month,
        source=source,
    ):
        cached = read_daily_dashboard(db, scope=normalized_scope, month=month)
        if cached is not None:
            return cached
    started = perf_counter()
    try:
        result = build_daily_dashboard(db, scope=normalized_scope, month=month)
    except Exception as exc:
        fail_refresh(
            db,
            scope=normalized_scope,
            granularity="daily",
            period=month,
            error=str(exc),
        )
        raise
    complete_refresh(
        db,
        scope=normalized_scope,
        granularity="daily",
        period=month,
    )
    logger.info(
        "dashboard refresh success granularity=daily scope=%s period=%s duration_ms=%.1f source=%s",
        normalized_scope,
        month,
        (perf_counter() - started) * 1000,
        source,
    )
    return result


def rebuild_monthly_dashboard(
    db: Session,
    *,
    scope: str,
    year: str,
    source: str = "manual",
) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    if not try_start_refresh(
        db,
        scope=normalized_scope,
        granularity="monthly",
        period=year,
        source=source,
    ):
        cached = read_monthly_dashboard(db, scope=normalized_scope, year=year)
        if cached is not None:
            return cached
    started = perf_counter()
    try:
        result = build_monthly_dashboard(db, scope=normalized_scope, year=year)
    except Exception as exc:
        fail_refresh(
            db,
            scope=normalized_scope,
            granularity="monthly",
            period=year,
            error=str(exc),
        )
        raise
    complete_refresh(
        db,
        scope=normalized_scope,
        granularity="monthly",
        period=year,
    )
    logger.info(
        "dashboard refresh success granularity=monthly scope=%s period=%s duration_ms=%.1f source=%s",
        normalized_scope,
        year,
        (perf_counter() - started) * 1000,
        source,
    )
    return result


def rebuild_yearly_dashboard(
    db: Session,
    *,
    scope: str,
    year: str,
    monthly_dashboard: Optional[dict[str, Any]] = None,
    source: str = "manual",
) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    if not try_start_refresh(
        db,
        scope=normalized_scope,
        granularity="yearly",
        period=year,
        source=source,
    ):
        cached = read_yearly_dashboard(db, scope=normalized_scope, year=year)
        if cached is not None:
            return cached
    started = perf_counter()
    try:
        result = build_yearly_dashboard(
            db,
            scope=normalized_scope,
            year=year,
            monthly_dashboard=monthly_dashboard,
        )
    except Exception as exc:
        fail_refresh(
            db,
            scope=normalized_scope,
            granularity="yearly",
            period=year,
            error=str(exc),
        )
        raise
    complete_refresh(
        db,
        scope=normalized_scope,
        granularity="yearly",
        period=year,
    )
    logger.info(
        "dashboard refresh success granularity=yearly scope=%s period=%s duration_ms=%.1f source=%s",
        normalized_scope,
        year,
        (perf_counter() - started) * 1000,
        source,
    )
    return result


def refresh_scope_dashboard_chain(
    db: Session,
    *,
    scope: str,
    anchor_date: date,
    source: str = "manual",
) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    period_map = mark_scope_dashboard_dirty(
        db,
        scope=normalized_scope,
        anchor_date=anchor_date,
        source=source,
    )
    refresh_employee_archive_snapshot(
        db,
        scope=normalized_scope,
        snapshot_date=anchor_date,
    )
    daily = rebuild_daily_dashboard(
        db,
        scope=normalized_scope,
        month=period_map["daily"],
        source=source,
    )
    monthly = rebuild_monthly_dashboard(
        db,
        scope=normalized_scope,
        year=period_map["monthly"],
        source=source,
    )
    yearly = rebuild_yearly_dashboard(
        db,
        scope=normalized_scope,
        year=period_map["yearly"],
        monthly_dashboard=monthly,
        source=source,
    )
    return {"daily": daily, "monthly": monthly, "yearly": yearly}


def refresh_dashboard_for_values(
    db: Session,
    *,
    anchor_date: Optional[date],
    scope: Optional[str] = None,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    source: str = "manual",
) -> dict[str, Any] | None:
    if not anchor_date:
        return None
    resolved_scope = (
        normalize_scope(scope)
        if scope
        else resolve_scope(
            campus=campus,
            department=department,
            position=position,
        )
    )
    if not resolved_scope:
        return None
    return refresh_scope_dashboard_chain(
        db,
        scope=resolved_scope,
        anchor_date=anchor_date,
        source=source,
    )


def mark_dashboard_for_values(
    db: Session,
    *,
    anchor_date: Optional[date],
    scope: Optional[str] = None,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    source: str = "api",
) -> Optional[dict[str, str]]:
    if not anchor_date:
        return None
    resolved_scope = (
        normalize_scope(scope)
        if scope
        else resolve_scope(
            campus=campus,
            department=department,
            position=position,
        )
    )
    if not resolved_scope:
        return None
    return mark_scope_dashboard_dirty(
        db,
        scope=resolved_scope,
        anchor_date=anchor_date,
        source=source,
    )


def process_scope_dashboard_chain_refresh(
    *,
    scope: str,
    anchor_date: date,
    source: str = "background",
) -> None:
    db = SessionLocal()
    try:
        refresh_scope_dashboard_chain(
            db,
            scope=scope,
            anchor_date=anchor_date,
            source=source,
        )
    finally:
        db.close()


def process_dashboard_refresh_for_values(
    *,
    anchor_date: Optional[date],
    scope: Optional[str] = None,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    source: str = "background",
) -> None:
    if not anchor_date:
        return
    db = SessionLocal()
    try:
        refresh_dashboard_for_values(
            db,
            anchor_date=anchor_date,
            scope=scope,
            campus=campus,
            department=department,
            position=position,
            source=source,
        )
    finally:
        db.close()


def run_pending_dashboard_refreshes(*, limit: int = 20) -> dict[str, Any]:
    db = SessionLocal()
    processed: list[dict[str, str]] = []
    try:
        timed_out = reset_timed_out_refreshes(db)
        due_states = list_due_refresh_states(db, limit=limit)
        for state in due_states:
            anchor_date = state.anchor_date
            if anchor_date is None:
                anchor_date = (
                    date.fromisoformat(f"{state.period}-01")
                    if state.granularity == "daily"
                    else date.fromisoformat(f"{state.period}-01-01")
                )
            try:
                refresh_scope_dashboard_chain(
                    db,
                    scope=state.scope,
                    anchor_date=anchor_date,
                    source="scheduler",
                )
                processed.append(
                    {
                        "scope": state.scope,
                        "granularity": state.granularity,
                        "period": state.period,
                    }
                )
            except Exception:
                logger.exception(
                    "dashboard refresh failed scope=%s granularity=%s period=%s",
                    state.scope,
                    state.granularity,
                    state.period,
                )
        return {"processed": processed, "timed_out_count": len(timed_out)}
    finally:
        db.close()
