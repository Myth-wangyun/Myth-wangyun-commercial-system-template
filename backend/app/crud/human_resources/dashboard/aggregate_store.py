from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, TypeAlias

from sqlalchemy import Table, tuple_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.crud.human_resources.dashboard_scope import normalize_scope
from app.models.human_resources import (
    DashboardDailyAggregate,
    DashboardMonthlyAggregate,
    DashboardYearlyAggregate,
)

AggregateModel: TypeAlias = (
    type[DashboardDailyAggregate]
    | type[DashboardMonthlyAggregate]
    | type[DashboardYearlyAggregate]
)

GRANULARITY_MODELS: dict[str, AggregateModel] = {
    "daily": DashboardDailyAggregate,
    "monthly": DashboardMonthlyAggregate,
    "yearly": DashboardYearlyAggregate,
}


def get_aggregate_model(granularity: str) -> AggregateModel:
    try:
        return GRANULARITY_MODELS[granularity]
    except KeyError as exc:
        raise ValueError(f"Unsupported dashboard granularity: {granularity}") from exc


def _store_aggregate_rows(
    db: Session,
    *,
    model: AggregateModel,
    scope: str,
    domain: str,
    period: str,
    rows: list[dict[str, Any]],
) -> None:
    recalculated_at = datetime.now(UTC)
    payloads_by_identity: dict[tuple[str, str], dict[str, Any]] = {}
    normalized_scope = normalize_scope(scope)
    for index, row in enumerate(rows):
        org_kind = str(row.get("rowType") or "row")
        org_key = str(row.get("key") or f"{domain}-{period}-{index:04d}")
        payloads_by_identity[(org_kind, org_key)] = {
            "scope": normalized_scope,
            "domain": domain,
            "period": period,
            "org_kind": org_kind,
            "org_key": org_key,
            "org_name": row.get("department")
            or row.get("division")
            or row.get("campus"),
            "metrics_json": {"payload": row},
            "lists_json": {},
            "recalculated_at": recalculated_at,
        }

    row_identities = list(payloads_by_identity.keys())
    stale_rows_query = db.query(model).filter(
        model.scope == normalized_scope,
        model.domain == domain,
        model.period == period,
    )
    if row_identities:
        stale_rows_query = stale_rows_query.filter(
            ~tuple_(model.org_kind, model.org_key).in_(row_identities)
        )
    stale_rows_query.delete(synchronize_session=False)

    if payloads_by_identity:
        table = model.__table__
        if not isinstance(table, Table):
            raise TypeError(f"Unsupported aggregate table type: {type(table)!r}")
        stmt = pg_insert(table).values(list(payloads_by_identity.values()))
        excluded = stmt.excluded
        stmt = stmt.on_conflict_do_update(
            index_elements=[
                table.c.scope,
                table.c.domain,
                table.c.period,
                table.c.org_kind,
                table.c.org_key,
            ],
            set_={
                "org_name": excluded.org_name,
                "metrics_json": excluded.metrics_json,
                "lists_json": excluded.lists_json,
                "recalculated_at": excluded.recalculated_at,
            },
        )
        db.execute(stmt)


def _load_aggregate_rows(
    db: Session,
    *,
    model: AggregateModel,
    scope: str,
    domain: str,
    period: str,
) -> list[dict[str, Any]]:
    records = (
        db.query(model)
        .filter(
            model.scope == normalize_scope(scope),
            model.domain == domain,
            model.period == period,
        )
        .order_by(model.org_key.asc(), model.id.asc())
        .all()
    )
    result: list[dict[str, Any]] = []
    for record in records:
        payload = (
            (record.metrics_json or {}).get("payload")
            if isinstance(record.metrics_json, dict)
            else None
        )
        if isinstance(payload, dict):
            result.append(payload)
    return result


def write_dashboard_sections(
    db: Session,
    *,
    granularity: str,
    scope: str,
    period: str,
    sections: dict[str, dict[str, Any]],
    commit: bool = True,
) -> None:
    model = get_aggregate_model(granularity)
    normalized_scope = normalize_scope(scope)
    for domain, payload in sections.items():
        _store_aggregate_rows(
            db,
            model=model,
            scope=normalized_scope,
            domain=domain,
            period=period,
            rows=list(payload.get("rows", [])),
        )
    if commit:
        db.commit()


def read_dashboard_sections(
    db: Session,
    *,
    granularity: str,
    scope: str,
    period: str,
    domains: tuple[str, ...] | list[str],
) -> tuple[dict[str, dict[str, Any]], bool]:
    model = get_aggregate_model(granularity)
    normalized_scope = normalize_scope(scope)
    sections: dict[str, dict[str, Any]] = {}
    has_data = False
    for domain in domains:
        rows = _load_aggregate_rows(
            db,
            model=model,
            scope=normalized_scope,
            domain=domain,
            period=period,
        )
        if rows:
            has_data = True
        sections[domain] = {"rows": rows, "warnings": {}}
    return sections, has_data
