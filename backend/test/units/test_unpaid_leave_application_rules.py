from __future__ import annotations

from typing import cast

from sqlalchemy.orm import Session

from app.crud.human_resources import unpaid_leave_application as unpaid_leave_crud
from app.models.human_resources.unpaid_leave_application import UnpaidLeaveApplication
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


FAKE_DB = cast(Session, object())


def test_management_center_market_department_head_candidates_follow_market_manager_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
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
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [2]


def test_management_center_finance_department_head_candidates_follow_finance_director_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="最高议事厅",
        department="神藏司",
        position="会计",
        created_by_user_id=4,
    )
    users = [
        _make_user(5, "财务总监", "神藏司", "神藏司总监", "最高议事厅"),
        _make_user(6, "财务经理", "神藏司", "神藏司经理", "最高议事厅"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [5]


def test_management_center_hr_department_head_candidates_follow_hr_director_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="最高议事厅",
        department="人资部",
        position="人资专员",
        created_by_user_id=7,
    )
    users = [
        _make_user(8, "人资总监", "人资部", "人资部总监", "最高议事厅"),
        _make_user(9, "行政总监", "行政部", "行政总监", "最高议事厅"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [8]


def test_principal_position_department_head_candidates_follow_operations_director_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="河北主神殿",
        department="校长室",
        position="校长",
        created_by_user_id=10,
    )
    users = [
        _make_user(11, "运营总监", "运营部", "运营总监", "最高议事厅"),
        _make_user(12, "校长", "校长室", "校长", "河北主神殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [11]


def test_academic_vice_principal_department_head_candidates_follow_academic_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="河北主神殿",
        department="智慧司",
        position="学术副校长",
        created_by_user_id=13,
    )
    users = [
        _make_user(14, "学术副经理", "智慧司", "智慧司副经理", "最高议事厅"),
        _make_user(15, "运营总监", "运营部", "运营总监", "最高议事厅"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [14]


def test_teaching_quality_vice_principal_department_head_candidates_follow_teaching_quality_director_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="河北主神殿",
        department="教化司",
        position="教质副校长",
        created_by_user_id=16,
    )
    users = [
        _make_user(17, "教质总监", "教化司", "教质总监", "最高议事厅"),
        _make_user(18, "运营总监", "运营部", "运营总监", "最高议事厅"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [17]


def test_shengbang_consult_department_head_candidates_follow_frontend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=19,
    )
    users = [
        _make_user(20, "前端副校长", "祈福司", "前端副校长", "河北主神殿"),
        _make_user(21, "分析规划师主管", "祈福司", "分析规划师主管", "河北主神殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [20]


def test_jimei_academic_department_head_candidates_follow_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="河北永恒殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=22,
    )
    users = [
        _make_user(23, "学术副经理", "智慧司", "智慧司副经理", "河北永恒殿"),
        _make_user(24, "学术经理", "智慧司", "智慧司经理", "河北永恒殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [23]


def test_shimei_teaching_quality_department_head_candidates_follow_vice_principal_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="河北慈悲殿",
        department="教化司",
        position="教质老师",
        created_by_user_id=25,
    )
    users = [
        _make_user(26, "副校长", "教化司", "副校长", "河北慈悲殿"),
        _make_user(27, "教质经理", "教化司", "教化司经理", "河北慈悲殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [26]


def test_jinmei_channel_department_head_candidates_follow_principal_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="山西李大殿",
        department="渠道部",
        position="渠道专员",
        created_by_user_id=28,
    )
    users = [
        _make_user(29, "校长", "校长室", "校长", "山西李大殿"),
        _make_user(30, "渠道经理", "渠道部", "渠道部经理", "山西李大殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [29]


def test_taimei_academic_department_head_candidates_follow_backend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="山西光明殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=31,
    )
    users = [
        _make_user(32, "后端副校长", "校长室", "后端副校长", "山西光明殿"),
        _make_user(33, "学术经理", "智慧司", "智慧司经理", "山西光明殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [32]


def test_guimei_channel_department_head_candidates_follow_principal_rule(
    monkeypatch,
) -> None:
    record = UnpaidLeaveApplication(
        campus="广西神恩殿",
        department="渠道部",
        position="渠道专员",
        created_by_user_id=34,
    )
    users = [
        _make_user(35, "校长", "校长室", "校长", "广西神恩殿"),
        _make_user(36, "渠道经理", "渠道部", "渠道部经理", "广西神恩殿"),
    ]

    monkeypatch.setattr(
        unpaid_leave_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = unpaid_leave_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [35]