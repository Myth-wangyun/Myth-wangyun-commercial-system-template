"""Broad HTTP smoke coverage for human_resources endpoints."""

from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

import pytest
import requests

pytestmark = [pytest.mark.integration, pytest.mark.http, pytest.mark.db]

os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
sys.dont_write_bytecode = True

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
TEST_DIR = BACKEND_DIR / "test"
sys.path.insert(0, str(TEST_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from hr_test_support import (
    REQUEST_TIMEOUT,
    TEST_LOGIN_PASSWORD,
    TEST_LOGIN_USERNAME,
    WRITE_REQUEST_TIMEOUT,
    ensure_user,
    ensure_admin_user,
    login,
    running_test_server,
)
from app.models.user import UserRole


TEST_DB = "qmjy_test_hr_http_smoke"


def _get(session: requests.Session, base_url: str, path: str, **kwargs):
    response = session.get(f"{base_url}{path}", timeout=REQUEST_TIMEOUT, **kwargs)
    assert response.status_code == 200, f"GET {path} -> {response.status_code}: {response.text[:500]}"
    return response


def _post(session: requests.Session, base_url: str, path: str, payload: dict):
    response = session.post(f"{base_url}{path}", json=payload, timeout=WRITE_REQUEST_TIMEOUT)
    assert response.status_code == 200, f"POST {path} -> {response.status_code}: {response.text[:500]}"
    return response


def _put(session: requests.Session, base_url: str, path: str, payload: dict):
    response = session.put(f"{base_url}{path}", json=payload, timeout=WRITE_REQUEST_TIMEOUT)
    assert response.status_code == 200, f"PUT {path} -> {response.status_code}: {response.text[:500]}"
    return response


def _delete(session: requests.Session, base_url: str, path: str):
    response = session.delete(f"{base_url}{path}", timeout=WRITE_REQUEST_TIMEOUT)
    assert response.status_code == 200, f"DELETE {path} -> {response.status_code}: {response.text[:500]}"
    return response


def _assert_list_contains(session: requests.Session, base_url: str, path: str, record_id: int):
    rows = _get(session, base_url, path).json()
    assert any(int(row["id"]) == int(record_id) for row in rows), f"{path} missing record {record_id}"


@pytest.fixture(scope="module")
def server_handle():
    with running_test_server(TEST_DB) as handle:
        yield handle


@pytest.fixture(scope="module")
def server_url(server_handle) -> str:
    return server_handle.base_url


@pytest.fixture(scope="module")
def admin_user_id(server_handle) -> int:
    admin_id = ensure_admin_user(TEST_DB)
    assert admin_id > 0
    return admin_id


@pytest.fixture(scope="module")
def approval_config_approver_ids() -> dict[str, int]:
    department_manager_id = ensure_user(
        db_name=TEST_DB,
        username="pytest_hr_department_manager",
        password=TEST_LOGIN_PASSWORD,
        real_name="Pytest Department Manager",
        department="运营部",
        position="运营主管",
        campus="最高议事厅",
        phone="13800018888",
        role=UserRole.ADMIN,
        is_superuser=False,
    )
    principal_id = ensure_user(
        db_name=TEST_DB,
        username="pytest_hr_principal",
        password=TEST_LOGIN_PASSWORD,
        real_name="Pytest Principal",
        department="最高议事厅神殿",
        position="校长",
        campus="最高议事厅",
        phone="13800018889",
        role=UserRole.ADMIN,
        is_superuser=False,
    )
    return {
        "department_manager": department_manager_id,
        "principal": principal_id,
    }


@pytest.fixture(scope="module")
def auth_session(server_url: str, admin_user_id: int):
    assert admin_user_id > 0
    session = login(server_url, TEST_LOGIN_USERNAME, TEST_LOGIN_PASSWORD)
    yield session
    session.close()


def test_approval_workflow_template_and_binding_routes(
    auth_session: requests.Session,
    server_url: str,
    admin_user_id: int,
):
    preview = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/approval-workflow-preview",
        {
            "flow_type": "recruitment_request",
            "campus": "最高议事厅",
            "department": "运营部",
            "position": "运营主管",
        },
    ).json()
    assert preview["flow_type"] == "recruitment_request"

    binding = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/org-responsibility-bindings",
        {
            "responsibility_code": "department_head",
            "responsibility_name": "部门负责人",
            "campus_scope": "最高议事厅",
            "department_scope": "运营部",
            "position_scope": "运营主管",
            "user_id": admin_user_id,
            "sort_order": 1,
            "is_primary": True,
            "is_active": True,
            "notes": "pytest binding",
        },
    ).json()
    binding_id = int(binding["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/org-responsibility-bindings", binding_id)
    updated_binding = _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/org-responsibility-bindings/{binding_id}",
        {"notes": "pytest binding updated", "sort_order": 2},
    ).json()
    assert updated_binding["notes"] == "pytest binding updated"

    template = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/approval-workflow-templates",
        {
            "flow_type": "recruitment_request",
            "name": "pytest 招聘模板",
            "campus": "最高议事厅",
            "apply_department": "运营部",
            "apply_position": "运营主管",
            "priority": 10,
            "is_active": True,
            "nodes": [
                {
                    "stage": "department_head",
                    "stage_label": "部门负责人",
                    "node_order": 1,
                    "approver_source_type": "user_ids",
                    "approver_source_value": "1",
                    "is_required": True,
                    "allow_multi_approver": False,
                    "applicant_selectable": True,
                }
            ],
        },
    ).json()
    template_id = int(template["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/approval-workflow-templates", template_id)
    updated_template = _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/approval-workflow-templates/{template_id}",
        {"name": "pytest 招聘模板更新", "priority": 20},
    ).json()
    assert updated_template["name"] == "pytest 招聘模板更新"

    _delete(auth_session, server_url, f"/api/v1/human-resources/approval-workflow-templates/{template_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/org-responsibility-bindings/{binding_id}")


