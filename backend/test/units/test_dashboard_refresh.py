from __future__ import annotations

from datetime import date
from types import SimpleNamespace

from fastapi import BackgroundTasks

from app.api.v1.endpoints.human_resources import dashboard as dashboard_endpoint
from app.crud.human_resources.dashboard import refresh as dashboard_refresh


def test_get_dashboard_daily_prefers_cached_payload_and_triggers_stale_refresh(monkeypatch):
    cached = {"scope": "hq", "month": "2026-03", "sections": {"recruitment": {"rows": []}}}
    scheduled: list[dict[str, object]] = []

    monkeypatch.setattr(
        dashboard_endpoint.crud,
        "read_daily_dashboard",
        lambda db, *, scope, month: cached,
    )
    monkeypatch.setattr(
        dashboard_endpoint.crud,
        "is_dashboard_dirty",
        lambda db, *, scope, granularity, period: True,
    )
    monkeypatch.setattr(
        dashboard_endpoint.crud,
        "rebuild_daily_dashboard",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("should not rebuild on cache hit")),
    )
    monkeypatch.setattr(
        dashboard_endpoint,
        "schedule_scope_dashboard_chain_refresh",
        lambda background_tasks, **kwargs: scheduled.append(kwargs),
    )

    result = dashboard_endpoint.get_dashboard_daily(
        BackgroundTasks(),
        scope="hq",
        month="2026-03",
        rebuild=False,
        db=object(),
        current_user=object(),
    )

    assert result is cached
    assert scheduled == [
        {
            "scope": "hq",
            "anchor_date": date(2026, 3, 1),
            "source": "dashboard_daily_stale",
        }
    ]


def test_get_dashboard_monthly_rebuild_bypasses_cached_read(monkeypatch):
    rebuilt = {"scope": "hq", "year": "2026", "sections": {}}

    monkeypatch.setattr(
        dashboard_endpoint.crud,
        "read_monthly_dashboard",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("should not read cache when rebuild=true")),
    )
    monkeypatch.setattr(
        dashboard_endpoint.crud,
        "rebuild_monthly_dashboard",
        lambda db, *, scope, year, source: rebuilt,
    )

    result = dashboard_endpoint.get_dashboard_monthly(
        BackgroundTasks(),
        scope="hq",
        year="2026",
        rebuild=True,
        db=object(),
        current_user=object(),
    )

    assert result is rebuilt


def test_run_pending_dashboard_refreshes_uses_state_anchor_date(monkeypatch):
    calls: list[dict[str, object]] = []

    monkeypatch.setattr(dashboard_refresh, "SessionLocal", lambda: SimpleNamespace(close=lambda: None))
    monkeypatch.setattr(dashboard_refresh, "reset_timed_out_refreshes", lambda db: [])
    monkeypatch.setattr(
        dashboard_refresh,
        "list_due_refresh_states",
        lambda db, limit=20: [
            SimpleNamespace(
                scope="offline",
                granularity="monthly",
                period="2026",
                anchor_date=date(2026, 3, 18),
            )
        ],
    )
    monkeypatch.setattr(
        dashboard_refresh,
        "refresh_scope_dashboard_chain",
        lambda db, *, scope, anchor_date, source: calls.append(
            {"scope": scope, "anchor_date": anchor_date, "source": source}
        ),
    )

    result = dashboard_refresh.run_pending_dashboard_refreshes(limit=10)

    assert result["processed"] == [
        {
            "scope": "offline",
            "granularity": "monthly",
            "period": "2026",
        }
    ]
    assert calls == [
        {
            "scope": "offline",
            "anchor_date": date(2026, 3, 18),
            "source": "scheduler",
        }
    ]
