"""Shared support for human_resources backend tests."""

from __future__ import annotations

import os
import socket
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterator

import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
os.environ.setdefault("APP_ENV", "test")
sys.dont_write_bytecode = True

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
ENV_TEST_PATH = PROJECT_ROOT / ".env.test"


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


ENV = load_env_file(ENV_TEST_PATH)
for _key, _value in ENV.items():
    os.environ.setdefault(_key, _value)

DB_USER = ENV.get("DB_USER", "postgres")
DB_PASSWORD = ENV.get("DB_PASSWORD", "qingmeijiaoyu123..")
DB_HOST = ENV.get("DB_HOST", "localhost")
DB_PORT = ENV.get("DB_PORT", "5432")
DEFAULT_TEST_DB = ENV.get("DB_NAME", "qmjy_test")
REQUEST_TIMEOUT = 30
WRITE_REQUEST_TIMEOUT = 240
HEALTH_TIMEOUT = 180
TEST_LOGIN_USERNAME = os.environ.get("TEST_LOGIN_USERNAME", "pytest_dashboard_admin")
TEST_LOGIN_PASSWORD = os.environ.get("TEST_LOGIN_PASSWORD", "pytest_dashboard_123")

sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import security_manager
from app.models.user import User, UserRole, UserStatus


def log(message: str) -> None:
    print(f"  [{time.strftime('%H:%M:%S')}] {message}", flush=True)


def db_url(db_name: str) -> str:
    return f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{db_name}"


def create_db_engine(db_name: str):
    return create_engine(db_url(db_name))


def create_http_session() -> requests.Session:
    session = requests.Session()
    session.trust_env = False
    return session


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def tail_log(log_path: Path, lines: int = 80) -> str:
    if not log_path.exists():
        return "(log file not found)"
    content = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(content[-lines:])


def reset_database(db_name: str) -> None:
    log(f"重建测试数据库: {db_name}")
    admin_engine = create_engine(db_url("postgres"), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = :dbname
                  AND pid <> pg_backend_pid()
                """
            ),
            {"dbname": db_name},
        )
        conn.execute(text(f'DROP DATABASE IF EXISTS "{db_name}"'))
        conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin_engine.dispose()


def wait_for_health(base_url: str, process: subprocess.Popen[str], log_path: Path) -> None:
    deadline = time.time() + HEALTH_TIMEOUT
    last_error = "server not started"
    session = create_http_session()
    try:
        while time.time() < deadline:
            if process.poll() is not None:
                raise RuntimeError(
                    "后端测试服务提前退出。\n"
                    f"日志文件: {log_path}\n"
                    f"日志尾部:\n{tail_log(log_path)}"
                )
            try:
                response = session.get(f"{base_url}/health", timeout=5)
                if response.status_code == 200:
                    log(f"测试服务已就绪: {base_url}")
                    return
                last_error = f"status={response.status_code}"
            except Exception as exc:  # pragma: no cover - surfaced via RuntimeError
                last_error = f"{type(exc).__name__}: {exc}"
            time.sleep(2)
    finally:
        session.close()

    raise RuntimeError(
        "等待测试服务超时。\n"
        f"地址: {base_url}\n"
        f"最后错误: {last_error}\n"
        f"日志文件: {log_path}\n"
        f"日志尾部:\n{tail_log(log_path)}"
    )


def ensure_user(
    *,
    db_name: str,
    username: str,
    password: str,
    real_name: str,
    department: str,
    position: str,
    campus: str,
    phone: str,
    role: UserRole,
    is_superuser: bool,
) -> int:
    engine = create_db_engine(db_name)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        password_hash = security_manager.get_password_hash(password)
        if user is None:
            user = User(
                username=username,
                password_hash=password_hash,
                real_name=real_name,
                department=department,
                position=position,
                campus=campus,
                phone=phone,
                role=role,
                status=UserStatus.ACTIVE,
                is_superuser=is_superuser,
                gender="男",
                entry_date=datetime(2025, 1, 10, 9, 0, 0),
            )
            db.add(user)
        else:
            user.password_hash = password_hash
            user.real_name = real_name
            user.department = department
            user.position = position
            user.campus = campus
            user.phone = phone
            user.role = role
            user.status = UserStatus.ACTIVE
            user.is_superuser = is_superuser
            if not user.entry_date:
                user.entry_date = datetime(2025, 1, 10, 9, 0, 0)
        db.commit()
        db.refresh(user)
        return int(user.user_id)
    finally:
        db.close()
        engine.dispose()


def login(base_url: str, username: str, password: str) -> requests.Session:
    session = create_http_session()
    response = session.post(
        f"{base_url}/api/v1/auth/login",
        data={"username": username, "password": password},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    payload = response.json()
    session.headers.update({"Authorization": f"Bearer {payload['access_token']}"})
    return session


def ensure_admin_user(db_name: str) -> int:
    return ensure_user(
        db_name=db_name,
        username=TEST_LOGIN_USERNAME,
        password=TEST_LOGIN_PASSWORD,
        real_name="Pytest Dashboard Admin",
        department="人资部",
        position="测试管理员",
        campus="最高议事厅",
        phone="13800009999",
        role=UserRole.ADMIN,
        is_superuser=True,
    )


@dataclass
class ServerHandle:
    base_url: str
    db_name: str
    process: subprocess.Popen[str]
    log_path: Path

    def stop(self) -> None:
        log("停止测试后端")
        self.process.terminate()
        try:
            self.process.wait(timeout=20)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait(timeout=10)


@contextmanager
def running_test_server(db_name: str = DEFAULT_TEST_DB) -> Iterator[ServerHandle]:
    reset_database(db_name)
    port = find_free_port()
    base_url = f"http://127.0.0.1:{port}"
    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env["APP_ENV"] = "test"
    env["DB_NAME"] = db_name
    env["NO_PROXY"] = "127.0.0.1,localhost"
    env["no_proxy"] = "127.0.0.1,localhost"

    log_file = tempfile.NamedTemporaryFile(
        mode="w+",
        encoding="utf-8",
        prefix="hr-backend-",
        suffix=".log",
        delete=False,
    )
    log_path = Path(log_file.name)
    log(f"启动测试后端: {base_url} (db={db_name})")
    process = subprocess.Popen(
        [sys.executable, "main.py", "--mode", "test", "--port", str(port)],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        text=True,
    )
    handle = ServerHandle(base_url=base_url, db_name=db_name, process=process, log_path=log_path)
    try:
        wait_for_health(base_url, process, log_path)
        yield handle
    finally:
        handle.stop()
        log_file.close()
