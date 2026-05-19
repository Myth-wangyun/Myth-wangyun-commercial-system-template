"""
集团人资基础 - 任命访谈记录表 CRUD
"""

from __future__ import annotations

from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources import approval_workflow as workflow_crud
from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.appointment_interview_record import (
    AppointmentInterviewRecord,
    AppointmentInterviewRecordApprovalAction,
    AppointmentInterviewRecordNotification,
)
from app.models.human_resources.promotion_application import PromotionApplication
from app.models.human_resources.promotion_interview import PromotionInterview
from app.models.user import User, UserStatus
from app.schemas.human_resources.appointment_interview_record import (
    APPOINTMENT_INTERVIEW_APPROVAL_STAGES,
    APPOINTMENT_INTERVIEW_FLOW_STATUS_LABELS,
    APPOINTMENT_INTERVIEW_STAGE_LABELS,
    APPOINTMENT_INTERVIEW_STATUS_LABELS,
    AppointmentInterviewApprovalInfo,
    AppointmentInterviewRecordCreate,
    AppointmentInterviewRecordUpdate,
)

FLOW_TYPE = "appointment_interview_record"
MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
HR_ADMIN_DEPARTMENT_MARKERS = (
    "人资行政",
    "人事行政",
    "人力资源",
    "人事部",
    "人资部",
    "人资",
)
MANAGEMENT_POSITION_KEYWORDS = ("主管", "经理", "总监", "部长", "主任", "负责人")
STAGE_FIELD_MAP = {
    "principal": ("principal_approval", "principal_passed"),
    "hr_director": ("hr_approval", "hr_passed"),
    "chairman": ("chairman_approval", "chairman_passed"),
}
ACTION_LABELS = {
    "submit": "提交",
    "approve": "通过",
    "reject": "驳回",
}


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.strip()


def _normalize_required_str(value: Optional[str], field_name: str) -> str:
    normalized = _normalize_scope_value(value)
    if not normalized:
        raise ValueError(f"{field_name}不能为空")
    return normalized


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    normalized = _normalize_scope_value(value)
    return normalized or None


def _normalize_answers(values: Optional[list[str]]) -> list[str]:
    normalized: list[str] = []
    for item in values or []:
        normalized.append((item or "").strip())
        if len(normalized) >= 5:
            break
    while len(normalized) < 5:
        normalized.append("")
    return normalized


def _normalize_approval_info(
    info: Optional[AppointmentInterviewApprovalInfo | dict],
) -> dict:
    if info is None:
        return {}

    if isinstance(info, AppointmentInterviewApprovalInfo):
        opinion = _normalize_optional_str(info.opinion)
        signer = _normalize_optional_str(info.signer)
        sign_date_value = info.sign_date
    else:
        opinion = _normalize_optional_str(info.get("opinion"))  # type: ignore[arg-type]
        signer = _normalize_optional_str(info.get("signer"))  # type: ignore[arg-type]
        sign_date_value = info.get("sign_date") or info.get("signDate")  # type: ignore[arg-type]

    sign_date: Optional[str]
    if isinstance(sign_date_value, datetime):
        sign_date = sign_date_value.date().isoformat()
    elif isinstance(sign_date_value, date):
        sign_date = sign_date_value.isoformat()
    elif isinstance(sign_date_value, str):
        sign_date = sign_date_value.strip() or None
    else:
        sign_date = None

    return {
        "opinion": opinion,
        "signer": signer,
        "sign_date": sign_date,
    }


def _parse_approval_info(raw_value: Optional[dict]) -> dict:
    payload = _normalize_approval_info(raw_value or {})
    sign_date_value = payload.get("sign_date")
    parsed_date: Optional[date] = None
    if isinstance(sign_date_value, str) and sign_date_value:
        try:
            parsed_date = date.fromisoformat(sign_date_value)
        except ValueError:
            parsed_date = None

    return {
        "opinion": payload.get("opinion"),
        "signer": payload.get("signer"),
        "sign_date": parsed_date,
    }


def _approval_acted_at(raw_value: Optional[dict]) -> Optional[datetime]:
    info = _parse_approval_info(raw_value)
    sign_date = info.get("sign_date")
    if isinstance(sign_date, date):
        return datetime.combine(sign_date, time.min)
    return None


def _serialize_approver(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.real_name,
        "department": user.department,
        "position": user.position,
        "campus": user.campus,
    }


def _format_record_no(record_id: Optional[int]) -> str:
    if not record_id:
        return ""
    return f"RMFT{int(record_id):06d}"


def _get_record_no(record: AppointmentInterviewRecord) -> str:
    return _format_record_no(record.id)


