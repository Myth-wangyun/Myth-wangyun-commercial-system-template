from __future__ import annotations

from typing import cast

import pytest
from sqlalchemy.orm import Session

from app.crud.human_resources import promotion_application as promotion_crud
from app.models.human_resources.promotion_application import PromotionApplication
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


class _FakeQuery:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def filter(self, *_args, **_kwargs) -> "_FakeQuery":
        return self

    def all(self) -> list[User]:
        return list(self._users)


FAKE_DB = cast(Session, object())


def test_management_center_flow_keeps_chairman() -> None:
    record = PromotionApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
    )

    assert promotion_crud.get_flow_stages(record, db=None) == [
        "department_manager",
        "biz_director",
        "hr_director",
        "chairman",
    ]


def test_branch_non_principal_flow_skips_chairman() -> None:
    record = PromotionApplication(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
    )

    assert promotion_crud.get_flow_stages(record, db=None) == [
        "department_manager",
        "principal",
        "biz_director",
        "hr_director",
    ]


def test_branch_principal_flow_requires_chairman() -> None:
    record = PromotionApplication(
        campus="河北主神殿",
        department="神殿",
        position="校长",
    )

    assert promotion_crud.get_flow_stages(record, db=None) == [
        "department_manager",
        "principal",
        "biz_director",
        "hr_director",
        "chairman",
    ]


