"""Filesystem path helpers used by runtime code and tests."""

from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
_TEST_RUNTIME_ROOT = PROJECT_ROOT / ".runtime" / "test"
_TEST_ENV_NAMES = {"test", "pytest"}


def get_app_env() -> str:
    """Return the normalized application environment name."""
    return (os.environ.get("APP_ENV") or "").strip().lower()


def is_test_environment() -> bool:
    """Detect pytest/test runtime without requiring eager app startup."""
    app_env = get_app_env()
    return app_env in _TEST_ENV_NAMES or "PYTEST_CURRENT_TEST" in os.environ


def _relative_to_data_root(path: Path) -> Path | None:
    posix_path = path.as_posix()
    if posix_path == "/data":
        return Path()
    if posix_path.startswith("/data/"):
        return Path(posix_path.removeprefix("/data/"))

    parts = path.parts
    if len(parts) >= 2 and parts[1].lower() == "data":
        return Path(*parts[2:])
    return None


def resolve_project_storage_path(configured_path: str | Path) -> Path:
    """Resolve configured storage paths relative to the repository root.

    In tests we remap production-only absolute `/data/...` paths into a writable
    repo-local runtime directory so import-time path resolution never depends on
    host filesystem permissions.
    """

    path = Path(configured_path)
    if is_test_environment():
        relative_path = _relative_to_data_root(path)
        if relative_path is not None:
            return _TEST_RUNTIME_ROOT / relative_path

    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def get_upload_root() -> Path:
    """Resolve the configured upload root for the current runtime."""
    from .config import settings

    return resolve_project_storage_path(settings.UPLOAD_DIR)