def _is_admin_user(current_user: User) -> bool:
    role = getattr(current_user.role, "value", current_user.role)
    return bool(current_user.is_superuser or role == "admin")


def _has_manage_privilege(
    current_user: User, record: AppointmentInterviewRecord
) -> bool:
    return (
        _is_admin_user(current_user)
        or current_user.user_id == record.created_by_user_id
    )


def _is_management_center_campus(campus: Optional[str]) -> bool:
    return _normalize_scope_value(campus) in MANAGEMENT_CENTER_CAMPUS_VALUES


def _resolve_campus_bucket(campus: Optional[str]) -> Optional[str]:
    normalized = _normalize_compact_text(campus)
    if not normalized:
        return None
    if _is_management_center_campus(campus):
        return "management_center"
    if "盛邦" in normalized:
        return "shengbang"
    if "冀美" in normalized:
        return "jimei"
    if "石美" in normalized:
        return "shimei"
    if "晋美" in normalized:
        return "jinmei"
    if "原美" in normalized:
        return "yuanmei"
    if "太美" in normalized:
        return "taimei"
    if "桂美" in normalized:
        return "guimei"
    return normalized


def _campus_matches_scope(
    user_campus: Optional[str], target_campus: Optional[str]
) -> bool:
    normalized_user = _normalize_scope_value(user_campus)
    normalized_target = _normalize_scope_value(target_campus)
    if not normalized_target:
        return True
    if not normalized_user:
        return False
    if _is_management_center_campus(normalized_target):
        return _is_management_center_campus(normalized_user)
    if _is_management_center_campus(normalized_user):
        return _is_management_center_campus(normalized_target)
    user_bucket = _resolve_campus_bucket(normalized_user)
    target_bucket = _resolve_campus_bucket(normalized_target)
    if user_bucket and target_bucket:
        return user_bucket == target_bucket
    return normalized_user == normalized_target


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


def _is_school_leader_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or "校长" not in normalized:
        return False
    vice_index = normalized.find("副")
    principal_index = normalized.find("校长")
    return vice_index == -1 or vice_index > principal_index


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in HR_ADMIN_DEPARTMENT_MARKERS)


def _is_management_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in MANAGEMENT_POSITION_KEYWORDS)


def _is_director_position(position: Optional[str]) -> bool:
    return "总监" in _normalize_compact_text(position)


def _is_chairman_position(position: Optional[str]) -> bool:
    return _normalize_scope_value(position) == "董事长"


def _is_hr_director_candidate(user: User) -> bool:
    return (
        _is_management_center_campus(user.campus)
        and _is_hr_admin_department(user.department)
        and _is_director_position(user.position)
    )


def _base_active_user_query(db: Session):
    return db.query(User).filter(User.status == UserStatus.ACTIVE)


def _sort_and_dedupe_users(users: list[User]) -> list[User]:
    seen: set[int] = set()
    result: list[User] = []
    for user in sorted(
        users,
        key=lambda item: (
            (item.campus or ""),
            (item.department or ""),
            item.real_name or "",
        ),
    ):
        if user.user_id in seen:
            continue
        seen.add(user.user_id)
        result.append(user)
    return result


def _get_active_users_by_ids(db: Session, user_ids: list[int]) -> list[User]:
    if not user_ids:
        return []
    users = _base_active_user_query(db).filter(User.user_id.in_(user_ids)).all()
    user_map = {user.user_id: user for user in users}
    return [user_map[user_id] for user_id in user_ids if user_id in user_map]


