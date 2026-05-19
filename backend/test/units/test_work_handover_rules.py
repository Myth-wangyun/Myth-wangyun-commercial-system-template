from __future__ import annotations

import json
from datetime import date
from typing import cast

from sqlalchemy.orm import Session

from app.crud.human_resources import work_handover as work_handover_crud
from app.models.human_resources.work_handover import WorkHandover
from app.models.user import User, UserRole, UserStatus


def _make_user(
    user_id: int,
    real_name: str,
    department: str,
    position: str,
    campus: str,
) -> User:
    return User(
        user_id=user_id,
        username=f"user_{user_id}",
        password_hash="x",
        real_name=real_name,
        department=department,
        position=position,
        campus=campus,
        role=UserRole.STAFF,
        status=UserStatus.ACTIVE,
        is_superuser=False,
    )


class _FakeUserQuery:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def filter(self, *args, **kwargs) -> "_FakeUserQuery":
        del args, kwargs
        return self

    def all(self) -> list[User]:
        return self._users


class _FakeSession:
    def add(self, obj) -> None:
        if getattr(obj, "id", None) is None:
            setattr(obj, "id", 1)

    def commit(self) -> None:
        return None

    def refresh(self, obj) -> None:
        del obj
        return None


FAKE_DB = cast(Session, object())


