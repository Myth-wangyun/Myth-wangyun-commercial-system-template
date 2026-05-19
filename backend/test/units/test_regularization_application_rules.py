from __future__ import annotations

from typing import cast

import pytest
from sqlalchemy.orm import Session

from app.crud.human_resources import regularization_application as regularization_crud
from app.models.human_resources.regularization_application import (
    RegularizationApplication,
    RegularizationApplicationApprovalAction,
)
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


class _FakeCountQuery:
    def __init__(self, count_value: int = 0) -> None:
        self._count_value = count_value

    def filter(self, *_args, **_kwargs) -> "_FakeCountQuery":
        return self

    def count(self) -> int:
        return self._count_value


class _FakeApprovalDb:
    def __init__(self, *, existing_action_count: int = 0) -> None:
        self._existing_action_count = existing_action_count
        self.added: list[object] = []

    def query(self, *_args, **_kwargs) -> _FakeCountQuery:
        return _FakeCountQuery(self._existing_action_count)

    def add(self, obj: object) -> None:
        self.added.append(obj)

    def commit(self) -> None:
        return None

    def refresh(self, _record: object) -> None:
        return None


FAKE_DB = cast(Session, object())


def test_management_center_market_flow_uses_department_head_hr_then_chairman() -> None:
    record = RegularizationApplication(
        campus="最高议事厅",
        department="市场部",
        position="市场专员",
    )

    assert regularization_crud.get_flow_stages(record, db=None) == [
        "department_head",
        "hr",
        "chairman",
    ]


def test_shengbang_academic_flow_uses_department_head_vice_principal_principal_then_hr() -> None:
    record = RegularizationApplication(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
    )

    assert regularization_crud.get_flow_stages(record, db=None) == [
        "department_head",
        "vice_principal",
        "principal",
        "hr",
    ]


def test_branch_principal_flow_skips_principal_stage_but_requires_hr_then_chairman() -> None:
    record = RegularizationApplication(
        campus="河北主神殿",
        department="校务部",
        position="校长",
    )

    assert regularization_crud.get_flow_stages(record, db=None) == ["hr", "chairman"]