def _resolve_principal_fallback(
    db: Session,
    record: AppointmentInterviewRecord,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return _sort_and_dedupe_users(
        [
            user
            for user in users
            if _campus_matches_scope(user.campus, record.campus)
            and _is_school_leader_position(user.position)
        ]
    )


def _resolve_hr_director_fallback(
    db: Session,
    record: AppointmentInterviewRecord,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    hr_users = [
        user
        for user in users
        if _is_management_center_campus(user.campus)
        and _is_hr_admin_department(user.department)
    ]
    hr_directors = [user for user in hr_users if _is_hr_director_candidate(user)]
    return _sort_and_dedupe_users(hr_directors)


def _resolve_chairman_fallback(
    db: Session,
    record: AppointmentInterviewRecord,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return _sort_and_dedupe_users(
        [user for user in users if _is_chairman_position(user.position)]
    )


def _default_flow_stages(record: AppointmentInterviewRecord) -> list[str]:
    if _is_management_center_campus(record.campus):
        return ["hr_director"]
    return ["principal", "hr_director"]


def _stage_has_history(record: AppointmentInterviewRecord, stage: str) -> bool:
    if record.current_stage == stage:
        return True
    approval_field, passed_field = STAGE_FIELD_MAP.get(stage, (None, None))
    if approval_field and getattr(record, approval_field, None):
        return True
    if passed_field and getattr(record, passed_field, None) is not None:
        return True
    return any(action.stage == stage for action in getattr(record, "approval_actions", []))


def _normalize_flow_stages(record: AppointmentInterviewRecord) -> list[str]:
    stages = list(_default_flow_stages(record))
    for legacy_stage in STAGE_FIELD_MAP:
        if legacy_stage in stages:
            continue
        if _stage_has_history(record, legacy_stage):
            stages.append(legacy_stage)
    return stages


def get_flow_stages(
    record: AppointmentInterviewRecord, db: Optional[Session] = None
) -> list[str]:
    del db
    return _normalize_flow_stages(record)


def _get_preview_stage_map(
    db: Session,
    record: AppointmentInterviewRecord,
) -> dict[str, dict]:
    preview = workflow_crud.build_flow_preview(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=None,
        position=None,
    )
    return {
        item["stage"]: item
        for item in preview.get("stages", [])
        if isinstance(item, dict) and item.get("stage")
    }


def get_stage_candidate_users(
    db: Session,
    record: AppointmentInterviewRecord,
    stage: str,
) -> list[User]:
    template_candidates = workflow_crud.get_template_stage_candidate_users(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=None,
        position=None,
        stage=stage,
    )
    if template_candidates is not None:
        return _sort_and_dedupe_users(template_candidates)

    if stage == "principal":
        return _resolve_principal_fallback(db, record)
    if stage == "hr_director":
        return _resolve_hr_director_fallback(db, record)
    if stage == "chairman":
        return _resolve_chairman_fallback(db, record)
    return []


def _resolve_auto_stage_approvers(
    db: Session,
    record: AppointmentInterviewRecord,
    stage: str,
) -> list[User]:
    template_users = workflow_crud.resolve_template_stage_approvers(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=None,
        position=None,
        stage=stage,
    )
    if template_users is not None:
        return _sort_and_dedupe_users(template_users)
    return get_stage_candidate_users(db, record, stage)


def get_selected_approver_user_ids(
    record: AppointmentInterviewRecord,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids,
        APPOINTMENT_INTERVIEW_APPROVAL_STAGES,
    )


def _validate_selected_stage_approvers(
    db: Session,
    record: AppointmentInterviewRecord,
    stage: str,
    user_ids: list[int],
    *,
    preview_stage_map: Optional[dict[str, dict]] = None,
) -> None:
    if not user_ids:
        return

    candidate_users = get_stage_candidate_users(db, record, stage)
    candidate_map = {item.user_id: item for item in candidate_users}
    invalid_user_ids = [user_id for user_id in user_ids if user_id not in candidate_map]
    if invalid_user_ids:
        raise ValueError(
            f"{APPOINTMENT_INTERVIEW_STAGE_LABELS[stage]}审批人不在候选范围内: {invalid_user_ids}"
        )

    stage_meta = (preview_stage_map or {}).get(stage, {})
    allow_multi_approver = bool(stage_meta.get("allow_multi_approver"))
    if not allow_multi_approver and len(user_ids) > 1:
        raise ValueError(
            f"{APPOINTMENT_INTERVIEW_STAGE_LABELS[stage]}仅允许选择一位审批人"
        )


def _set_selected_approver_user_ids(
    db: Session,
    record: AppointmentInterviewRecord,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record, db)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    preview_stage_map = _get_preview_stage_map(db, record)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(
            db,
            record,
            stage,
            user_ids,
            preview_stage_map=preview_stage_map,
        )
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        APPOINTMENT_INTERVIEW_APPROVAL_STAGES,
    )
    return normalized


def resolve_stage_approvers(
    db: Session,
    record: AppointmentInterviewRecord,
    stage: str,
) -> list[User]:
    selected_map = get_selected_approver_user_ids(record)
    if selected_map.get(stage):
        return _sort_and_dedupe_users(_get_active_users_by_ids(db, selected_map[stage]))

    auto_approvers = _resolve_auto_stage_approvers(db, record, stage)
    stage_meta = _get_preview_stage_map(db, record).get(stage, {})
    if stage_meta.get("applicant_selectable") is False:
        return auto_approvers
    if record.status in {"pending", "approved"}:
        return auto_approvers
    if len(auto_approvers) == 1:
        return auto_approvers
    return []


def get_stage_approver_ids(
    db: Session,
    record: AppointmentInterviewRecord,
    stage: str,
) -> list[int]:
    return [item.user_id for item in resolve_stage_approvers(db, record, stage)]


def build_approver_candidate_preview(
    db: Session,
    *,
    campus: str,
    created_by_user_id: Optional[int] = None,
    selected_approver_user_ids: Optional[dict[str, list[int]]] = None,
) -> list[dict]:
    record = AppointmentInterviewRecord(
        campus=campus.strip(),
        created_by_user_id=created_by_user_id,
        status="draft",
    )
    flow_stages = get_flow_stages(record, db)
    preview_stage_map = _get_preview_stage_map(db, record)
    preview_map = normalize_selected_approver_map(
        selected_approver_user_ids, flow_stages
    )
    preview_items: list[dict] = []
    for stage in flow_stages:
        candidate_users = get_stage_candidate_users(db, record, stage)
        auto_approvers = _resolve_auto_stage_approvers(db, record, stage)
        stage_meta = preview_stage_map.get(stage, {})
        applicant_selectable = bool(stage_meta.get("applicant_selectable", True))
        allow_multi_approver = bool(stage_meta.get("allow_multi_approver", False))

        if preview_map.get(stage):
            recommended_user_ids = preview_map[stage]
        elif not applicant_selectable:
            recommended_user_ids = [item.user_id for item in auto_approvers]
        elif len(auto_approvers) == 1:
            recommended_user_ids = [auto_approvers[0].user_id]
        else:
            recommended_user_ids = []

        preview_items.append(
            {
                "stage": stage,
                "stage_label": APPOINTMENT_INTERVIEW_STAGE_LABELS[stage],
                "recommended_user_ids": recommended_user_ids,
                "approvers": [_serialize_approver(item) for item in candidate_users],
                "allow_multi_approver": allow_multi_approver,
                "applicant_selectable": applicant_selectable,
            }
        )
    return preview_items


def validate_full_approval_chain(
    db: Session,
    record: AppointmentInterviewRecord,
) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record, db):
        if not get_stage_approver_ids(db, record, stage):
            missing_stages.append(APPOINTMENT_INTERVIEW_STAGE_LABELS[stage])
    return missing_stages


def _clear_stage_approvals(record: AppointmentInterviewRecord) -> None:
    for approval_field, passed_field in STAGE_FIELD_MAP.values():
        setattr(record, approval_field, {})
        setattr(record, passed_field, None)


def _set_stage_result(
    record: AppointmentInterviewRecord,
    stage: str,
    *,
    comment: str,
    signer: str,
    passed: bool,
) -> None:
    approval_field, passed_field = STAGE_FIELD_MAP[stage]
    setattr(
        record,
        approval_field,
        {
            "opinion": comment,
            "signer": signer,
            "sign_date": date.today().isoformat(),
        },
    )
    setattr(record, passed_field, passed)


def _get_stage_result(
    record: AppointmentInterviewRecord, stage: str
) -> tuple[dict, Optional[bool]]:
    approval_field, passed_field = STAGE_FIELD_MAP[stage]
    return getattr(record, approval_field) or {}, getattr(record, passed_field)


def _has_approval_history(
    record: AppointmentInterviewRecord, current_user: Optional[User]
) -> bool:
    if current_user is None:
        return False
    return any(
        action.approver_user_id == current_user.user_id
        for action in record.approval_actions
    )


def _create_record_notification(
    db: Session,
    *,
    record: AppointmentInterviewRecord,
    recipient_user_id: Optional[int],
    notification_type: str,
    title: str,
    content: str,
    stage: Optional[str] = None,
    action_by_user: Optional[User] = None,
) -> None:
    if not recipient_user_id:
        return
    db.add(
        AppointmentInterviewRecordNotification(
            record_id=record.id,
            recipient_user_id=recipient_user_id,
            notification_type=notification_type,
            title=title,
            content=content,
            stage=stage,
            action_by_user_id=action_by_user.user_id if action_by_user else None,
            action_by_name=action_by_user.real_name if action_by_user else None,
        )
    )


def _notify_stage_approvers(
    db: Session,
    *,
    record: AppointmentInterviewRecord,
    stage: str,
    action_by_user: Optional[User],
) -> None:
    stage_approvers = resolve_stage_approvers(db, record, stage)
    record_no = _get_record_no(record)
    for approver in stage_approvers:
        _create_record_notification(
            db,
            record=record,
            recipient_user_id=approver.user_id,
            notification_type="pending_stage",
            title=f"任命访谈记录待审批：{record.interviewee}/{record.campus}",
            content=(
                f"任命访谈记录《{record_no}》已流转至【{APPOINTMENT_INTERVIEW_STAGE_LABELS[stage]}】环节，"
                "请及时处理。"
            ),
            stage=stage,
            action_by_user=action_by_user,
        )


def get_unread_notification_count(db: Session, recipient_user_id: int) -> int:
    return (
        db.query(AppointmentInterviewRecordNotification)
        .filter(
            AppointmentInterviewRecordNotification.recipient_user_id
            == recipient_user_id,
            AppointmentInterviewRecordNotification.is_read.is_(False),
        )
        .count()
    )


def list_record_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[AppointmentInterviewRecordNotification]:
    query = (
        db.query(AppointmentInterviewRecordNotification)
        .options(selectinload(AppointmentInterviewRecordNotification.record))
        .filter(
            AppointmentInterviewRecordNotification.recipient_user_id
            == recipient_user_id
        )
    )
    if unread_only:
        query = query.filter(AppointmentInterviewRecordNotification.is_read.is_(False))
    return query.order_by(
        AppointmentInterviewRecordNotification.created_at.desc()
    ).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[AppointmentInterviewRecordNotification]:
    record = (
        db.query(AppointmentInterviewRecordNotification)
        .options(selectinload(AppointmentInterviewRecordNotification.record))
        .filter(
            AppointmentInterviewRecordNotification.id == notification_id,
            AppointmentInterviewRecordNotification.recipient_user_id
            == recipient_user_id,
        )
        .first()
    )
    if not record:
        return None
    if not record.is_read:
        record.is_read = True
        record.read_at = datetime.now()
        db.commit()
        db.refresh(record)
    return record


def mark_all_notifications_read(db: Session, recipient_user_id: int) -> int:
    records = (
        db.query(AppointmentInterviewRecordNotification)
        .filter(
            AppointmentInterviewRecordNotification.recipient_user_id
            == recipient_user_id,
            AppointmentInterviewRecordNotification.is_read.is_(False),
        )
        .all()
    )
    if not records:
        return 0
    now = datetime.now()
    for record in records:
        record.is_read = True
        record.read_at = now
    db.commit()
    return len(records)


def can_view_record(
    db: Session,
    record: AppointmentInterviewRecord,
    current_user: User,
) -> bool:
    if _has_manage_privilege(current_user, record):
        return True
    if record.status == "draft":
        return False
    if _has_approval_history(record, current_user):
        return True

    current_user_name = _normalize_scope_value(current_user.real_name)
    for stage in get_flow_stages(record, db):
        approval_payload, _ = _get_stage_result(record, stage)
        if _normalize_scope_value(approval_payload.get("signer")) == current_user_name:
            return True

    if record.status == "pending" and record.current_stage:
        return current_user.user_id in get_stage_approver_ids(
            db, record, record.current_stage
        )

    if record.status in {"approved", "rejected"}:
        for stage in get_flow_stages(record, db):
            if current_user.user_id in get_stage_approver_ids(db, record, stage):
                return True
    return False


def get_record(db: Session, record_id: int) -> Optional[AppointmentInterviewRecord]:
    return (
        db.query(AppointmentInterviewRecord)
        .options(selectinload(AppointmentInterviewRecord.approval_actions))
        .filter(AppointmentInterviewRecord.id == record_id)
        .first()
    )


def get_record_by_source_promotion_interview_id(
    db: Session,
    source_promotion_interview_id: int,
) -> Optional[AppointmentInterviewRecord]:
    return (
        db.query(AppointmentInterviewRecord)
        .options(selectinload(AppointmentInterviewRecord.approval_actions))
        .filter(
            AppointmentInterviewRecord.source_promotion_interview_id
            == source_promotion_interview_id
        )
        .first()
    )


def ensure_record_for_qualified_interview(
    db: Session,
    interview: PromotionInterview,
) -> Optional[AppointmentInterviewRecord]:
    if not interview.is_qualified or interview.source_application_id is None:
        return None

    application = (
        db.query(PromotionApplication)
        .filter(PromotionApplication.id == interview.source_application_id)
        .first()
    )
    if application is None:
        return None

    interviewee = _normalize_required_str(application.name, "被访谈人员")
    campus = _normalize_required_str(application.campus or interview.campus, "所属神殿")
    record = get_record_by_source_promotion_interview_id(db, interview.id)
    if record is None:
        record = AppointmentInterviewRecord(
            source_application_id=application.id,
            source_promotion_interview_id=interview.id,
            campus=campus,
            interviewer="",
            interviewee=interviewee,
            location=None,
            interview_date=interview.interview_date,
            answers=_normalize_answers([]),
            suggestions=None,
            self_sign={},
            principal_approval={},
            hr_approval={},
            chairman_approval={},
            status="draft",
            created_by_user_id=application.created_by_user_id
            or interview.created_by_user_id,
            created_by_name=application.created_by_name or interview.created_by_name,
        )
        db.add(record)
        db.flush()
        return record

    record.source_application_id = application.id
    if record.status in {"draft", "rejected"}:
        record.campus = campus
        record.interviewee = interviewee
    if record.created_by_user_id is None:
        record.created_by_user_id = (
            application.created_by_user_id or interview.created_by_user_id
        )
    if not record.created_by_name:
        record.created_by_name = application.created_by_name or interview.created_by_name
    return record


def list_records(
    db: Session,
    *,
    current_user: User,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> list[AppointmentInterviewRecord]:
    query = db.query(AppointmentInterviewRecord).options(
        selectinload(AppointmentInterviewRecord.approval_actions)
    )
    if status:
        query = query.filter(AppointmentInterviewRecord.status == status.strip())
    if search and search.strip():
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AppointmentInterviewRecord.campus.ilike(keyword),
                AppointmentInterviewRecord.interviewer.ilike(keyword),
                AppointmentInterviewRecord.interviewee.ilike(keyword),
                AppointmentInterviewRecord.location.ilike(keyword),
            )
        )

    items = query.order_by(AppointmentInterviewRecord.created_at.desc()).all()
    return [item for item in items if can_view_record(db, item, current_user)]