def test_management_center_market_department_head_candidates_follow_market_manager_rule(
    monkeypatch,
) -> None:
    record = WorkHandover(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        created_by_user_id=1,
    )
    users = [
        _make_user(2, "市场经理", "市场部", "市场部经理", "最高议事厅"),
        _make_user(3, "市场副经理", "市场部", "市场部副经理", "最高议事厅"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = work_handover_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [2]


def test_shengbang_consult_department_head_candidates_follow_frontend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = WorkHandover(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=4,
    )
    users = [
        _make_user(5, "前端副校长", "祈福司", "前端副校长", "河北主神殿"),
        _make_user(6, "分析规划师主管", "祈福司", "分析规划师主管", "河北主神殿"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = work_handover_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [5]


def test_academic_vice_principal_department_head_candidates_follow_academic_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = WorkHandover(
        campus="河北主神殿",
        department="智慧司",
        position="学术副校长",
        created_by_user_id=7,
    )
    users = [
        _make_user(8, "学术副经理", "智慧司", "智慧司副经理", "最高议事厅"),
        _make_user(9, "运营总监", "运营部", "运营总监", "最高议事厅"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = work_handover_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [8]


def test_shimei_teaching_quality_department_head_candidates_follow_vice_principal_rule(
    monkeypatch,
) -> None:
    record = WorkHandover(
        campus="河北慈悲殿",
        department="教化司",
        position="教质老师",
        created_by_user_id=10,
    )
    users = [
        _make_user(11, "副校长", "教化司", "副校长", "河北慈悲殿"),
        _make_user(12, "教质经理", "教化司", "教化司经理", "河北慈悲殿"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = work_handover_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [11]


def test_finance_preview_market_employee_uses_management_center_finance_director(
    monkeypatch,
) -> None:
    users = [
        _make_user(13, "财务总监", "神藏司", "神藏司总监", "最高议事厅"),
        _make_user(14, "盛邦出纳", "神藏司", "出纳", "河北主神殿"),
        _make_user(15, "刘洁琼", "人资行政部", "人资部主管", "最高议事厅"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    preview = work_handover_crud.build_form_assignee_preview(
        FAKE_DB,
        campus="河北主神殿",
        department="市场部",
        position="市场专员",
        created_by_user_id=15,
    )

    assert preview["finance_cashier"]["recommended_name"] == "财务总监"
    assert preview["finance_manager"]["recommended_name"] == "财务总监"
    assert preview["hr_receiver"]["recommended_name"] == "刘洁琼"
    assert preview["principal_sign_required"] is False


def test_finance_preview_branch_consult_employee_uses_same_campus_finance_specialist(
    monkeypatch,
) -> None:
    users = [
        _make_user(16, "财务总监", "神藏司", "神藏司总监", "最高议事厅"),
        _make_user(17, "盛邦出纳", "神藏司", "出纳", "河北主神殿"),
        _make_user(18, "冀美会计", "神藏司", "会计", "河北永恒殿"),
        _make_user(19, "刘洁琼", "人资行政部", "人事主管", "最高议事厅"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    preview = work_handover_crud.build_form_assignee_preview(
        FAKE_DB,
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=20,
    )

    assert preview["finance_cashier"]["recommended_name"] == "盛邦出纳"
    assert preview["finance_manager"]["recommended_name"] == "盛邦出纳"
    assert preview["hr_receiver"]["recommended_name"] == "刘洁琼"
    assert preview["principal_sign_required"] is True


def test_finance_preview_branch_finance_employee_uses_management_center_finance_director(
    monkeypatch,
) -> None:
    users = [
        _make_user(20, "财务总监", "神藏司", "神藏司总监", "最高议事厅"),
        _make_user(21, "盛邦出纳", "神藏司", "出纳", "河北主神殿"),
    ]

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    preview = work_handover_crud.build_form_assignee_preview(
        FAKE_DB,
        campus="河北主神殿",
        department="神藏司",
        position="出纳",
        created_by_user_id=22,
    )

    assert preview["finance_cashier"]["recommended_name"] == "财务总监"
    assert preview["finance_manager"]["recommended_name"] == "财务总监"


def test_create_application_autofills_department_receiver_and_finance_signatures_when_blank(
    monkeypatch,
) -> None:
    current_user = _make_user(30, "申请人", "祈福司", "咨询师", "河北主神殿")
    users = [
        _make_user(31, "前端副校长", "祈福司", "前端副校长", "河北主神殿"),
        _make_user(32, "盛邦出纳", "神藏司", "出纳", "河北主神殿"),
        _make_user(33, "刘洁琼", "人资行政部", "人资部主管", "最高议事厅"),
    ]
    payload = work_handover_crud.WorkHandoverCreate(
        campus="河北主神殿",
        name="申请人",
        department="祈福司",
        position="咨询师",
        leave_date=date(2026, 4, 1),
        leave_reason=["个人发展"],
        dept_handover={
            "work_handover": "交接内容",
            "receiver": "",
        },
        finance_handover={
            "finance_items": "发票交接",
            "cashier_sign": "",
            "manager_sign": "",
        },
        hr_handover={
            "fixed_assets": "电脑1台",
            "receiver": "",
        },
        all_completed=False,
        selected_approver_user_ids={},
    )

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )
    monkeypatch.setattr(
        work_handover_crud,
        "get_application",
        lambda db, application_id: None,
    )

    record = work_handover_crud.create_application(
        cast(Session, _FakeSession()),
        payload,
        current_user,
    )

    dept_handover = json.loads(record.dept_handover_json)
    finance_handover = json.loads(record.finance_handover_json)
    hr_handover = json.loads(record.hr_handover_json)

    assert dept_handover["receiver"] == "前端副校长"
    assert finance_handover["cashier_sign"] == "盛邦出纳"
    assert finance_handover["manager_sign"] == "盛邦出纳"
    assert hr_handover["receiver"] == "刘洁琼"


def test_create_application_clears_principal_sign_when_scope_is_exempt(
    monkeypatch,
) -> None:
    current_user = _make_user(40, "申请人", "市场部", "市场专员", "最高议事厅")
    users = [
        _make_user(41, "市场经理", "市场部", "市场部经理", "最高议事厅"),
        _make_user(42, "财务总监", "神藏司", "神藏司总监", "最高议事厅"),
        _make_user(43, "刘洁琼", "人资行政部", "人资部主管", "最高议事厅"),
    ]
    payload = work_handover_crud.WorkHandoverCreate(
        campus="最高议事厅",
        name="申请人",
        department="市场部",
        position="市场专员",
        leave_date=date(2026, 4, 1),
        leave_reason=["个人发展"],
        dept_handover={
            "work_handover": "交接内容",
            "receiver": "",
        },
        finance_handover={
            "finance_items": "财务交接",
            "cashier_sign": "",
            "manager_sign": "",
        },
        hr_handover={
            "fixed_assets": "门禁卡",
            "receiver": "",
        },
        all_completed=True,
        principal_sign="校长签字",
        principal_date=date(2026, 4, 2),
        selected_approver_user_ids={},
    )

    monkeypatch.setattr(
        work_handover_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )
    monkeypatch.setattr(
        work_handover_crud,
        "get_application",
        lambda db, application_id: None,
    )

    record = work_handover_crud.create_application(
        cast(Session, _FakeSession()),
        payload,
        current_user,
    )

    assert record.principal_sign is None
    assert record.principal_date is None