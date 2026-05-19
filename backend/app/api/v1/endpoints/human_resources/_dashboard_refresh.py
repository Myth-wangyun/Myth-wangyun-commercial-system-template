from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from fastapi import BackgroundTasks
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import SessionLocal
from app.crud.human_resources import dashboard as dashboard_crud

logger = logging.getLogger("human_resources.dashboard.api_refresh")


def _mark_scope_dirty(
    *,
    scope: str,
    anchor_date: Optional[date],
    source: str,
) -> None:
    if not anchor_date:
        return
    db = SessionLocal()
    try:
        dashboard_crud.mark_scope_dashboard_dirty(
            db,
            scope=scope,
            anchor_date=anchor_date,
            source=source,
        )
    except (SQLAlchemyError, ValueError, TypeError):
        logger.exception(
            "failed to mark scope dashboard dirty scope=%s anchor_date=%s",
            scope,
            anchor_date,
        )
        db.rollback()
    finally:
        db.close()


def _mark_values_dirty(
    *,
    anchor_date: Optional[date],
    scope: Optional[str] = None,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    source: str,
) -> None:
    if not anchor_date:
        return
    db = SessionLocal()
    try:
        dashboard_crud.mark_dashboard_for_values(
            db,
            anchor_date=anchor_date,
            scope=scope,
            campus=campus,
            department=department,
            position=position,
            source=source,
        )
    except (SQLAlchemyError, ValueError, TypeError):
        logger.exception(
            "failed to mark dashboard dirty anchor_date=%s scope=%s campus=%s department=%s position=%s",
            anchor_date,
            scope,
            campus,
            department,
            position,
        )
        db.rollback()
    finally:
        db.close()


def schedule_dashboard_refresh(
    background_tasks: BackgroundTasks,
    *,
    anchor_date: Optional[date],
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    scope: Optional[str] = None,
    source: str = "api",
) -> None:
    if not anchor_date:
        return
    _mark_values_dirty(
        anchor_date=anchor_date,
        scope=scope,
        campus=campus,
        department=department,
        position=position,
        source=source,
    )
    background_tasks.add_task(
        dashboard_crud.process_dashboard_refresh_for_values,
        anchor_date=anchor_date,
        scope=scope,
        campus=campus,
        department=department,
        position=position,
        source=f"{source}_background",
    )


def schedule_scope_dashboard_chain_refresh(
    background_tasks: BackgroundTasks,
    *,
    scope: str,
    anchor_date: Optional[date],
    source: str = "api",
) -> None:
    if not anchor_date:
        return
    _mark_scope_dirty(scope=scope, anchor_date=anchor_date, source=source)
    background_tasks.add_task(
        dashboard_crud.process_scope_dashboard_chain_refresh,
        scope=scope,
        anchor_date=anchor_date,
        source=f"{source}_background",
    )