def test_basic_table_endpoints(auth_session: requests.Session, server_url: str):
    interview = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/interview-registrations",
        {
            "region": "河北",
            "campus_name": "最高议事厅",
            "name": "HTTP面试登记",
            "source": "Boss",
            "phone": "13800010001",
            "position": "运营主管",
            "invite_date": "2026-03-11",
            "inviter": "pytest",
            "scheduled_time": "09:30",
            "attended_first": "是",
            "first_interviewer": "测试官",
            "first_hire_decision": "待定",
        },
    ).json()
    interview_id = int(interview["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/interview-registrations", interview_id)
    assert _get(auth_session, server_url, f"/api/v1/human-resources/interview-registrations/{interview_id}").json()["name"] == "HTTP面试登记"
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/interview-registrations/{interview_id}",
        {"reported": "是", "onboard_date": "2026-03-15"},
    ).json()["reported"] == "是"

    goal = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/training-goals",
        {
            "parent_category": "业务",
            "sub_category": "销售",
            "level": "基础",
            "objectives": ["掌握流程", "提升成交"],
            "year": "2026",
            "remark": "pytest goal",
        },
    ).json()
    goal_id = int(goal["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/training-goals", goal_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/training-goals/{goal_id}",
        {"remark": "pytest goal updated"},
    ).json()["remark"] == "pytest goal updated"

    result = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/training-results",
        {
            "campus": "最高议事厅",
            "department": "运营部",
            "training_date": "2026-03-12",
            "training_hours": 4,
            "expected_count": 2,
            "total_cost": 500,
            "trainees": [
                {"name": "学员甲", "theory_score": 80, "practice_score": 82},
                {"name": "学员乙", "theory_score": 70, "practice_score": 68},
            ],
            "remark": "pytest result",
        },
    ).json()
    result_id = int(result["id"])
    assert _get(auth_session, server_url, f"/api/v1/human-resources/training-results/{result_id}").json()["id"] == result_id
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/training-results/{result_id}",
        {"total_cost": 600},
    ).json()["total_cost"] == 600

    satisfaction = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/training-satisfaction-surveys",
        {
            "department": "运营部",
            "training_date": "2026-03-12",
            "training_location": "会议室A",
            "course_content": "客户沟通",
            "trainer": "讲师甲",
            "scores": {
                "q1": 5,
                "q2": 5,
                "q3": 4,
                "q4": 4,
                "q5": 5,
                "q6": 5,
                "q7": 5,
                "q8": 4,
                "q9": 4,
                "q10": 5,
                "q11": 5,
                "q12": 4,
                "q13": 5,
                "q14": 5,
            },
            "open_q4": "满意",
            "open_q5": "可复训",
            "open_q6": "继续保持",
            "remark": "pytest survey",
        },
    ).json()
    satisfaction_id = int(satisfaction["id"])
    assert (
        _get(auth_session, server_url, f"/api/v1/human-resources/training-satisfaction-surveys/{satisfaction_id}").json()["id"]
        == satisfaction_id
    )
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/training-satisfaction-surveys/{satisfaction_id}",
        {"remark": "pytest survey updated"},
    ).json()["remark"] == "pytest survey updated"

    promotion_interview = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/promotion-interviews",
        {
            "name": "晋升候选人",
            "department": "运营部",
            "position": "运营主管",
            "campus": "最高议事厅",
            "interview_date": "2026-03-13",
            "interviewer": "面试官甲",
            "performance_type": "p2",
            "scores": {
                "v1": 8,
                "v2": 8,
                "v3": 4,
                "v4": 9,
                "p2": 18,
                "k1": 8,
                "k2": 8,
                "k3": 4,
                "m1": 9,
                "m2": 4,
                "m3": 4,
            },
            "status": "draft",
        },
    ).json()
    promotion_interview_id = int(promotion_interview["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/promotion-interviews", promotion_interview_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/promotion-interviews/{promotion_interview_id}",
        {"status": "submitted"},
    ).json()["status"] == "submitted"

    legacy_manual = _put(
        auth_session,
        server_url,
        "/api/v1/human-resources/management-center-daily-recruitment-manuals",
        {
            "stat_date": "2026-03-09",
            "department": "运营部",
            "authorized_posts": 9,
            "current_posts": 7,
            "planned_optimize_count": 1,
            "actual_optimize_count": 0,
            "transfer_names": ["老接口调岗"],
            "optimize_names": ["老接口优化"],
            "resign_names": ["老接口离职"],
        },
    ).json()
    assert legacy_manual["department"] == "运营部"
    legacy_rows = _get(
        auth_session,
        server_url,
        "/api/v1/human-resources/management-center-daily-recruitment-manuals?month=2026-03",
    ).json()
    assert any(row["department"] == "运营部" for row in legacy_rows)

    _delete(auth_session, server_url, f"/api/v1/human-resources/promotion-interviews/{promotion_interview_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/training-satisfaction-surveys/{satisfaction_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/training-results/{result_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/training-goals/{goal_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/interview-registrations/{interview_id}")


def test_application_and_config_endpoints(
    auth_session: requests.Session,
    server_url: str,
    admin_user_id: int,
    approval_config_approver_ids: dict[str, int],
):
    config_cases = [
        {
            "path": "/api/v1/human-resources/recruitment-approval-configs",
            "stage": "department_head",
            "apply_position": "运营专员",
            "approver_user_ids": [approval_config_approver_ids["department_manager"]],
        },
        {
            "path": "/api/v1/human-resources/regularization-approval-configs",
            "stage": "department_head",
            "apply_position": "运营专员",
            "approver_user_ids": [approval_config_approver_ids["department_manager"]],
        },
        {
            "path": "/api/v1/human-resources/social-insurance-approval-configs",
            "stage": "department_head",
            "apply_position": "运营专员",
            "approver_user_ids": [approval_config_approver_ids["department_manager"]],
        },
        {
            "path": "/api/v1/human-resources/promotion-approval-configs",
            "stage": "department_manager",
            "apply_position": "运营专员",
            "approver_user_ids": [approval_config_approver_ids["department_manager"]],
        },
    ]
    for case in config_cases:
        created = _put(
            auth_session,
            server_url,
            case["path"],
            {
                "campus": "最高议事厅",
                "apply_department": "运营部",
                "apply_position": case["apply_position"],
                "stage": case["stage"],
                "approver_user_ids": case["approver_user_ids"],
                "is_active": True,
            },
        ).json()
        config_id = int(created["id"])
        listed = _get(auth_session, server_url, case["path"]).json()
        assert any(int(row["id"]) == config_id for row in listed)
        _delete(auth_session, server_url, f"{case['path']}/{config_id}")

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/recruitment-requests/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    recruitment = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/recruitment-requests",
        {
            "campus": "最高议事厅",
            "apply_date": "2026-03-10",
            "department": "运营部",
            "position": "运营主管",
            "headcount": 1,
            "reason": "扩编",
            "expected_date": "2026-03-20",
            "selected_approver_user_ids": {},
        },
    ).json()
    recruitment_id = int(recruitment["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/recruitment-requests", recruitment_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/recruitment-requests/{recruitment_id}",
        {"reason": "业务增长扩编"},
    ).json()["reason"] == "业务增长扩编"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/training-applications/approver-preview",
            {
                "campus": "最高议事厅",
                "department": "运营部",
                "category": "业务",
                "is_internal_training": True,
                "is_key_staff_training": False,
                "total_amount": 1000,
            },
        ).json(),
        list,
    )
    training = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/training-applications",
        {
            "campus": "最高议事厅",
            "department": "运营部",
            "category": "业务",
            "objective": "提升转化",
            "trainees": "运营部全员",
            "content": "客户接待流程",
            "start_date": "2026-03-20",
            "end_date": "2026-03-20",
            "total_hours": 3,
            "training_format": "线下",
            "exam_method": "理论",
            "trainer": "讲师A",
            "cost_per_person": 100,
            "cost_count": 10,
            "cost_total": 1000,
            "cost_other": 0,
            "is_internal_training": True,
            "is_key_staff_training": False,
            "remark": "pytest training",
            "selected_approver_user_ids": {},
        },
    ).json()
    training_id = int(training["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/training-applications", training_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/training-applications/{training_id}",
        {"remark": "pytest training updated"},
    ).json()["remark"] == "pytest training updated"

    work_report_text = "负责运营流程梳理跨部门协作数据复盘并持续优化执行效率和落地标准" * 6
    assert _get(auth_session, server_url, "/api/v1/human-resources/work-reports/my-status").json()[
        "has_completed_report"
    ] is False
    work_report = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/work-reports",
        {
            "report_date": "2026-03-10",
            "work_description": work_report_text,
            "difficulties": work_report_text,
            "achievements": work_report_text,
            "improvements": work_report_text,
            "future_plan": work_report_text,
        },
    ).json()
    work_report_id = int(work_report["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/work-reports", work_report_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/work-reports/{work_report_id}",
        {"future_plan": work_report_text + "继续完善跨部门协作机制并输出稳定流程"},
    ).json()["future_plan"].startswith(work_report_text)
    assert _get(auth_session, server_url, "/api/v1/human-resources/work-reports/my-status").json()[
        "has_completed_report"
    ] is True

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/regularization-applications/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    regularization = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/regularization-applications",
        {
            "fill_date": "2026-03-10",
            "campus": "最高议事厅",
            "name": "转正员工甲",
            "department": "运营部",
            "position": "运营主管",
            "gender": "女",
            "entry_date": "2025-12-01",
            "regular_salary": 9000,
            "probation_start": "2025-12-01",
            "probation_end": "2026-03-01",
            "probation_salary": 7000,
            "main_work": "负责运营测试",
            "suggestion": "建议转正",
            "self_evaluation": "表现良好",
            "selected_approver_user_ids": {},
        },
    ).json()
    regularization_id = int(regularization["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/regularization-applications", regularization_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/regularization-applications/{regularization_id}",
        {"suggestion": "建议提前调级"},
    ).json()["suggestion"] == "建议提前调级"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/social-insurance-applications/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    social = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/social-insurance-applications",
        {
            "fill_date": "2026-03-10",
            "campus": "最高议事厅",
            "account_no": "SI-HTTP-001",
            "name": "社保员工甲",
            "department": "运营部",
            "position": "运营主管",
            "phone": "13800010002",
            "id_number": "130101199001010010",
            "household_type": "城镇",
            "id_expiry": "长期",
            "hire_date": "2025-12-01",
            "registered_address": "石家庄测试地址",
            "insurance_type": "新参保",
            "remark": "pytest social",
            "selected_approver_user_ids": {},
        },
    ).json()
    social_id = int(social["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/social-insurance-applications", social_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/social-insurance-applications/{social_id}",
        {"remark": "pytest social updated"},
    ).json()["remark"] == "pytest social updated"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/promotion-applications/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    promotion = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/promotion-applications",
        {
            "fill_date": "2026-03-10",
            "campus": "最高议事厅",
            "name": "晋升员工甲",
            "native_place": "河北",
            "age": 28,
            "entry_date": "2025-01-10",
            "department": "运营部",
            "position": "运营主管",
            "work_overview": "负责关键运营项目",
            "promotion_reason": "业绩突出",
            "confidence_and_expectation": "可以带团队",
            "original_level": "P2",
            "original_salary": 8000,
            "promoted_level": "P3",
            "promoted_salary": 10000,
            "selected_approver_user_ids": {},
        },
    ).json()
    promotion_id = int(promotion["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/promotion-applications", promotion_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/promotion-applications/{promotion_id}",
        {"promoted_salary": 10500},
    ).json()["promoted_salary"] == 10500

    _delete(auth_session, server_url, f"/api/v1/human-resources/promotion-applications/{promotion_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/social-insurance-applications/{social_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/regularization-applications/{regularization_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/work-reports/{work_report_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/training-applications/{training_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/recruitment-requests/{recruitment_id}")


def test_remaining_application_endpoints(auth_session: requests.Session, server_url: str):
    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/transfer-applications/approver-preview",
            {
                "campus": "最高议事厅",
                "department": "运营部",
                "position": "运营主管",
                "target_department": "市场部",
                "target_position": "市场主管",
            },
        ).json(),
        list,
    )
    transfer = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/transfer-applications",
        {
            "apply_date": "2026-03-10",
            "campus": "最高议事厅",
            "name": "调岗员工甲",
            "department": "运营部",
            "position": "运营主管",
            "entry_date": "2025-01-10",
            "original_salary": 8000,
            "target_department": "市场部",
            "target_position": "市场主管",
            "new_salary": 9000,
            "reason": "业务需要",
            "applicant_name": "pytest",
            "selected_approver_user_ids": {},
        },
    ).json()
    transfer_id = int(transfer["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/transfer-applications", transfer_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/transfer-applications/{transfer_id}",
        {"reason": "部门协同需要"},
    ).json()["reason"] == "部门协同需要"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/unpaid-leave-applications/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    unpaid = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/unpaid-leave-applications",
        {
            "fill_date": "2026-03-10",
            "campus": "最高议事厅",
            "name": "停薪员工甲",
            "gender": "男",
            "department": "运营部",
            "position": "运营主管",
            "entry_date": "2025-01-10",
            "birth_date": "1998-01-01",
            "phone": "13800010003",
            "email": "pytest@example.com",
            "home_address": "户籍地",
            "current_address": "现住址",
            "reason": "个人安排",
            "selected_approver_user_ids": {},
        },
    ).json()
    unpaid_id = int(unpaid["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/unpaid-leave-applications", unpaid_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/unpaid-leave-applications/{unpaid_id}",
        {"reason": "家庭安排"},
    ).json()["reason"] == "家庭安排"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/resignation-approvals/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    resignation = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/resignation-approvals",
        {
            "fill_date": "2026-03-10",
            "campus": "最高议事厅",
            "name": "离职员工甲",
            "gender": "女",
            "department": "运营部",
            "position": "运营主管",
            "entry_date": "2025-01-10",
            "contract_end_date": "2026-12-31",
            "leave_date": "2026-03-31",
            "leave_type": "主动离职",
            "reason": "个人发展",
            "employee_sign": "离职员工甲",
            "employee_sign_date": "2026-03-10",
            "selected_approver_user_ids": {},
        },
    ).json()
    resignation_id = int(resignation["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/resignation-approvals", resignation_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/resignation-approvals/{resignation_id}",
        {"reason": "职业调整"},
    ).json()["reason"] == "职业调整"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/appointment-interview-records/approver-preview",
            {"campus": "最高议事厅"},
        ).json(),
        list,
    )
    appointment = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/appointment-interview-records",
        {
            "campus": "最高议事厅",
            "interviewer": "访谈官",
            "interviewee": "候选干部",
            "location": "办公室",
            "interview_date": "2026-03-10",
            "answers": ["回答1", "回答2"],
            "suggestions": "建议任命",
            "self_sign": {"opinion": "同意", "signer": "候选干部", "sign_date": "2026-03-10"},
            "selected_approver_user_ids": {},
        },
    ).json()
    appointment_id = int(appointment["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/appointment-interview-records", appointment_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/appointment-interview-records/{appointment_id}",
        {"suggestions": "建议进一步培养"},
    ).json()["suggestions"] == "建议进一步培养"

    assert isinstance(
        _post(
            auth_session,
            server_url,
            "/api/v1/human-resources/work-handovers/approver-preview",
            {"campus": "最高议事厅", "department": "运营部", "position": "运营主管"},
        ).json(),
        list,
    )
    work_handover = _post(
        auth_session,
        server_url,
        "/api/v1/human-resources/work-handovers",
        {
            "campus": "最高议事厅",
            "name": "交接员工甲",
            "department": "运营部",
            "position": "运营主管",
            "entry_date": "2025-01-10",
            "phone": "13800010004",
            "email": "handover@example.com",
            "leave_date": "2026-03-31",
            "leave_type": "主动离职",
            "leave_reason": ["个人发展"],
            "address": "石家庄测试地址",
            "dept_handover": {"work_handover": "业务交接中", "receiver": "接收人甲"},
            "finance_handover": {"finance_items": "发票提交", "cashier_sign": "出纳甲"},
            "hr_handover": {"fixed_assets": "电脑1台", "receiver": "人资甲"},
            "all_completed": False,
            "selected_approver_user_ids": {},
        },
    ).json()
    work_handover_id = int(work_handover["id"])
    _assert_list_contains(auth_session, server_url, "/api/v1/human-resources/work-handovers", work_handover_id)
    assert _put(
        auth_session,
        server_url,
        f"/api/v1/human-resources/work-handovers/{work_handover_id}",
        {"all_completed": True},
    ).json()["all_completed"] is True

    _delete(auth_session, server_url, f"/api/v1/human-resources/work-handovers/{work_handover_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/appointment-interview-records/{appointment_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/resignation-approvals/{resignation_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/unpaid-leave-applications/{unpaid_id}")
    _delete(auth_session, server_url, f"/api/v1/human-resources/transfer-applications/{transfer_id}")
