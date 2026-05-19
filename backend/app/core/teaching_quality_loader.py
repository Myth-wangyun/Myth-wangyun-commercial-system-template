"""
Lazy teaching_quality route loading.
"""

from __future__ import annotations

import importlib
import logging
import threading
import time
from collections.abc import Callable
from typing import Any

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.teaching_quality_registry import TEACHING_QUALITY_API_MODULES

logger = logging.getLogger("qm.startup.teaching_quality")

TEACHING_QUALITY_PATH_PREFIX = "/api/v1/teaching-quality"
OPENAPI_PATHS = {"/openapi.json", "/docs", "/redoc"}

_load_lock = threading.Lock()


def has_teaching_quality_routes(app: FastAPI) -> bool:
    return any(
        isinstance(route, APIRoute) and isinstance(route.path, str) and route.path.startswith(TEACHING_QUALITY_PATH_PREFIX)
        for route in app.router.routes
    )


def ensure_teaching_quality_routers_loaded(
    app: FastAPI,
    *,
    run_startup_hooks: bool,
    hook_runner: Callable[[FastAPI], None] | None,
) -> bool:
    if getattr(app.state, "teaching_quality_routes_loaded", False):
        if run_startup_hooks and hook_runner is not None:
            hook_runner(app)
        return True

    with _load_lock:
        if not getattr(app.state, "teaching_quality_routes_loaded", False):
            started_at = time.perf_counter()
            imported_modules: list[tuple[str, Any, float]] = []
            startup_hooks: list[tuple[str, Callable[[], Any]]] = []
            failures: list[str] = []

            for module_name in TEACHING_QUALITY_API_MODULES:
                module_started_at = time.perf_counter()
                try:
                    module = importlib.import_module(module_name)
                    router = getattr(module, "router", None)
                    if router is None:
                        raise RuntimeError("missing router")
                    imported_modules.append(
                        (module_name, router, time.perf_counter() - module_started_at)
                    )
                    hook = getattr(module, "_startup_init", None)
                    if callable(hook):
                        startup_hooks.append((f"{module_name}._startup_init", hook))
                except Exception as exc:
                    failures.append(f"{module_name}: {type(exc).__name__}: {exc}")

            if failures:
                app.state.teaching_quality_route_load_errors = failures
                failure_preview = "; ".join(failures[:5])
                raise RuntimeError(
                    "teaching_quality registry load failed: "
                    + failure_preview
                )

            for module_name, router, _elapsed_seconds in imported_modules:
                app.include_router(
                    router,
                    prefix=TEACHING_QUALITY_PATH_PREFIX,
                    tags=[module_name.rsplit(".", 1)[-1]],
                )

            app.state.teaching_quality_routes_loaded = True
            app.state.teaching_quality_route_load_errors = []
            app.state.teaching_quality_startup_hooks = startup_hooks
            app.state.teaching_quality_route_import_timings = [
                (module_name, elapsed_seconds)
                for module_name, _router, elapsed_seconds in imported_modules
            ]
            app.openapi_schema = None

            elapsed_seconds = time.perf_counter() - started_at
            logger.info(
                "[startup] teaching_quality registry loaded %d routers and %d startup hooks in %.3fs",
                len(imported_modules),
                len(startup_hooks),
                elapsed_seconds,
            )
            for module_name, module_elapsed in sorted(
                app.state.teaching_quality_route_import_timings,
                key=lambda item: item[1],
                reverse=True,
            )[:8]:
                logger.info(
                    "[startup]   tq import %s %.3fs",
                    module_name.rsplit(".", 1)[-1],
                    module_elapsed,
                )

    if run_startup_hooks and hook_runner is not None:
        hook_runner(app)
    return True


class TeachingQualityLazyLoadMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Any,
        *,
        hook_runner: Callable[[FastAPI], None] | None,
    ) -> None:
        self._hook_runner = hook_runner
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        fastapi_app: FastAPI = request.app
        if path.startswith(TEACHING_QUALITY_PATH_PREFIX):
            ensure_teaching_quality_routers_loaded(
                fastapi_app,
                run_startup_hooks=True,
                hook_runner=self._hook_runner,
            )
        elif path in OPENAPI_PATHS:
            ensure_teaching_quality_routers_loaded(
                fastapi_app,
                run_startup_hooks=False,
                hook_runner=self._hook_runner,
            )

        return await call_next(request)


def install_teaching_quality_openapi_loader(
    app: FastAPI,
    *,
    hook_runner: Callable[[FastAPI], None] | None,
) -> None:
    if getattr(app.state, "teaching_quality_openapi_loader_installed", False):
        return

    original_openapi = app.openapi

    def openapi():
        ensure_teaching_quality_routers_loaded(
            app,
            run_startup_hooks=False,
            hook_runner=hook_runner,
        )
        return original_openapi()

    app.openapi = openapi
    app.state.teaching_quality_openapi_loader_installed = True
