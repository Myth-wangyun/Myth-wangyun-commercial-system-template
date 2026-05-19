from __future__ import annotations

from decimal import Decimal
import re
from typing import Optional

from sqlalchemy import Date, cast, func, or_
from sqlalchemy.orm import Session

from app.crud.human_resources.dashboard_scope import (
    HQ_SCOPE,
    OFFLINE_SCOPE,
    is_management_center_campus,
    list_scope_orgs,
    normalize_scope,
    normalize_text,
    resolve_org_name,
    resolve_scope,
)
from app.models.human_resources.appointment_interview_record import (
    AppointmentInterviewRecord,
)
from app.models.human_resources.employee_archive_change_log import (
    EmployeeArchiveChangeLog,
)
from app.models.human_resources.employee import EmployeeProfile
from app.models.human_resources.promotion_application import PromotionApplication
from app.models.human_resources.recruitment_request import RecruitmentRequest
from app.models.human_resources.regularization_application import RegularizationApplication
from app.models.human_resources.resignation_approval import ResignationApproval
from app.models.human_resources.social_insurance_application import SocialInsuranceApplication
from app.models.human_resources.transfer_application import TransferApplication
from app.models.human_resources.unpaid_leave_application import UnpaidLeaveApplication
from app.models.user import User, UserRole, UserStatus
from app.schemas.human_resources.employee_archive import EmployeeArchiveUpsert

HQ_DEFAULT_DEPARTMENTS = ["运营部", "神藏司", "人资部", "教化司", "智慧司", "祈福司", "市场部"]
POSITION_CATEGORY_OPTIONS = ["干部", "员工"]
MANAGEMENT_POSITION_KEYWORDS = (
    "主管",
    "经理",
    "总监",
    "部长",
    "主任",
    "负责人",
    "校长",
    "副校长",
    "董事长",
)
EMERGENCY_CONTACT_PHONE_PATTERN = re.compile(r"1\d{10}")
HR_EDITABLE_FIELDS = {
    "name",
    "department",
    "position",
    "phone",
    "gender",
    "entry_date",
    "labor_relation_company",
    "actual_work_company",
    "position_category",
    "position_nature",
    "ethnicity",
    "native_place",
    "contract_sign_date",
    "contract_end_date",
    "id_number",
    "birth_date",
    "political_status",
    "marital_status",
    "first_education",
    "first_major",
    "first_school",
    "first_remark",
    "second_education",
    "second_major",
    "second_school",
    "second_remark",
    "title_level",
    "hukou_address",
    "current_address",
    "emergency_contact_name",
    "emergency_contact_phone",
    "emergency_contact",
    "bank_account_name",
    "bank_name",
    "bank_card_number",
    "base_salary",
    "performance_salary",
    "personnel_change",
    "reward_welfare",
    "archive_remark",
}
SELF_EDITABLE_FIELDS = {
    "name",
    "department",
    "position",
    "phone",
    "gender",
    "entry_date",
    "position_category",
    "ethnicity",
    "native_place",
    "contract_sign_date",
    "contract_end_date",
    "id_number",
    "birth_date",
    "political_status",
    "marital_status",
    "first_education",
    "first_major",
    "first_school",
    "first_remark",
    "second_education",
    "second_major",
    "second_school",
    "second_remark",
    "title_level",
    "hukou_address",
    "current_address",
    "emergency_contact_name",
    "emergency_contact_phone",
    "emergency_contact",
    "bank_account_name",
    "bank_name",
    "bank_card_number",
}
USER_SYNC_FIELDS = {"name", "department", "position", "phone", "gender", "entry_date"}
TRACKED_CHANGE_FIELD_LABELS = {
    "base_salary": "基础薪资",
    "performance_salary": "绩效薪资",
    "personnel_change": "人事变动",
}
CHANGE_SOURCE_LABELS = {
    "manual_edit": "员工档案编辑",
    "promotion_application_sync": "晋升申请同步",
    "transfer_application_sync": "调岗申请同步",
}
POSITION_NATURE_FORMAL = "正式"
POSITION_NATURE_UNPAID = "停薪留职"
POSITION_NATURE_RESIGNED = "离职"
POSITION_NATURE_PROBATION = "试用期"


