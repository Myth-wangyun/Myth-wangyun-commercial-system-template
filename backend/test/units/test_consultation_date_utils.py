from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time

import pytest

from app.utils import consultation_date_utils as date_utils


pytestmark = pytest.mark.unit


@dataclass
class FakeConfig:
    period_start: date
    period_end: date
    cutoff_hour: int
    cutoff_minute: int


class FakeQuery:
    def __init__(self, configs: list[FakeConfig]) -> None:
        self.configs = list(configs)

    def filter(self, *args, **kwargs) -> "FakeQuery":
        return self

    def order_by(self, *args, **kwargs) -> "FakeQuery":
        return self

    def all(self) -> list[FakeConfig]:
        return list(self.configs)


class FakeDB:
    def __init__(self, configs: list[FakeConfig]) -> None:
        self.configs = list(configs)
        self.query_calls = 0
        self._bind = object()

    def get_bind(self) -> object:
        return self._bind

    def query(self, model) -> FakeQuery:
        self.query_calls += 1
        return FakeQuery(self.configs)


@pytest.fixture(autouse=True)
def _clear_schedule_cache() -> None:
    date_utils.invalidate_schedule_cache()
    yield
    date_utils.invalidate_schedule_cache()


def test_active_config_cache_is_reused_until_invalidated() -> None:
    db = FakeDB(
        [
            FakeConfig(
                period_start=date(2026, 1, 1),
                period_end=date(2026, 4, 30),
                cutoff_hour=17,
                cutoff_minute=30,
            )
        ]
    )

    first = date_utils._get_all_active_configs(db)
    second = date_utils._get_all_active_configs(db)

    assert first == second
    assert db.query_calls == 1

    date_utils.invalidate_schedule_cache()
    third = date_utils._get_all_active_configs(db)

    assert third == first
    assert db.query_calls == 2


def test_cutoff_and_business_ranges_follow_matching_schedule() -> None:
    db = FakeDB(
        [
            FakeConfig(
                period_start=date(2026, 1, 1),
                period_end=date(2026, 4, 30),
                cutoff_hour=17,
                cutoff_minute=30,
            ),
            FakeConfig(
                period_start=date(2026, 5, 1),
                period_end=date(2026, 9, 30),
                cutoff_hour=18,
                cutoff_minute=0,
            ),
        ]
    )

    assert date_utils.get_cutoff_time_for_date(date(2026, 5, 1), db) == time(18, 0)

    start_dt, end_dt = date_utils.get_business_day_range(date(2026, 5, 1), db)
    month_start, month_end = date_utils.get_business_month_range(
        date(2026, 5, 1),
        date(2026, 5, 31),
        db,
    )

    assert start_dt == datetime(2026, 4, 30, 17, 30)
    assert end_dt == datetime(2026, 5, 1, 18, 0)
    assert month_start == datetime(2026, 4, 30, 17, 30)
    assert month_end == datetime(2026, 5, 31, 18, 0)


def test_business_day_range_falls_back_without_matching_schedule() -> None:
    empty_db = FakeDB([])

    assert date_utils.get_cutoff_time_for_date(date(2026, 5, 1), empty_db) is None
    assert date_utils.has_schedule_config(empty_db) is False
    assert date_utils.get_business_day_range(date(2026, 5, 1), empty_db) == (
        datetime(2026, 5, 1, 0, 0),
        datetime(2026, 5, 1, 23, 59, 59),
    )


def test_business_day_range_uses_current_cutoff_when_previous_day_has_no_config() -> None:
    db = FakeDB(
        [
            FakeConfig(
                period_start=date(2026, 5, 1),
                period_end=date(2026, 5, 31),
                cutoff_hour=18,
                cutoff_minute=15,
            )
        ]
    )

    start_dt, end_dt = date_utils.get_business_day_range(date(2026, 5, 1), db)

    assert start_dt == datetime(2026, 4, 30, 18, 15)
    assert end_dt == datetime(2026, 5, 1, 18, 15)
    assert date_utils.has_schedule_config(db) is True


def test_default_schedule_configs_cover_three_seasons() -> None:
    configs = date_utils.get_default_schedule_configs(2027)

    assert len(configs) == 3
    assert configs[0]["period_start"] == date(2027, 1, 1)
    assert configs[0]["period_end"] == date(2027, 4, 30)
    assert configs[1]["cutoff_hour"] == 18
    assert configs[1]["cutoff_minute"] == 0
    assert configs[2]["period_start"] == date(2027, 10, 1)
    assert configs[2]["period_end"] == date(2027, 12, 31)
