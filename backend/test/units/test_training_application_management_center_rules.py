from __future__ import annotations

from decimal import Decimal
from typing import cast

from app.crud.human_resources import training_application as training_application_crud
from app.crud.human_resources.training_application import (
    apply_chairman_approval_rule_for_test,
    attach_request_applicant_for_flow,
)
from app.models.human_resources.training_application import (
    TrainingApplication,
    TrainingApplicationNotification,
)
from app.models.user import User, UserRole, UserStatus
from sqlalchemy.orm import Session


def _make_user(
    *,
    user_id: int,
    real_name: str,
    department: str,
    position: str,
    campus: str = "最高议事厅",
    is_superuser: bool = False,
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
        is_superuser=is_superuser,
    )


class _FakeQuery:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def filter(self, *_args, **_kwargs) -> "_FakeQuery":
        return self

    def all(self) -> list[User]:
        return list(self._users)

    def first(self) -> User | None:
        return self._users[0] if self._users else None


class _FakeSession:
    def __init__(self, users: list[User]) -> None:
        self._users = users

    def query(self, *_args, **_kwargs) -> _FakeQuery:
        return _FakeQuery(self._users)


FAKE_DB = cast(Session, object())


def _make_record(*, department: str, total_amount: Decimal = Decimal("0")) -> TrainingApplication:
    return TrainingApplication(
        campus="最高议事厅",
        department=department,
        category="管理",
        objective="培训目标",
        trainees="张三",
        content="培训内容",
        start_date=training_application_crud.datetime.now().date(),
        end_date=training_application_crud.datetime.now().date(),
        total_hours=Decimal("1"),
        training_format="线下",
        exam_method="理论",
        cost_per_person=Decimal("0"),
        cost_count=0,
        cost_total=total_amount,
        cost_other=Decimal("0"),
        include_chairman_approval=False,
        created_by_user_id=999,
    )


def _make_branch_record(*, campus: str, department: str) -> TrainingApplication:
    return TrainingApplication(
        campus=campus,
        department=department,
        category="专业",
        objective="培训目标",
        trainees="李四",
        content="培训内容",
        start_date=training_application_crud.datetime.now().date(),
        end_date=training_application_crud.datetime.now().date(),
        total_hours=Decimal("1"),
        training_format="线下",
        exam_method="理论",
        cost_per_person=Decimal("0"),
        cost_count=0,
        cost_total=Decimal("0"),
        cost_other=Decimal("0"),
        include_chairman_approval=False,
        created_by_user_id=999,
    )


def test_management_center_market_manager_can_access_form() -> None:
    user = _make_user(user_id=1, real_name="韩维明", department="市场部", position="市场部经理")

    assert training_application_crud.can_access_training_application_form(user) is True


def test_management_center_unauthorized_position_cannot_access_form() -> None:
    user = _make_user(user_id=2, real_name="市场专员", department="市场部", position="市场专员")

    assert training_application_crud.can_access_training_application_form(user) is False


def test_management_center_market_deputy_manager_requires_department_head_stage() -> None:
    applicant = _make_user(user_id=3, real_name="康青", department="市场部", position="市场部副经理")
    record = _make_record(department="市场部")
    attach_request_applicant_for_flow(record, applicant)

    assert training_application_crud.get_flow_stages(record) == ["department_head", "hr"]


def test_management_center_market_manager_skips_department_head_stage() -> None:
    applicant = _make_user(user_id=4, real_name="韩维明", department="市场部", position="市场部经理")
    record = _make_record(department="市场部")
    attach_request_applicant_for_flow(record, applicant)

    assert training_application_crud.get_flow_stages(record) == ["hr"]


def test_management_center_department_head_candidates_follow_exact_position_rule(monkeypatch) -> None:
    record = _make_record(department="市场部")
    users = [
        _make_user(user_id=5, real_name="市场副经理", department="市场部", position="市场部副经理"),
        _make_user(user_id=6, real_name="市场经理", department="市场部", position="市场部经理"),
        _make_user(user_id=7, real_name="学术副总监", department="智慧司", position="智慧司副总监"),
    ]

    monkeypatch.setattr(
        training_application_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )

    candidates = training_application_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [6]


def test_management_center_total_amount_over_500_auto_includes_chairman() -> None:
    record = _make_record(department="运营部", total_amount=Decimal("600"))

    apply_chairman_approval_rule_for_test(record, False)

    assert record.include_chairman_approval is True


def test_management_center_total_amount_at_500_does_not_auto_include_chairman() -> None:
    record = _make_record(department="运营部", total_amount=Decimal("500"))

    apply_chairman_approval_rule_for_test(record, False)

    assert record.include_chairman_approval is False


def test_shengbang_principal_can_access_any_department() -> None:
    user = _make_user(
        user_id=8,
        real_name="靳月莲",
        department="神殿",
        position="校长",
        campus="河北主神殿",
    )

    assert training_application_crud.can_access_training_application_form(user) is True


def test_shengbang_frontend_vice_principal_can_only_access_consulting() -> None:
    user = _make_user(
        user_id=9,
        real_name="李金雷",
        department="祈福司",
        position="前端副校长",
        campus="河北主神殿",
    )

    assert training_application_crud.can_access_training_application_form(user) is True

    user.department = "智慧司"

    assert training_application_crud.can_access_training_application_form(user) is False


