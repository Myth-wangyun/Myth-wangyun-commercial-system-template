from __future__ import annotations

import importlib
import json
import os
import textwrap
import subprocess
import sys
from pathlib import Path
from collections.abc import Iterable

import pytest
from fastapi.routing import APIRoute


pytestmark = [pytest.mark.unit, pytest.mark.smoke]

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = PROJECT_ROOT / "backend"


def _route_paths(routes: Iterable[object]) -> set[str]:
    return {
        route.path
        for route in routes
        if isinstance(route, APIRoute)
    }


def _patch_new_student_loss_detail_init(monkeypatch: pytest.MonkeyPatch) -> None:
    model_module = importlib.import_module("app.models.new_student_loss_detail")
    monkeypatch.setattr(model_module, "init_new_student_loss_detail_tables", lambda: None)


def test_market_router_keeps_expected_endpoints(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_new_student_loss_detail_init(monkeypatch)
    market = importlib.import_module("app.api.v1.endpoints.market")

    paths = _route_paths(market.router.routes)

    assert {"/", "/daily", "/daily/bulk", "/consultation", "/statistics/summary"} <= paths
    assert any(path.startswith("/summary/") for path in paths)
    assert len(paths) >= 10


def test_api_router_includes_market_health_and_consult_prefixes(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_new_student_loss_detail_init(monkeypatch)
    api_v1 = importlib.import_module("app.api.v1")

    paths = _route_paths(api_v1.api_router.routes)

    assert any(path.startswith("/market") for path in paths)
    assert any(path.startswith("/health") for path in paths)
    assert any(path.startswith("/consult") for path in paths)


def test_main_app_registers_root_health_api_and_teaching_quality_routes() -> None:
    inspection_script = f"""
import importlib
import json
import sys
from pathlib import Path

root = Path(r"{PROJECT_ROOT}")
sys.path.insert(0, str(root / "backend"))

model_module = importlib.import_module("app.models.new_student_loss_detail")
model_module.init_new_student_loss_detail_tables = lambda: None

from fastapi.routing import APIRoute
import main

initial_paths = sorted(
    route.path
    for route in main.app.router.routes
    if isinstance(route, APIRoute) and isinstance(route.path, str)
)
main.app.openapi()
loaded_paths = sorted(
    route.path
    for route in main.app.router.routes
    if isinstance(route, APIRoute) and isinstance(route.path, str)
)
print("ROUTE_SUMMARY=" + json.dumps({{"initial": initial_paths, "loaded": loaded_paths}}, ensure_ascii=False))
"""
    env = os.environ.copy()
    env.setdefault("APP_ENV", "test")
    env.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    completed = subprocess.run(
        [sys.executable, "-c", inspection_script],
        check=True,
        capture_output=True,
        cwd=BACKEND_DIR,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    route_line = next(
        line for line in completed.stdout.splitlines() if line.startswith("ROUTE_SUMMARY=")
    )
    route_summary = json.loads(route_line.removeprefix("ROUTE_SUMMARY="))
    initial_paths = set(route_summary["initial"])
    loaded_paths = set(route_summary["loaded"])

    assert "/" in initial_paths
    assert "/health" in initial_paths
    assert any(path.startswith("/api/v1/market") for path in initial_paths)
    assert not any(path.startswith("/api/v1/teaching-quality") for path in initial_paths)
    assert any(path.startswith("/api/v1/teaching-quality") for path in loaded_paths)


def test_teaching_quality_registry_matches_api_files() -> None:
    registry = importlib.import_module("app.teaching_quality_registry")
    expected = {
        f"app.teaching_quality.{path.stem}"
        for path in sorted((BACKEND_DIR / "app" / "teaching_quality").glob("*_api.py"))
    }

    assert set(registry.TEACHING_QUALITY_API_MODULES) == expected


def test_auto_migrate_executes_zero_arg_migrate_function(tmp_path: Path) -> None:
    migration_file = tmp_path / "sample_migration.py"
    marker_file = tmp_path / "executed.txt"
    migration_source = textwrap.dedent(
        f"""
        from pathlib import Path

        def migrate() -> None:
            Path(r\"{marker_file}\").write_text(\"ok\", encoding=\"utf-8\")
        """
    )
    migration_file.write_text(migration_source, encoding="utf-8")

    auto_migrate = importlib.import_module("migrations.auto_migrate")

    assert auto_migrate.run_migration_script("sample_migration.py", str(migration_file)) is True
    assert marker_file.read_text(encoding="utf-8") == "ok"
