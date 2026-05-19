from __future__ import annotations

from typing import cast

from sqlalchemy.orm import Session

from app.crud.human_resources import appointment_interview_record as interview_crud
from app.models.human_resources.appointment_interview_record import AppointmentInterviewRecord
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


def test_management_center_flow_only_uses_hr_director() -> None:
    record = AppointmentInterviewRecord(campus="最高议事厅")

    assert interview_crud.get_flow_stages(record, db=None) == ["hr_director"]


def test_branch_flow_uses_principal_then_hr_director() -> None:
    record = AppointmentInterviewRecord(campus="河北主神殿")

    assert interview_crud.get_flow_stages(record, db=None) == [
        "principal",
        "hr_director",
    ]


def test_legacy_pending_chairman_stage_is_preserved() -> None:
    record = AppointmentInterviewRecord(
        campus="河北主神殿",
        status="pending",
        current_stage="chairman",
    )

    assert interview_crud.get_flow_stages(record, db=None) == [
        "principal",
        "hr_director",
        "chairman",
    ]


def test_principal_candidates_only_include_same_campus_principal(monkeypatch) -> None:
    record = AppointmentInterviewRecord(
        campus="永恒殿",
        created_by_user_id=1,
    )
    users = [
        _make_user(
            user_id=2,
            real_name="冀美校长",
            department="神殿",
            position="校长",
            campus="河北永恒殿",
        ),
        _make_user(
            user_id=3,
            real_name="冀美副校长",
            department="神殿",
            position="副校长",
            campus="河北永恒殿",
        ),
        _make_user(
            user_id=4,
            real_name="盛邦校长",
            department="神殿",
            position="校长",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(interview_crud, "_base_active_user_query", lambda db: _FakeQuery(users))
    monkeypatch.setattr(
        interview_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = interview_crud.get_stage_candidate_users(FAKE_DB, record, "principal")

    assert [item.user_id for item in candidates] == [2]


def test_hr_director_candidates_only_include_management_center_hr_directors(monkeypatch) -> None:
    record = AppointmentInterviewRecord(
        campus="河北主神殿",
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
            real_name="人资主管",
            department="人资行政部",
            position="人资部主管",
            campus="最高议事厅",
        ),
        _make_user(
            user_id=13,
            real_name="神殿人资总监",
            department="人资行政部",
            position="人资部总监",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(interview_crud, "_base_active_user_query", lambda db: _FakeQuery(users))
    monkeypatch.setattr(
        interview_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )

    candidates = interview_crud.get_stage_candidate_users(FAKE_DB, record, "hr_director")

    assert [item.user_id for item in candidates] == [11]


def test_approver_preview_excludes_chairman_stage(monkeypatch) -> None:
    users = [
        _make_user(
            user_id=21,
            real_name="盛邦校长",
            department="神殿",
            position="校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=22,
            real_name="人资总监",
            department="人资行政部",
            position="人资部总监",
            campus="最高议事厅",
        ),
    ]

    monkeypatch.setattr(interview_crud, "_base_active_user_query", lambda db: _FakeQuery(users))
    monkeypatch.setattr(interview_crud, "_get_preview_stage_map", lambda db, record: {})
    monkeypatch.setattr(
        interview_crud.workflow_crud,
        "get_template_stage_candidate_users",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        interview_crud.workflow_crud,
        "resolve_template_stage_approvers",
        lambda *args, **kwargs: None,
    )

    preview = interview_crud.build_approver_candidate_preview(
        FAKE_DB,
        campus="河北主神殿",
    )

    assert [item["stage"] for item in preview] == ["principal", "hr_director"]