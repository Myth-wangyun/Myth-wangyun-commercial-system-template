from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.crud.human_resources.dashboard_scope import (
    HQ_SCOPE,
    OFFLINE_SCOPE,
    normalize_scope,
)
from app.crud.human_resources.dashboard_legacy import (
    _MONTHLY_DOMAINS,
    _YEARLY_DOMAINS,
    _build_daily_salary_welfare,
    _build_daily_social_insurance,
    build_monthly_dashboard as _legacy_build_monthly_dashboard,
    build_yearly_dashboard as _legacy_build_yearly_dashboard,
)

from .aggregate_store import read_dashboard_sections, write_dashboard_sections
from .daily_hq import _build_hq_daily_recruitment, _build_hq_daily_training
from .daily_offline import (
    _build_offline_daily_recruitment,
    _build_offline_daily_training,
)
from .daily_online import (
    _build_online_daily_recruitment,
    _build_online_daily_training,
)

DAILY_DOMAINS = (
    "recruitment",
    "training",
    "salary_welfare",
    "social_insurance",
)
MONTHLY_DOMAINS = _MONTHLY_DOMAINS
YEARLY_DOMAINS = _YEARLY_DOMAINS


def _build_daily_sections(
    db: Session,
    *,
    scope: str,
    month: str,
) -> dict[str, dict[str, Any]]:
    normalized_scope = normalize_scope(scope)
    if normalized_scope == HQ_SCOPE:
        recruitment_rows, recruitment_warnings = _build_hq_daily_recruitment(
            db,
            month=month,
        )
        training_rows, training_warnings = _build_hq_daily_training(db, month=month)
    elif normalized_scope == OFFLINE_SCOPE:
        recruitment_rows, recruitment_warnings = _build_offline_daily_recruitment(
            db,
            month=month,
        )
        training_rows, training_warnings = _build_offline_daily_training(
            db,
            month=month,
        )
    else:
        recruitment_rows, recruitment_warnings = _build_online_daily_recruitment(
            db,
            month=month,
        )
        training_rows, training_warnings = _build_online_daily_training(
            db,
            month=month,
        )

    salary_rows, salary_warnings = _build_daily_salary_welfare(
        db,
        scope=normalized_scope,
        month=month,
    )
    insurance_rows, insurance_warnings = _build_daily_social_insurance(
        db,
        scope=normalized_scope,
        month=month,
    )
    return {
        "recruitment": {"rows": recruitment_rows, "warnings": recruitment_warnings},
        "training": {"rows": training_rows, "warnings": training_warnings},
        "salary_welfare": {"rows": salary_rows, "warnings": salary_warnings},
        "social_insurance": {
            "rows": insurance_rows,
            "warnings": insurance_warnings,
        },
    }


def read_daily_dashboard(
    db: Session,
    *,
    scope: str,
    month: str,
) -> Optional[dict[str, Any]]:
    normalized_scope = normalize_scope(scope)
    sections, has_data = read_dashboard_sections(
        db,
        granularity="daily",
        scope=normalized_scope,
        period=month,
        domains=DAILY_DOMAINS,
    )
    if not has_data:
        return None
    return {"scope": normalized_scope, "month": month, "sections": sections}


def build_daily_dashboard(db: Session, *, scope: str, month: str) -> dict[str, Any]:
    normalized_scope = normalize_scope(scope)
    sections = _build_daily_sections(db, scope=normalized_scope, month=month)
    write_dashboard_sections(
        db,
        granularity="daily",
        scope=normalized_scope,
        period=month,
        sections=sections,
        commit=True,
    )
    return {"scope": normalized_scope, "month": month, "sections": sections}


def read_monthly_dashboard(
    db: Session,
    *,
    scope: str,
    year: str,
) -> Optional[dict[str, Any]]:
    normalized_scope = normalize_scope(scope)
    sections, has_data = read_dashboard_sections(
        db,
        granularity="monthly",
        scope=normalized_scope,
        period=year,
        domains=MONTHLY_DOMAINS,
    )
    if not has_data:
        return None
    return {"scope": normalized_scope, "year": year, "sections": sections}


def build_monthly_dashboard(db: Session, *, scope: str, year: str) -> dict[str, Any]:
    return _legacy_build_monthly_dashboard(db, scope=normalize_scope(scope), year=year)


def read_yearly_dashboard(
    db: Session,
    *,
    scope: str,
    year: str,
) -> Optional[dict[str, Any]]:
    normalized_scope = normalize_scope(scope)
    sections, has_data = read_dashboard_sections(
        db,
        granularity="yearly",
        scope=normalized_scope,
        period=year,
        domains=YEARLY_DOMAINS,
    )
    if not has_data:
        return None
    return {"scope": normalized_scope, "year": year, "sections": sections}


def build_yearly_dashboard(
    db: Session,
    *,
    scope: str,
    year: str,
    monthly_dashboard: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    return _legacy_build_yearly_dashboard(
        db,
        scope=normalize_scope(scope),
        year=year,
        monthly_dashboard=monthly_dashboard,
    )
