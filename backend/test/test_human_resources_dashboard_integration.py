"""HR dashboard API integration tests.

This module is self-contained:
- drops and recreates the `.env.test` database
- starts the backend in `--mode test` on an ephemeral port
- waits for `/health`
- seeds test users directly in PostgreSQL
- verifies auth, employee archive API, dashboard read APIs, and write-refresh chain

Run:
    PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest -q backend/test/test_human_resources_dashboard_integration.py -s
"""
from __future__ import annotations

import os
import socket
import subprocess
import sys
import tempfile
import time
from datetime import date, datetime
from pathlib import Path

os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
os.environ.setdefault("APP_ENV", "test")
sys.dont_write_bytecode = True

import pytest
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

pytestmark = [pytest.mark.integration, pytest.mark.http, pytest.mark.db]


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
ENV_TEST_PATH = PROJECT_ROOT / ".env.test"


def _load_env_file(path: Path) -> dict[str, str]:
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


_ENV = _load_env_file(ENV_TEST_PATH)
for _key, _value in _ENV.items():
    os.environ.setdefault(_key, _value)

DB_USER = _ENV.get("DB_USER", "postgres")
DB_PASSWORD = _ENV.get("DB_PASSWORD", "qingmeijiaoyu123..")
DB_HOST = _ENV.get("DB_HOST", "localhost")
DB_PORT = _ENV.get("DB_PORT", "5432")
TEST_DB = _ENV.get("DB_NAME", "qmjy_test")
REQUEST_TIMEOUT = 30
HEALTH_TIMEOUT = 180
WRITE_REQUEST_TIMEOUT = 240
TEST_LOGIN_USERNAME = os.environ.get("TEST_LOGIN_USERNAME", "pytest_dashboard_admin")
TEST_LOGIN_PASSWORD = os.environ.get("TEST_LOGIN_PASSWORD", "pytest_dashboard_123")

sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import security_manager
from app.models.user import User, UserRole, UserStatus


def _log(message: str) -> None:
    print(f"  [{time.strftime('%H:%M:%S')}] {message}", flush=True)


def _db_url(dbname: str) -> str:
    return f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{dbname}"


def _tail_log(log_path: Path, lines: int = 80) -> str:
    if not log_path.exists():
        return "(log file not found)"
    content = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(content[-lines:])


def _http_session() -> requests.Session:
    session = requests.Session()
    session.trust_env = False
    return session


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _reset_test_database() -> None:
    _log(f"重建测试数据库: {TEST_DB}")
    admin_engine = create_engine(_db_url("postgres"), isolation_level="AUTOCOMMIT")
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
            {"dbname": TEST_DB},
        )
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB}"'))
        conn.execute(text(f'CREATE DATABASE "{TEST_DB}"'))
    admin_engine.dispose()


def _wait_for_health(base_url: str, process: subprocess.Popen[str], log_path: Path) -> None:
    deadline = time.time() + HEALTH_TIMEOUT
    last_error = "server not started"
    session = _http_session()
    try:
        while time.time() < deadline:
            if process.poll() is not None:
                pytest.fail(
                    "后端测试服务提前退出。\n"
                    f"日志文件: {log_path}\n"
                    f"日志尾部:\n{_tail_log(log_path)}"
                )
            try:
                response = session.get(f"{base_url}/health", timeout=5)
                if response.status_code == 200:
                    _log(f"测试服务已就绪: {base_url}")
                    return
                last_error = f"status={response.status_code}"
            except Exception as exc:
                last_error = f"{type(exc).__name__}: {exc}"
            time.sleep(2)
    finally:
        session.close()

    pytest.fail(
        "等待测试服务超时。\n"
        f"地址: {base_url}\n"
        f"最后错误: {last_error}\n"
        f"日志文件: {log_path}\n"
        f"日志尾部:\n{_tail_log(log_path)}"
    )