def test_shengbang_academic_vice_principal_candidates_follow_department_rule(
    monkeypatch,
) -> None:
    record = RegularizationApplication(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=1,
    )
    users = [
        _make_user(
            user_id=2,
            real_name="后端副校长",
            department="神殿",
            position="后端副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=3,
            real_name="前端副校长",
            department="神殿",
            position="前端副校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=4,
            real_name="校长",
            department="神殿",
            position="校长",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        regularization_crud,
        "_resolve_scoped_users",
        lambda db, current_record: users,
    )
    monkeypatch.setattr(
        regularization_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = regularization_crud.get_stage_candidate_users(
        FAKE_DB,
        record,
        "vice_principal",
    )

    assert [item.user_id for item in candidates] == [2]


def test_hr_candidates_require_management_center_hr_director(monkeypatch) -> None:
    record = RegularizationApplication(
        campus="河北主神殿",
        department="智慧司",
        position="讲师",
        created_by_user_id=10,
    )
    users = [
        _make_user(
            user_id=11,
            real_name="人资总监",
            department="人资行政部",
            position="人资部总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=12,
            real_name="人资经理",
            department="人资行政部",
            position="人资经理",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=13,
            real_name="行政总监",
            department="行政部",
            position="行政总监",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=14,
            real_name="神殿人资总监",
            department="人资行政部",
            position="人资部总监",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        regularization_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )
    monkeypatch.setattr(
        regularization_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = regularization_crud.get_stage_candidate_users(FAKE_DB, record, "hr")

    assert [item.user_id for item in candidates] == [11]


def test_text_validation_enforces_main_work_and_self_evaluation_min_lengths() -> None:
    with pytest.raises(ValueError, match="试用期主要工作不能少于120字"):
        regularization_crud._validate_regularization_text_fields(
            main_work="a" * 119,
            self_evaluation="b" * 50,
        )

    with pytest.raises(ValueError, match="自我鉴定不能少于50字"):
        regularization_crud._validate_regularization_text_fields(
            main_work="a" * 120,
            self_evaluation="b" * 49,
        )

    regularization_crud._validate_regularization_text_fields(
        main_work="a" * 120,
        self_evaluation="b" * 50,
    )


def test_approve_application_auto_advances_same_user_consecutive_stages(
    monkeypatch,
) -> None:
    record = RegularizationApplication(
        id=101,
        application_no="ZZSQ-TEST-001",
        name="刘洁琼",
        campus="最高议事厅",
        department="人资行政部",
        position="人资部主管",
        status="pending",
        current_stage="department_head",
        created_by_user_id=28,
    )
    current_user = _make_user(
        user_id=27,
        real_name="管璇",
        department="人资行政部",
        position="人资部总监",
        campus="最高议事厅",
    )
    fake_db = _FakeApprovalDb()
    notifications: list[dict] = []

    monkeypatch.setattr(
        regularization_crud,
        "get_flow_stages",
        lambda current_record, db=None: ["department_head", "hr", "chairman"],
    )
    monkeypatch.setattr(
        regularization_crud,
        "get_stage_approver_ids",
        lambda db, current_record, stage: {
            "department_head": [27],
            "hr": [27],
            "chairman": [2],
        }[stage],
    )
    monkeypatch.setattr(
        regularization_crud,
        "_create_application_notification",
        lambda *args, **kwargs: notifications.append(kwargs),
    )
    monkeypatch.setattr(
        regularization_crud.employee_archive_crud,
        "sync_archive_from_regularization_approval",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        regularization_crud,
        "get_application",
        lambda db, application_id: record,
    )

    result = regularization_crud.approve_application(fake_db, record, current_user, "同意")

    assert result.status == "pending"
    assert result.current_stage == "chairman"
    assert result.department_head_passed is True
    assert result.hr_passed is True
    assert result.hr_opinion is not None
    assert "自动通过当前环节" in result.hr_opinion

    approval_actions = [
        item
        for item in fake_db.added
        if isinstance(item, RegularizationApplicationApprovalAction)
    ]
    assert [item.stage for item in approval_actions] == ["department_head", "hr"]
    assert notifications[0]["notification_type"] == "stage_approved"
    assert "部门负责人、集团人力资源部" in notifications[0]["content"]


def test_approve_application_auto_completes_when_last_stage_is_same_user(
    monkeypatch,
) -> None:
    record = RegularizationApplication(
        id=102,
        application_no="ZZSQ-TEST-002",
        name="刘洁琼",
        campus="最高议事厅",
        department="人资行政部",
        position="人资部主管",
        status="pending",
        current_stage="department_head",
        created_by_user_id=28,
    )
    current_user = _make_user(
        user_id=27,
        real_name="管璇",
        department="人资行政部",
        position="人资部总监",
        campus="最高议事厅",
    )
    fake_db = _FakeApprovalDb()
    notifications: list[dict] = []

    monkeypatch.setattr(
        regularization_crud,
        "get_flow_stages",
        lambda current_record, db=None: ["department_head", "hr"],
    )
    monkeypatch.setattr(
        regularization_crud,
        "get_stage_approver_ids",
        lambda db, current_record, stage: {
            "department_head": [27],
            "hr": [27],
        }[stage],
    )
    monkeypatch.setattr(
        regularization_crud,
        "_create_application_notification",
        lambda *args, **kwargs: notifications.append(kwargs),
    )
    monkeypatch.setattr(
        regularization_crud.employee_archive_crud,
        "sync_archive_from_regularization_approval",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        regularization_crud,
        "get_application",
        lambda db, application_id: record,
    )

    result = regularization_crud.approve_application(fake_db, record, current_user, "同意")

    assert result.status == "approved"
    assert result.current_stage is None
    assert result.is_passed is True
    assert result.hr_passed is True
    assert result.completed_at is not None

    approval_actions = [
        item
        for item in fake_db.added
        if isinstance(item, RegularizationApplicationApprovalAction)
    ]
    assert [item.stage for item in approval_actions] == ["department_head", "hr"]
    assert notifications[0]["notification_type"] == "approved"