def _normalize_text(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _clean_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _normalize_tracked_change_value(field: str, value) -> Optional[str]:
    if value is None:
        return None
    if field in {"base_salary", "performance_salary"}:
        return format(Decimal(str(value)).quantize(Decimal("0.01")), "f")
    return _clean_optional_text(str(value))


def _resolve_position_nature_override(
    profile: Optional[EmployeeProfile],
) -> Optional[str]:
    return _clean_optional_text(
        profile.position_nature_override if profile else None
    )


def _resolve_position_category_from_position(
    position: Optional[str],
) -> Optional[str]:
    normalized_position = normalize_text(position)
    if not normalized_position:
        return None
    if any(keyword in normalized_position for keyword in MANAGEMENT_POSITION_KEYWORDS):
        return POSITION_CATEGORY_OPTIONS[0]
    return POSITION_CATEGORY_OPTIONS[1]


def _append_employee_archive_change_log(
    db: Session,
    *,
    profile: EmployeeProfile,
    field_name: str,
    old_value,
    new_value,
    change_source: str,
    source_record_id: Optional[int] = None,
    changed_by_user: Optional[User] = None,
    changed_by_name: Optional[str] = None,
) -> None:
    normalized_old = _normalize_tracked_change_value(field_name, old_value)
    normalized_new = _normalize_tracked_change_value(field_name, new_value)
    if normalized_old == normalized_new:
        return

    db.add(
        EmployeeArchiveChangeLog(
            employee_id=profile.id,
            field_name=field_name,
            old_value=normalized_old,
            new_value=normalized_new,
            change_source=change_source,
            source_record_id=source_record_id,
            changed_by_user_id=changed_by_user.user_id if changed_by_user else None,
            changed_by_name=changed_by_user.real_name
            if changed_by_user
            else _clean_optional_text(changed_by_name),
        )
    )


def _update_tracked_profile_field(
    db: Session,
    *,
    profile: EmployeeProfile,
    field_name: str,
    value,
    change_source: str,
    source_record_id: Optional[int] = None,
    changed_by_user: Optional[User] = None,
    changed_by_name: Optional[str] = None,
) -> None:
    normalized_value = (
        _clean_optional_text(value) if field_name == "personnel_change" else value
    )
    old_value = getattr(profile, field_name, None)
    setattr(profile, field_name, normalized_value)
    _append_employee_archive_change_log(
        db,
        profile=profile,
        field_name=field_name,
        old_value=old_value,
        new_value=normalized_value,
        change_source=change_source,
        source_record_id=source_record_id,
        changed_by_user=changed_by_user,
        changed_by_name=changed_by_name,
    )


def _split_legacy_emergency_contact(value: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    raw = (value or "").strip()
    if not raw:
        return None, None

    match = EMERGENCY_CONTACT_PHONE_PATTERN.search(raw)
    if not match:
        return raw, None

    phone = match.group(0)
    name = EMERGENCY_CONTACT_PHONE_PATTERN.sub("", raw, count=1)
    name = re.sub(r"[\s,:，：;；/|()（）-]+", " ", name).strip()
    return name or None, phone


def _compose_emergency_contact(
    name: Optional[str],
    phone: Optional[str],
    legacy: Optional[str] = None,
) -> Optional[str]:
    normalized_name = _clean_optional_text(name)
    normalized_phone = _clean_optional_text(phone)
    if normalized_name and normalized_phone:
        return f"{normalized_name} {normalized_phone}"
    if normalized_name:
        return normalized_name
    if normalized_phone:
        return normalized_phone
    return _clean_optional_text(legacy)


def _resolve_emergency_contact_parts(
    profile: Optional[EmployeeProfile],
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    if profile is None:
        return None, None, None

    name = _clean_optional_text(getattr(profile, "emergency_contact_name", None))
    phone = _clean_optional_text(getattr(profile, "emergency_contact_phone", None))
    legacy = _clean_optional_text(profile.emergency_contact)
    if not name and not phone and legacy:
        name, phone = _split_legacy_emergency_contact(legacy)
    return name, phone, legacy


def has_hr_manage_privilege(user: Optional[User]) -> bool:
    if not user:
        return False
    if user.is_superuser or user.role in {UserRole.ADMIN, UserRole.MANAGER}:
        return True
    department = _normalize_text(user.department)
    position = _normalize_text(user.position)
    return any(keyword in department for keyword in ("人资", "人事", "行政")) or any(
        keyword in position for keyword in ("人资", "人事", "hr")
    )


def _apply_user_scope(db: Session, *, scope: str):
    normalized_scope = normalize_scope(scope)
    query = db.query(User, EmployeeProfile).outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.user_id)
    if normalized_scope == HQ_SCOPE:
        return query.filter(
            or_(
                func.coalesce(User.campus, "").ilike("%最高议事厅%"),
                func.coalesce(User.campus, "").ilike("%总部%"),
                func.coalesce(EmployeeProfile.campus_name, "").ilike("%最高议事厅%"),
                func.coalesce(EmployeeProfile.campus_name, "").ilike("%总部%"),
            )
        )

    if normalized_scope == OFFLINE_SCOPE:
        orgs = list_scope_orgs(OFFLINE_SCOPE)
        predicates = []
        for org in orgs:
            keyword = normalize_text(org).replace("神殿", "").strip()
            if not keyword:
                continue
            predicates.extend(
                [
                    func.coalesce(User.campus, "").ilike(f"%{keyword}%"),
                    func.coalesce(EmployeeProfile.campus_name, "").ilike(f"%{keyword}%"),
                ]
            )
        return query.filter(
            or_(*predicates)
        )

    return query


def _matches_scope(scope: str, user: User, profile: Optional[EmployeeProfile]) -> bool:
    normalized_scope = normalize_scope(scope)
    campus_scope = resolve_scope(
        campus=profile.campus_name if profile and profile.campus_name else user.campus,
    )
    if campus_scope:
        return campus_scope == normalized_scope
    resolved_scope = resolve_scope(
        campus=profile.campus_name if profile and profile.campus_name else user.campus,
        department=profile.department if profile and profile.department else user.department,
        position=profile.position if profile and profile.position else user.position,
    )
    return resolved_scope == normalized_scope


def list_employee_archives(
    db: Session,
    *,
    scope: str = HQ_SCOPE,
    keyword: Optional[str] = None,
    include_inactive: bool = True,
):
    normalized_scope = normalize_scope(scope)
    query = _apply_user_scope(db, scope=normalized_scope)
    if not include_inactive:
        query = query.filter(User.status == UserStatus.ACTIVE)
    if keyword:
        like_keyword = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                User.real_name.ilike(like_keyword),
                func.coalesce(EmployeeProfile.department, User.department, "").ilike(like_keyword),
                func.coalesce(EmployeeProfile.position, User.position, "").ilike(like_keyword),
                func.coalesce(EmployeeProfile.contact, User.phone, "").ilike(like_keyword),
            )
        )
    rows = query.order_by(
        func.coalesce(EmployeeProfile.department, User.department, "").asc(),
        func.coalesce(EmployeeProfile.position, User.position, "").asc(),
        User.user_id.asc(),
    ).all()
    return [(user, profile) for user, profile in rows if _matches_scope(normalized_scope, user, profile)]