def _ensure_user(
    *,
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
    engine = create_engine(_db_url(TEST_DB))
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


def _login(base_url: str, username: str, password: str) -> requests.Session:
    session = _http_session()
    response = session.post(
        f"{base_url}/api/v1/auth/login",
        data={"username": username, "password": password},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    payload = response.json()
    session.headers.update({"Authorization": f"Bearer {payload['access_token']}"})
    return session


@pytest.fixture(scope="module")
def server_url() -> str:
    _reset_test_database()
    port = _find_free_port()
    base_url = f"http://127.0.0.1:{port}"
    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env["APP_ENV"] = "test"

    log_file = tempfile.NamedTemporaryFile(
        mode="w+",
        encoding="utf-8",
        prefix="hr-dashboard-backend-",
        suffix=".log",
        delete=False,
    )
    log_path = Path(log_file.name)
    _log(f"启动测试后端: {base_url}")
    process = subprocess.Popen(
        [sys.executable, "main.py", "--mode", "test", "--port", str(port)],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        _wait_for_health(base_url, process, log_path)
        yield base_url
    finally:
        _log("停止测试后端")
        process.terminate()
        try:
            process.wait(timeout=20)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)
        log_file.close()


@pytest.fixture(scope="module")
def auth_session(server_url: str):
    _ensure_user(
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
    session = _login(server_url, TEST_LOGIN_USERNAME, TEST_LOGIN_PASSWORD)
    yield session
    session.close()


def test_startup_creates_required_dashboard_tables(server_url: str):
    _log("测试: 冷启动后数据库关键表存在")
    engine = create_engine(_db_url(TEST_DB))
    required_tables = {
        "config": {"campuses", "approval_flow_templates"},
        "humanresources": {
            "employees",
            "recruitment_requests",
            "dashboard_daily_aggregates",
            "dashboard_yearly_aggregates",
            "salary_welfare_facts",
            "performance_facts",
        },
    }
    with engine.connect() as conn:
        for schema, expected_tables in required_tables.items():
            rows = conn.execute(
                text(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = :schema
                    """
                ),
                {"schema": schema},
            ).fetchall()
            existing_tables = {row[0] for row in rows}
            missing_tables = expected_tables - existing_tables
            _log(
                f"{schema}: 已有 {len(existing_tables)} 张表，"
                f"必需 {len(expected_tables)} 张，缺失 {len(missing_tables)} 张"
            )
            assert not missing_tables, f"{schema} missing tables: {sorted(missing_tables)}"
    engine.dispose()
    _log("测试通过: 冷启动建表正常")


def test_employee_archive_api_roundtrip_and_permissions(server_url: str, auth_session: requests.Session):
    _log("测试: employee archive API 读写与权限")
    admin_session = auth_session
    target_user_id = _ensure_user(
        username="pytest_archive_target",
        password="pytest_archive_target_123",
        real_name="档案目标员工",
        department="神藏司",
        position="出纳",
        campus="最高议事厅",
        phone="13800003001",
        role=UserRole.STAFF,
        is_superuser=False,
    )
    self_user_password = "pytest_archive_self_123"
    self_user_id = _ensure_user(
        username="pytest_archive_self",
        password=self_user_password,
        real_name="档案自助员工",
        department="运营部",
        position="运营专员",
        campus="最高议事厅",
        phone="13800003002",
        role=UserRole.STAFF,
        is_superuser=False,
    )

    update_payload = {
        "name": "档案目标员工已更新",
        "department": "运营部",
        "position": "运营主管",
        "phone": "13900003001",
        "gender": "女",
        "entry_date": "2025-06-01",
        "labor_relation_company": "清美教育集团",
        "actual_work_company": "最高议事厅",
        "base_salary": "8800",
        "archive_remark": "dashboard api integration",
    }
    update_response = admin_session.put(
        f"{server_url}/api/v1/human-resources/dashboard/employee-archive/{target_user_id}?scope=hq",
        json=update_payload,
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert update_response.status_code == 200, update_response.text
    update_data = update_response.json()
    assert update_data["name"] == "档案目标员工已更新"
    assert update_data["department"] == "运营部"
    assert float(update_data["base_salary"]) == pytest.approx(8800.0)
    assert update_data["can_edit_hr_fields"] is True

    list_response = admin_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/employee-archive?scope=hq",
        timeout=REQUEST_TIMEOUT,
    )
    assert list_response.status_code == 200, list_response.text
    rows = list_response.json()
    assert any(row["user_id"] == target_user_id and row["position"] == "运营主管" for row in rows)

    options_response = admin_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/employee-archive/options?scope=hq",
        timeout=REQUEST_TIMEOUT,
    )
    assert options_response.status_code == 200, options_response.text
    options_data = options_response.json()
    assert "运营部" in options_data["departments"]
    assert "运营主管" in options_data["positions"]

    self_session = _login(server_url, "pytest_archive_self", self_user_password)
    try:
        self_update = self_session.put(
            f"{server_url}/api/v1/human-resources/dashboard/employee-archive/{self_user_id}?scope=hq",
            json={
                "name": "档案自助员工已更新",
                "current_address": "石家庄市测试地址 66 号",
                "bank_card_number": "6222022020202020",
            },
            timeout=WRITE_REQUEST_TIMEOUT,
        )
        assert self_update.status_code == 200, self_update.text
        self_data = self_update.json()
        assert self_data["name"] == "档案自助员工已更新"
        assert self_data["current_address"] == "石家庄市测试地址 66 号"
        assert self_data["can_edit_hr_fields"] is False

        forbidden_update = self_session.put(
            f"{server_url}/api/v1/human-resources/dashboard/employee-archive/{target_user_id}?scope=hq",
            json={"current_address": "越权修改"},
            timeout=WRITE_REQUEST_TIMEOUT,
        )
        assert forbidden_update.status_code == 403, forbidden_update.text
    finally:
        self_session.close()
    _log("测试通过: employee archive API 正常")


def test_dashboard_read_endpoints(server_url: str, auth_session: requests.Session):
    _log("测试: dashboard 只读接口")
    month = date.today().strftime("%Y-%m")
    year = date.today().strftime("%Y")

    cases = [
        ("hq_archive_options", f"/api/v1/human-resources/dashboard/employee-archive/options?scope=hq"),
        ("offline_archive_options", f"/api/v1/human-resources/dashboard/employee-archive/options?scope=offline"),
        ("hq_archive", f"/api/v1/human-resources/dashboard/employee-archive?scope=hq"),
        ("offline_archive", f"/api/v1/human-resources/dashboard/employee-archive?scope=offline"),
        ("hq_daily", f"/api/v1/human-resources/dashboard/daily?scope=hq&month={month}"),
        ("offline_daily", f"/api/v1/human-resources/dashboard/daily?scope=offline&month={month}"),
        ("hq_monthly", f"/api/v1/human-resources/dashboard/monthly?scope=hq&year={year}"),
        ("offline_monthly", f"/api/v1/human-resources/dashboard/monthly?scope=offline&year={year}"),
        ("hq_annual", f"/api/v1/human-resources/dashboard/annual?scope=hq&year={year}"),
        ("offline_annual", f"/api/v1/human-resources/dashboard/annual?scope=offline&year={year}"),
        ("online_annual", f"/api/v1/human-resources/dashboard/annual?scope=online&year={year}"),
    ]
    expected_sections = {
        "daily": {"recruitment", "training", "salary_welfare", "social_insurance"},
        "monthly": {"hr_allocation", "training", "salary_welfare", "social_insurance"},
        "annual": {
            "summary",
            "post_staff",
            "hr_allocation",
            "training",
            "salary_welfare",
            "social_insurance",
            "performance",
        },
    }

    for name, path in cases:
        response = auth_session.get(f"{server_url}{path}", timeout=REQUEST_TIMEOUT)
        assert response.status_code == 200, f"{name} failed ({response.status_code}): {response.text[:500]}"
        payload = response.json()
        if name.endswith("_options"):
            assert isinstance(payload.get("departments"), list)
            assert isinstance(payload.get("positions"), list)
        elif name.endswith("_archive"):
            assert isinstance(payload, list)
        elif name.endswith("_daily"):
            assert set(payload["sections"].keys()) == expected_sections["daily"]
        elif name.endswith("_monthly"):
            assert set(payload["sections"].keys()) == expected_sections["monthly"]
        elif name.endswith("_annual"):
            assert set(payload["sections"].keys()) == expected_sections["annual"]
            if name == "hq_annual":
                assert payload["sections"]["post_staff"]["rows"][0]["rowType"] in {"grandTotal", "yearEnd"}
                assert payload["sections"]["hr_allocation"]["rows"][0]["rowType"] == "grandTotal"
                assert any(row.get("rowType") == "monthSubtotal" for row in payload["sections"]["hr_allocation"]["rows"])
                salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
                insurance_total_row = payload["sections"]["social_insurance"]["rows"][0]
                assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
                assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
                assert "totalPayment" in insurance_total_row
                assert "insurancePayTotal" in insurance_total_row
            if name == "offline_annual":
                assert payload["sections"]["post_staff"]["rows"][0]["rowType"] == "yearEnd"
                assert payload["sections"]["hr_allocation"]["rows"][0]["rowType"] == "yearTotal"
                assert not any(row.get("rowType") == "monthSubtotal" for row in payload["sections"]["hr_allocation"]["rows"])
                salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
                assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
                assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
            if name == "online_annual":
                assert payload["sections"]["post_staff"]["rows"][0]["rowType"] == "yearEnd"
                assert payload["sections"]["hr_allocation"]["rows"][0]["rowType"] == "yearTotal"
                assert not any(row.get("rowType") == "monthSubtotal" for row in payload["sections"]["hr_allocation"]["rows"])
                salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
                insurance_total_row = payload["sections"]["social_insurance"]["rows"][0]
                assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
                assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
                assert "totalPayment" in insurance_total_row
                assert "insurancePayTotal" in insurance_total_row
    _log("测试通过: dashboard 只读接口正常")


def test_dashboard_write_refresh_chain(server_url: str, auth_session: requests.Session):
    _log("测试: 写入 -> 刷新 -> 查询 链路")
    today = date.today()
    month = today.strftime("%Y-%m")
    year = today.strftime("%Y")
    month_start = today.replace(day=1).isoformat()

    manual_payload = {
        "scope": "hq",
        "stat_date": today.isoformat(),
        "org_name": "运营部",
        "authorized_posts": 9,
        "current_posts": 7,
        "planned_optimize_count": 2,
        "actual_optimize_count": 1,
        "transfer_names": ["pytest调岗"],
        "optimize_names": ["pytest优化"],
        "resign_names": ["pytest离职"],
    }
    manual_response = auth_session.post(
        f"{server_url}/api/v1/human-resources/dashboard/manual/recruitment-daily",
        json=manual_payload,
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert manual_response.status_code == 200, manual_response.text
    assert manual_response.json()["org_name"] == "运营部"

    salary_payload = {
        "scope": "hq",
        "org_kind": "department",
        "org_name": "运营部",
        "stat_date": today.isoformat(),
        "person_name": "pytest集成员工",
        "position": "测试岗位",
        "position_category": "干部",
        "headcount": 1,
        "salary": "12345.67",
        "annual_welfare_total": "888.00",
        "monthly_incentive_total": "222.00",
        "temporary_reward_total": "33.00",
        "deduction": "11.00",
        "cadre_salary_total": "12345.67",
        "staff_salary_total": "0",
        "remark": "pytest integration",
    }
    salary_response = auth_session.post(
        f"{server_url}/api/v1/human-resources/salary-welfare-facts",
        json=salary_payload,
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert salary_response.status_code == 200, salary_response.text
    assert salary_response.json()["person_name"] == "pytest集成员工"

    performance_payload = {
        "scope": "hq",
        "org_kind": "department",
        "org_name": "运营部",
        "stat_month": month_start,
        "person_name": "pytest集成员工",
        "position_category": "干部",
        "average_score": "88.50",
        "leader_average_score": "91.20",
        "staff_average_score": "0",
        "remark": "pytest integration",
    }
    performance_response = auth_session.post(
        f"{server_url}/api/v1/human-resources/performance-facts",
        json=performance_payload,
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert performance_response.status_code == 200, performance_response.text
    assert performance_response.json()["person_name"] == "pytest集成员工"

    manual_list_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/manual/recruitment-daily?scope=hq&month={month}",
        timeout=REQUEST_TIMEOUT,
    )
    assert manual_list_response.status_code == 200, manual_list_response.text
    manual_rows = manual_list_response.json()
    assert any(
        row["org_name"] == "运营部"
        and row["authorized_posts"] == 9
        and "pytest调岗" in row["transfer_names"]
        for row in manual_rows
    )

    salary_list_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/salary-welfare-facts?scope=hq&org_name=运营部",
        timeout=REQUEST_TIMEOUT,
    )
    assert salary_list_response.status_code == 200, salary_list_response.text
    assert any(row["person_name"] == "pytest集成员工" for row in salary_list_response.json())

    performance_list_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/performance-facts?scope=hq&org_name=运营部",
        timeout=REQUEST_TIMEOUT,
    )
    assert performance_list_response.status_code == 200, performance_list_response.text
    assert any(row["person_name"] == "pytest集成员工" for row in performance_list_response.json())

    daily_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/daily?scope=hq&month={month}",
        timeout=REQUEST_TIMEOUT,
    )
    assert daily_response.status_code == 200, daily_response.text
    daily_payload = daily_response.json()

    recruitment_matches = [
        row for row in daily_payload["sections"]["recruitment"]["rows"]
        if row.get("department") == "运营部"
        and row.get("authorizedPosts") == 9
        and "pytest调岗" in row.get("transferNames", [])
    ]
    assert recruitment_matches, "manual recruitment row did not propagate to daily dashboard"

    salary_matches = [
        row for row in daily_payload["sections"]["salary_welfare"]["rows"]
        if row.get("personName") == "pytest集成员工"
        and float(row.get("salaryTotal", 0) or 0) >= 12345.67
    ]
    assert salary_matches, "salary fact did not propagate to daily dashboard"

    annual_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/annual?scope=hq&year={year}",
        timeout=REQUEST_TIMEOUT,
    )
    assert annual_response.status_code == 200, annual_response.text
    annual_payload = annual_response.json()
    hr_rows = annual_payload["sections"]["hr_allocation"]["rows"]
    salary_rows = annual_payload["sections"]["salary_welfare"]["rows"]
    insurance_rows = annual_payload["sections"]["social_insurance"]["rows"]
    current_month_sequence = str(today.month)

    assert hr_rows[0]["rowType"] == "grandTotal"
    assert any(row.get("rowType") == "monthSubtotal" for row in hr_rows)
    assert any(
        row.get("rowType") == "month"
        and row.get("sequence") == current_month_sequence
        and row.get("division") == "运营部"
        for row in hr_rows
    )

    salary_total_row = salary_rows[0]
    assert salary_total_row["rowType"] == "grandTotal"
    assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
    assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]

    insurance_total_row = insurance_rows[0]
    assert insurance_total_row["rowType"] == "grandTotal"
    assert "totalPayment" in insurance_total_row
    assert "insurancePayTotal" in insurance_total_row
    assert "companyPayment" in insurance_total_row
    assert "personalPayment" in insurance_total_row
    assert "serviceFee" in insurance_total_row
    performance_matches = [
        row for row in annual_payload["sections"]["performance"]["rows"]
        if row.get("division") == "运营部"
        and row.get("sequence") == current_month_sequence
        and float(row.get("avgScore", 0) or 0) == pytest.approx(88.5)
        and float(row.get("leaderAvgScore", 0) or 0) == pytest.approx(91.2)
    ]
    assert performance_matches, "performance fact did not propagate to annual dashboard"
    _log("测试通过: 写入回刷链路正常")
