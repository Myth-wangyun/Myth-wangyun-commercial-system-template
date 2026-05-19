from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = REPO_ROOT / "backend"

for path in (REPO_ROOT, BACKEND_DIR):
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
os.environ.setdefault("NO_PROXY", "127.0.0.1,localhost")
os.environ.setdefault("no_proxy", "127.0.0.1,localhost")
sys.dont_write_bytecode = True


class UnitIsolationError(RuntimeError):
    """Raised when a unit test attempts forbidden I/O."""


def _block_requests(self, method: str, url: str, *args, **kwargs):
    raise UnitIsolationError(f"Real HTTP request blocked in unit tests: {method} {url}")


def _block_httpx_request(self, method: str, url, *args, **kwargs):
    raise UnitIsolationError(f"Real HTTP request blocked in unit tests: {method} {url}")


async def _block_async_httpx_request(self, method: str, url, *args, **kwargs):
    raise UnitIsolationError(f"Real HTTP request blocked in unit tests: {method} {url}")


def _block_engine_connect(self, *args, **kwargs):
    raise UnitIsolationError("Real database connection blocked in unit tests")


def _block_engine_raw_connection(self, *args, **kwargs):
    raise UnitIsolationError("Real raw database connection blocked in unit tests")


def _block_psycopg_connect(*args, **kwargs):
    raise UnitIsolationError("Direct psycopg connections are blocked in unit tests")


@pytest.fixture(autouse=True)
def _isolation_guards(monkeypatch: pytest.MonkeyPatch) -> None:
    import httpx
    import psycopg
    import requests.sessions
    from sqlalchemy.engine import Engine

    monkeypatch.setattr(requests.sessions.Session, "request", _block_requests)
    monkeypatch.setattr(httpx.Client, "request", _block_httpx_request)
    monkeypatch.setattr(httpx.AsyncClient, "request", _block_async_httpx_request)
    monkeypatch.setattr(Engine, "connect", _block_engine_connect)
    monkeypatch.setattr(Engine, "raw_connection", _block_engine_raw_connection)
    monkeypatch.setattr(psycopg, "connect", _block_psycopg_connect)


@pytest.fixture
def repo_root() -> Path:
    return REPO_ROOT


@pytest.fixture
def backend_dir() -> Path:
    return BACKEND_DIR
