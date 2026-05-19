"""
Core package exports.
"""

from __future__ import annotations

from importlib import import_module
from typing import Any

__all__ = ["settings", "get_db", "engine", "AccountBase"]


def __getattr__(name: str) -> Any:
    if name == "settings":
        return import_module(".config", __name__).settings
    if name in {"get_db", "engine", "AccountBase"}:
        database = import_module(".database", __name__)
        return getattr(database, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