def get_employee_archive_by_user_id(db: Session, user_id: int):
    return get_employee_archive_by_user_id_in_scope(db, user_id=user_id, scope=HQ_SCOPE)


def get_employee_archive_by_user_id_in_scope(db: Session, *, user_id: int, scope: str):
    pair = _apply_user_scope(db, scope=scope).filter(User.user_id == user_id).first()
    if not pair:
        return None
    user, profile = pair
    if not _matches_scope(scope, user, profile):
        return None
    return pair


def _normalized_phone(value: Optional[str]) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def _candidate_names(user: User, profile: Optional[EmployeeProfile]) -> list[str]:
    values: list[str] = []
    for value in (user.real_name, profile.name if profile else None):
        normalized = normalize_text(value)
        if normalized and normalized not in values:
            values.append(normalized)
    return values


def _candidate_campuses(user: User, profile: Optional[EmployeeProfile]) -> list[str]:
    values: list[str] = []
    for value in (user.campus, profile.campus_name if profile else None):
        normalized = normalize_text(value)
        if normalized and normalized not in values:
            values.append(normalized)
    return values


def _build_name_match(column, user: User, profile: Optional[EmployeeProfile]):
    names = _candidate_names(user, profile)
    if not names:
        return None
    return or_(*[column == name for name in names])


def _build_campus_match(column, user: User, profile: Optional[EmployeeProfile]):
    campuses = _candidate_campuses(user, profile)
    if not campuses:
        return None

    predicates = [column == campus for campus in campuses if not is_management_center_campus(campus)]
    if any(is_management_center_campus(campus) for campus in campuses):
        predicates.extend([column.ilike("%最高议事厅%"), column.ilike("%总部%")])
    return or_(*predicates)


def _event_campus_matches(event_campus: Optional[str], user: User, profile: Optional[EmployeeProfile]) -> bool:
    normalized_event_campus = normalize_text(event_campus)
    if not normalized_event_campus:
        return True
    campuses = _candidate_campuses(user, profile)
    if not campuses:
        return True
    if is_management_center_campus(normalized_event_campus):
        return any(is_management_center_campus(campus) for campus in campuses)
    return normalized_event_campus in campuses


def _event_field_matches(event_value: Optional[str], current_value: Optional[str]) -> bool:
    normalized_event_value = normalize_text(event_value)
    if not normalized_event_value:
        return True
    return normalize_text(current_value) == normalized_event_value


def _get_user_profile_pair(db: Session, *, user_id: int):
    return (
        db.query(User, EmployeeProfile)
        .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.user_id)
        .filter(User.user_id == user_id)
        .first()
    )


