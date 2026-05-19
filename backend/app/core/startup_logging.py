"""
Startup logging and lightweight profiling helpers.
"""

from __future__ import annotations

import logging
import os
import time
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator

DEV_MODES = {"dev", "development", "test", "debug", "local"}


def _normalize_mode(value: str | None) -> str:
    return (value or "").strip().lower()


def env_flag(name: str, default: bool = False) -> bool:
    raw_value = os.environ.get(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def should_profile_startup(mode: str | None = None) -> bool:
    if "QM_STARTUP_PROFILE" in os.environ:
        return env_flag("QM_STARTUP_PROFILE")
    return _normalize_mode(mode or os.environ.get("APP_ENV")) in DEV_MODES


def configure_logging(mode: str | None = None, *, force: bool = False) -> logging.Logger:
    if getattr(configure_logging, "_configured", False) and not force:
        return logging.getLogger("qm.startup")

    level_name = os.environ.get("QM_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        force=force,
    )

    request_logging_enabled = env_flag("QM_LOG_REQUESTS")
    reload_logging_enabled = env_flag("QM_LOG_RELOAD_EVENTS")
    sql_logging_enabled = env_flag("QM_LOG_SQL")

    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(
        logging.INFO if request_logging_enabled else logging.WARNING
    )
    logging.getLogger("watchfiles.main").setLevel(
        logging.INFO if reload_logging_enabled else logging.WARNING
    )
    logging.getLogger("watchfiles.watcher").setLevel(
        logging.INFO if reload_logging_enabled else logging.WARNING
    )
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if sql_logging_enabled else logging.WARNING
    )

    setattr(configure_logging, "_configured", True)
    logger = logging.getLogger("qm.startup")
    logger.debug(
        "Logging configured mode=%s request_logs=%s reload_logs=%s sql_logs=%s startup_profile=%s",
        _normalize_mode(mode or os.environ.get("APP_ENV")),
        request_logging_enabled,
        reload_logging_enabled,
        sql_logging_enabled,
        should_profile_startup(mode),
    )
    return logger


@dataclass(slots=True)
class StepRecord:
    name: str
    elapsed_seconds: float


class StepProfiler:
    def __init__(self, logger: logging.Logger, label: str, *, enabled: bool) -> None:
        self.logger = logger
        self.label = label
        self.enabled = enabled
        self.records: list[StepRecord] = []

    @contextmanager
    def step(self, name: str) -> Iterator[None]:
        start = time.perf_counter()
        try:
            yield
        finally:
            elapsed = time.perf_counter() - start
            self.records.append(StepRecord(name=name, elapsed_seconds=elapsed))
            if self.enabled:
                self.logger.info("[startup] %s: %.3fs", name, elapsed)

    def log_summary(self, *, top_n: int = 8) -> None:
        if not self.enabled or not self.records:
            return
        total_seconds = sum(record.elapsed_seconds for record in self.records)
        self.logger.info(
            "[startup] %s summary: %d steps %.3fs",
            self.label,
            len(self.records),
            total_seconds,
        )
        for record in sorted(self.records, key=lambda item: item.elapsed_seconds, reverse=True)[:top_n]:
            self.logger.info(
                "[startup]   %s %.3fs",
                record.name,
                record.elapsed_seconds,
            )
