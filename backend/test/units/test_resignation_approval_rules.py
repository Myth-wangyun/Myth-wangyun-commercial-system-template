from __future__ import annotations

from datetime import date
from typing import cast

from sqlalchemy.orm import Session

from app.crud.human_resources import resignation_approval as resignation_approval_crud
from app.models.human_resources.resignation_approval import ResignationApproval
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


def _make_record(
    *,
    campus: str,
    department: str,
    position: str,
    created_by_user_id: int = 1,
) -> ResignationApproval:
    return ResignationApproval(
        fill_date=date(2026, 4, 1),
        campus=campus,
        department=department,
        position=position,
        name="申请人",
        leave_date=date(2026, 4, 1),
        leave_type="辞职",
        reason="个人发展",
        created_by_user_id=created_by_user_id,
    )


def test_management_center_market_department_head_candidates_follow_market_manager_rule(
    monkeypatch,
) -> None:
    record = _make_record(campus="最高议事厅", department="市场部", position="市场专员")
    users = [
        _make_user(2, "市场经理", "市场部", "市场部经理", "最高议事厅"),
        _make_user(3, "市场副经理", "市场部", "市场部副经理", "最高议事厅"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = resignation_approval_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_head",
    )

    assert [item.user_id for item in candidates] == [2]


def test_shengbang_consult_department_head_candidates_follow_frontend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = _make_record(campus="河北主神殿", department="祈福司", position="咨询师")
    users = [
        _make_user(4, "李金雷", "祈福司", "前端副校长", "河北主神殿"),
        _make_user(5, "咨询主管", "祈福司", "咨询主管", "河北主神殿"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = resignation_approval_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_head",
    )

    assert [item.user_id for item in candidates] == [4]


def test_academic_vice_principal_department_head_candidates_follow_academic_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = _make_record(campus="河北主神殿", department="智慧司", position="学术副校长")
    users = [
        _make_user(6, "杜鹏涛", "智慧司", "智慧司副经理", "最高议事厅"),
        _make_user(7, "运营总监", "运营部", "运营总监", "最高议事厅"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = resignation_approval_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_head",
    )

    assert [item.user_id for item in candidates] == [6]


def test_teaching_quality_vice_principal_department_head_candidates_follow_teaching_quality_director_rule(
    monkeypatch,
) -> None:
    record = _make_record(campus="河北主神殿", department="教化司", position="教质副校长")
    users = [
        _make_user(8, "孙宏岩", "教化司", "教质总监", "最高议事厅"),
        _make_user(9, "副校长", "教化司", "副校长", "河北主神殿"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = resignation_approval_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_head",
    )

    assert [item.user_id for item in candidates] == [8]


def test_hr_candidates_follow_management_center_hr_director_rule(monkeypatch) -> None:
    record = _make_record(campus="河北主神殿", department="祈福司", position="咨询师")
    users = [
        _make_user(10, "管璇", "人资行政部", "人资总监", "最高议事厅"),
        _make_user(11, "刘洁琼", "人资行政部", "人资部主管", "最高议事厅"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = resignation_approval_crud.get_stage_candidate_users(FAKE_DB, record, "hr")

    assert [item.user_id for item in candidates] == [10]


def test_principal_candidates_follow_same_campus_positive_principal_rule(monkeypatch) -> None:
    record = _make_record(campus="河北主神殿", department="祈福司", position="咨询师")
    users = [
        _make_user(12, "靳月莲", "校办", "校长", "河北主神殿"),
        _make_user(13, "李金雷", "祈福司", "前端副校长", "河北主神殿"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = resignation_approval_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "principal",
    )

    assert [item.user_id for item in candidates] == [12]


def test_flow_stages_for_branch_employee_end_at_principal() -> None:
    record = _make_record(campus="河北主神殿", department="祈福司", position="咨询师")

    assert resignation_approval_crud.get_flow_stages(record) == [
        "department_head",
        "hr",
        "principal",
    ]


def test_flow_stages_for_management_center_employee_end_at_chairman() -> None:
    record = _make_record(campus="最高议事厅", department="人资行政部", position="专员")

    assert resignation_approval_crud.get_flow_stages(record) == [
        "department_head",
        "hr",
        "chairman",
    ]


def test_flow_stages_for_positive_principal_use_operations_then_chairman() -> None:
    record = _make_record(campus="河北主神殿", department="祈福司", position="校长")

    assert resignation_approval_crud.get_flow_stages(record) == [
        "operations_reviewer",
        "chairman",
    ]


def test_flow_preview_for_finance_department_skips_principal_and_includes_chairman(
    monkeypatch,
) -> None:
    users = [
        _make_user(14, "财务总监", "神藏司", "神藏司总监", "最高议事厅"),
        _make_user(15, "管璇", "人资行政部", "人资总监", "最高议事厅"),
        _make_user(16, "王总", "董事办", "董事长", "最高议事厅"),
    ]

    monkeypatch.setattr(
        resignation_approval_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    preview = resignation_approval_crud.build_approver_candidate_preview(
        FAKE_DB,
        campus="河北主神殿",
        department="神藏司",
        position="出纳",
        created_by_user_id=99,
    )

    assert [item["stage"] for item in preview] == ["department_head", "hr", "chairman"]
    assert preview[0]["recommended_user_ids"] == [14]
    assert preview[1]["recommended_user_ids"] == [15]
    assert preview[2]["recommended_user_ids"] == [16]