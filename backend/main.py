"""
Backend entrypoint for the Qingmei management system.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import os
import sys
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.dynamic_import import enable_importlib_cache
from app.core.startup_logging import StepProfiler, configure_logging, env_flag, should_profile_startup

try:
    from starlette.middleware.proxy_headers import ProxyHeadersMiddleware  # type: ignore
except Exception:  # pragma: no cover
    try:
        from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware  # type: ignore
    except Exception:  # pragma: no cover
        ProxyHeadersMiddleware = None  # type: ignore


def _get_mode_early() -> str | None:
    for index, arg in enumerate(sys.argv):
        if arg in {"--mode", "-m"} and index + 1 < len(sys.argv):
            return sys.argv[index + 1]
        if arg.startswith("--mode="):
            return arg.split("=", 1)[1]
    return None


_early_mode = _get_mode_early()

if _early_mode == "test":
    os.environ["APP_ENV"] = "test"

if _early_mode in {"dev", "development", "test"}:
    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    sys.dont_write_bytecode = True

os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"

try:
    if hasattr(sys.stdout, "buffer"):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
except Exception:
    pass


def safe_error_str(exc: Exception) -> str:
    try:
        return str(exc)
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass

    try:
        if hasattr(exc, "args") and exc.args:
            for arg in exc.args:
                if isinstance(arg, bytes):
                    return arg.decode("utf-8", errors="replace")
    except Exception:
        pass

    try:
        return repr(exc)
    except Exception:
        return f"<{type(exc).__name__}: encoding error>"


enable_importlib_cache()

logger = configure_logging(_early_mode or os.environ.get("APP_MODE"))
request_logger = logging.getLogger("qm.request")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Qingmei backend")
    parser.add_argument(
        "--mode",
        "-m",
        choices=["dev", "development", "test", "prod", "production"],
        default=None,
        help="Runtime mode",
    )
    parser.add_argument("--host", type=str, default=None, help="Server host")
    parser.add_argument("--port", "-p", type=int, default=None, help="Server port")
    return parser.parse_args()


def setup_environment(mode: str | None = None) -> str:
    project_root = Path(__file__).resolve().parent.parent
    env_file_map = {
        "dev": ".env.development",
        "development": ".env.development",
        "test": ".env.test",
        "prod": ".env.production",
        "production": ".env.production",
    }

    if mode and mode in env_file_map:
        env_file = project_root / env_file_map[mode]
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        os.environ.setdefault(key.strip(), value.strip())
            logger.info("[startup] loaded environment file %s", env_file)
            return mode

        logger.warning("[startup] environment file missing, using defaults: %s", env_file)

    return mode or "default"


if __name__ == "__main__":
    args = parse_args()
    current_mode = setup_environment(args.mode)
else:
    args = None
    current_mode = setup_environment(os.environ.get("APP_MODE"))

logger = configure_logging(current_mode)
startup_profile_enabled = should_profile_startup(current_mode)
module_init_profiler = StepProfiler(logger, "module init", enabled=startup_profile_enabled)

with module_init_profiler.step("app.api.v1 import"):
    from app.api.v1 import api_router

with module_init_profiler.step("settings import"):
    from app.core.config import settings
    print(f"[DEBUG] DB_HOST from settings: {settings.DB_HOST}")
    print(f"[DEBUG] DB_HOST from env: {os.environ.get('DB_HOST', 'NOT SET')}")

with module_init_profiler.step("teaching_quality loader import"):
    from app.core.teaching_quality_loader import (
        ensure_teaching_quality_routers_loaded,
    )

with module_init_profiler.step("audit middleware import"):
    from app.logs.middleware import AuditLogMiddleware


def _get_database_module():
    from app.core import database as database_module

    return database_module


def _dev_reload_state_file() -> Path:
    return Path(__file__).resolve().parent / "temp" / ".dev-reload-runtime-state.json"


def _read_runtime_state() -> dict[str, object]:
    state_file = _dev_reload_state_file()
    if not state_file.exists():
        return {}

    try:
        state = json.loads(state_file.read_text(encoding="utf-8"))
    except Exception:
        return {}

    max_age_seconds = int(os.environ.get("QM_DEV_RELOAD_INIT_CACHE_SECONDS", "900"))
    loaded_at = float(state.get("loaded_at", 0) or 0)
    if not loaded_at or time.time() - loaded_at > max_age_seconds:
        return {}
    if state.get("db_name") != settings.DB_NAME:
        return {}
    if state.get("app_env") != os.environ.get("APP_ENV", ""):
        return {}
    if state.get("mode") != str(current_mode).lower():
        return {}
    return state


def _should_skip_runtime_db_init() -> bool:
    if os.environ.get("QM_FORCE_RUNTIME_DB_INIT") == "1":
        return False
    if not settings.RELOAD:
        return False
    if str(current_mode).lower() not in {"dev", "development", "test"}:
        return False
    return bool(_read_runtime_state().get("runtime_db_ready"))


def _should_skip_teaching_quality_startup() -> bool:
    return bool(_read_runtime_state().get("teaching_quality_startup_completed"))


def _mark_runtime_state(
    *,
    runtime_db_ready: bool | None = None,
    teaching_quality_startup_completed: bool | None = None,
) -> None:
    state = _read_runtime_state()
    state_file = _dev_reload_state_file()
    state_file.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "loaded_at": time.time(),
        "db_name": settings.DB_NAME,
        "app_env": os.environ.get("APP_ENV", ""),
        "mode": str(current_mode).lower(),
        "runtime_db_ready": state.get("runtime_db_ready", False),
        "teaching_quality_startup_completed": state.get(
            "teaching_quality_startup_completed", False
        ),
    }
    if runtime_db_ready is not None:
        payload["runtime_db_ready"] = runtime_db_ready
    if teaching_quality_startup_completed is not None:
        payload["teaching_quality_startup_completed"] = teaching_quality_startup_completed
    state_file.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")


def run_teaching_quality_startup_hooks(app: FastAPI) -> None:
    hooks = getattr(app.state, "teaching_quality_startup_hooks", [])
    if not hooks:
        return

    if getattr(app.state, "teaching_quality_startup_completed", False):
        return

    hook_profiler = StepProfiler(
        logger,
        "teaching_quality startup hooks",
        enabled=app.state.startup_profile_enabled,
    )
    failures: list[str] = []

    logger.info("[startup] running %d teaching_quality startup hooks", len(hooks))
    for hook_name, hook in hooks:
        try:
            with hook_profiler.step(f"hook {hook_name}"):
                hook()
        except Exception as exc:
            failures.append(f"{hook_name}: {safe_error_str(exc)}")

    if failures:
        for failure in failures[:10]:
            logger.error("[startup] teaching_quality hook failed: %s", failure)
        raise RuntimeError("teaching_quality startup hook execution failed")

    app.state.teaching_quality_startup_completed = True
    _mark_runtime_state(teaching_quality_startup_completed=True)
    logger.info("[startup] teaching_quality startup hooks complete")
    hook_profiler.log_summary()


_current_env = os.environ.get("APP_ENV", "").lower()
_disable_api_docs = (
    os.environ.get("DISABLE_API_DOCS") == "1"
    or _current_env in {"prod", "production"}
    or str(current_mode).lower() in {"prod", "production"}
)

docs_url = None if _disable_api_docs else "/docs"
redoc_url = None if _disable_api_docs else "/redoc"
openapi_url = None if _disable_api_docs else "/openapi.json"

app: FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    lifecycle_profiler = StepProfiler(
        logger,
        "lifespan",
        enabled=app.state.startup_profile_enabled,
    )
    database_module = None

    if _should_skip_runtime_db_init():
        logger.info("[startup] reload cache hit, skipping runtime db init")
    else:
        with lifecycle_profiler.step("init_db"):
            database_module = _get_database_module()
            if not database_module.ensure_runtime_db_ready():
                raise RuntimeError("runtime database initialization failed")
        _mark_runtime_state(runtime_db_ready=True)

    if _should_skip_teaching_quality_startup():
        app.state.teaching_quality_startup_completed = True

    with lifecycle_profiler.step("permissions"):
        try:
            if database_module is None:
                database_module = _get_database_module()
            from sqlalchemy import text as sa_text

            with database_module.engine.begin() as conn:
                conn.execute(sa_text("SELECT 1"))
            database_module.ensure_permission_tables()
            database_module.ensure_audit_log_schema()
        except Exception as exc:
            logger.warning("[startup] self-check failed: %s", safe_error_str(exc))

    # --- teaching_quality: batch DDL + eager route loading ---
    with lifecycle_profiler.step("teaching_quality batch DDL"):
        if database_module is None:
            database_module = _get_database_module()
        database_module.batch_ensure_teaching_quality_tables()

    with lifecycle_profiler.step("teaching_quality routes"):
        ensure_teaching_quality_routers_loaded(
            app,
            run_startup_hooks=False,
            hook_runner=run_teaching_quality_startup_hooks,
        )

    if getattr(app.state, "teaching_quality_startup_hooks", []):
        with lifecycle_profiler.step("startup hooks"):
            run_teaching_quality_startup_hooks(app)
    else:
        logger.info("[startup] no teaching_quality startup hooks to run")

    with lifecycle_profiler.step("scheduler"):
        from app.core.scheduler import init_scheduler, shutdown_scheduler
        from app.crud.human_resources.dashboard import run_pending_dashboard_refreshes

        scheduler = init_scheduler()
        if scheduler is not None and scheduler.get_job("dashboard_refresh_recovery") is None:
            scheduler.add_job(
                run_pending_dashboard_refreshes,
                "interval",
                seconds=60,
                kwargs={"limit": 20},
                id="dashboard_refresh_recovery",
                name="dashboard refresh recovery",
                replace_existing=True,
            )
            logger.info("[startup] scheduler added dashboard_refresh_recovery interval=60s")
        app.state.scheduler_shutdown = shutdown_scheduler

    logger.info("[startup] server ready at http://%s:%s/", settings.HOST, settings.PORT)
    logger.info("[startup] database=%s", settings.DB_NAME)
    if docs_url:
        logger.info("[startup] docs=http://%s:%s/docs", settings.HOST, settings.PORT)
    else:
        logger.info("[startup] docs disabled")
    lifecycle_profiler.log_summary()

    try:
        yield
    finally:
        shutdown_scheduler = getattr(app.state, "scheduler_shutdown", None)
        if callable(shutdown_scheduler):
            shutdown_scheduler()
        logger.info("[startup] shutdown complete")

with module_init_profiler.step("fastapi app create"):
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="清美教育管理系统 - Backend API",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
        lifespan=lifespan,
    )

app.state.startup_profile_enabled = startup_profile_enabled

if ProxyHeadersMiddleware is not None:
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["127.0.0.1", "::1"])

_cors_allow_all = os.environ.get("CORS_ALLOW_ALL", "0") == "1"
if _cors_allow_all:
    _cors_origins = ["*"]
    _cors_origin_regex = None
    _cors_allow_credentials = False
    logger.warning("[startup] CORS allow-all enabled")
else:
    _cors_origins = settings.ALLOWED_ORIGINS
    _cors_origin_regex = settings.ALLOW_ORIGIN_REGEX
    _cors_allow_credentials = True
    logger.info("[startup] CORS origins=%s regex=%s", _cors_origins, _cors_origin_regex)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.request_counts = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if not getattr(settings, "RATE_LIMIT_ENABLED", True):
            return await call_next(request)

        path = request.url.path
        if (
            path in {"/", "/health", "/openapi.json"}
            or path.startswith("/docs")
            or path.startswith("/redoc")
            or path.startswith("/api/v1/auth/")
        ):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        max_requests = int(getattr(settings, "RATE_LIMIT_REQUESTS", 100))
        window_seconds = int(getattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60))
        now = time.time()
        window_start = now - window_seconds

        self.request_counts[client_ip] = [
            timestamp for timestamp in self.request_counts[client_ip] if timestamp > window_start
        ]

        if len(self.request_counts[client_ip]) >= max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"请求过于频繁，请 {window_seconds} 秒后重试",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": window_seconds,
                },
                headers={"Retry-After": str(window_seconds)},
            )

        self.request_counts[client_ip].append(now)
        return await call_next(request)


class SecurityMiddleware(BaseHTTPMiddleware):
    PUBLIC_PATHS = [
        "/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/auth/refresh",
        "/api/v1/baidu-marketing/oauth/callback",
    ]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method == "OPTIONS":
            return await call_next(request)

        is_public = False
        for public_path in self.PUBLIC_PATHS:
            if path == public_path or path.startswith(public_path + "/") or path.rstrip("/") == public_path:
                is_public = True
                break

        if is_public:
            return await call_next(request)

        if getattr(settings, "REQUIRE_AUTH", True):
            token = request.cookies.get("access_token")
            if not token:
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header[7:]

            if not token:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "未登录，请先登录", "code": "NOT_AUTHENTICATED"},
                    headers={"WWW-Authenticate": "Bearer"},
                )

            try:
                from app.core.security import security_manager

                payload = security_manager.verify_token(token)
                if not payload or not payload.get("sub"):
                    raise ValueError("Invalid token")
                request.state.username = payload.get("sub")
                request.state.user_id = payload.get("user_id") or payload.get("sub")
            except Exception:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token 无效或已过期，请重新登录", "code": "INVALID_TOKEN"},
                    headers={"WWW-Authenticate": "Bearer"},
                )

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.request_logging_enabled = env_flag("QM_LOG_REQUESTS")

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        started_at = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        response.headers["X-Request-ID"] = request_id

        if self.request_logging_enabled:
            request_logger.info(
                "[request] id=%s method=%s path=%s status=%s elapsed_ms=%.1f",
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                elapsed_ms,
            )

        return response


app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(AuditLogMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=_cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

with module_init_profiler.step("api router register"):
    app.include_router(api_router, prefix="/api/v1")

module_init_profiler.log_summary()


@app.get("/", tags=["Root"])
async def root():
    response = {"message": "欢迎使用清美教育管理系统 API"}
    if docs_url:
        response["docs"] = docs_url
    return response


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback

    error_detail = str(exc) if settings.DEBUG else "Internal Server Error"
    traceback_str = traceback.format_exc() if settings.DEBUG else None
    logger.exception(
        "[error] unhandled exception method=%s path=%s detail=%s",
        request.method,
        request.url,
        error_detail,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "服务器内部错误",
            "error": error_detail,
            "traceback": traceback_str if settings.DEBUG else None,
        },
    )


if __name__ == "__main__":
    host = args.host or settings.HOST or "0.0.0.0"
    port = args.port or settings.PORT or 8000
    backend_root = Path(__file__).resolve().parent
    reload_kwargs: dict[str, object] = {}

    if settings.RELOAD:
        reload_kwargs = {
            "reload_dirs": [str(backend_root)],
            "reload_excludes": [
                "**/*.py[cod]",
                "**/__pycache__/**",
                "**/*.log",
                "**/logs/**",
                "**/temp/**",
                "**/data/**",
                "**/uploads/**",
            ],
        }

    logger.info("[startup] mode=%s host=%s port=%s reload=%s", current_mode, host, port, settings.RELOAD)
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=settings.RELOAD,
        log_level="info",
        **reload_kwargs,
    )