def _find_archive_pair_for_event(
    db: Session,
    *,
    user_id: Optional[int] = None,
    name: Optional[str],
    campus: Optional[str],
    department: Optional[str] = None,
    position: Optional[str] = None,
    phone: Optional[str] = None,
):
    normalized_name = normalize_text(name)
    if user_id:
        pair = _get_user_profile_pair(db, user_id=user_id)
        if pair:
            user, profile = pair
            matched_names = _candidate_names(user, profile)
            if (
                normalized_name
                and normalized_name in matched_names
                and _event_campus_matches(campus, user, profile)
            ):
                return pair

    if not normalized_name:
        return None

    query = (
        db.query(User, EmployeeProfile)
        .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.user_id)
        .filter(
            or_(
                func.coalesce(EmployeeProfile.name, "") == normalized_name,
                User.real_name == normalized_name,
            )
        )
    )
    candidates = query.order_by(User.user_id.asc()).all()
    if not candidates:
        return None

    filtered = [
        pair
        for pair in candidates
        if _event_campus_matches(campus, pair[0], pair[1])
    ]
    if not filtered:
        filtered = candidates

    normalized_phone = _normalized_phone(phone)
    if normalized_phone:
        phone_filtered = [
            pair
            for pair in filtered
            if normalized_phone
            in {
                _normalized_phone(pair[0].phone),
                _normalized_phone(pair[1].contact if pair[1] else None),
            }
        ]
        if phone_filtered:
            filtered = phone_filtered

    if department:
        department_filtered = [
            pair
            for pair in filtered
            if _event_field_matches(
                department,
                pair[1].department if pair[1] and pair[1].department else pair[0].department,
            )
        ]
        if department_filtered:
            filtered = department_filtered

    if position:
        position_filtered = [
            pair
            for pair in filtered
            if _event_field_matches(
                position,
                pair[1].position if pair[1] and pair[1].position else pair[0].position,
            )
        ]
        if position_filtered:
            filtered = position_filtered

    return filtered[0] if len(filtered) == 1 else None


def _sync_profile_from_event(
    db: Session,
    *,
    pair,
    name: Optional[str] = None,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    phone: Optional[str] = None,
    gender: Optional[str] = None,
    entry_date=None,
    user_status: Optional[UserStatus] = None,
):
    if pair is None:
        return None
    user, profile = pair
    profile = profile or _get_or_create_profile(db, user)

    if name:
        user.real_name = name.strip()
        profile.name = name.strip()
    if department:
        normalized_department = department.strip()
        user.department = normalized_department
        profile.department = normalized_department
    if position:
        normalized_position = position.strip()
        user.position = normalized_position
        profile.position = normalized_position
    if phone:
        normalized_phone = phone.strip()
        user.phone = normalized_phone
        profile.contact = normalized_phone
    if gender is not None:
        user.gender = gender.strip() or None
    if entry_date is not None:
        user.entry_date = entry_date
    if campus:
        profile.campus_name = campus.strip()
    else:
        profile.campus_name = user.campus
    if user_status is not None:
        user.status = user_status
    profile.is_active = user.status == UserStatus.ACTIVE
    db.flush()
    return user, profile


def sync_archive_from_social_insurance_approval(db: Session, record: SocialInsuranceApplication):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        phone=record.phone,
    )
    return _sync_profile_from_event(
        db,
        pair=pair,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        phone=record.phone,
        entry_date=record.hire_date,
    )


def sync_archive_from_regularization_approval(db: Session, record: RegularizationApplication):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    return _sync_profile_from_event(
        db,
        pair=pair,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        gender=record.gender,
        entry_date=record.entry_date,
        user_status=UserStatus.ACTIVE,
    )


def sync_archive_from_unpaid_leave_approval(db: Session, record: UnpaidLeaveApplication):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        phone=record.phone,
    )
    result = _sync_profile_from_event(
        db,
        pair=pair,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        gender=record.gender,
        entry_date=record.entry_date,
    )
    if result is not None:
        _user, profile = result
        profile.position_nature_override = None
        db.flush()
    return result


def sync_archive_from_resignation_approval(db: Session, record: ResignationApproval):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    result = _sync_profile_from_event(
        db,
        pair=pair,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        gender=record.gender,
        entry_date=record.entry_date,
        user_status=UserStatus.INACTIVE,
    )
    if result is not None:
        _user, profile = result
        profile.position_nature_override = None
        db.flush()
    return result


def sync_archive_from_recruitment_request(db: Session, record: RecruitmentRequest):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.created_by_name,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    return _sync_profile_from_event(
        db,
        pair=pair,
        name=record.created_by_name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        entry_date=record.expected_date,
        user_status=UserStatus.ACTIVE,
    )


