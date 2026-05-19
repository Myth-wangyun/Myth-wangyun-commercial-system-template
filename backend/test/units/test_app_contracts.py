from __future__ import annotations

import importlib
import importlib.util
from pathlib import Path

import pytest
from fastapi import APIRouter
from fastapi.routing import APIRoute


pytestmark = [pytest.mark.unit, pytest.mark.smoke]


BACKEND_DIR = Path(__file__).resolve().parents[2]
APP_DIR = BACKEND_DIR / "app"


def _iter_module_paths(root: Path) -> list[Path]:
    module_paths: list[Path] = []
    for path in sorted(root.rglob("*.py")):
        if "__pycache__" in path.parts:
            continue
        module_paths.append(path)
    return module_paths


def _module_name_from_path(path: Path) -> str:
    relative = path.relative_to(BACKEND_DIR).with_suffix("")
    parts = list(relative.parts)
    if parts[-1] == "__init__":
        parts = parts[:-1]
    return ".".join(parts)


def _load_module_from_path(path: Path):
    module_name = _module_name_from_path(path)
    try:
        return importlib.import_module(module_name)
    except ModuleNotFoundError as exc:
        if "is not a package" not in str(exc):
            raise

    synthetic_name = f"_units_{path.stem}_{abs(hash(path.as_posix()))}"
    spec = importlib.util.spec_from_file_location(synthetic_name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _iter_router_module_names() -> list[str]:
    router_modules: list[Path] = []

    for path in sorted((APP_DIR / "api" / "v1" / "endpoints").rglob("*.py")):
        if "__pycache__" in path.parts or path.name == "__init__.py":
            continue
        router_modules.append(path)

    for path in sorted((APP_DIR / "api" / "v1" / "market").rglob("*.py")):
        if "__pycache__" in path.parts or path.name == "__init__.py":
            continue
        router_modules.append(path)

    for path in sorted((APP_DIR / "teaching_quality").glob("*_api.py")):
        router_modules.append(path)

    return router_modules


def _patch_import_side_effects(monkeypatch: pytest.MonkeyPatch) -> None:
    model_module = importlib.import_module("app.models.new_student_loss_detail")
    monkeypatch.setattr(model_module, "init_new_student_loss_detail_tables", lambda: None)


def test_every_backend_app_module_imports_without_real_io(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_import_side_effects(monkeypatch)

    failures: list[str] = []
    module_paths = _iter_module_paths(APP_DIR)
    for path in module_paths:
        try:
            _load_module_from_path(path)
        except Exception as exc:  # pragma: no cover - surfaced by assertion
            failures.append(f"{path.relative_to(BACKEND_DIR)}: {type(exc).__name__}: {exc}")

    assert not failures, "Unexpected import failures:\n" + "\n".join(failures[:20])
    assert len(module_paths) >= 800


def test_router_modules_expose_fastapi_routers(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_import_side_effects(monkeypatch)

    failures: list[str] = []
    for path in _iter_router_module_names():
        if path.stat().st_size == 0:
            continue
        module = _load_module_from_path(path)
        router = getattr(module, "router", None)
        if not isinstance(router, APIRouter):
            failures.append(f"{path.relative_to(BACKEND_DIR)}: missing APIRouter")
            continue
        if not any(isinstance(route, APIRoute) for route in router.routes):
            failures.append(f"{path.relative_to(BACKEND_DIR)}: router has no APIRoute entries")

    assert not failures, "Router contract failures:\n" + "\n".join(failures[:20])


def test_registered_sqlalchemy_tables_have_names_and_columns(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_import_side_effects(monkeypatch)
    for path in _iter_module_paths(APP_DIR):
        _load_module_from_path(path)

    from app.core.database import TQBase
    from app.models import AccountBase

    tables = list(AccountBase.metadata.tables.values()) + list(TQBase.metadata.tables.values())
    assert tables

    nameless = [table.fullname for table in tables if not table.name]
    empty = [table.fullname for table in tables if not list(table.columns)]

    assert not nameless
    assert not empty
