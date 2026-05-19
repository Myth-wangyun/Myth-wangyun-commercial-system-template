"""Launch deterministic HR backend/frontend services and run Playwright against them."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from contextlib import suppress
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def build_clean_env(extra: dict[str, str] | None = None) -> dict[str, str]:
    env = os.environ.copy()
    for key in ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy"):
        env.pop(key, None)
    env["NO_PROXY"] = "127.0.0.1,localhost"
    env["no_proxy"] = "127.0.0.1,localhost"
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    if extra:
        env.update(extra)
    return env


def wait_for_http(url: str, *, timeout: int, label: str) -> None:
    deadline = time.time() + timeout
    session = requests.Session()
    session.trust_env = False
    last_error = "unknown"
    try:
        while time.time() < deadline:
            try:
                response = session.get(url, timeout=5)
                if response.status_code < 500:
                    print(f"[hr-playwright] {label} 就绪: {url}", flush=True)
                    return
                last_error = f"HTTP {response.status_code}"
            except requests.RequestException as exc:
                last_error = f"{type(exc).__name__}: {exc}"
            time.sleep(2)
    finally:
        session.close()
    raise RuntimeError(f"等待 {label} 超时: {url}; last_error={last_error}")


def terminate_process(process: subprocess.Popen[str] | None, label: str) -> None:
    if not process or process.poll() is not None:
        return
    print(f"[hr-playwright] 停止 {label}", flush=True)
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    deadline = time.time() + 20
    while time.time() < deadline:
        if process.poll() is not None:
            return
        time.sleep(0.5)
    with suppress(Exception):
        os.killpg(process.pid, signal.SIGKILL)
def main() -> int:
    backend_port = os.environ.get("PLAYWRIGHT_HR_BACKEND_PORT", "49081")
    frontend_port = os.environ.get("PLAYWRIGHT_PORT", "5173")
    backend_db = os.environ.get("PLAYWRIGHT_HR_DB", "qmjy_test_hr_e2e")
    backend_url = f"http://127.0.0.1:{backend_port}"
    frontend_url = f"http://127.0.0.1:{frontend_port}"

    backend_env = build_clean_env(
        {
            "APP_ENV": "test",
            "PLAYWRIGHT_HR_BACKEND_PORT": backend_port,
            "PLAYWRIGHT_HR_DB": backend_db,
        }
    )
    frontend_env = build_clean_env(
        {
            "VITE_PROXY_TARGET": backend_url,
            "VITE_API_BASE_URL": f"{backend_url}/api/v1",
            "PLAYWRIGHT_PORT": frontend_port,
        }
    )
    playwright_env = build_clean_env(
        {
            "PLAYWRIGHT_DISABLE_WEBSERVER": "1",
            "PLAYWRIGHT_BASE_URL": frontend_url,
            "PLAYWRIGHT_HR_BACKEND_PORT": backend_port,
            "PLAYWRIGHT_HR_DB": backend_db,
        }
    )

    backend_cmd = [
        str(PROJECT_ROOT / ".venv" / "bin" / "python"),
        "backend/test/start_human_resources_e2e_backend.py",
        "--port",
        backend_port,
        "--db",
        backend_db,
    ]
    frontend_cmd = [
        "npm",
        "run",
        "dev",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        frontend_port,
    ]
    playwright_cmd = ["npx", "playwright", "test", *sys.argv[1:]]

    backend_proc: subprocess.Popen[str] | None = None
    frontend_proc: subprocess.Popen[str] | None = None

    try:
        print("[hr-playwright] 启动人事测试后端", flush=True)
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(PROJECT_ROOT),
            env=backend_env,
            start_new_session=True,
        )
        wait_for_http(f"{backend_url}/health", timeout=300, label="后端")

        print("[hr-playwright] 启动前端 Vite", flush=True)
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(PROJECT_ROOT),
            env=frontend_env,
            start_new_session=True,
        )
        wait_for_http(frontend_url, timeout=180, label="前端")

        print("[hr-playwright] 开始执行 Playwright", flush=True)
        completed = subprocess.run(
            playwright_cmd,
            cwd=str(PROJECT_ROOT),
            env=playwright_env,
            check=False,
        )
        return completed.returncode
    finally:
        terminate_process(frontend_proc, "前端 Vite")
        terminate_process(backend_proc, "人事测试后端")


if __name__ == "__main__":
    raise SystemExit(main())