def create_record(
    db: Session,
    payload: AppointmentInterviewRecordCreate,
    current_user: User,
) -> AppointmentInterviewRecord:
    record = AppointmentInterviewRecord(
        campus=_normalize_required_str(payload.campus, "所属神殿"),
        interviewer=_normalize_required_str(payload.interviewer, "访谈人员"),
        interviewee=_normalize_required_str(payload.interviewee, "被访谈人员"),
        location=_normalize_optional_str(payload.location),
        interview_date=payload.interview_date,
        answers=_normalize_answers(payload.answers),
        suggestions=_normalize_optional_str(payload.suggestions),
        self_sign=_normalize_approval_info(payload.self_sign),
        principal_approval={},
        hr_approval={},
        chairman_approval={},
        status="draft",
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)
    db.add(record)
    db.commit()
    db.refresh(record)
    return get_record(db, record.id) or record


def update_record(
    db: Session,
    record: AppointmentInterviewRecord,
    payload: AppointmentInterviewRecordUpdate,
    current_user: User,
) -> AppointmentInterviewRecord:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权编辑该记录")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    if payload.campus is not None:
        record.campus = _normalize_required_str(payload.campus, "所属神殿")
    if payload.interviewer is not None:
        record.interviewer = _normalize_required_str(payload.interviewer, "访谈人员")
    if payload.interviewee is not None:
        record.interviewee = _normalize_required_str(payload.interviewee, "被访谈人员")
    if payload.location is not None:
        record.location = _normalize_optional_str(payload.location)
    if payload.interview_date is not None:
        record.interview_date = payload.interview_date
    if payload.answers is not None:
        record.answers = _normalize_answers(payload.answers)
    if payload.suggestions is not None:
        record.suggestions = _normalize_optional_str(payload.suggestions)
    if payload.self_sign is not None:
        record.self_sign = _normalize_approval_info(payload.self_sign)
    if payload.selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_record(db, record.id) or record