def sync_archive_from_transfer_application(db: Session, record: TransferApplication):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    result = _sync_profile_from_event(
        db,
        pair=pair,
        name=record.name,
        campus=record.campus,
        department=record.target_department,
        position=record.target_position,
        entry_date=record.entry_date,
    )
    if result is not None:
        _user, profile = result
        position_category = _resolve_position_category_from_position(
            record.target_position
        )
        if position_category:
            profile.position_category = position_category

        if (
            record.new_base_salary is not None
            or record.new_performance_salary is not None
        ):
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="base_salary",
                value=(
                    Decimal(str(record.new_base_salary))
                    if record.new_base_salary is not None
                    else None
                ),
                change_source="transfer_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="performance_salary",
                value=(
                    Decimal(str(record.new_performance_salary))
                    if record.new_performance_salary is not None
                    else None
                ),
                change_source="transfer_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
        elif record.new_salary is not None:
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="base_salary",
                value=Decimal(str(record.new_salary)),
                change_source="transfer_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="performance_salary",
                value=None,
                change_source="transfer_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
        db.flush()
    return result


def sync_archive_from_promotion_application(db: Session, record: PromotionApplication):
    pair = _find_archive_pair_for_event(
        db,
        user_id=record.created_by_user_id,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    result = _sync_profile_from_event(
        db,
        pair=pair,
        name=record.name,
        campus=record.campus,
        department=record.department,
        position=record.position,
        entry_date=record.entry_date,
    )
    if result is not None:
        _user, profile = result
        if record.promoted_level:
            profile.title_level = record.promoted_level.strip()
        if (
            record.promoted_base_salary is not None
            or record.promoted_performance_salary is not None
        ):
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="base_salary",
                value=(
                    Decimal(str(record.promoted_base_salary))
                    if record.promoted_base_salary is not None
                    else None
                ),
                change_source="promotion_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="performance_salary",
                value=(
                    Decimal(str(record.promoted_performance_salary))
                    if record.promoted_performance_salary is not None
                    else None
                ),
                change_source="promotion_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
        elif record.promoted_salary is not None:
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="base_salary",
                value=Decimal(str(record.promoted_salary)),
                change_source="promotion_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name="performance_salary",
                value=None,
                change_source="promotion_application_sync",
                source_record_id=record.id,
                changed_by_name="系统同步",
            )
        db.flush()
    return result


def sync_archive_from_appointment_interview_approval(
    db: Session, record: AppointmentInterviewRecord
):
    application = None
    if record.source_application_id is not None:
        application = (
            db.query(PromotionApplication)
            .filter(PromotionApplication.id == record.source_application_id)
            .first()
        )

    pair = _find_archive_pair_for_event(
        db,
        user_id=application.created_by_user_id if application else None,
        name=application.name if application else record.interviewee,
        campus=application.campus if application else record.campus,
        department=application.department if application else None,
        position=application.position if application else None,
    )
    if pair is None:
        pair = _find_archive_pair_for_event(
            db,
            name=record.interviewee,
            campus=record.campus,
        )
    if pair is None:
        return None

    user, profile = pair
    profile = profile or _get_or_create_profile(db, user)
    profile.position_category = POSITION_CATEGORY_OPTIONS[0]
    db.flush()
    return user, profile


def sync_archive_from_interview_registration(
    db: Session,
    *,
    name: Optional[str],
    campus: Optional[str],
    position: Optional[str],
    phone: Optional[str],
    onboard_date,
    final_hire_decision: Optional[str],
    reported: Optional[str],
):
    approved = normalize_text(final_hire_decision) == "是"
    reported_yes = normalize_text(reported) == "是"
    if not approved or not reported_yes or onboard_date is None:
        return None
    pair = _find_archive_pair_for_event(
        db,
        name=name,
        campus=campus,
        position=position,
        phone=phone,
    )
    return _sync_profile_from_event(
        db,
        pair=pair,
        name=name,
        campus=campus,
        position=position,
        phone=phone,
        entry_date=onboard_date,
        user_status=UserStatus.ACTIVE,
    )


def _latest_social_insurance_date(db: Session, user: User, profile: Optional[EmployeeProfile]):
    name_match = _build_name_match(SocialInsuranceApplication.name, user, profile)
    campus_match = _build_campus_match(SocialInsuranceApplication.campus, user, profile)
    if name_match is None or campus_match is None:
        return None
    approval_date = func.coalesce(
        cast(SocialInsuranceApplication.completed_at, Date),
        cast(SocialInsuranceApplication.updated_at, Date),
        cast(SocialInsuranceApplication.created_at, Date),
    )
    record = (
        db.query(SocialInsuranceApplication)
        .filter(
            SocialInsuranceApplication.status == "approved",
            name_match,
            campus_match,
        )
        .order_by(
            approval_date.desc().nullslast(),
            SocialInsuranceApplication.created_at.desc(),
        )
        .first()
    )
    if not record:
        return None
    if record.completed_at:
        return record.completed_at.date()
    if record.updated_at:
        return record.updated_at.date()
    if record.created_at:
        return record.created_at.date()
    return None


