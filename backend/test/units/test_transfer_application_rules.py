from __future__ import annotations

from datetime import date
from typing import cast

import pytest
from sqlalchemy.orm import Session

from app.crud.human_resources import transfer_application as transfer_crud
from app.models.human_resources.transfer_application import TransferApplication
from app.models.user import User, UserRole, UserStatus


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


FAKE_DB = cast(Session, object())


class _FakeSession:
    def add(self, obj) -> None:
        if getattr(obj, "id", None) is None:
            setattr(obj, "id", 1)

    def commit(self) -> None:
        return None

    def refresh(self, obj) -> None:
        del obj
        return None


class _FakeUserQuery:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def filter(self, *args, **kwargs) -> "_FakeUserQuery":
        del args, kwargs
        return self

    def all(self) -> list[User]:
        return self._users


def test_required_new_salary_must_be_complete_before_approval() -> None:
    record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        new_salary=None,
    )

    validate_required_salary_fields = getattr(
        transfer_crud,
        "_validate_required_salary_fields",
    )

    with pytest.raises(ValueError, match="调出部门主管审批前请先填写：新工资"):
        validate_required_salary_fields(record, "out_department_manager")


def test_market_and_hr_targets_skip_biz_director_stage() -> None:
    market_record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="市场部",
        target_position="市场专员",
    )
    hr_record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="人资行政部",
        target_position="人资专员",
    )

    assert "biz_director" not in transfer_crud.get_flow_stages(market_record)
    assert "biz_director" not in transfer_crud.get_flow_stages(hr_record)


