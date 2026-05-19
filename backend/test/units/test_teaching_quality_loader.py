from __future__ import annotations

import sys
from types import ModuleType

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute

import app.core.teaching_quality_loader as teaching_quality_loader


pytestmark = pytest.mark.unit


def _make_module(name: str, *, with_router: bool = True, with_hook: bool = False) -> ModuleType:
    module = ModuleType(name)
    if with_router:
        router = APIRouter()

        @router.get(f"/{name.rsplit('.', 1)[-1]}")
        def endpoint():
            return {"ok": True}

        module.router = router

    if with_hook:
        module.hook_calls = 0

        def startup_hook() -> None:
            module.hook_calls += 1

        module._startup_init = startup_hook

    return module


def _run_hooks_once(app: FastAPI) -> None:
    if getattr(app.state, "teaching_quality_startup_completed", False):
        return
    for _hook_name, hook in getattr(app.state, "teaching_quality_startup_hooks", []):
        hook()
    app.state.teaching_quality_startup_completed = True


def _route_paths(app: FastAPI) -> set[str]:
    return {
        route.path
        for route in app.router.routes
        if isinstance(route, APIRoute)
    }


def test_teaching_quality_loader_loads_once_and_deduplicates_hooks(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    module_names = (
        "tests.fake_tq.module_a",
        "tests.fake_tq.module_b",
    )
    module_a = _make_module(module_names[0], with_router=True, with_hook=True)
    module_b = _make_module(module_names[1], with_router=True, with_hook=False)

    monkeypatch.setattr(teaching_quality_loader, "TEACHING_QUALITY_API_MODULES", module_names)
    monkeypatch.setitem(sys.modules, module_names[0], module_a)
    monkeypatch.setitem(sys.modules, module_names[1], module_b)

    app = FastAPI()

    teaching_quality_loader.ensure_teaching_quality_routers_loaded(
        app,
        run_startup_hooks=True,
        hook_runner=_run_hooks_once,
    )
    first_paths = _route_paths(app)

    teaching_quality_loader.ensure_teaching_quality_routers_loaded(
        app,
        run_startup_hooks=True,
        hook_runner=_run_hooks_once,
    )
    second_paths = _route_paths(app)

    tq_paths = {
        path for path in second_paths if path.startswith(teaching_quality_loader.TEACHING_QUALITY_PATH_PREFIX)
    }
    assert first_paths == second_paths
    assert len(tq_paths) == 2
    assert module_a.hook_calls == 1


def test_teaching_quality_loader_fails_fast_for_registry_entry_without_router(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    module_name = "tests.fake_tq.bad_module"
    monkeypatch.setattr(teaching_quality_loader, "TEACHING_QUALITY_API_MODULES", (module_name,))
    monkeypatch.setitem(sys.modules, module_name, _make_module(module_name, with_router=False))

    app = FastAPI()

    with pytest.raises(RuntimeError, match="teaching_quality registry load failed"):
        teaching_quality_loader.ensure_teaching_quality_routers_loaded(
            app,
            run_startup_hooks=False,
            hook_runner=None,
        )

    assert app.state.teaching_quality_route_load_errors