def _latest_leave_record(db: Session, user: User, profile: Optional[EmployeeProfile]):
    name_match = _build_name_match(ResignationApproval.name, user, profile)
    campus_match = _build_campus_match(ResignationApproval.campus, user, profile)
    if name_match is None or campus_match is None:
        return None
    return (
        db.query(ResignationApproval)
        .filter(
            ResignationApproval.status == "approved",
            name_match,
            campus_match,
        )
        .order_by(ResignationApproval.leave_date.desc(), ResignationApproval.created_at.desc())
        .first()
    )


def _latest_unpaid_leave_record(db: Session, user: User, profile: Optional[EmployeeProfile]):
    name_match = _build_name_match(UnpaidLeaveApplication.name, user, profile)
    campus_match = _build_campus_match(UnpaidLeaveApplication.campus, user, profile)
    if name_match is None or campus_match is None:
        return None
    return (
        db.query(UnpaidLeaveApplication)
        .filter(
            UnpaidLeaveApplication.status == "approved",
            name_match,
            campus_match,
        )
        .order_by(UnpaidLeaveApplication.completed_at.desc().nullslast(), UnpaidLeaveApplication.created_at.desc())
        .first()
    )


def _latest_regularization_record(db: Session, user: User, profile: Optional[EmployeeProfile]):
    name_match = _build_name_match(RegularizationApplication.name, user, profile)
    campus_match = _build_campus_match(RegularizationApplication.campus, user, profile)
    if name_match is None or campus_match is None:
        return None
    return (
        db.query(RegularizationApplication)
        .filter(
            RegularizationApplication.status == "approved",
            name_match,
            campus_match,
        )
        .order_by(RegularizationApplication.completed_at.desc().nullslast(), RegularizationApplication.created_at.desc())
        .first()
    )


def _resolve_unpaid_leave_effective_date(
    record: Optional[UnpaidLeaveApplication],
):
    if record is None:
        return None
    if record.completed_at:
        return record.completed_at.date()
    if record.updated_at:
        return record.updated_at.date()
    if record.created_at:
        return record.created_at.date()
    return record.fill_date


def _resolve_position_nature(db: Session, user: User, profile: Optional[EmployeeProfile]) -> str:
    if user.status == UserStatus.INACTIVE:
        return POSITION_NATURE_RESIGNED
    if _latest_leave_record(db, user, profile):
        return POSITION_NATURE_RESIGNED
    manual_override = _resolve_position_nature_override(profile)
    if manual_override:
        return manual_override
    if _latest_unpaid_leave_record(db, user, profile):
        return POSITION_NATURE_UNPAID
    if _latest_regularization_record(db, user, profile):
        return POSITION_NATURE_FORMAL
    return POSITION_NATURE_PROBATION


def _resolve_leave_date(
    db: Session, user: User, profile: Optional[EmployeeProfile]
):
    leave_record = _latest_leave_record(db, user, profile)
    if leave_record:
        return leave_record.leave_date
    if _resolve_position_nature_override(profile) == POSITION_NATURE_FORMAL:
        return None
    unpaid_record = _latest_unpaid_leave_record(db, user, profile)
    return _resolve_unpaid_leave_effective_date(unpaid_record)