def delete_record(
    db: Session,
    record: AppointmentInterviewRecord,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该记录")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def submit_record(
    db: Session,
    record: AppointmentInterviewRecord,
    current_user: User,
) -> AppointmentInterviewRecord:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该记录")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

    _normalize_required_str(record.campus, "所属神殿")
    _normalize_required_str(record.interviewer, "访谈人员")
    _normalize_required_str(record.interviewee, "被访谈人员")
    self_sign = _normalize_approval_info(record.self_sign)
    if not self_sign.get("signer"):
        raise ValueError("提交前请先填写本人签字")
    if not self_sign.get("sign_date"):
        raise ValueError("提交前请先填写本人签字日期")

    missing_stages = validate_full_approval_chain(db, record)
    if missing_stages:
        raise ValueError(f"审批链不完整，缺少：{'、'.join(missing_stages)}")

    flow_stages = get_flow_stages(record, db)
    _clear_stage_approvals(record)
    record.status = "pending"
    record.current_stage = flow_stages[0]
    record.rejection_reason = None
    record.submitted_at = datetime.now()
    record.completed_at = None

    db.add(
        AppointmentInterviewRecordApprovalAction(
            record_id=record.id,
            stage="submit",
            action="submit",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment="提交审批",
        )
    )
    _notify_stage_approvers(
        db,
        record=record,
        stage=flow_stages[0],
        action_by_user=current_user,
    )

    db.commit()
    db.refresh(record)
    return get_record(db, record.id) or record


