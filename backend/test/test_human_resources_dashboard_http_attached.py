"""HR dashboard HTTP integration tests against a pre-started backend server.

Start the backend yourself first:

    cd backend && .venv/bin/python main.py --mode test --port 8000

Then run:

    TEST_BASE_URL=http://127.0.0.1:8000 \
    PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m pytest \
      -q backend/test/test_human_resources_dashboard_http_attached.py -s
"""

from __future__ import annotations

import os
import sys
import time
from datetime import date
from pathlib import Path

import pytest
import requests
from sqlalchemy import create_engine, text

os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
sys.dont_write_bytecode = True

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
TEST_DIR = BACKEND_DIR / "test"
sys.path.insert(0, str(TEST_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.models.user import UserRole
from hr_test_support import (
    HEALTH_TIMEOUT,
    REQUEST_TIMEOUT,
    TEST_LOGIN_PASSWORD,
    TEST_LOGIN_USERNAME,
    WRITE_REQUEST_TIMEOUT,
    create_http_session,
    ensure_user,
    log,
    login,
)


DEFAULT_BASE_URLS = [
    os.environ.get("TEST_BASE_URL"),
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]


def _candidate_base_urls() -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for base_url in DEFAULT_BASE_URLS:
        if not base_url or base_url in seen:
            continue
        seen.add(base_url)
        result.append(base_url)
    return result


def _db_url_from_settings() -> str:
    return (
        f"postgresql+psycopg://{settings.DB_USER}:{settings.DB_PASSWORD}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    )


@pytest.fixture(scope="module")
def server_url() -> str:
    log(f"检测后端服务器候选地址: {_candidate_base_urls()}")
    deadline = time.time() + HEALTH_TIMEOUT
    last_error = ""
    attempt = 0
    session = create_http_session()
    try:
        while time.time() < deadline:
            attempt += 1
            for base_url in _candidate_base_urls():
                try:
                    resp = session.get(f"{base_url}/health", timeout=5)
                    if resp.status_code == 200:
                        log(f"服务器就绪: {base_url}")
                        return base_url
                    last_error = f"{base_url} -> status {resp.status_code}"
                except requests.ConnectionError:
                    last_error = f"{base_url} -> 连接被拒绝"
                except Exception as exc:  # pragma: no cover - surfaced by pytest.fail
                    last_error = f"{base_url} -> {type(exc).__name__}: {exc}"
            time.sleep(3)
    finally:
        session.close()

    pytest.fail(
        "后端服务器不可达，请先手工启动后端。\n"
        "示例: cd backend && .venv/bin/python main.py --mode test --port 8000\n"
        f"最后错误: {last_error}"
    )


@pytest.fixture(scope="module")
def auth_session(server_url: str):
    ensure_user(
        db_name=settings.DB_NAME,
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
    session = login(server_url, TEST_LOGIN_USERNAME, TEST_LOGIN_PASSWORD)
    yield session
    session.close()


def test_attached_server_has_required_hr_tables():
    engine = create_engine(_db_url_from_settings())
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
            assert not missing_tables, f"{schema} missing tables: {sorted(missing_tables)}"
    engine.dispose()


def test_attached_dashboard_read_endpoints(server_url: str, auth_session: requests.Session):
    month = date.today().strftime("%Y-%m")
    year = date.today().strftime("%Y")
    cases = [
        f"/api/v1/human-resources/dashboard/employee-archive/options?scope=hq",
        f"/api/v1/human-resources/dashboard/employee-archive/options?scope=offline",
        f"/api/v1/human-resources/dashboard/employee-archive?scope=hq",
        f"/api/v1/human-resources/dashboard/employee-archive?scope=offline",
        f"/api/v1/human-resources/dashboard/daily?scope=hq&month={month}",
        f"/api/v1/human-resources/dashboard/daily?scope=offline&month={month}",
        f"/api/v1/human-resources/dashboard/monthly?scope=hq&year={year}",
        f"/api/v1/human-resources/dashboard/monthly?scope=offline&year={year}",
        f"/api/v1/human-resources/dashboard/annual?scope=hq&year={year}",
        f"/api/v1/human-resources/dashboard/annual?scope=offline&year={year}",
        f"/api/v1/human-resources/dashboard/annual?scope=online&year={year}",
    ]
    for path in cases:
        response = auth_session.get(f"{server_url}{path}", timeout=REQUEST_TIMEOUT)
        assert response.status_code == 200, f"{path} -> {response.status_code}: {response.text[:500]}"
        if "dashboard/annual?scope=hq" in path:
            payload = response.json()
            assert payload["sections"]["post_staff"]["rows"][0]["rowType"] in {"grandTotal", "yearEnd"}
            assert payload["sections"]["hr_allocation"]["rows"][0]["rowType"] == "grandTotal"
            assert any(row.get("rowType") == "monthSubtotal" for row in payload["sections"]["hr_allocation"]["rows"])
            salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
            assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
            assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
        if "dashboard/annual?scope=offline" in path:
            payload = response.json()
            assert payload["sections"]["post_staff"]["rows"][0]["rowType"] == "yearEnd"
            assert payload["sections"]["hr_allocation"]["rows"][0]["rowType"] == "yearTotal"
            assert not any(row.get("rowType") == "monthSubtotal" for row in payload["sections"]["hr_allocation"]["rows"])
            salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
            assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
            assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
        if "dashboard/annual?scope=online" in path:
            payload = response.json()
            assert payload["sections"]["post_staff"]["rows"][0]["rowType"] == "yearEnd"
            assert payload["sections"]["hr_allocation"]["rows"][0]["rowType"] == "yearTotal"
            assert not any(row.get("rowType") == "monthSubtotal" for row in payload["sections"]["hr_allocation"]["rows"])
            salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
            insurance_total_row = payload["sections"]["social_insurance"]["rows"][0]
            assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
            assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
            assert "totalPayment" in insurance_total_row
            assert "insurancePayTotal" in insurance_total_row


def test_attached_annual_read_contracts(server_url: str, auth_session: requests.Session):
    year = date.today().strftime("%Y")
    cases = [
        ("hq", "grandTotal", "grandTotal", True),
        ("offline", "yearEnd", "yearTotal", False),
        ("online", "yearEnd", "yearTotal", False),
    ]

    for scope, post_row_type, hr_row_type, has_month_subtotal in cases:
        response = auth_session.get(
            f"{server_url}/api/v1/human-resources/dashboard/annual?scope={scope}&year={year}",
            timeout=REQUEST_TIMEOUT,
        )
        assert response.status_code == 200, f"annual {scope} -> {response.status_code}: {response.text[:500]}"

        payload = response.json()
        post_rows = payload["sections"]["post_staff"]["rows"]
        hr_rows = payload["sections"]["hr_allocation"]["rows"]
        salary_total_row = payload["sections"]["salary_welfare"]["rows"][0]
        insurance_total_row = payload["sections"]["social_insurance"]["rows"][0]

        assert post_rows[0]["rowType"] == post_row_type
        assert hr_rows[0]["rowType"] == hr_row_type
        assert any(row.get("rowType") == "monthSubtotal" for row in hr_rows) is has_month_subtotal
        assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
        assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]
        assert "totalPayment" in insurance_total_row
        assert "insurancePayTotal" in insurance_total_row


def test_attached_dashboard_write_refresh_chain(server_url: str, auth_session: requests.Session):
    today = date.today()
    month = today.strftime("%Y-%m")
    year = today.strftime("%Y")

    manual_response = auth_session.post(
        f"{server_url}/api/v1/human-resources/dashboard/manual/recruitment-daily",
        json={
            "scope": "hq",
            "stat_date": today.isoformat(),
            "org_name": "运营部",
            "authorized_posts": 8,
            "current_posts": 6,
            "planned_optimize_count": 1,
            "actual_optimize_count": 1,
            "transfer_names": ["attached调岗"],
            "optimize_names": ["attached优化"],
            "resign_names": ["attached离职"],
        },
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert manual_response.status_code == 200, manual_response.text

    salary_response = auth_session.post(
        f"{server_url}/api/v1/human-resources/salary-welfare-facts",
        json={
            "scope": "hq",
            "org_kind": "department",
            "org_name": "运营部",
            "stat_date": today.isoformat(),
            "person_name": "attached薪酬",
            "position": "测试岗位",
            "position_category": "干部",
            "headcount": 1,
            "salary": "10000",
            "annual_welfare_total": "500",
            "monthly_incentive_total": "200",
            "temporary_reward_total": "50",
            "deduction": "20",
            "cadre_salary_total": "10000",
            "staff_salary_total": "0",
        },
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert salary_response.status_code == 200, salary_response.text

    performance_response = auth_session.post(
        f"{server_url}/api/v1/human-resources/performance-facts",
        json={
            "scope": "hq",
            "org_kind": "department",
            "org_name": "运营部",
            "stat_month": today.replace(day=1).isoformat(),
            "person_name": "attached绩效",
            "position_category": "干部",
            "average_score": "87.5",
            "leader_average_score": "89.0",
            "staff_average_score": "0",
        },
        timeout=WRITE_REQUEST_TIMEOUT,
    )
    assert performance_response.status_code == 200, performance_response.text

    daily_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/daily?scope=hq&month={month}",
        timeout=REQUEST_TIMEOUT,
    )
    assert daily_response.status_code == 200, daily_response.text
    daily_payload = daily_response.json()
    assert any(
        row.get("department") == "运营部" and "attached调岗" in row.get("transferNames", [])
        for row in daily_payload["sections"]["recruitment"]["rows"]
    )
    assert any(
        row.get("department") == "运营部" and "attached薪酬" in str(row.get("personName") or "")
        for row in daily_payload["sections"]["salary_welfare"]["rows"]
    )

    annual_response = auth_session.get(
        f"{server_url}/api/v1/human-resources/dashboard/annual?scope=hq&year={year}",
        timeout=REQUEST_TIMEOUT,
    )
    assert annual_response.status_code == 200, annual_response.text
    annual_payload = annual_response.json()
    hr_rows = annual_payload["sections"]["hr_allocation"]["rows"]
    salary_rows = annual_payload["sections"]["salary_welfare"]["rows"]
    insurance_rows = annual_payload["sections"]["social_insurance"]["rows"]

    assert hr_rows[0]["rowType"] == "grandTotal"
    assert any(row.get("rowType") == "monthSubtotal" for row in hr_rows)
    assert any(
        row.get("rowType") == "month"
        and row.get("sequence") == str(today.month)
        and row.get("division") == "运营部"
        for row in hr_rows
    )

    salary_total_row = salary_rows[0]
    assert salary_total_row["salaryTotal"] == salary_total_row["annualSalaryTotal"]
    assert salary_total_row["welfareTotal"] == salary_total_row["annualWelfareTotal"]

    insurance_total_row = insurance_rows[0]
    assert "totalPayment" in insurance_total_row
    assert "insurancePayTotal" in insurance_total_row
    assert "companyPayment" in insurance_total_row
    assert "personalPayment" in insurance_total_row
    assert "serviceFee" in insurance_total_row

    assert any(
        row.get("division") == "运营部" and float(row.get("avgScore", 0) or 0) >= 87.5
        for row in annual_payload["sections"]["performance"]["rows"]
    )