def test_finance_biz_director_candidates_follow_finance_director_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="神藏司",
        target_position="会计",
        created_by_user_id=60,
    )
    users = [
        _make_user(
            user_id=61,
            real_name="财务总监",
            department="神藏司",
            position="神藏司总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=62,
            real_name="财务经理",
            department="神藏司",
            position="神藏司经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=63,
            real_name="运营总监",
            department="运营部",
            position="运营总监",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = transfer_crud.get_stage_candidate_users(FAKE_DB, record, "biz_director")

    assert [item.user_id for item in candidates] == [61]


def test_academic_biz_director_candidates_follow_academic_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北永恒殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=64,
    )
    users = [
        _make_user(
            user_id=65,
            real_name="学术副经理",
            department="智慧司",
            position="智慧司副经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=66,
            real_name="学术总监",
            department="智慧司",
            position="智慧司总监",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = transfer_crud.get_stage_candidate_users(FAKE_DB, record, "biz_director")

    assert [item.user_id for item in candidates] == [65]


def test_consult_target_biz_director_candidates_follow_operations_director_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北慈悲殿",
        department="智慧司",
        position="讲师",
        target_department="祈福司",
        target_position="咨询师",
        created_by_user_id=67,
    )
    users = [
        _make_user(
            user_id=68,
            real_name="运营总监",
            department="运营部",
            position="运营总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=69,
            real_name="咨询总监",
            department="祈福司",
            position="祈福司总监",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    candidates = transfer_crud.get_stage_candidate_users(FAKE_DB, record, "biz_director")

    assert [item.user_id for item in candidates] == [68]


def test_hr_review_stages_follow_hr_director_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=70,
    )
    users = [
        _make_user(
            user_id=71,
            real_name="人资总监",
            department="人资部",
            position="人资部总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=72,
            real_name="行政总监",
            department="行政部",
            position="行政总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=73,
            real_name="人资经理",
            department="人资部",
            position="人资部经理",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_base_active_user_query",
        lambda db: _FakeUserQuery(users),
    )

    first_review_candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "hr_first_review",
    )
    final_review_candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "hr_final_review",
    )

    assert [item.user_id for item in first_review_candidates] == [71]
    assert [item.user_id for item in final_review_candidates] == [71]


def test_create_application_rejects_reason_shorter_than_30_characters(
    monkeypatch,
) -> None:
    current_user = _make_user(
        user_id=100,
        real_name="申请人",
        department="祈福司",
        position="咨询师",
        campus="河北主神殿",
    )
    payload = transfer_crud.TransferApplicationCreate(
        apply_date=date(2026, 3, 31),
        campus="河北主神殿",
        name="申请人",
        department="祈福司",
        position="咨询师",
        entry_date=date(2024, 6, 1),
        target_department="智慧司",
        target_position="讲师",
        reason="调岗原因说明太短",
        applicant_name="申请人",
        selected_approver_user_ids={},
    )

    monkeypatch.setattr(
        transfer_crud,
        "_set_selected_approver_user_ids",
        lambda db, record, value: {},
    )
    monkeypatch.setattr(
        transfer_crud,
        "get_application",
        lambda db, application_id: None,
    )

    with pytest.raises(ValueError, match="调岗原因不少于30字"):
        transfer_crud.create_application(
            cast(Session, _FakeSession()),
            payload,
            current_user,
        )


def test_submit_application_rejects_reason_shorter_than_30_characters(
    monkeypatch,
) -> None:
    current_user = _make_user(
        user_id=101,
        real_name="申请人",
        department="祈福司",
        position="咨询师",
        campus="河北主神殿",
    )
    record = TransferApplication(
        id=1,
        status="draft",
        campus="河北主神殿",
        name="申请人",
        department="祈福司",
        position="咨询师",
        entry_date=date(2024, 6, 1),
        target_department="智慧司",
        target_position="讲师",
        reason="字数不足的调岗原因",
        created_by_user_id=current_user.user_id,
    )

    monkeypatch.setattr(
        transfer_crud,
        "validate_full_approval_chain",
        lambda db, current_record: [],
    )

    with pytest.raises(ValueError, match="调岗原因不少于30字"):
        transfer_crud.submit_application(
            cast(Session, _FakeSession()),
            record,
            current_user,
        )


def test_management_center_finance_out_department_manager_candidates_follow_director_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="最高议事厅",
        department="神藏司",
        position="会计",
        target_department="运营部",
        target_position="运营专员",
        created_by_user_id=1,
    )
    users = [
        _make_user(
            user_id=2,
            real_name="财务总监",
            department="神藏司",
            position="神藏司总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=3,
            real_name="财务经理",
            department="神藏司",
            position="神藏司经理",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [2]


def test_shengbang_consult_out_department_manager_candidates_follow_frontend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=10,
    )
    users = [
        _make_user(
            user_id=11,
            real_name="前端副校长",
            department="祈福司",
            position="前端副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=12,
            real_name="分析规划师主管",
            department="祈福司",
            position="分析规划师主管",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [11]


def test_management_center_market_out_department_manager_candidates_follow_market_manager_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="最高议事厅",
        department="市场部",
        position="专员",
        target_department="运营部",
        target_position="运营专员",
        created_by_user_id=13,
    )
    users = [
        _make_user(
            user_id=14,
            real_name="市场经理",
            department="市场部",
            position="市场部经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=15,
            real_name="市场副经理",
            department="市场部",
            position="市场部副经理",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [14]


def test_shengbang_channel_out_department_manager_candidates_follow_channel_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北主神殿",
        department="渠道部",
        position="渠道专员",
        target_department="祈福司",
        target_position="咨询师",
        created_by_user_id=16,
    )
    users = [
        _make_user(
            user_id=17,
            real_name="渠道副校长",
            department="渠道部",
            position="渠道部副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=18,
            real_name="渠道经理",
            department="渠道部",
            position="渠道部经理",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [17]


def test_jimei_academic_in_department_manager_candidates_follow_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="永恒殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=20,
    )
    users = [
        _make_user(
            user_id=21,
            real_name="学术副经理",
            department="智慧司",
            position="智慧司副经理",
            campus="河北永恒殿",
        ),
        _make_user(
            user_id=22,
            real_name="学术经理",
            department="智慧司",
            position="智慧司经理",
            campus="河北永恒殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "in_department_manager",
    )

    assert [item.user_id for item in candidates] == [21]


def test_management_center_market_in_department_manager_candidates_follow_market_manager_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="最高议事厅",
        department="运营部",
        position="运营专员",
        target_department="市场部",
        target_position="市场专员",
        created_by_user_id=23,
    )
    users = [
        _make_user(
            user_id=24,
            real_name="市场经理",
            department="市场部",
            position="市场部经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=25,
            real_name="市场副经理",
            department="市场部",
            position="市场部副经理",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "in_department_manager",
    )

    assert [item.user_id for item in candidates] == [24]


def test_shengbang_channel_in_department_manager_candidates_follow_channel_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        target_department="渠道部",
        target_position="渠道专员",
        created_by_user_id=26,
    )
    users = [
        _make_user(
            user_id=27,
            real_name="渠道副校长",
            department="渠道部",
            position="渠道部副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=28,
            real_name="渠道经理",
            department="渠道部",
            position="渠道部经理",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "in_department_manager",
    )

    assert [item.user_id for item in candidates] == [27]


def test_shimei_consult_out_department_manager_candidates_follow_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北慈悲殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=33,
    )
    users = [
        _make_user(
            user_id=34,
            real_name="校长",
            department="校长室",
            position="校长",
            campus="河北慈悲殿",
        ),
        _make_user(
            user_id=35,
            real_name="前端副校长",
            department="祈福司",
            position="前端副校长",
            campus="河北慈悲殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [34]


def test_shimei_teaching_quality_out_department_manager_candidates_follow_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北慈悲殿",
        department="教化司",
        position="教质老师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=36,
    )
    users = [
        _make_user(
            user_id=37,
            real_name="副校长",
            department="校长室",
            position="副校长",
            campus="河北慈悲殿",
        ),
        _make_user(
            user_id=38,
            real_name="教质经理",
            department="教化司",
            position="教化司经理",
            campus="河北慈悲殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [37]


def test_shimei_teaching_quality_in_department_manager_candidates_follow_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="河北慈悲殿",
        department="祈福司",
        position="咨询师",
        target_department="教化司",
        target_position="教质老师",
        created_by_user_id=30,
    )
    users = [
        _make_user(
            user_id=31,
            real_name="副校长",
            department="校长室",
            position="副校长",
            campus="河北慈悲殿",
        ),
        _make_user(
            user_id=32,
            real_name="教质经理",
            department="教化司",
            position="教化司经理",
            campus="河北慈悲殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "in_department_manager",
    )

    assert [item.user_id for item in candidates] == [31]


def test_guimei_consult_in_department_manager_candidates_follow_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="广西神恩殿",
        department="智慧司",
        position="讲师",
        target_department="祈福司",
        target_position="咨询师",
        created_by_user_id=40,
    )
    users = [
        _make_user(
            user_id=41,
            real_name="校长",
            department="校长室",
            position="校长",
            campus="广西神恩殿",
        ),
        _make_user(
            user_id=42,
            real_name="分析规划师主管",
            department="祈福司",
            position="分析规划师主管",
            campus="广西神恩殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "in_department_manager",
    )

    assert [item.user_id for item in candidates] == [41]


def test_taimei_teaching_quality_in_department_manager_candidates_follow_backend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="山西光明殿",
        department="祈福司",
        position="咨询师",
        target_department="教化司",
        target_position="教质老师",
        created_by_user_id=52,
    )
    users = [
        _make_user(
            user_id=53,
            real_name="后端副校长",
            department="校长室",
            position="后端副校长",
            campus="山西光明殿",
        ),
        _make_user(
            user_id=54,
            real_name="教质经理",
            department="教化司",
            position="教化司经理",
            campus="山西光明殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "in_department_manager",
    )

    assert [item.user_id for item in candidates] == [53]


def test_jinmei_consult_out_department_manager_candidates_follow_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="山西李大殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=43,
    )
    users = [
        _make_user(
            user_id=44,
            real_name="校长",
            department="校长室",
            position="校长",
            campus="山西李大殿",
        ),
        _make_user(
            user_id=45,
            real_name="分析规划师主管",
            department="祈福司",
            position="分析规划师主管",
            campus="山西李大殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [44]


def test_taimei_academic_out_department_manager_candidates_follow_backend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="山西光明殿",
        department="智慧司",
        position="讲师",
        target_department="祈福司",
        target_position="咨询师",
        created_by_user_id=46,
    )
    users = [
        _make_user(
            user_id=47,
            real_name="后端副校长",
            department="校长室",
            position="后端副校长",
            campus="山西光明殿",
        ),
        _make_user(
            user_id=48,
            real_name="学术经理",
            department="智慧司",
            position="智慧司经理",
            campus="山西光明殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [47]


def test_guimei_consult_out_department_manager_candidates_follow_principal_rule(
    monkeypatch,
) -> None:
    record = TransferApplication(
        campus="广西神恩殿",
        department="祈福司",
        position="咨询师",
        target_department="智慧司",
        target_position="讲师",
        created_by_user_id=49,
    )
    users = [
        _make_user(
            user_id=50,
            real_name="校长",
            department="校长室",
            position="校长",
            campus="广西神恩殿",
        ),
        _make_user(
            user_id=51,
            real_name="分析规划师主管",
            department="祈福司",
            position="分析规划师主管",
            campus="广西神恩殿",
        ),
    ]

    monkeypatch.setattr(
        transfer_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )

    candidates = transfer_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "out_department_manager",
    )

    assert [item.user_id for item in candidates] == [50]