def test_management_center_market_department_manager_candidates_follow_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        created_by_user_id=1,
    )
    users = [
        _make_user(
            user_id=2,
            real_name="韩维明",
            department="市场部",
            position="市场部经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=3,
            real_name="康青",
            department="市场部",
            position="市场部副经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=4,
            real_name="窦建茹",
            department="神藏司",
            position="神藏司总监",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [2]


def test_branch_channel_department_manager_can_fall_back_to_same_department_leader(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="主神殿",
        department="渠道部",
        position="渠道专员",
        created_by_user_id=10,
    )
    users = [
        _make_user(
            user_id=11,
            real_name="李会霞",
            department="渠道部",
            position="渠道部副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=12,
            real_name="学术经理",
            department="智慧司",
            position="学术经理",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [11]


def test_principal_candidates_use_campus_bucket_alias_and_exclude_proxy_vice_principal(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="永恒殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=20,
    )
    users = [
        _make_user(
            user_id=21,
            real_name="韩俊萍",
            department="神殿",
            position="神殿校长",
            campus="河北永恒殿",
        ),
        _make_user(
            user_id=22,
            real_name="尚笑莹",
            department="祈福司",
            position="神殿副(代理)校长",
            campus="永恒殿",
        ),
        _make_user(
            user_id=23,
            real_name="靳月莲",
            department="神殿",
            position="神殿校长",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "principal",
    )

    assert [item.user_id for item in candidates] == [21]


def test_jimei_principal_candidates_do_not_use_deputy_director(monkeypatch) -> None:
    record = PromotionApplication(
        campus="河北永恒殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=24,
    )
    users = [
        _make_user(
            user_id=25,
            real_name="冀美校长",
            department="神殿",
            position="校长",
            campus="河北永恒殿",
        ),
        _make_user(
            user_id=26,
            real_name="冀美副总监",
            department="神殿",
            position="副总监",
            campus="河北永恒殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "principal",
    )

    assert [item.user_id for item in candidates] == [25]


def test_yuanmei_principal_candidates_do_not_use_executive_vice_principal(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="山西智慧阁",
        department="教化司",
        position="教师",
        created_by_user_id=27,
    )
    users = [
        _make_user(
            user_id=28,
            real_name="原美校长",
            department="神殿",
            position="校长",
            campus="山西智慧阁",
        ),
        _make_user(
            user_id=29,
            real_name="执行副校长",
            department="神殿",
            position="执行副校长",
            campus="山西智慧阁",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "principal",
    )

    assert [item.user_id for item in candidates] == [28]


def test_apply_promotion_compensation_fields_updates_total_salary() -> None:
    record = PromotionApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
    )

    apply_compensation_fields = getattr(
        promotion_crud,
        "_apply_promotion_compensation_fields",
    )

    apply_compensation_fields(
        record,
        {
            "original_salary": 6000,
            "promoted_base_salary": 7000,
            "promoted_performance_salary": 1500,
        },
    )

    assert record.original_salary == 6000
    assert record.promoted_base_salary == 7000
    assert record.promoted_performance_salary == 1500
    assert record.promoted_salary == 8500


def test_required_compensation_fields_must_be_complete_before_approval() -> None:
    record = PromotionApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        original_salary=None,
        promoted_salary=None,
    )

    validate_required_compensation_fields = getattr(
        promotion_crud,
        "_validate_required_compensation_fields",
    )

    with pytest.raises(ValueError, match="原薪资标准、晋升后薪资标准"):
        validate_required_compensation_fields(
            record,
            "department_manager",
        )


def test_hr_director_candidates_only_include_management_center_hr_directors(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
        created_by_user_id=100,
    )
    users = [
        _make_user(
            user_id=101,
            real_name="人资总监",
            department="人资行政部",
            position="人资部总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=102,
            real_name="人资主管",
            department="人资行政部",
            position="人资部主管",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=103,
            real_name="运营总监",
            department="运营部",
            position="运营总监",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "hr_director",
    )

    assert [item.user_id for item in candidates] == [101]


def test_management_center_finance_department_manager_candidates_follow_director_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="最高议事厅",
        department="神藏司",
        position="会计",
        created_by_user_id=30,
    )
    users = [
        _make_user(
            user_id=31,
            real_name="财务总监",
            department="神藏司",
            position="神藏司总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=32,
            real_name="财务经理",
            department="神藏司",
            position="神藏司经理",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [31]


def test_shengbang_consult_department_manager_candidates_follow_frontend_vice_principal_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="河北主神殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=40,
    )
    users = [
        _make_user(
            user_id=41,
            real_name="前端副校长",
            department="祈福司",
            position="前端副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=42,
            real_name="分析规划师主管",
            department="祈福司",
            position="分析规划师主管",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [41]


def test_jimei_academic_department_manager_candidates_follow_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="河北永恒殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=50,
    )
    users = [
        _make_user(
            user_id=51,
            real_name="学术副经理",
            department="智慧司",
            position="智慧司副经理",
            campus="河北永恒殿",
        ),
        _make_user(
            user_id=52,
            real_name="学术经理",
            department="智慧司",
            position="智慧司经理",
            campus="河北永恒殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [51]


def test_shimei_teaching_quality_department_manager_candidates_follow_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="河北慈悲殿",
        department="教化司",
        position="教质老师",
        created_by_user_id=60,
    )
    users = [
        _make_user(
            user_id=61,
            real_name="教质副经理",
            department="教化司",
            position="教化司副经理",
            campus="河北慈悲殿",
        ),
        _make_user(
            user_id=62,
            real_name="教质经理",
            department="教化司",
            position="教化司经理",
            campus="河北慈悲殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [61]


def test_taimei_teaching_quality_department_manager_candidates_follow_deputy_manager_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="山西光明殿",
        department="教化司",
        position="教质老师",
        created_by_user_id=70,
    )
    users = [
        _make_user(
            user_id=71,
            real_name="教质副经理",
            department="教化司",
            position="教化司副经理",
            campus="山西光明殿",
        ),
        _make_user(
            user_id=72,
            real_name="教质经理",
            department="教化司",
            position="教化司经理",
            campus="山西光明殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [71]


def test_guimei_consult_department_manager_candidates_follow_analysis_supervisor_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="广西神恩殿",
        department="祈福司",
        position="咨询师",
        created_by_user_id=80,
    )
    users = [
        _make_user(
            user_id=81,
            real_name="分析规划师主管",
            department="祈福司",
            position="分析规划师主管",
            campus="广西神恩殿",
        ),
        _make_user(
            user_id=82,
            real_name="咨询经理",
            department="祈福司",
            position="祈福司经理",
            campus="广西神恩殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [81]


def test_guimei_academic_department_manager_candidates_follow_manager_rule(
    monkeypatch,
) -> None:
    record = PromotionApplication(
        campus="广西神恩殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=90,
    )
    users = [
        _make_user(
            user_id=91,
            real_name="学术经理",
            department="智慧司",
            position="智慧司经理",
            campus="广西神恩殿",
        ),
        _make_user(
            user_id=92,
            real_name="学术副经理",
            department="智慧司",
            position="智慧司副经理",
            campus="广西神恩殿",
        ),
    ]

    monkeypatch.setattr(
        promotion_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        promotion_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = promotion_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "department_manager",
    )

    assert [item.user_id for item in candidates] == [91]


def test_application_text_fields_require_minimum_50_effective_chars() -> None:
    record = PromotionApplication(
        promotion_reason="业绩突出，计划清晰",
        confidence_and_expectation="希望承担更多职责",
    )

    validate_application_text_fields = getattr(
        promotion_crud,
        "_validate_application_text_fields",
    )

    with pytest.raises(ValueError, match="申请晋升的理由不少于50字"):
        validate_application_text_fields(record)


def test_application_text_fields_accept_exactly_50_effective_chars() -> None:
    record = PromotionApplication(
        promotion_reason="晋" * 50,
        confidence_and_expectation="望" * 50,
    )

    validate_application_text_fields = getattr(
        promotion_crud,
        "_validate_application_text_fields",
    )

    validate_application_text_fields(record)