def test_shengbang_consulting_principal_candidates_follow_prompt_chain(monkeypatch) -> None:
    record = _make_branch_record(campus="河北主神殿", department="祈福司")
    users = [
        _make_user(
            user_id=10,
            real_name="靳月莲",
            department="神殿",
            position="校长",
            campus="河北主神殿",
        ),
        _make_user(
            user_id=11,
            real_name="李金雷",
            department="祈福司",
            position="前端副校长",
            campus="河北主神殿",
        ),
    ]

    monkeypatch.setattr(
        training_application_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )

    candidates = training_application_crud.get_stage_candidate_users(FAKE_DB, record, "principal")

    assert [item.user_id for item in candidates] == [10]


def test_branch_principal_applicant_skips_department_head_and_principal() -> None:
    applicant = _make_user(
        user_id=12,
        real_name="韩俊萍",
        department="神殿",
        position="校长",
        campus="河北永恒殿",
    )
    record = _make_branch_record(campus="河北永恒殿", department="祈福司")

    attach_request_applicant_for_flow(record, applicant)

    assert training_application_crud.get_flow_stages(record) == ["group_department", "hr"]


def test_shengbang_academic_manager_flow_matches_prompt_chain() -> None:
    applicant = _make_user(
        user_id=16,
        real_name="闫梦雷",
        department="智慧司",
        position="智慧司经理",
        campus="河北主神殿",
    )
    record = _make_branch_record(campus="河北主神殿", department="智慧司")

    attach_request_applicant_for_flow(record, applicant)

    assert training_application_crud.get_flow_stages(record) == [
        "department_head",
        "principal",
        "group_department",
        "hr",
    ]


def test_yuanmei_academic_manager_flow_skips_backend_stage() -> None:
    applicant = _make_user(
        user_id=17,
        real_name="韩艳威",
        department="智慧司",
        position="智慧司经理",
        campus="山西智慧阁",
    )
    record = _make_branch_record(campus="山西智慧阁", department="智慧司")

    attach_request_applicant_for_flow(record, applicant)

    assert training_application_crud.get_flow_stages(record) == [
        "principal",
        "group_department",
        "hr",
    ]


def test_management_center_market_preview_candidates_match_prompt_chain(monkeypatch) -> None:
    users = [
        _make_user(user_id=3, real_name="康青", department="市场部", position="市场部副经理"),
        _make_user(user_id=18, real_name="韩维明", department="市场部", position="市场部经理"),
        _make_user(user_id=19, real_name="管璇", department="人资部", position="人资部总监"),
        _make_user(user_id=20, real_name="董事长", department="董事办", position="董事长"),
    ]
    monkeypatch.setattr(
        training_application_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )

    preview = training_application_crud.build_approver_candidate_preview(
        _FakeSession(users),
        campus="最高议事厅",
        department="市场部",
        category="管理",
        is_internal_training=False,
        is_key_staff_training=False,
        include_chairman_approval=True,
        total_amount=600,
        created_by_user_id=3,
    )

    assert [item["stage"] for item in preview] == ["department_head", "hr", "chairman"]
    assert preview[0]["recommended_user_ids"] == [18]
    assert preview[1]["recommended_user_ids"] == [19]
    assert preview[2]["recommended_user_ids"] == [20]


def test_shimei_academic_deputy_manager_department_head_candidates_follow_prompt(monkeypatch) -> None:
    record = _make_branch_record(campus="河北慈悲殿", department="智慧司")
    applicant = _make_user(
        user_id=99,
        real_name="姜东亮",
        department="智慧司",
        position="智慧司副经理",
        campus="河北慈悲殿",
    )
    attach_request_applicant_for_flow(record, applicant)
    users = [
        _make_user(
            user_id=13,
            real_name="赵静",
            department="智慧司",
            position="后端副校长",
            campus="河北慈悲殿",
        ),
        _make_user(
            user_id=14,
            real_name="姜东亮",
            department="智慧司",
            position="智慧司副经理",
            campus="河北慈悲殿",
        ),
        _make_user(
            user_id=15,
            real_name="张志恒",
            department="智慧司",
            position="智慧司经理",
            campus="河北慈悲殿",
        ),
    ]

    monkeypatch.setattr(
        training_application_crud,
        "_base_active_user_query",
        lambda db: _FakeQuery(users),
    )

    candidates = training_application_crud.get_stage_candidate_users(FAKE_DB, record, "department_head")

    assert [item.user_id for item in candidates] == [15]


def test_shimei_academic_manager_skips_department_head_stage() -> None:
    applicant = _make_user(
        user_id=21,
        real_name="张志恒",
        department="智慧司",
        position="智慧司经理",
        campus="河北慈悲殿",
    )
    record = _make_branch_record(campus="河北慈悲殿", department="智慧司")

    attach_request_applicant_for_flow(record, applicant)

    assert training_application_crud.get_flow_stages(record) == [
        "principal",
        "group_department",
        "hr",
    ]


def test_notification_recipient_can_view_training_application_detail() -> None:
    viewer = _make_user(
        user_id=22,
        real_name="管璇",
        department="人资行政部",
        position="人资部总监",
        campus="最高议事厅神殿",
    )
    record = _make_record(department="运营部")
    record.status = "approved"
    record.notifications = [
        TrainingApplicationNotification(
            application_id=4,
            recipient_user_id=viewer.user_id,
            notification_type="pending_stage",
            title="培训申请待审批：运营部/思想",
            content="培训申请已流转至人事部意见环节，请及时处理。",
        )
    ]

    assert training_application_crud.can_view_application(FAKE_DB, record, viewer) is True