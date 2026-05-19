from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.crud.human_resources.dashboard_scope import normalize_scope
from app.models.human_resources import DashboardRefreshState

REFRESH_TIMEOUT = timedelta(minutes=15)


def _get_or_create_refresh_state(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
) -> DashboardRefreshState:
    normalized_scope = normalize_scope(scope)
    state = (
        db.query(DashboardRefreshState)
        .filter(
            DashboardRefreshState.scope == normalized_scope,
            DashboardRefreshState.granularity == granularity,
            DashboardRefreshState.period == period,
        )
        .first()
    )
    if state is None:
        state = DashboardRefreshState(
            scope=normalized_scope,
            granularity=granularity,
            period=period,
            dirty=False,
            running=False,
        )
        db.add(state)
        db.flush()
    return state


def get_refresh_state(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
) -> Optional[DashboardRefreshState]:
    return (
        db.query(DashboardRefreshState)
        .filter(
            DashboardRefreshState.scope == normalize_scope(scope),
            DashboardRefreshState.granularity == granularity,
            DashboardRefreshState.period == period,
        )
        .first()
    )


def is_dashboard_dirty(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
) -> bool:
    state = get_refresh_state(
        db,
        scope=scope,
        granularity=granularity,
        period=period,
    )
    return bool(state and state.dirty)


def mark_dashboard_dirty(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
    anchor_date: Optional[date] = None,
    source: Optional[str] = None,
    commit: bool = True,
) -> DashboardRefreshState:
    state = _get_or_create_refresh_state(
        db,
        scope=scope,
        granularity=granularity,
        period=period,
    )
    state.dirty = True
    if anchor_date is not None:
        state.anchor_date = anchor_date
    state.last_requested_at = datetime.now(UTC)
    if source:
        state.last_source = source
    if commit:
        db.commit()
    else:
        db.flush()
    return state


def mark_scope_dashboard_dirty(
    db: Session,
    *,
    scope: str,
    anchor_date: date,
    source: Optional[str] = None,
) -> dict[str, str]:
    month = anchor_date.strftime("%Y-%m")
    year = anchor_date.strftime("%Y")
    mark_dashboard_dirty(
        db,
        scope=scope,
        granularity="daily",
        period=month,
        anchor_date=anchor_date,
        source=source,
        commit=False,
    )
    mark_dashboard_dirty(
        db,
        scope=scope,
        granularity="monthly",
        period=year,
        anchor_date=anchor_date,
        source=source,
        commit=False,
    )
    mark_dashboard_dirty(
        db,
        scope=scope,
        granularity="yearly",
        period=year,
        anchor_date=anchor_date,
        source=source,
        commit=False,
    )
    db.commit()
    return {"daily": month, "monthly": year, "yearly": year}


def try_start_refresh(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
    source: Optional[str] = None,
) -> bool:
    state = _get_or_create_refresh_state(
        db,
        scope=scope,
        granularity=granularity,
        period=period,
    )
    if state.running:
        return False
    state.running = True
    state.dirty = False
    state.started_at = datetime.now(UTC)
    state.last_error = None
    if source:
        state.last_source = source
    db.commit()
    return True


def complete_refresh(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
) -> DashboardRefreshState:
    state = _get_or_create_refresh_state(
        db,
        scope=scope,
        granularity=granularity,
        period=period,
    )
    state.running = False
    state.started_at = None
    state.last_completed_at = datetime.now(UTC)
    state.last_error = None
    db.commit()
    return state


def fail_refresh(
    db: Session,
    *,
    scope: str,
    granularity: str,
    period: str,
    error: str,
) -> DashboardRefreshState:
    state = _get_or_create_refresh_state(
        db,
        scope=scope,
        granularity=granularity,
        period=period,
    )
    state.running = False
    state.dirty = True
    state.started_at = None
    state.last_error = error[:1000]
    db.commit()
    return state


def list_due_refresh_states(
    db: Session,
    *,
    limit: int = 20,
) -> list[DashboardRefreshState]:
    cutoff = datetime.now(UTC) - REFRESH_TIMEOUT
    states = (
        db.query(DashboardRefreshState)
        .filter(DashboardRefreshState.dirty.is_(True))
        .order_by(
            DashboardRefreshState.last_requested_at.asc().nullsfirst(),
            DashboardRefreshState.id.asc(),
        )
        .limit(limit)
        .all()
    )
    result: list[DashboardRefreshState] = []
    for state in states:
        if state.running and state.started_at and state.started_at > cutoff:
            continue
        result.append(state)
    return result


def reset_timed_out_refreshes(db: Session) -> list[DashboardRefreshState]:
    cutoff = datetime.now(UTC) - REFRESH_TIMEOUT
    states = (
        db.query(DashboardRefreshState)
        .filter(
            DashboardRefreshState.running.is_(True),
            DashboardRefreshState.started_at.is_not(None),
            DashboardRefreshState.started_at <= cutoff,
        )
        .all()
    )
    for state in states:
        state.running = False
        state.dirty = True
        state.last_error = "dashboard refresh timed out"
        state.started_at = None
    if states:
        db.commit()
    return states
