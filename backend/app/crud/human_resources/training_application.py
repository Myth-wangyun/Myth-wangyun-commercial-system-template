"""
集团人资基础 - 培训申请表 CRUD
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
import re
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.training_application import (
    TrainingApplication,
    TrainingApplicationApprovalAction,
    TrainingApplicationNotification,
)
from app.models.human_resources.training_result import TrainingResult
from app.models.human_resources.training_satisfaction import TrainingSatisfactionSurvey
from app.models.user import User, UserStatus
from app.schemas.human_resources.training_application import (
    TRAINING_APPLICATION_APPROVAL_STAGES,
    TRAINING_APPLICATION_FLOW_STATUS_LABELS,
    TRAINING_APPLICATION_STAGE_LABELS,
    TRAINING_APPLICATION_STATUS_LABELS,
    TrainingApplicationCreate,
    TrainingApplicationUpdate,
)

MONEY_PRECISION = Decimal("0.01")

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿", "总部", "总部神殿"}
MANAGEMENT_CENTER_CANONICAL = "最高议事厅神殿"
MIDDLE_MANAGEMENT_KEYWORDS = ("主管", "经理", "部长", "主任", "负责人", "总监")
HR_DEPARTMENT_KEYWORDS = ("人事", "人力", "人资", "行政人事", "人资行政")
HR_POSITION_KEYWORDS = ("人事", "人力", "人资", "HR")
THOUGHT_REVIEW_DEPARTMENTS = ("人事部", "人力资源部", "行政人事部", "企业文化部")
MANAGEMENT_REVIEW_DEPARTMENTS = ("运营部", "行政人事部", "人事部")
DEFAULT_SATISFACTION_SCORE_KEYS = tuple(f"q{index}" for index in range(1, 15))
TRAINING_APPLICATION_AUTO_CHAIRMAN_THRESHOLD = Decimal("500")
ACADEMIC_GROUP_REVIEW_POSITIONS = ["智慧司副总监", "学术副总监", "学术总监", "智慧司总监"]
TEACHING_QUALITY_GROUP_REVIEW_POSITIONS = ["教化司总监", "教质总监"]
OPERATIONS_GROUP_REVIEW_POSITIONS = ["运营总监", "运营部总监"]
HR_DIRECTOR_POSITIONS = ["人资部总监", "人资总监"]

TRAINING_APPLICATION_ACCESS_RULES = [
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿", "总部", "总部神殿"],
        "department_keywords": ["市场"],
        "access_positions": ["市场部副经理", "市场部经理"],
        "approver_positions": ["市场部经理"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿", "总部", "总部神殿"],
        "department_keywords": ["人资", "人力资源", "人事"],
        "access_positions": ["人资部主管"],
        "approver_positions": ["人资部主管"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿", "总部", "总部神殿"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司总监"],
        "approver_positions": ["教化司总监"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿", "总部", "总部神殿"],
        "department_keywords": ["财务"],
        "access_positions": ["神藏司总监"],
        "approver_positions": ["神藏司总监"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿", "总部", "总部神殿"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司副总监", "学术副总监", "学术总监", "智慧司总监"],
        "approver_positions": ["智慧司副总监", "学术副总监", "学术总监", "智慧司总监"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿", "总部", "总部神殿"],
        "department_keywords": ["运营"],
        "access_positions": ["运营总监", "运营部总监"],
        "approver_positions": ["运营总监", "运营部总监"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["后端"],
        "access_positions": ["后端副校长"],
        "approver_positions": ["后端副校长"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司经理"],
        "approver_positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司经理"],
        "approver_positions": ["教化司经理"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["咨询"],
        "access_positions": ["前端副校长"],
        "approver_positions": ["前端副校长"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["渠道"],
        "access_positions": ["渠道部副校长"],
        "approver_positions": ["渠道部副校长"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["后端"],
        "access_positions": ["后端副校长"],
        "approver_positions": ["后端副校长"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司副经理"],
        "approver_positions": ["智慧司副经理"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司经理"],
        "approver_positions": ["教化司经理"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["咨询"],
        "access_positions": ["神殿副校长"],
        "approver_positions": ["神殿副校长"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["渠道"],
        "access_positions": ["渠道部经理"],
        "approver_positions": ["渠道部经理"],
    },
    {
        "campus_keywords": ["石美"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["石美"],
        "department_keywords": ["学术", "教质"],
        "access_positions": ["后端副校长"],
        "approver_positions": ["后端副校长"],
    },
    {
        "campus_keywords": ["石美"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司副经理", "智慧司经理"],
        "approver_positions": ["智慧司副经理", "智慧司经理"],
    },
    {
        "campus_keywords": ["石美"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司副经理"],
        "approver_positions": ["教化司副经理"],
    },
    {
        "campus_keywords": ["太美"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["太美"],
        "department_keywords": ["后端"],
        "access_positions": ["后端副校长"],
        "approver_positions": ["后端副校长"],
    },
    {
        "campus_keywords": ["太美"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司副经理"],
        "approver_positions": ["教化司副经理"],
    },
    {
        "campus_keywords": ["桂美"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["桂美"],
        "department_keywords": ["后端"],
        "access_positions": ["后端副校长"],
        "approver_positions": ["后端副校长"],
    },
    {
        "campus_keywords": ["桂美"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司经理"],
        "approver_positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["晋美"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["晋美"],
        "department_keywords": ["后端"],
        "access_positions": ["后端副校长"],
        "approver_positions": ["后端副校长"],
    },
    {
        "campus_keywords": ["晋美"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司副经理"],
        "approver_positions": ["智慧司副经理"],
    },
    {
        "campus_keywords": ["晋美"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司经理"],
        "approver_positions": ["教化司经理"],
    },
    {
        "campus_keywords": ["原美"],
        "department_keywords": [],
        "access_positions": ["校长"],
        "approver_positions": ["校长"],
    },
    {
        "campus_keywords": ["原美"],
        "department_keywords": ["学术"],
        "access_positions": ["智慧司经理"],
        "approver_positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["原美"],
        "department_keywords": ["教质"],
        "access_positions": ["教化司经理"],
        "approver_positions": ["教化司经理"],
    },
]


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.strip()


def _normalize_campus_value(value: Optional[str]) -> str:
    normalized = _normalize_scope_value(value)
    if normalized in MANAGEMENT_CENTER_CAMPUS_VALUES:
        return MANAGEMENT_CENTER_CANONICAL
    return normalized


def _split_selected_campuses(value: Optional[str]) -> list[str]:
    normalized = _normalize_scope_value(value)
    if not normalized:
        return []
    return list(
        dict.fromkeys(
            _normalize_campus_value(item)
            for item in re.split(r"[、,，;；\n]+", normalized)
            if _normalize_scope_value(item)
        )
    )


def _normalize_campus_selection(value: Optional[str]) -> Optional[str]:
    campuses = _split_selected_campuses(value)
    if not campuses:
        return None
    return "、".join(campuses)


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    normalized = _normalize_scope_value(value)
    return normalized or None


def _split_trainee_names(value: Optional[str]) -> list[str]:
    normalized = _normalize_scope_value(value)
    if not normalized:
        return []
    return list(
        dict.fromkeys(
            item.strip()
            for item in re.split(r"[、,，;；\n\r]+", normalized)
            if item and item.strip()
        )
    )


def _build_training_period_note(record: TrainingApplication) -> Optional[str]:
    if not record.start_date or not record.end_date or record.start_date == record.end_date:
        return None
    return f"培训周期：{record.start_date.isoformat()} 至 {record.end_date.isoformat()}"


def _resolve_followup_training_date(record: TrainingApplication) -> date:
    return record.end_date or record.start_date


def _resolve_training_location(record: TrainingApplication) -> str:
    campuses = _split_selected_campuses(record.campus)
    campus_label = "、".join(campuses) if campuses else (record.campus or "")
    if record.training_format == "线上":
        return f"{campus_label}线上培训" if campus_label else "线上培训"
    if record.training_format == "线上+线下":
        return f"{campus_label}/线上" if campus_label else "线上+线下"
    return campus_label or "线下培训"


def _sync_followup_records_for_approved_application(
    db: Session,
    record: TrainingApplication,
    current_user: User,
) -> None:
    existing_result = (
        db.query(TrainingResult)
        .filter(TrainingResult.source_application_id == record.id)
        .first()
    )
    if not existing_result:
        trainee_names = _split_trainee_names(record.trainees)
        expected_count = max(len(trainee_names), int(record.cost_count or 0))
        total_cost = float((record.cost_total or Decimal("0")) + (record.cost_other or Decimal("0")))
        result_remark_parts = [part for part in [record.remark, _build_training_period_note(record)] if part]
        trainee_payload = [
            {
                "name": name,
                "theory_score": 0,
                "practice_score": 0,
                "composite_score": 0,
                "rank": index,
                "remark": None,
            }
            for index, name in enumerate(sorted(trainee_names), start=1)
        ]
        db.add(
            TrainingResult(
                campus=record.campus,
                department=record.department,
                training_date=_resolve_followup_training_date(record),
                training_hours=float(record.total_hours or 0),
                expected_count=expected_count,
                actual_count=len(trainee_names),
                pass_count=0,
                fail_count=len(trainee_names),
                average_score=0,
                total_cost=total_cost,
                average_cost=round(total_cost / len(trainee_names), 2) if trainee_names else 0,
                pass_rate=0,
                trainees_json=json.dumps(trainee_payload, ensure_ascii=False),
                year=str(_resolve_followup_training_date(record).year),
                remark="；".join(result_remark_parts) if result_remark_parts else None,
                created_by_user_id=current_user.user_id,
                created_by_name=current_user.real_name,
                source_application_id=record.id,
            )
        )

    existing_satisfaction = (
        db.query(TrainingSatisfactionSurvey)
        .filter(TrainingSatisfactionSurvey.source_application_id == record.id)
        .first()
    )
    if not existing_satisfaction:
        satisfaction_remark_parts = [
            part for part in [record.remark, f"培训形式：{record.training_format}", _build_training_period_note(record)] if part
        ]
        default_scores = {key: 0 for key in DEFAULT_SATISFACTION_SCORE_KEYS}
        db.add(
            TrainingSatisfactionSurvey(
                department=record.department,
                training_date=_resolve_followup_training_date(record),
                training_location=_resolve_training_location(record),
                course_content=record.content,
                trainer=_normalize_scope_value(record.trainer) or "待填写",
                scores_json=json.dumps(default_scores, ensure_ascii=False, sort_keys=True),
                course_content_total=0,
                trainer_total=0,
                training_method_total=0,
                total_score=0,
                open_q4=None,
                open_q5=None,
                open_q6=None,
                year=str(_resolve_followup_training_date(record).year),
                remark="；".join(satisfaction_remark_parts) if satisfaction_remark_parts else None,
                created_by_user_id=current_user.user_id,
                created_by_name=current_user.real_name,
                source_application_id=record.id,
            )
        )


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


def _matches_compact_keyword(value: Optional[str], keywords: list[str]) -> bool:
    normalized_value = _normalize_compact_text(value)
    if not normalized_value:
        return False
    return any(
        keyword and keyword in normalized_value
        for keyword in (_normalize_compact_text(item) for item in keywords)
    )


def _matches_rule_position(position: Optional[str], expected_positions: list[str]) -> bool:
    normalized_position = _normalize_compact_text(position)
    if not normalized_position:
        return False
    return any(
        normalized_position == _normalize_compact_text(expected)
        for expected in expected_positions
    )


def _match_training_application_rules(
    campus: Optional[str],
    department: Optional[str],
) -> tuple[list[dict[str, list[str]]], list[dict[str, list[str]]]]:
    normalized_campus = _normalize_compact_text(campus)
    normalized_department = _normalize_compact_text(department)
    if not normalized_campus:
        return [], []

    matched_specific_rules: list[dict[str, list[str]]] = []
    matched_generic_rules: list[dict[str, list[str]]] = []
    for rule in TRAINING_APPLICATION_ACCESS_RULES:
        if not _matches_compact_keyword(normalized_campus, rule["campus_keywords"]):
            continue
        department_keywords = rule["department_keywords"]
        if not department_keywords:
            matched_generic_rules.append(rule)
            continue
        if normalized_department and _matches_compact_keyword(normalized_department, department_keywords):
            matched_specific_rules.append(rule)
    return matched_specific_rules, matched_generic_rules


def _get_training_application_access_rules(
    campus: Optional[str],
    department: Optional[str],
) -> list[dict[str, list[str]]]:
    matched_specific_rules, matched_generic_rules = _match_training_application_rules(campus, department)
    return matched_specific_rules + matched_generic_rules


def _get_preferred_department_head_rules(
    campus: Optional[str],
    department: Optional[str],
) -> list[dict[str, list[str]]]:
    matched_specific_rules, matched_generic_rules = _match_training_application_rules(campus, department)
    return matched_specific_rules or matched_generic_rules


def can_access_training_application_form(user: Optional[User]) -> bool:
    if user is None:
        return False
    if getattr(user, "is_superuser", False):
        return True
    if getattr(user, "role", None) and getattr(user.role, "value", None) == "admin":
        return True
    rules = _get_training_application_access_rules(user.campus, user.department)
    if not rules:
        return False
    return any(_matches_rule_position(user.position, rule["access_positions"]) for rule in rules)


def _resolve_training_campus_bucket(campus: Optional[str]) -> Optional[str]:
    normalized = _normalize_compact_text(_normalize_campus_value(campus))
    if not normalized:
        return None
    if normalized == _normalize_compact_text(MANAGEMENT_CENTER_CANONICAL):
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
    return None


def _matches_department_family(
    department: Optional[str],
    keywords: list[str],
) -> bool:
    return _matches_compact_keyword(department, keywords)


def _resolve_group_review_positions(department: Optional[str]) -> list[str]:
    if _matches_department_family(department, ["学术", "后端"]):
        return list(ACADEMIC_GROUP_REVIEW_POSITIONS)
    if _matches_department_family(department, ["教质"]):
        return list(TEACHING_QUALITY_GROUP_REVIEW_POSITIONS)
    return list(OPERATIONS_GROUP_REVIEW_POSITIONS)


def _resolve_department_head_required_positions(
    record: TrainingApplication,
    applicant: Optional[User],
) -> list[str]:
    campus_bucket = _resolve_training_campus_bucket(record.campus)
    applicant_position = applicant.position if applicant else None

    if campus_bucket == "management_center":
        if _matches_department_family(record.department, ["市场"]):
            return ["市场部经理"]
        return []

    if applicant is not None and _is_branch_principal_position(applicant.position):
        return []

    if _matches_department_family(record.department, ["后端"]):
        return []

    if _matches_department_family(record.department, ["学术"]):
        if campus_bucket == "yuanmei":
            return []
        if campus_bucket == "shimei":
            if _matches_rule_position(applicant_position, ["智慧司经理"]):
                return []
            return ["智慧司经理"]
        if campus_bucket in {"shengbang", "jimei", "jinmei", "taimei", "guimei"}:
            return ["后端副校长"]
        return []

    if _matches_department_family(record.department, ["教质"]):
        if campus_bucket in {"shengbang", "jimei", "shimei", "jinmei", "taimei"}:
            return ["后端副校长"]
        return []

    return []


def _should_auto_include_chairman_approval(record: TrainingApplication) -> bool:
    return _is_management_center_campus(record.campus) and _calc_total_amount(record) > TRAINING_APPLICATION_AUTO_CHAIRMAN_THRESHOLD


def _apply_chairman_approval_rule(
    record: TrainingApplication,
    requested_value: bool,
) -> None:
    record.include_chairman_approval = bool(requested_value or _should_auto_include_chairman_approval(record))


def _set_request_applicant(record: TrainingApplication, applicant: Optional[User]) -> None:
    setattr(record, "_request_applicant", applicant)


def attach_request_applicant_for_flow(record: TrainingApplication, applicant: Optional[User]) -> None:
    _set_request_applicant(record, applicant)


def apply_chairman_approval_rule_for_test(
    record: TrainingApplication,
    requested_value: bool,
) -> None:
    _apply_chairman_approval_rule(record, requested_value)


def _should_skip_department_head_stage(
    record: TrainingApplication,
    applicant: Optional[User],
) -> bool:
    required_positions = _resolve_department_head_required_positions(record, applicant)
    if not required_positions:
        return True
    if applicant is None:
        return False
    return _matches_rule_position(applicant.position, required_positions)


def _generate_application_no() -> str:
    return f"PXSQ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


def _is_management_center_campus(campus: Optional[str]) -> bool:
    campuses = _split_selected_campuses(campus)
    return bool(campuses) and all(item == MANAGEMENT_CENTER_CANONICAL for item in campuses)


def _campus_matches_scope(
    user_campus: Optional[str], selected_campus: Optional[str]
) -> bool:
    if not selected_campus or not user_campus:
        return True
    selected_campuses = _split_selected_campuses(selected_campus)
    if not selected_campuses:
        return True
    normalized_user_campus = _normalize_campus_value(user_campus)
    return normalized_user_campus in selected_campuses


def _is_department_manager_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in MIDDLE_MANAGEMENT_KEYWORDS)


def _is_principal_position(position: Optional[str]) -> bool:
    return _is_branch_principal_position(position)


def _is_chairman_position(position: Optional[str]) -> bool:
    return _normalize_scope_value(position) == "董事长"


def _is_hr_user(user: User) -> bool:
    department = _normalize_compact_text(user.department)
    position = _normalize_compact_text(user.position)
    return any(keyword in department for keyword in HR_DEPARTMENT_KEYWORDS) or any(
        keyword in position for keyword in HR_POSITION_KEYWORDS
    )


def _position_priority(position: Optional[str]) -> int:
    normalized = _normalize_compact_text(position)
    if normalized == "董事长":
        return 0
    if "校长" in normalized:
        return 1
    if "总监" in normalized:
        return 2
    if "经理" in normalized:
        return 3
    if "主管" in normalized:
        return 4
    if "负责人" in normalized:
        return 5
    if "部长" in normalized:
        return 6
    if "主任" in normalized:
        return 7
    return 99


def _serialize_approver(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.real_name,
        "department": user.department,
        "position": user.position,
        "campus": user.campus,
    }


def _sort_and_dedupe_users(users: list[User]) -> list[User]:
    seen: set[int] = set()
    unique_users: list[User] = []
    for user in users:
        if user.user_id in seen:
            continue
        seen.add(user.user_id)
        unique_users.append(user)
    return sorted(
        unique_users,
        key=lambda item: (
            _position_priority(item.position),
            _normalize_compact_text(item.department),
            _normalize_compact_text(item.position),
            item.real_name or "",
        ),
    )


def _base_active_user_query(db: Session):
    return db.query(User).filter(User.status == UserStatus.ACTIVE)


def _resolve_department_head_candidates(
    db: Session, record: TrainingApplication
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    same_scope_users = [
        user for user in users if _campus_matches_scope(user.campus, record.campus)
    ]
    applicant = getattr(record, "_request_applicant", None)
    approver_positions = _resolve_department_head_required_positions(record, applicant)
    if approver_positions:
        matched = [
            user
            for user in same_scope_users
            if _matches_rule_position(user.position, approver_positions)
        ]
        if matched:
            return _sort_and_dedupe_users(matched)
    department_heads = [
        user
        for user in same_scope_users
        if _normalize_compact_text(user.department)
        == _normalize_compact_text(record.department)
        and _is_department_manager_position(user.position)
    ]
    if department_heads:
        return _sort_and_dedupe_users(department_heads)
    principals = [
        user for user in same_scope_users if _is_principal_position(user.position)
    ]
    if principals:
        return _sort_and_dedupe_users(principals)
    return _sort_and_dedupe_users(
        [
            user
            for user in same_scope_users
            if _is_department_manager_position(user.position)
        ]
    )


def _resolve_principal_candidates(
    db: Session, record: TrainingApplication
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    principals = [
        user
        for user in users
        if _campus_matches_scope(user.campus, record.campus)
        and _is_principal_position(user.position)
    ]
    return _sort_and_dedupe_users(principals)


def _resolve_group_department_candidates(
    db: Session, record: TrainingApplication
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    management_users = [
        user for user in users if _is_management_center_campus(user.campus)
    ]
    if _is_management_center_campus(record.campus):
        return []

    preferred_positions = _resolve_group_review_positions(record.department)
    preferred = [
        user
        for user in management_users
        if _matches_rule_position(user.position, preferred_positions)
    ]
    return _sort_and_dedupe_users(preferred)


def _resolve_hr_candidates(db: Session, record: TrainingApplication) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    management_hr = [
        user
        for user in users
        if _is_management_center_campus(user.campus)
        and _matches_rule_position(user.position, HR_DIRECTOR_POSITIONS)
    ]
    if management_hr:
        return _sort_and_dedupe_users(management_hr)
    return _sort_and_dedupe_users(
        [user for user in users if _matches_rule_position(user.position, HR_DIRECTOR_POSITIONS)]
    )


def _resolve_chairman_candidates(
    db: Session, record: TrainingApplication
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return _sort_and_dedupe_users(
        [user for user in users if _is_chairman_position(user.position)]
    )


def get_stage_candidate_users(
    db: Session, record: TrainingApplication, stage: str
) -> list[User]:
    if stage == "department_head":
        return _resolve_department_head_candidates(db, record)
    if stage == "principal":
        return _resolve_principal_candidates(db, record)
    if stage == "group_department":
        return _resolve_group_department_candidates(db, record)
    if stage == "hr":
        return _resolve_hr_candidates(db, record)
    if stage == "chairman":
        return _resolve_chairman_candidates(db, record)
    return []


def _to_decimal(value: Decimal | float | int | None) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _calc_total_cost(
    cost_per_person: Decimal | float | int, cost_count: int
) -> Decimal:
    return (_to_decimal(cost_per_person) * Decimal(cost_count)).quantize(
        MONEY_PRECISION
    )


def _calc_total_amount(record: TrainingApplication) -> Decimal:
    return (_to_decimal(record.cost_total) + _to_decimal(record.cost_other)).quantize(
        MONEY_PRECISION
    )


def _has_chairman_history(record: TrainingApplication) -> bool:
    if record.current_stage == "chairman":
        return True
    if record.chairman_opinion is not None or record.chairman_passed is not None:
        return True
    return any(action.stage == "chairman" for action in record.approval_actions)


def _uses_chairman_stage(record: TrainingApplication) -> bool:
    return bool(record.include_chairman_approval or _has_chairman_history(record))


def _is_branch_principal_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return bool(normalized and "校长" in normalized and "副校长" not in normalized)


def _needs_principal_stage(
    record: TrainingApplication,
    applicant: Optional[User],
) -> bool:
    if applicant is not None and _is_branch_principal_position(applicant.position):
        return False
    if _is_management_center_campus(record.campus):
        return False
    return True


def get_flow_stages(record: TrainingApplication) -> list[str]:
    applicant = getattr(record, "_request_applicant", None)
    stages = []
    if not _should_skip_department_head_stage(record, applicant):
        stages.append("department_head")
    if _needs_principal_stage(record, applicant):
        stages.append("principal")
    if not _is_management_center_campus(record.campus):
        stages.append("group_department")
    stages.append("hr")
    if _uses_chairman_stage(record):
        stages.append("chairman")
    return stages


def _get_request_applicant(
    db: Session,
    record: TrainingApplication,
) -> Optional[User]:
    applicant = getattr(record, "_request_applicant", None)
    if applicant is not None:
        return applicant
    if not record.created_by_user_id:
        return None
    applicant = (
        db.query(User)
        .filter(User.user_id == record.created_by_user_id, User.status == UserStatus.ACTIVE)
        .first()
    )
    _set_request_applicant(record, applicant)
    return applicant


def _get_selected_approver_user_ids(
    record: TrainingApplication,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids,
        TRAINING_APPLICATION_APPROVAL_STAGES,
    )


def _resolve_selected_stage_approvers(
    db: Session,
    record: TrainingApplication,
    stage: str,
) -> list[User]:
    user_ids = _get_selected_approver_user_ids(record).get(stage, [])
    if not user_ids:
        return []
    users = (
        db.query(User)
        .filter(User.user_id.in_(user_ids), User.status == UserStatus.ACTIVE)
        .all()
    )
    user_map = {user.user_id: user for user in users}
    return [user_map[user_id] for user_id in user_ids if user_id in user_map]


def resolve_stage_approvers(
    db: Session, record: TrainingApplication, stage: str
) -> list[User]:
    selected_users = _resolve_selected_stage_approvers(db, record, stage)
    if selected_users:
        return selected_users
    return get_stage_candidate_users(db, record, stage)


def _validate_selected_stage_approvers(
    db: Session,
    record: TrainingApplication,
    stage: str,
    user_ids: list[int],
) -> None:
    candidate_user_ids = {
        item.user_id for item in get_stage_candidate_users(db, record, stage)
    }
    if not candidate_user_ids:
        raise ValueError(f"{TRAINING_APPLICATION_STAGE_LABELS[stage]}未找到可选审批人")
    invalid_user_ids = [
        user_id for user_id in user_ids if user_id not in candidate_user_ids
    ]
    if invalid_user_ids:
        raise ValueError(
            f"{TRAINING_APPLICATION_STAGE_LABELS[stage]}审批人超出当前候选范围: {invalid_user_ids}"
        )


def _set_selected_approver_user_ids(
    db: Session,
    record: TrainingApplication,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        TRAINING_APPLICATION_APPROVAL_STAGES,
    )
    return normalized


def build_approver_candidate_preview(
    db: Session,
    *,
    campus: str,
    department: str,
    category: str,
    is_internal_training: bool,
    is_key_staff_training: bool,
    include_chairman_approval: bool,
    total_amount: float,
    created_by_user_id: Optional[int] = None,
    selected_approver_user_ids: Optional[dict[str, list[int]]] = None,
) -> list[dict]:
    temp_record = TrainingApplication(
        campus=campus.strip(),
        department=department.strip(),
        category=category.strip(),
        objective="临时预览",
        trainees="临时预览",
        content="临时预览",
        start_date=datetime.now().date(),
        end_date=datetime.now().date(),
        total_hours=0,
        training_format="线下",
        exam_method="理论",
        cost_per_person=0,
        cost_count=0,
        cost_total=round(float(total_amount), 2),
        cost_other=0,
        is_internal_training=is_internal_training,
        is_key_staff_training=is_key_staff_training,
        include_chairman_approval=include_chairman_approval,
        created_by_user_id=created_by_user_id,
    )
    if created_by_user_id is not None:
        applicant = (
            db.query(User)
            .filter(User.user_id == created_by_user_id, User.status == UserStatus.ACTIVE)
            .first()
        )
        _set_request_applicant(temp_record, applicant)
    _apply_chairman_approval_rule(temp_record, include_chairman_approval)
    flow_stages = get_flow_stages(temp_record)
    preview_map = normalize_selected_approver_map(
        selected_approver_user_ids, flow_stages
    )
    preview_items: list[dict] = []
    for stage in flow_stages:
        candidate_users = get_stage_candidate_users(db, temp_record, stage)
        if preview_map.get(stage):
            recommended_user_ids = preview_map[stage]
        else:
            recommended_user_ids = [
                item.user_id for item in resolve_stage_approvers(db, temp_record, stage)
            ]
        preview_items.append(
            {
                "stage": stage,
                "stage_label": TRAINING_APPLICATION_STAGE_LABELS[stage],
                "recommended_user_ids": recommended_user_ids,
                "approvers": [_serialize_approver(item) for item in candidate_users],
            }
        )
    return preview_items


def get_application(db: Session, application_id: int) -> Optional[TrainingApplication]:
    return (
        db.query(TrainingApplication)
        .options(
            selectinload(TrainingApplication.approval_actions),
            selectinload(TrainingApplication.notifications),
        )
        .filter(TrainingApplication.id == application_id)
        .first()
    )


def _has_manage_privilege(user: User, record: TrainingApplication) -> bool:
    return record.created_by_user_id == user.user_id


def _has_approval_history(record: TrainingApplication, user: Optional[User]) -> bool:
    if user is None:
        return False
    return any(
        action.approver_user_id == user.user_id for action in record.approval_actions
    )


def _has_notification_history(
    record: TrainingApplication,
    user: Optional[User],
) -> bool:
    if user is None:
        return False
    return any(
        notification.recipient_user_id == user.user_id
        for notification in record.notifications
    )


def _is_current_stage_approver(
    db: Session, record: TrainingApplication, user: Optional[User]
) -> bool:
    if user is None or record.status != "pending" or not record.current_stage:
        return False
    allowed_user_ids = get_stage_approver_ids(db, record, record.current_stage)
    return user.user_id in allowed_user_ids


def can_view_application(
    db: Session, record: TrainingApplication, user: Optional[User]
) -> bool:
    if user is None:
        return False
    if record.created_by_user_id == user.user_id:
        return True
    if record.status == "draft":
        return False
    if _has_approval_history(record, user):
        return True
    if _has_notification_history(record, user):
        return True
    return _is_current_stage_approver(db, record, user)


def list_applications(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
) -> list[TrainingApplication]:
    query = db.query(TrainingApplication).options(
        selectinload(TrainingApplication.approval_actions),
        selectinload(TrainingApplication.notifications),
    )
    if campus:
        query = query.filter(TrainingApplication.campus == campus)
    if status:
        query = query.filter(TrainingApplication.status == status)
    if department:
        query = query.filter(TrainingApplication.department == department)
    if category:
        query = query.filter(TrainingApplication.category == category)
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TrainingApplication.campus.ilike(keyword),
                TrainingApplication.department.ilike(keyword),
                TrainingApplication.category.ilike(keyword),
                TrainingApplication.objective.ilike(keyword),
                TrainingApplication.trainees.ilike(keyword),
                TrainingApplication.content.ilike(keyword),
                TrainingApplication.trainer.ilike(keyword),
                TrainingApplication.remark.ilike(keyword),
            )
        )
    records = query.order_by(TrainingApplication.created_at.desc()).all()
    if current_user is None:
        return records
    return [
        record for record in records if can_view_application(db, record, current_user)
    ]


def list_applications_page(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[TrainingApplication], int]:
    records = list_applications(
        db,
        campus=campus,
        status=status,
        department=department,
        category=category,
        search=search,
        current_user=current_user,
    )
    start = max(page - 1, 0) * page_size
    end = start + page_size
    return records[start:end], len(records)


def create_application(
    db: Session, payload: TrainingApplicationCreate, current_user: User
) -> TrainingApplication:
    if not can_access_training_application_form(current_user):
        raise PermissionError("当前账号没有填写培训申请表的权限")
    cost_total = _calc_total_cost(payload.cost_per_person, payload.cost_count)
    record = TrainingApplication(
        application_no=_generate_application_no(),
        campus=_normalize_campus_selection(payload.campus) or payload.campus.strip(),
        department=payload.department.strip(),
        category=payload.category,
        objective=payload.objective.strip(),
        trainees=payload.trainees.strip(),
        content=payload.content.strip(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_hours=_to_decimal(payload.total_hours),
        training_format=payload.training_format,
        exam_method=payload.exam_method,
        trainer=_normalize_optional_str(payload.trainer),
        expected_pass_rate=(
            _to_decimal(payload.expected_pass_rate)
            if payload.expected_pass_rate is not None
            else None
        ),
        cost_per_person=_to_decimal(payload.cost_per_person),
        cost_count=payload.cost_count,
        cost_total=cost_total,
        cost_other=_to_decimal(payload.cost_other),
        is_internal_training=payload.is_internal_training,
        is_key_staff_training=payload.is_key_staff_training,
        include_chairman_approval=payload.include_chairman_approval,
        remark=_normalize_optional_str(payload.remark),
        status="draft",
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    _set_request_applicant(record, current_user)
    _apply_chairman_approval_rule(record, payload.include_chairman_approval)
    _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)
    db.add(record)
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def update_application(
    db: Session,
    record: TrainingApplication,
    payload: TrainingApplicationUpdate,
    current_user: User,
) -> TrainingApplication:
    if not can_access_training_application_form(current_user):
        raise PermissionError("当前账号没有填写培训申请表的权限")
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)

    required_string_fields = {
        "campus",
        "department",
        "objective",
        "trainees",
        "content",
    }
    optional_string_fields = {"trainer", "remark"}
    decimal_fields = {
        "total_hours",
        "expected_pass_rate",
        "cost_per_person",
        "cost_total",
        "cost_other",
    }

    for field, value in payload_data.items():
        if field in decimal_fields and value is not None:
            value = _to_decimal(value)
        if isinstance(value, str):
            value = value.strip()
            if field in required_string_fields and not value:
                raise ValueError(f"{field} 不能为空")
            if field == "campus":
                value = _normalize_campus_selection(value) or value
            if field in optional_string_fields:
                value = value or None
        setattr(record, field, value)

    record.cost_total = _calc_total_cost(
        record.cost_per_person or 0, int(record.cost_count or 0)
    )
    _set_request_applicant(record, current_user)
    _apply_chairman_approval_rule(record, bool(record.include_chairman_approval))

    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def delete_application(
    db: Session, record: TrainingApplication, current_user: User
) -> None:
    if not can_access_training_application_form(current_user):
        raise PermissionError("当前账号没有填写培训申请表的权限")
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def validate_full_approval_chain(db: Session, record: TrainingApplication) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(TRAINING_APPLICATION_STAGE_LABELS[stage])
    return missing_stages


def _clear_stage_results(record: TrainingApplication) -> None:
    record.department_head_opinion = None
    record.department_head_passed = None
    record.principal_opinion = None
    record.principal_passed = None
    record.group_department_opinion = None
    record.group_department_passed = None
    record.hr_opinion = None
    record.hr_passed = None
    record.chairman_opinion = None
    record.chairman_passed = None
    record.is_passed = None


def _set_stage_result(
    record: TrainingApplication,
    stage: str,
    *,
    approved: bool,
    comment: Optional[str],
) -> None:
    normalized_comment = _normalize_optional_str(comment)
    if stage == "department_head":
        record.department_head_opinion = normalized_comment
        record.department_head_passed = approved
    elif stage == "principal":
        record.principal_opinion = normalized_comment
        record.principal_passed = approved
    elif stage == "group_department":
        record.group_department_opinion = normalized_comment
        record.group_department_passed = approved
    elif stage == "hr":
        record.hr_opinion = normalized_comment
        record.hr_passed = approved
    elif stage == "chairman":
        record.chairman_opinion = normalized_comment
        record.chairman_passed = approved


def get_stage_approver_ids(
    db: Session, record: TrainingApplication, stage: str
) -> list[int]:
    approvers = resolve_stage_approvers(db, record, stage)
    return [item.user_id for item in approvers]


def _create_application_notification(
    db: Session,
    *,
    record: TrainingApplication,
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
        TrainingApplicationNotification(
            application_id=record.id,
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
    record: TrainingApplication,
    stage: str,
    action_by_user: Optional[User],
) -> None:
    for approver in resolve_stage_approvers(db, record, stage):
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=approver.user_id,
            notification_type="pending_stage",
            title=f"培训申请待审批：{record.department}/{record.category}",
            content=(
                f"培训申请《{record.application_no}》已流转至【{TRAINING_APPLICATION_STAGE_LABELS[stage]}】环节，请及时处理。"
            ),
            stage=stage,
            action_by_user=action_by_user,
        )


def get_unread_notification_count(db: Session, recipient_user_id: int) -> int:
    return (
        db.query(TrainingApplicationNotification)
        .filter(
            TrainingApplicationNotification.recipient_user_id == recipient_user_id,
            TrainingApplicationNotification.is_read.is_(False),
        )
        .count()
    )


def list_application_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[TrainingApplicationNotification]:
    query = (
        db.query(TrainingApplicationNotification)
        .join(
            TrainingApplication,
            TrainingApplication.id == TrainingApplicationNotification.application_id,
        )
        .options(selectinload(TrainingApplicationNotification.application))
        .filter(TrainingApplicationNotification.recipient_user_id == recipient_user_id)
    )
    if unread_only:
        query = query.filter(TrainingApplicationNotification.is_read.is_(False))
    return query.order_by(TrainingApplicationNotification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[TrainingApplicationNotification]:
    record = (
        db.query(TrainingApplicationNotification)
        .filter(
            TrainingApplicationNotification.id == notification_id,
            TrainingApplicationNotification.recipient_user_id == recipient_user_id,
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
        db.query(TrainingApplicationNotification)
        .filter(
            TrainingApplicationNotification.recipient_user_id == recipient_user_id,
            TrainingApplicationNotification.is_read.is_(False),
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


def submit_application(
    db: Session, record: TrainingApplication, current_user: User
) -> TrainingApplication:
    if not can_access_training_application_form(current_user):
        raise PermissionError("当前账号没有填写培训申请表的权限")
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

    _set_request_applicant(record, current_user)
    _apply_chairman_approval_rule(record, bool(record.include_chairman_approval))

    missing_stages = validate_full_approval_chain(db, record)
    if missing_stages:
        raise ValueError(f"审批链不完整，缺少：{'、'.join(missing_stages)}")

    flow_stages = get_flow_stages(record)
    record.status = "pending"
    record.current_stage = flow_stages[0]
    record.rejection_reason = None
    record.completed_at = None
    record.submitted_at = datetime.now()
    _clear_stage_results(record)

    db.add(
        TrainingApplicationApprovalAction(
            application_id=record.id,
            stage="submit",
            action="submit",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment="提交审批",
        )
    )
    _notify_stage_approvers(
        db, record=record, stage=flow_stages[0], action_by_user=current_user
    )

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def approve_application(
    db: Session,
    record: TrainingApplication,
    current_user: User,
    comment: Optional[str],
) -> TrainingApplication:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(TrainingApplicationApprovalAction)
        .filter(
            TrainingApplicationApprovalAction.application_id == record.id,
            TrainingApplicationApprovalAction.stage == current_stage,
            TrainingApplicationApprovalAction.approver_user_id == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    normalized_comment = _normalize_optional_str(comment)
    _set_stage_result(record, current_stage, approved=True, comment=normalized_comment)
    db.add(
        TrainingApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=normalized_comment,
        )
    )

    flow_stages = get_flow_stages(record)
    current_index = flow_stages.index(current_stage)
    if current_index == len(flow_stages) - 1:
        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        record.is_passed = True
        _sync_followup_records_for_approved_application(db, record, current_user)
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"培训申请已通过：{record.department}/{record.category}",
            content=(
                f"你的培训申请《{record.application_no}》已完成全部审批并通过。"
                f" 当前环节：{TRAINING_APPLICATION_STAGE_LABELS[current_stage]}。"
                f"{f' 审批意见：{normalized_comment}' if normalized_comment else ''}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )
    else:
        next_stage = flow_stages[current_index + 1]
        next_stage_approvers = get_stage_approver_ids(db, record, next_stage)
        if not next_stage_approvers:
            raise ValueError(
                f"下一阶段“{TRAINING_APPLICATION_STAGE_LABELS[next_stage]}”未找到审批人，无法继续流转"
            )
        record.current_stage = next_stage
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"培训申请流转更新：{record.department}/{record.category}",
            content=(
                f"你的培训申请《{record.application_no}》已通过【{TRAINING_APPLICATION_STAGE_LABELS[current_stage]}】审批，"
                f" 当前已流转至【{TRAINING_APPLICATION_STAGE_LABELS[next_stage]}】。"
                f"{f' 审批意见：{normalized_comment}' if normalized_comment else ''}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )
        _notify_stage_approvers(
            db, record=record, stage=next_stage, action_by_user=current_user
        )

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def reject_application(
    db: Session,
    record: TrainingApplication,
    current_user: User,
    comment: Optional[str],
) -> TrainingApplication:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")
    if not comment or not comment.strip():
        raise ValueError("驳回时必须填写审批意见")

    normalized_comment = comment.strip()
    _set_stage_result(record, current_stage, approved=False, comment=normalized_comment)
    record.status = "rejected"
    record.current_stage = None
    record.rejection_reason = normalized_comment
    record.completed_at = datetime.now()
    record.is_passed = False

    db.add(
        TrainingApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="reject",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=normalized_comment,
        )
    )
    _create_application_notification(
        db,
        record=record,
        recipient_user_id=record.created_by_user_id,
        notification_type="rejected",
        title=f"培训申请已驳回：{record.department}/{record.category}",
        content=(
            f"你的培训申请《{record.application_no}》在【{TRAINING_APPLICATION_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{normalized_comment}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def build_approval_flow(db: Session, record: TrainingApplication) -> list[dict]:
    _get_request_applicant(db, record)
    flow_stages = get_flow_stages(record)
    actions_by_stage: dict[str, list[TrainingApplicationApprovalAction]] = {
        stage: [] for stage in flow_stages
    }
    for action in record.approval_actions:
        if action.stage in actions_by_stage:
            actions_by_stage[action.stage].append(action)

    result: list[dict] = []
    for stage in flow_stages:
        stage_actions = actions_by_stage.get(stage, [])
        latest_action = stage_actions[-1] if stage_actions else None
        if any(item.action == "reject" for item in stage_actions):
            status = "rejected"
        elif any(item.action == "approve" for item in stage_actions):
            status = "completed"
        elif record.status == "pending" and record.current_stage == stage:
            status = "current"
        else:
            status = "waiting"

        action_label = None
        if latest_action:
            action_label = {"approve": "通过", "reject": "驳回", "submit": "提交"}.get(
                latest_action.action,
                latest_action.action,
            )

        result.append(
            {
                "stage": stage,
                "stage_label": TRAINING_APPLICATION_STAGE_LABELS[stage],
                "status": status,
                "status_label": TRAINING_APPLICATION_FLOW_STATUS_LABELS[status],
                "approvers": [
                    _serialize_approver(item)
                    for item in resolve_stage_approvers(db, record, stage)
                ],
                "action": latest_action.action if latest_action else None,
                "action_label": action_label,
                "acted_by_user_id": (
                    latest_action.approver_user_id if latest_action else None
                ),
                "acted_by_name": latest_action.approver_name if latest_action else None,
                "comment": latest_action.comment if latest_action else None,
                "acted_at": latest_action.created_at if latest_action else None,
            }
        )
    return result


def serialize_notification(record: TrainingApplicationNotification) -> dict:
    application = record.application
    return {
        "id": record.id,
        "application_id": record.application_id,
        "application_no": application.application_no if application else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": TRAINING_APPLICATION_STAGE_LABELS.get(
            record.stage or "", record.stage
        ),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_application(
    record: TrainingApplication, current_user: Optional[User], db: Session
) -> dict:
    _get_request_applicant(db, record)
    current_approvers = []
    can_approve = False
    if record.status == "pending" and record.current_stage:
        stage_approvers = resolve_stage_approvers(db, record, record.current_stage)
        current_approvers = [_serialize_approver(item) for item in stage_approvers]
        if current_user:
            can_approve = any(
                item.user_id == current_user.user_id for item in stage_approvers
            )

    can_manage = current_user is not None and _has_manage_privilege(
        current_user, record
    )

    return {
        "id": record.id,
        "application_no": record.application_no,
        "campus": record.campus,
        "department": record.department,
        "category": record.category,
        "objective": record.objective,
        "trainees": record.trainees,
        "content": record.content,
        "start_date": record.start_date,
        "end_date": record.end_date,
        "total_hours": float(record.total_hours or 0),
        "training_format": record.training_format,
        "exam_method": record.exam_method,
        "trainer": record.trainer,
        "expected_pass_rate": (
            float(record.expected_pass_rate)
            if record.expected_pass_rate is not None
            else None
        ),
        "cost_per_person": float(record.cost_per_person or 0),
        "cost_count": record.cost_count,
        "cost_total": float(record.cost_total or 0),
        "cost_other": float(record.cost_other or 0),
        "is_internal_training": record.is_internal_training,
        "is_key_staff_training": record.is_key_staff_training,
        "include_chairman_approval": record.include_chairman_approval,
        "remark": record.remark,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "department_head_opinion": record.department_head_opinion,
        "department_head_passed": record.department_head_passed,
        "principal_opinion": record.principal_opinion,
        "principal_passed": record.principal_passed,
        "group_department_opinion": record.group_department_opinion,
        "group_department_passed": record.group_department_passed,
        "hr_opinion": record.hr_opinion,
        "hr_passed": record.hr_passed,
        "chairman_opinion": record.chairman_opinion,
        "chairman_passed": record.chairman_passed,
        "is_passed": record.is_passed,
        "status": record.status,
        "status_label": TRAINING_APPLICATION_STATUS_LABELS.get(
            record.status, record.status
        ),
        "current_stage": record.current_stage,
        "current_stage_label": TRAINING_APPLICATION_STAGE_LABELS.get(
            record.current_stage or "", record.current_stage
        ),
        "rejection_reason": record.rejection_reason,
        "submitted_at": record.submitted_at,
        "completed_at": record.completed_at,
        "can_edit": can_manage and record.status in {"draft", "rejected"},
        "can_delete": can_manage and record.status in {"draft", "rejected"},
        "can_submit": can_manage and record.status in {"draft", "rejected"},
        "can_approve": can_approve,
        "selected_approver_user_ids": _get_selected_approver_user_ids(record),
        "current_approvers": current_approvers,
        "approval_flow": build_approval_flow(db, record),
        "approval_actions": [
            {
                "id": item.id,
                "stage": item.stage,
                "stage_label": (
                    "提交"
                    if item.stage == "submit"
                    else TRAINING_APPLICATION_STAGE_LABELS.get(item.stage, item.stage)
                ),
                "action": item.action,
                "approver_user_id": item.approver_user_id,
                "approver_name": item.approver_name,
                "comment": item.comment,
                "created_at": item.created_at,
            }
            for item in record.approval_actions
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
