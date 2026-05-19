from __future__ import annotations

from typing import cast

from app.crud.human_resources import social_insurance_application as social_insurance_crud
from app.models.human_resources.social_insurance_application import SocialInsuranceApplication
from app.models.user import User, UserRole, UserStatus
from sqlalchemy.orm import Session


def _make_user(
    *,
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


class _FakeQuery:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def filter(self, *_args, **_kwargs) -> "_FakeQuery":
        return self

    def all(self) -> list[User]:
        return list(self._users)


FAKE_DB = cast(Session, object())


def test_management_center_market_flow_uses_department_head_hr_then_chairman() -> None:
    record = SocialInsuranceApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
    )

    assert social_insurance_crud.get_flow_stages(record, db=None) == ["department_head", "hr", "chairman"]


def test_management_center_market_department_head_candidates_follow_department_rule(monkeypatch) -> None:
    record = SocialInsuranceApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        created_by_user_id=1,
    )
    users = [
        _make_user(user_id=2, real_name="市场经理", department="市场部", position="市场部经理", campus="最高议事厅"),
        _make_user(user_id=3, real_name="市场副经理", department="市场部", position="市场部副经理", campus="最高议事厅"),
        _make_user(user_id=4, real_name="财务总监", department="神藏司", position="神藏司总监", campus="最高议事厅"),
    ]

    monkeypatch.setattr(
        social_insurance_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        social_insurance_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = social_insurance_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [2]


def test_management_center_chairman_candidates_only_include_chairman(monkeypatch) -> None:
    record = SocialInsuranceApplication(
        campus="最高议事厅",
        department="运营部",
        position="运营专员",
        created_by_user_id=10,
    )
    users = [
        _make_user(user_id=11, real_name="董事长", department="董事办", position="董事长", campus="最高议事厅"),
        _make_user(user_id=12, real_name="校长", department="校务部", position="校长", campus="最高议事厅"),
    ]

    monkeypatch.setattr(
        social_insurance_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        social_insurance_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = social_insurance_crud.get_stage_candidate_users(FAKE_DB, record, "chairman")

    assert [item.user_id for item in candidates] == [11]


def test_shengbang_academic_flow_uses_department_head_hr_then_principal() -> None:
    record = SocialInsuranceApplication(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
    )

    assert social_insurance_crud.get_flow_stages(record, db=None) == ["department_head", "hr", "principal"]


def test_shengbang_academic_department_head_candidates_follow_department_rule(monkeypatch) -> None:
    record = SocialInsuranceApplication(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=20,
    )
    users = [
        _make_user(user_id=21, real_name="学术经理", department="智慧司", position="智慧司经理", campus="河北主神殿"),
        _make_user(user_id=22, real_name="教质经理", department="教化司", position="教化司经理", campus="河北主神殿"),
    ]

    monkeypatch.setattr(
        social_insurance_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        social_insurance_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = social_insurance_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [21]


def test_jimei_consult_department_head_candidates_follow_department_rule(monkeypatch) -> None:
    record = SocialInsuranceApplication(
        campus="河北永恒殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=30,
    )
    users = [
        _make_user(user_id=31, real_name="分析规划师主管", department="祈福司", position="分析规划师主管", campus="河北永恒殿"),
        _make_user(user_id=32, real_name="渠道经理", department="渠道部", position="渠道部经理", campus="河北永恒殿"),
    ]

    monkeypatch.setattr(
        social_insurance_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        social_insurance_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = social_insurance_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [31]


def test_yuanmei_academic_manager_skips_department_head_to_avoid_self_approval() -> None:
    record = SocialInsuranceApplication(
        campus="山西智慧阁",
        department="智慧司",
        position="智慧司经理",
    )

    assert social_insurance_crud.get_flow_stages(record, db=None) == ["hr", "principal"]


def test_branch_principal_candidates_only_include_campus_principal(monkeypatch) -> None:
    record = SocialInsuranceApplication(
        campus="广西神恩殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=40,
    )
    users = [
        _make_user(user_id=41, real_name="校长", department="神殿", position="校长", campus="广西神恩殿"),
        _make_user(user_id=42, real_name="后端副校长", department="神殿", position="后端副校长", campus="广西神恩殿"),
        _make_user(user_id=43, real_name="外校校长", department="神殿", position="校长", campus="山西智慧阁"),
    ]

    monkeypatch.setattr(
        social_insurance_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        social_insurance_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = social_insurance_crud.get_stage_candidate_users(FAKE_DB, record, "principal")

    assert [item.user_id for item in candidates] == [41]