def serialize_employee_archive(db: Session, user: User, profile: Optional[EmployeeProfile], current_user: Optional[User]):
    can_manage = has_hr_manage_privilege(current_user)
    can_self = current_user is not None and current_user.user_id == user.user_id
    leave_date = _resolve_leave_date(db, user, profile)
    emergency_contact_name, emergency_contact_phone, legacy_emergency_contact = _resolve_emergency_contact_parts(profile)
    return {
        "id": profile.id if profile else None,
        "user_id": user.user_id,
        "username": user.username,
        "campus_name": profile.campus_name if profile and profile.campus_name else user.campus,
        "name": profile.name if profile and profile.name else user.real_name,
        "department": profile.department if profile and profile.department else (user.department or ""),
        "position": profile.position if profile and profile.position else (user.position or ""),
        "position_category": profile.position_category if profile else None,
        "gender": user.gender,
        "ethnicity": profile.ethnicity if profile else None,
        "phone": profile.contact if profile and profile.contact else user.phone,
        "native_place": profile.native_place if profile else None,
        "entry_date": user.entry_date.date() if user.entry_date else None,
        "labor_relation_company": profile.labor_relation_company if profile else None,
        "actual_work_company": profile.actual_work_company if profile else None,
        "contract_sign_date": profile.contract_sign_date if profile else None,
        "contract_end_date": profile.contract_end_date if profile else None,
        "insurance_start_date": _latest_social_insurance_date(db, user, profile),
        "position_nature": _resolve_position_nature(db, user, profile),
        "leave_date": leave_date,
        "id_number": profile.id_number if profile else None,
        "birth_date": profile.birth_date if profile else None,
        "political_status": profile.political_status if profile else None,
        "marital_status": profile.marital_status if profile else None,
        "first_education": profile.first_education if profile else None,
        "first_major": profile.first_major if profile else None,
        "first_school": profile.first_school if profile else None,
        "first_remark": profile.first_remark if profile else None,
        "second_education": profile.second_education if profile else None,
        "second_major": profile.second_major if profile else None,
        "second_school": profile.second_school if profile else None,
        "second_remark": profile.second_remark if profile else None,
        "title_level": profile.title_level if profile else None,
        "hukou_address": profile.hukou_address if profile else None,
        "current_address": profile.current_address if profile else None,
        "emergency_contact_name": emergency_contact_name,
        "emergency_contact_phone": emergency_contact_phone,
        "emergency_contact": _compose_emergency_contact(
            emergency_contact_name,
            emergency_contact_phone,
            legacy_emergency_contact,
        ),
        "bank_account_name": profile.bank_account_name if profile else None,
        "bank_name": profile.bank_name if profile else None,
        "bank_card_number": profile.bank_card_number if profile else None,
        "base_salary": Decimal(profile.base_salary) if profile and profile.base_salary is not None else None,
        "performance_salary": Decimal(profile.performance_salary) if profile and profile.performance_salary is not None else None,
        "personnel_change": profile.personnel_change if profile else None,
        "reward_welfare": profile.reward_welfare if profile else None,
        "archive_remark": profile.archive_remark if profile else None,
        "user_status": user.status.value,
        "can_edit": can_manage or can_self,
        "can_edit_hr_fields": can_manage,
        "can_edit_self_fields": can_manage or can_self,
        "created_at": profile.created_at if profile else None,
        "updated_at": profile.updated_at if profile else None,
    }


def serialize_employee_archive_change_log(log: EmployeeArchiveChangeLog) -> dict:
    return {
        "id": log.id,
        "employee_id": log.employee_id,
        "field_name": log.field_name,
        "field_label": TRACKED_CHANGE_FIELD_LABELS.get(log.field_name, log.field_name),
        "old_value": log.old_value,
        "new_value": log.new_value,
        "change_source": log.change_source,
        "change_source_label": CHANGE_SOURCE_LABELS.get(
            log.change_source, log.change_source
        ),
        "source_record_id": log.source_record_id,
        "changed_by_user_id": log.changed_by_user_id,
        "changed_by_name": log.changed_by_name,
        "created_at": log.created_at,
    }


def list_employee_archive_change_logs(
    db: Session,
    *,
    user_id: int,
    current_user: User,
    scope: str = HQ_SCOPE,
) -> list[dict]:
    pair = get_employee_archive_by_user_id_in_scope(db, user_id=user_id, scope=scope)
    if not pair:
        raise ValueError("员工不存在")

    user, profile = pair
    can_manage = has_hr_manage_privilege(current_user)
    can_self = current_user.user_id == user.user_id
    if not can_manage and not can_self:
        raise PermissionError("无权查看该员工档案变更记录")
    if profile is None:
        return []

    rows = (
        db.query(EmployeeArchiveChangeLog)
        .filter(EmployeeArchiveChangeLog.employee_id == profile.id)
        .order_by(
            EmployeeArchiveChangeLog.created_at.desc(),
            EmployeeArchiveChangeLog.id.desc(),
        )
        .all()
    )
    return [serialize_employee_archive_change_log(row) for row in rows]


def get_archive_options(db: Session, *, scope: str = HQ_SCOPE):
    rows = list_employee_archives(db, scope=scope)
    department_values = set(HQ_DEFAULT_DEPARTMENTS if normalize_scope(scope) == HQ_SCOPE else [])
    position_values = set()
    for user, profile in rows:
        department = profile.department if profile and profile.department else user.department
        position = profile.position if profile and profile.position else user.position
        if department and department.strip():
            department_values.add(department.strip())
        if position and position.strip():
            position_values.add(position.strip())
    return {
        "departments": sorted(department_values),
        "positions": sorted(position_values),
        "position_categories": POSITION_CATEGORY_OPTIONS,
    }