def approve_record(
    db: Session,
    record: AppointmentInterviewRecord,
    current_user: User,
    *,
    comment: str,
) -> AppointmentInterviewRecord:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前记录不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(AppointmentInterviewRecordApprovalAction)
        .filter(
            AppointmentInterviewRecordApprovalAction.record_id == record.id,
            AppointmentInterviewRecordApprovalAction.stage == current_stage,
            AppointmentInterviewRecordApprovalAction.approver_user_id
            == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    normalized_comment = _normalize_required_str(comment, "审批意见")
    _set_stage_result(
        record,
        current_stage,
        comment=normalized_comment,
        signer=current_user.real_name,
        passed=True,
    )
    db.add(
        AppointmentInterviewRecordApprovalAction(
            record_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=normalized_comment,
        )
    )

    flow_stages = get_flow_stages(record, db)
    current_index = flow_stages.index(current_stage)
    if current_index == len(flow_stages) - 1:
        from app.crud.human_resources import employee_archive as employee_archive_crud

        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        record.rejection_reason = None
        employee_archive_crud.sync_archive_from_appointment_interview_approval(
            db, record
        )
        _create_record_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"任命访谈记录已通过：{record.interviewee}/{record.campus}",
            content=(
                f"你的任命访谈记录《{_get_record_no(record)}》已完成全部审批并通过。"
                f" 当前环节：{APPOINTMENT_INTERVIEW_STAGE_LABELS[current_stage]}。"
                f" 审批意见：{normalized_comment}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )
    else:
        next_stage = flow_stages[current_index + 1]
        next_stage_approvers = get_stage_approver_ids(db, record, next_stage)
        if not next_stage_approvers:
            raise ValueError(
                f"下一阶段“{APPOINTMENT_INTERVIEW_STAGE_LABELS[next_stage]}”未配置审批人"
            )
        record.current_stage = next_stage
        record.completed_at = None
        record.rejection_reason = None
        _create_record_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"任命访谈记录流转更新：{record.interviewee}/{record.campus}",
            content=(
                f"你的任命访谈记录《{_get_record_no(record)}》已通过【{APPOINTMENT_INTERVIEW_STAGE_LABELS[current_stage]}】审批，"
                f" 当前已流转至【{APPOINTMENT_INTERVIEW_STAGE_LABELS[next_stage]}】。"
                f" 审批意见：{normalized_comment}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )
        _notify_stage_approvers(
            db,
            record=record,
            stage=next_stage,
            action_by_user=current_user,
        )

    db.commit()
    db.refresh(record)
    return get_record(db, record.id) or record


def reject_record(
    db: Session,
    record: AppointmentInterviewRecord,
    current_user: User,
    *,
    comment: str,
) -> AppointmentInterviewRecord:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前记录不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    normalized_comment = _normalize_required_str(comment, "驳回意见")
    _set_stage_result(
        record,
        current_stage,
        comment=normalized_comment,
        signer=current_user.real_name,
        passed=False,
    )
    db.add(
        AppointmentInterviewRecordApprovalAction(
            record_id=record.id,
            stage=current_stage,
            action="reject",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=normalized_comment,
        )
    )
    record.status = "rejected"
    record.current_stage = None
    record.rejection_reason = normalized_comment
    record.completed_at = datetime.now()
    _create_record_notification(
        db,
        record=record,
        recipient_user_id=record.created_by_user_id,
        notification_type="rejected",
        title=f"任命访谈记录已驳回：{record.interviewee}/{record.campus}",
        content=(
            f"你的任命访谈记录《{_get_record_no(record)}》在【{APPOINTMENT_INTERVIEW_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{normalized_comment}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )

    db.commit()
    db.refresh(record)
    return get_record(db, record.id) or record


def build_approval_flow(
    db: Session,
    record: AppointmentInterviewRecord,
) -> list[dict]:
    steps: list[dict] = []
    flow_stages = get_flow_stages(record, db)
    actions_by_stage: dict[str, list[AppointmentInterviewRecordApprovalAction]] = {
        stage: [] for stage in flow_stages
    }
    for action in record.approval_actions:
        if action.stage in actions_by_stage:
            actions_by_stage[action.stage].append(action)

    for stage in flow_stages:
        stage_actions = actions_by_stage.get(stage, [])
        latest_action = stage_actions[-1] if stage_actions else None
        approval_payload, passed = _get_stage_result(record, stage)

        if latest_action is not None:
            if latest_action.action == "reject":
                status = "rejected"
            elif latest_action.action == "approve":
                status = "completed"
            elif record.status == "pending" and record.current_stage == stage:
                status = "current"
            else:
                status = "waiting"
            action = latest_action.action
            action_label = ACTION_LABELS.get(latest_action.action, latest_action.action)
            acted_by_user_id = latest_action.approver_user_id
            acted_by_name = latest_action.approver_name
            comment = latest_action.comment
            acted_at = latest_action.created_at
        else:
            if passed is False:
                status = "rejected"
                action = "reject"
                action_label = ACTION_LABELS["reject"]
            elif passed is True:
                status = "completed"
                action = "approve"
                action_label = ACTION_LABELS["approve"]
            elif record.status == "pending" and record.current_stage == stage:
                status = "current"
                action = None
                action_label = None
            else:
                status = "waiting"
                action = None
                action_label = None
            acted_by_user_id = None
            acted_by_name = approval_payload.get("signer")
            comment = approval_payload.get("opinion")
            acted_at = _approval_acted_at(approval_payload)

        steps.append(
            {
                "stage": stage,
                "stage_label": APPOINTMENT_INTERVIEW_STAGE_LABELS[stage],
                "status": status,
                "status_label": APPOINTMENT_INTERVIEW_FLOW_STATUS_LABELS[status],
                "approvers": [
                    _serialize_approver(item)
                    for item in resolve_stage_approvers(db, record, stage)
                ],
                "action": action,
                "action_label": action_label,
                "acted_by_user_id": acted_by_user_id,
                "acted_by_name": acted_by_name,
                "comment": comment,
                "acted_at": acted_at,
            }
        )
    return steps


def serialize_approval_action(action: AppointmentInterviewRecordApprovalAction) -> dict:
    if action.stage == "submit":
        stage_label = "提交"
    else:
        stage_label = APPOINTMENT_INTERVIEW_STAGE_LABELS.get(action.stage, action.stage)
    return {
        "id": action.id,
        "stage": action.stage,
        "stage_label": stage_label,
        "action": action.action,
        "approver_user_id": action.approver_user_id,
        "approver_name": action.approver_name,
        "comment": action.comment,
        "created_at": action.created_at,
    }


def serialize_notification(record: AppointmentInterviewRecordNotification) -> dict:
    return {
        "id": record.id,
        "record_id": record.record_id,
        "record_no": _format_record_no(record.record_id),
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": APPOINTMENT_INTERVIEW_STAGE_LABELS.get(
            record.stage or "", record.stage
        ),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_record(
    record: AppointmentInterviewRecord,
    current_user: Optional[User],
    db: Session,
) -> dict:
    current_approvers: list[dict] = []
    can_approve = False
    if record.status == "pending" and record.current_stage:
        approvers = resolve_stage_approvers(db, record, record.current_stage)
        current_approvers = [_serialize_approver(item) for item in approvers]
        if current_user:
            can_approve = any(
                item.user_id == current_user.user_id for item in approvers
            )

    can_manage = current_user is not None and _has_manage_privilege(
        current_user, record
    )

    return {
        "id": record.id,
        "campus": record.campus,
        "interviewer": record.interviewer,
        "interviewee": record.interviewee,
        "location": record.location,
        "interview_date": record.interview_date,
        "answers": _normalize_answers(record.answers),
        "suggestions": record.suggestions,
        "self_sign": _parse_approval_info(record.self_sign),
        "principal_approval": _parse_approval_info(record.principal_approval),
        "principal_passed": record.principal_passed,
        "hr_approval": _parse_approval_info(record.hr_approval),
        "hr_passed": record.hr_passed,
        "chairman_approval": _parse_approval_info(record.chairman_approval),
        "chairman_passed": record.chairman_passed,
        "status": record.status,
        "status_label": APPOINTMENT_INTERVIEW_STATUS_LABELS.get(
            record.status, record.status
        ),
        "current_stage": record.current_stage,
        "current_stage_label": APPOINTMENT_INTERVIEW_STAGE_LABELS.get(
            record.current_stage or "", None
        ),
        "rejection_reason": record.rejection_reason,
        "submitted_at": record.submitted_at,
        "completed_at": record.completed_at,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "selected_approver_user_ids": get_selected_approver_user_ids(record),
        "can_edit": can_manage and record.status in {"draft", "rejected"},
        "can_delete": can_manage and record.status in {"draft", "rejected"},
        "can_submit": can_manage and record.status in {"draft", "rejected"},
        "can_approve": can_approve,
        "current_approvers": current_approvers,
        "approval_flow": build_approval_flow(db, record),
        "approval_actions": [
            serialize_approval_action(item) for item in record.approval_actions
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