def _get_or_create_profile(db: Session, user: User) -> EmployeeProfile:
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.user_id).first()
    if profile:
        return profile
    profile = EmployeeProfile(
        user_id=user.user_id,
        name=user.real_name,
        department=user.department or "",
        position=user.position or "",
        contact=user.phone or "",
        campus_name=user.campus,
        is_active=user.status == UserStatus.ACTIVE,
    )
    db.add(profile)
    db.flush()
    return profile


def upsert_employee_archive(
    db: Session,
    user_id: int,
    payload: EmployeeArchiveUpsert,
    current_user: User,
    *,
    scope: str = HQ_SCOPE,
):
    pair = get_employee_archive_by_user_id_in_scope(db, user_id=user_id, scope=scope)
    if not pair:
        raise ValueError("员工不存在")
    user, profile = pair
    can_manage = has_hr_manage_privilege(current_user)
    can_self = current_user.user_id == user.user_id
    if not can_manage and not can_self:
        raise PermissionError("无权编辑该员工档案")

    update_data = payload.model_dump(exclude_unset=True)
    allowed_fields = HR_EDITABLE_FIELDS if can_manage else SELF_EDITABLE_FIELDS
    invalid_fields = [field for field in update_data if field not in allowed_fields]
    if invalid_fields:
        raise PermissionError(f"当前角色不可编辑字段: {', '.join(invalid_fields)}")

    profile = profile or _get_or_create_profile(db, user)
    position_nature_value = update_data.pop("position_nature", None) if "position_nature" in update_data else None
    has_position_nature_update = "position_nature" in payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field in USER_SYNC_FIELDS:
            if field == "name":
                user.real_name = value or user.real_name
                profile.name = value or profile.name
            elif field == "phone":
                user.phone = value
                profile.contact = value or ""
            elif field == "department":
                user.department = value
                profile.department = value or ""
            elif field == "position":
                user.position = value
                profile.position = value or ""
            elif field == "gender":
                user.gender = value
            elif field == "entry_date":
                user.entry_date = value
            continue
        if field in TRACKED_CHANGE_FIELD_LABELS:
            _update_tracked_profile_field(
                db,
                profile=profile,
                field_name=field,
                value=value,
                change_source="manual_edit",
                changed_by_user=current_user,
            )
            continue
        setattr(profile, field, value)

    if has_position_nature_update:
        normalized_position_nature = _clean_optional_text(position_nature_value)
        current_position_nature = _resolve_position_nature(db, user, profile)
        if normalized_position_nature == POSITION_NATURE_FORMAL:
            if current_position_nature != POSITION_NATURE_UNPAID:
                raise ValueError("仅停薪留职状态可手动恢复为正式")
            profile.position_nature_override = POSITION_NATURE_FORMAL
        else:
            profile.position_nature_override = None

    emergency_name = _clean_optional_text(
        update_data.get("emergency_contact_name", getattr(profile, "emergency_contact_name", None))
    )
    emergency_phone = _clean_optional_text(
        update_data.get("emergency_contact_phone", getattr(profile, "emergency_contact_phone", None))
    )
    legacy_emergency_contact = update_data.get("emergency_contact", profile.emergency_contact)
    if not emergency_name and not emergency_phone:
        parsed_name, parsed_phone = _split_legacy_emergency_contact(legacy_emergency_contact)
        emergency_name = emergency_name or parsed_name
        emergency_phone = emergency_phone or parsed_phone
    profile.emergency_contact_name = emergency_name
    profile.emergency_contact_phone = emergency_phone
    profile.emergency_contact = _compose_emergency_contact(
        emergency_name,
        emergency_phone,
        legacy_emergency_contact,
    )

    profile.campus_name = user.campus
    profile.is_active = user.status == UserStatus.ACTIVE
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return user, profile


def serialize_employee_archive_for_scope(
    db: Session,
    user: User,
    profile: Optional[EmployeeProfile],
    current_user: Optional[User],
    *,
    scope: str,
):
    data = serialize_employee_archive(db, user, profile, current_user)
    data["scope"] = normalize_scope(scope)
    _campus = data.get("campus_name")
    _dept = data.get("department")
    _pos = data.get("position")
    campus_str: str | None = _campus if isinstance(_campus, str) else None
    dept_str: str | None = _dept if isinstance(_dept, str) else None
    pos_str: str | None = _pos if isinstance(_pos, str) else None
    data["org_name"] = resolve_org_name(
        scope,
        campus=campus_str,
        department=dept_str,
        position=pos_str,
    ) or normalize_text(dept_str) or normalize_text(campus_str)
    return data
