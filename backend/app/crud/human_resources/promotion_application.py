"""
集团人资基础 - 晋升申请 CRUD
"""

from __future__ import annotations

from datetime import datetime
import re
from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources import approval_workflow as workflow_crud
from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.promotion_application import (
    PromotionApplication,
    PromotionApplicationApprovalAction,
    PromotionApplicationNotification,
    PromotionApprovalConfig,
    PromotionApprovalConfigApprover,
)
from app.models.user import User, UserStatus
from app.schemas.human_resources.promotion_application import (
    PROMOTION_APPROVAL_STAGES,
    PROMOTION_FLOW_STATUS_LABELS,
    PROMOTION_STAGE_LABELS,
    PROMOTION_STATUS_LABELS,
    PromotionApplicationCreate,
    PromotionApplicationUpdate,
    PromotionApprovalConfigUpsert,
)

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
MANAGEMENT_ROLE_KEYWORDS = ("主管", "经理", "总监", "部长", "主任", "负责人", "校长")
DIRECTOR_POSITION_KEYWORD = "总监"
FLOW_TYPE = "promotion_application"
PROMOTION_REQUIRED_SALARY_FIELDS = {
    "original_salary": "原薪资标准",
    "promoted_salary": "晋升后薪资标准",
}
PROMOTION_MIN_TEXT_LENGTH_FIELDS = {
    "promotion_reason": ("申请晋升的理由", 50),
    "confidence_and_expectation": ("对晋升后的信心与期望", 50),
}
DEPARTMENT_MANAGER_RULES = {
    "management_center": (
        {
            "department_keywords": ("市场",),
            "position_patterns": ((('经理',), ('副经理',)),),
        },
        {
            "department_keywords": ("财务",),
            "position_patterns": ((('总监',), ()),),
        },
        {
            "department_keywords": ("学术",),
            "position_patterns": ((('副总监',), ()), (('总监',), ())),
        },
        {
            "department_keywords": ("教质",),
            "position_patterns": ((('经理',), ()), (('总监',), ())),
        },
        {
            "department_keywords": ("运营",),
            "position_patterns": ((('总监',), ()),),
        },
        {
            "department_keywords": ("人资", "人力", "人事", "行政"),
            "position_patterns": ((('总监',), ()),),
        },
    ),
    "branch": (
        {
            "department_keywords": ("咨询",),
            "position_patterns": ((('分析规划师主管',), ()),),
        },
        {
            "department_keywords": ("学术",),
            "position_patterns": ((('学术经理',), ()), (('学术副经理',), ())),
        },
        {
            "department_keywords": ("教质",),
            "position_patterns": ((('教化司经理',), ()), (('教化司副经理',), ())),
        },
        {
            "department_keywords": ("渠道",),
            "position_patterns": (
                (("渠道部经理",), ()),
                (("渠道部副校长",), ()),
                (("渠道部校长",), ()),
            ),
        },
    ),
}
SPECIAL_DEPARTMENT_MANAGER_RULES = {
    "shengbang": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (('学术经理',), ('副经理',))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教化司经理',), ('副经理',)), (('教质经理',), ('副经理',))),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((('前端副校长',), ()),),
        },
    ),
    "jimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司副经理',), ()), (('学术副经理',), ())),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教质经理',), ()), (('教化司经理',), ())),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((('前端副校长',), ()),),
        },
        {
            "apply_department_keywords": ("渠道",),
            "candidate_department_keywords": ("渠道",),
            "position_patterns": ((('渠道部经理',), ()), (('渠道经理',), ())),
        },
    ),
    "shimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (('学术经理',), ('副经理',))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教化司副经理',), ()), (('教质副经理',), ())),
        },
    ),
    "jinmei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司副经理',), ()), (('学术副经理',), ())),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教化司经理',), ()), (('教质经理',), ())),
        },
    ),
    "yuanmei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (('学术经理',), ('副经理',))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教化司经理',), ()), (('教质经理',), ())),
        },
    ),
    "taimei": (
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教化司副经理',), ()), (('教质副经理',), ())),
        },
    ),
    "guimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (('学术经理',), ('副经理',))),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((('分析规划师主管',), ()),),
        },
    ),
}
DEFAULT_PRINCIPAL_PATTERNS = ((('校长',), ('副校长',)),)
PRINCIPAL_PATTERNS_BY_BUCKET = {
    'jimei': ((('校长',), ('副校长',)), (('副总监',), ())),
    'yuanmei': ((('校长',), ('副校长',)), (('执行副校长',), ())),
}
LINE_DEPARTMENT_KEYWORDS = {
    "咨询": ("咨询",),
    "教质": ("教质",),
    "学术": ("学术",),
    "市场": ("市场",),
    "财务": ("财务",),
    "人资行政": ("人资", "人力", "行政"),
    "运营": ("运营",),
    "渠道": ("渠道",),
    "线上事业部": ("线上事业部", "线上"),
    "线下事业部": ("线下事业部", "线下"),
}


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.strip()


def _normalize_config_campus_value(value: Optional[str]) -> str:
    normalized = _normalize_scope_value(value)
    if normalized in MANAGEMENT_CENTER_CAMPUS_VALUES:
        return "最高议事厅"
    return normalized


def _get_config_campus_values(value: Optional[str]) -> list[str]:
    normalized = _normalize_scope_value(value)
    if not normalized:
        return []
    if normalized in MANAGEMENT_CENTER_CAMPUS_VALUES:
        return sorted(MANAGEMENT_CENTER_CAMPUS_VALUES)
    return [normalized]


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


def _get_effective_text_length(value: Optional[str]) -> int:
    return len(re.sub(r"\s+", "", value or ""))


def _matches_keyword_family(value: Optional[str], keywords: tuple[str, ...]) -> bool:
    normalized = _normalize_compact_text(value)
    return bool(normalized) and any(keyword in normalized for keyword in keywords)


def _matches_position_pattern(
    position: Optional[str],
    include_keywords: tuple[str, ...],
    exclude_keywords: tuple[str, ...],
) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or not any(keyword in normalized for keyword in include_keywords):
        return False
    return not any(keyword in normalized for keyword in exclude_keywords)


def _matches_any_position_patterns(
    position: Optional[str],
    patterns: tuple[tuple[tuple[str, ...], tuple[str, ...]], ...],
) -> bool:
    return any(
        _matches_position_pattern(position, include_keywords, exclude_keywords)
        for include_keywords, exclude_keywords in patterns
    )


def _is_same_department_scope(
    user_department: Optional[str],
    apply_department: Optional[str],
) -> bool:
    normalized_user = _normalize_compact_text(user_department)
    normalized_apply = _normalize_compact_text(apply_department)
    if not normalized_user or not normalized_apply:
        return False
    return (
        normalized_user == normalized_apply
        or normalized_user in normalized_apply
        or normalized_apply in normalized_user
    )


def _resolve_campus_bucket(campus: Optional[str]) -> Optional[str]:
    normalized = _normalize_compact_text(campus)
    if not normalized:
        return None
    if _is_management_center_campus(campus):
        return 'management_center'
    if '盛邦' in normalized:
        return 'shengbang'
    if '冀美' in normalized:
        return 'jimei'
    if '石美' in normalized:
        return 'shimei'
    if '晋美' in normalized:
        return 'jinmei'
    if '原美' in normalized:
        return 'yuanmei'
    if '太美' in normalized:
        return 'taimei'
    if '桂美' in normalized:
        return 'guimei'
    return None


def _user_matches_campus_bucket(
    user_campus: Optional[str], campus_bucket: Optional[str]
) -> bool:
    if campus_bucket is None:
        return False
    return _resolve_campus_bucket(user_campus) == campus_bucket


def _require_applicant_identity(current_user: User) -> tuple[str, str, str, str]:
    applicant_name = (current_user.real_name or current_user.username or '').strip()
    applicant_campus = (current_user.campus or '').strip()
    applicant_department = (current_user.department or '').strip()
    applicant_position = (current_user.position or '').strip()

    if not applicant_name:
        raise ValueError('当前账号缺少姓名信息，无法填写晋升申请')
    if not applicant_campus:
        raise ValueError('当前账号缺少神殿信息，无法填写晋升申请')
    if not applicant_department:
        raise ValueError('当前账号缺少部门信息，无法填写晋升申请')
    if not applicant_position:
        raise ValueError('当前账号缺少岗位信息，无法填写晋升申请')

    return (
        applicant_name,
        applicant_campus,
        applicant_department,
        applicant_position,
    )


def _validate_application_text_fields(record: PromotionApplication) -> None:
    for field_name, (label, min_length) in PROMOTION_MIN_TEXT_LENGTH_FIELDS.items():
        value = getattr(record, field_name, None)
        if _get_effective_text_length(value) < min_length:
            raise ValueError(f"{label}不少于{min_length}字")


def _generate_application_no() -> str:
    return f"JSSQ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


def _sum_salary_parts(
    base_salary: Optional[float], performance_salary: Optional[float]
) -> Optional[float]:
    if base_salary is None and performance_salary is None:
        return None
    total = 0.0
    if base_salary is not None:
        total += float(base_salary)
    if performance_salary is not None:
        total += float(performance_salary)
    return total


def _normalize_promoted_salary_fields(
    *,
    promoted_base_salary: Optional[float],
    promoted_performance_salary: Optional[float],
    promoted_salary: Optional[float],
) -> tuple[Optional[float], Optional[float], Optional[float]]:
    if promoted_base_salary is None and promoted_performance_salary is None:
        if promoted_salary is None:
            return None, None, None
        return promoted_salary, None, promoted_salary
    return (
        promoted_base_salary,
        promoted_performance_salary,
        _sum_salary_parts(promoted_base_salary, promoted_performance_salary),
    )


def _is_management_center_campus(campus: Optional[str]) -> bool:
    return bool(campus and campus.strip() in MANAGEMENT_CENTER_CAMPUS_VALUES)


def _campus_matches_scope(
    user_campus: Optional[str], selected_campus: Optional[str]
) -> bool:
    if not selected_campus:
        return True
    if not user_campus:
        return True
    if _is_management_center_campus(selected_campus):
        return _is_management_center_campus(user_campus)
    selected_bucket = _resolve_campus_bucket(selected_campus)
    user_bucket = _resolve_campus_bucket(user_campus)
    if selected_bucket and user_bucket:
        return selected_bucket == user_bucket
    return user_campus == selected_campus


def _is_management_role_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in MANAGEMENT_ROLE_KEYWORDS)


def _is_director_position(position: Optional[str]) -> bool:
    return DIRECTOR_POSITION_KEYWORD in _normalize_compact_text(position)


def _is_school_leader_position(position: Optional[str]) -> bool:
    return "校长" in _normalize_compact_text(position)


def _is_principal_position(
    campus_bucket: Optional[str],
    position: Optional[str],
) -> bool:
    del campus_bucket
    normalized = _normalize_compact_text(position)
    if not normalized:
        return False
    if '校长' not in normalized:
        return False
    vice_index = normalized.find('副')
    principal_index = normalized.find('校长')
    return vice_index == -1 or vice_index > principal_index


def _is_chairman_position(position: Optional[str]) -> bool:
    return bool(position and position.strip() == "董事长")


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(
        marker in normalized
        for marker in ("人资行政", "人事行政", "人力资源", "人事部", "人资部", "人资")
    )


def _is_department_head_candidate_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or normalized == '董事长':
        return False
    return _is_management_role_position(position) or '校长' in normalized


def _is_hr_director_candidate(user: User) -> bool:
    return (
        _is_management_center_campus(user.campus)
        and _is_hr_admin_department(user.department)
        and _is_director_position(user.position)
    )


def _normalize_department_key(department: Optional[str]) -> str:
    normalized = _normalize_compact_text(department)
    for marker in LINE_DEPARTMENT_KEYWORDS:
        if marker in normalized:
            return marker
    return normalized


def _get_line_keywords(
    department: Optional[str], position: Optional[str]
) -> tuple[str, ...]:
    normalized_department = _normalize_compact_text(department)
    normalized_position = _normalize_compact_text(position)
    values: list[str] = []
    for marker, keywords in LINE_DEPARTMENT_KEYWORDS.items():
        if marker in normalized_department or marker in normalized_position:
            values.extend(keywords)
    if values:
        return tuple(dict.fromkeys(values))
    if normalized_department:
        return (normalized_department,)
    return tuple()


def _department_matches(
    user_department: Optional[str], apply_department: Optional[str]
) -> bool:
    normalized_user_department = _normalize_department_key(user_department)
    normalized_apply_department = _normalize_department_key(apply_department)
    return bool(
        normalized_user_department
        and normalized_user_department == normalized_apply_department
    )


def _matches_line_keywords(
    user_department: Optional[str],
    user_position: Optional[str],
    keywords: tuple[str, ...],
) -> bool:
    if not keywords:
        return False
    haystack = f"{_normalize_compact_text(user_department)}|{_normalize_compact_text(user_position)}"
    return any(keyword in haystack for keyword in keywords)


def _position_priority(position: Optional[str]) -> int:
    normalized = _normalize_compact_text(position)
    if normalized == "董事长":
        return 0
    if "总监" in normalized:
        return 1
    if "校长" in normalized:
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


def _get_selected_approver_user_ids(
    record: PromotionApplication,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids, PROMOTION_APPROVAL_STAGES
    )


def _resolve_selected_stage_approvers(
    db: Session,
    record: PromotionApplication,
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


def _get_department_manager_rule(
    campus_bucket: Optional[str],
    department: Optional[str],
) -> Optional[dict]:
    if campus_bucket is None:
        return None
    rule_group_key = 'management_center' if campus_bucket == 'management_center' else 'branch'
    for rule in DEPARTMENT_MANAGER_RULES.get(rule_group_key, ()): 
        if _matches_keyword_family(department, rule['department_keywords']):
            return rule
    return None


def _get_special_department_manager_rule(
    campus_bucket: Optional[str],
    apply_department: Optional[str],
) -> Optional[dict]:
    if campus_bucket is None:
        return None
    for rule in SPECIAL_DEPARTMENT_MANAGER_RULES.get(campus_bucket, ()): 
        if _matches_keyword_family(apply_department, rule['apply_department_keywords']):
            return rule
    return None


def _matches_special_department_manager_rule(
    approver: User,
    apply_department: Optional[str],
    rule: dict,
) -> bool:
    if not _matches_any_position_patterns(approver.position, rule['position_patterns']):
        return False

    candidate_department_keywords = rule.get('candidate_department_keywords')
    if candidate_department_keywords and not _matches_keyword_family(
        approver.department,
        candidate_department_keywords,
    ):
        return False

    if rule.get('allow_cross_department'):
        return True

    return _is_same_department_scope(approver.department, apply_department)


def _resolve_scoped_users(
    db: Session,
    record: PromotionApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    campus_bucket = _resolve_campus_bucket(record.campus)
    if campus_bucket == 'management_center':
        return [user for user in users if _is_management_center_campus(user.campus)]
    if campus_bucket is not None:
        return [user for user in users if _user_matches_campus_bucket(user.campus, campus_bucket)]
    return [user for user in users if _campus_matches_scope(user.campus, record.campus)]


def _is_valid_department_manager_approver(
    approver: User,
    campus: str,
    apply_department: str,
    apply_position: str,
) -> bool:
    campus_bucket = _resolve_campus_bucket(campus)
    if _is_management_center_campus(campus):
        if not _is_management_center_campus(approver.campus):
            return False
    elif campus_bucket is not None:
        if not _user_matches_campus_bucket(approver.campus, campus_bucket):
            return False
    elif not _campus_matches_scope(approver.campus, campus):
        return False

    if _is_management_role_position(apply_position):
        if _is_management_center_campus(campus):
            return _is_valid_biz_director_approver(
                approver,
                apply_department,
                apply_position,
            )
        return _is_valid_principal_approver(approver, campus)

    special_rule = _get_special_department_manager_rule(campus_bucket, apply_department)
    if special_rule is not None:
        return _matches_special_department_manager_rule(
            approver,
            apply_department,
            special_rule,
        )

    rule = _get_department_manager_rule(campus_bucket, apply_department)
    if rule is not None and _is_same_department_scope(
        approver.department, apply_department
    ):
        if _matches_any_position_patterns(approver.position, rule['position_patterns']):
            return True
        return '校长' in _normalize_compact_text(approver.position)

    return _is_same_department_scope(
        approver.department, apply_department
    ) and _is_department_head_candidate_position(approver.position)


def _is_valid_principal_approver(approver: User, campus: str) -> bool:
    campus_bucket = _resolve_campus_bucket(campus)
    if campus_bucket == 'management_center':
        return False
    if campus_bucket is not None and not _user_matches_campus_bucket(
        approver.campus, campus_bucket
    ):
        return False
    if campus_bucket is None and not _campus_matches_scope(approver.campus, campus):
        return False
    return _is_principal_position(campus_bucket, approver.position)


def _is_valid_biz_director_approver(
    approver: User,
    apply_department: str,
    apply_position: str,
) -> bool:
    if not _is_management_center_campus(approver.campus):
        return False
    if not _is_management_role_position(approver.position):
        return False
    keywords = _get_line_keywords(apply_department, apply_position)
    if _department_matches(approver.department, apply_department):
        return True
    return _matches_line_keywords(approver.department, approver.position, keywords)


def _resolve_department_manager_fallback(
    db: Session,
    record: PromotionApplication,
) -> list[User]:
    same_scope_users = _resolve_scoped_users(db, record)
    campus_bucket = _resolve_campus_bucket(record.campus)

    special_rule = _get_special_department_manager_rule(campus_bucket, record.department)
    if special_rule is not None:
        special_candidates = [
            user
            for user in same_scope_users
            if _matches_special_department_manager_rule(
                user,
                record.department,
                special_rule,
            )
        ]
        if special_candidates:
            return _sort_and_dedupe_users(special_candidates)

    same_department_rule_users = [
        user
        for user in same_scope_users
        if _is_valid_department_manager_approver(
            user,
            record.campus,
            record.department,
            record.position,
        )
        and _is_same_department_scope(user.department, record.department)
    ]
    if same_department_rule_users:
        return _sort_and_dedupe_users(same_department_rule_users)

    if _get_department_manager_rule(campus_bucket, record.department) is not None:
        same_department_school_leaders = [
            user
            for user in same_scope_users
            if _is_same_department_scope(user.department, record.department)
            and '校长' in _normalize_compact_text(user.position)
        ]
        if same_department_school_leaders:
            return _sort_and_dedupe_users(same_department_school_leaders)

    same_department_managers = [
        user
        for user in same_scope_users
        if _is_same_department_scope(user.department, record.department)
        and _is_department_head_candidate_position(user.position)
    ]
    if same_department_managers:
        return _sort_and_dedupe_users(same_department_managers)

    target_is_management_role = _is_management_role_position(record.position)
    if _is_management_center_campus(record.campus) and target_is_management_role:
        return _resolve_biz_director_fallback(db, record)
    if target_is_management_role:
        return _resolve_principal_fallback(db, record)

    rule = _get_department_manager_rule(campus_bucket, record.department)
    if rule is not None:
        scoped_rule_users = [
            user
            for user in same_scope_users
            if _matches_any_position_patterns(user.position, rule['position_patterns'])
        ]
        if scoped_rule_users:
            return _sort_and_dedupe_users(scoped_rule_users)
    return []


def _resolve_principal_fallback(
    db: Session,
    record: PromotionApplication,
) -> list[User]:
    same_scope_users = _resolve_scoped_users(db, record)
    principals = [
        user
        for user in same_scope_users
        if _is_valid_principal_approver(user, record.campus)
    ]
    return _sort_and_dedupe_users(principals)


def _resolve_biz_director_fallback(
    db: Session,
    record: PromotionApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    management_center_users = [
        user for user in users if _is_management_center_campus(user.campus)
    ]
    keywords = _get_line_keywords(record.department, record.position)

    exact_department_directors = [
        user
        for user in management_center_users
        if _department_matches(user.department, record.department)
        and _is_director_position(user.position)
    ]
    keyword_directors = [
        user
        for user in management_center_users
        if _matches_line_keywords(user.department, user.position, keywords)
        and _is_director_position(user.position)
    ]
    exact_department_managers = [
        user
        for user in management_center_users
        if _department_matches(user.department, record.department)
        and _is_management_role_position(user.position)
    ]
    keyword_managers = [
        user
        for user in management_center_users
        if _matches_line_keywords(user.department, user.position, keywords)
        and _is_management_role_position(user.position)
    ]

    return _sort_and_dedupe_users(
        exact_department_directors
        + keyword_directors
        + exact_department_managers
        + keyword_managers
    )


def _resolve_hr_director_fallback(
    db: Session,
    record: PromotionApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    hr_directors = [user for user in users if _is_hr_director_candidate(user)]
    return _sort_and_dedupe_users(hr_directors)


def _resolve_chairman_fallback(
    db: Session,
    record: PromotionApplication,
) -> list[User]:
    if not _should_require_chairman(record.campus, record.position):
        return []

    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    chairmen = [user for user in users if _is_chairman_position(user.position)]
    return _sort_and_dedupe_users(chairmen)


def get_stage_candidate_users(
    db: Session,
    record: PromotionApplication,
    stage: str,
) -> list[User]:
    template_candidates = workflow_crud.get_template_stage_candidate_users(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=record.department,
        position=record.position,
        stage=stage,
    )
    if template_candidates is not None:
        return template_candidates

    if stage == "department_manager":
        return _resolve_department_manager_fallback(db, record)
    if stage == "principal":
        return _resolve_principal_fallback(db, record)
    if stage == "biz_director":
        return _resolve_biz_director_fallback(db, record)
    if stage == "hr_director":
        return _resolve_hr_director_fallback(db, record)
    if stage == "chairman":
        return _resolve_chairman_fallback(db, record)
    return []


def _resolve_config(
    db: Session,
    campus: Optional[str],
    apply_department: str,
    apply_position: str,
    stage: str,
) -> Optional[PromotionApprovalConfig]:
    campus_values = _get_config_campus_values(campus)
    if not campus_values:
        return None

    dept = _normalize_scope_value(apply_department)
    pos = _normalize_scope_value(apply_position)
    candidates = [
        (dept, pos),
        (dept, ""),
        ("", pos),
        ("", ""),
    ]

    for candidate_dept, candidate_pos in candidates:
        config = (
            db.query(PromotionApprovalConfig)
            .options(selectinload(PromotionApprovalConfig.approvers))
            .filter(
                PromotionApprovalConfig.campus.in_(campus_values),
                PromotionApprovalConfig.apply_department == candidate_dept,
                PromotionApprovalConfig.apply_position == candidate_pos,
                PromotionApprovalConfig.stage == stage,
                PromotionApprovalConfig.is_active.is_(True),
            )
            .order_by(PromotionApprovalConfig.id.asc())
            .first()
        )
        if config and config.approvers:
            return config
    return None


def _should_require_chairman(
    campus: Optional[str],
    position: Optional[str],
) -> bool:
    return _is_management_center_campus(campus) or _is_principal_position(
        _resolve_campus_bucket(campus),
        position,
    )


def _normalize_flow_stage_order(
    record: PromotionApplication,
    stages: list[str],
) -> list[str]:
    requires_chairman = _should_require_chairman(record.campus, record.position)
    normalized_stages: list[str] = []
    seen: set[str] = set()

    for stage in stages:
        if stage not in PROMOTION_APPROVAL_STAGES or stage in seen:
            continue
        if stage == "principal" and _is_management_center_campus(record.campus):
            continue
        if stage == "chairman" and not requires_chairman:
            continue
        normalized_stages.append(stage)
        seen.add(stage)

    if requires_chairman and "chairman" not in seen:
        normalized_stages.append("chairman")

    return normalized_stages


def get_flow_stages(
    record: PromotionApplication, db: Optional[Session] = None
) -> list[str]:
    if db is not None:
        template_stages = workflow_crud.resolve_flow_stage_order(
            db,
            flow_type=FLOW_TYPE,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        if template_stages is not None:
            return _normalize_flow_stage_order(record, template_stages)

    if _is_management_center_campus(record.campus):
        return _normalize_flow_stage_order(
            record,
            ["department_manager", "biz_director", "hr_director", "chairman"],
        )
    return _normalize_flow_stage_order(
        record,
        [
            "department_manager",
            "principal",
            "biz_director",
            "hr_director",
            "chairman",
        ],
    )


def resolve_stage_approvers(
    db: Session,
    record: PromotionApplication,
    stage: str,
) -> list[User]:
    selected_users = _resolve_selected_stage_approvers(db, record, stage)
    if selected_users:
        return selected_users

    template_users = workflow_crud.resolve_template_stage_approvers(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=record.department,
        position=record.position,
        stage=stage,
    )
    if template_users is not None:
        return template_users

    config = _resolve_config(
        db, record.campus, record.department, record.position, stage
    )
    if config:
        user_ids = [item.approver_user_id for item in config.approvers]
        if user_ids:
            users = (
                db.query(User)
                .filter(User.user_id.in_(user_ids), User.status == UserStatus.ACTIVE)
                .all()
            )
            user_map = {user.user_id: user for user in users}
            return [user_map[user_id] for user_id in user_ids if user_id in user_map]

    return get_stage_candidate_users(db, record, stage)


def _validate_selected_stage_approvers(
    db: Session,
    record: PromotionApplication,
    stage: str,
    user_ids: list[int],
) -> None:
    template_candidates = workflow_crud.get_template_stage_candidate_users(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=record.department,
        position=record.position,
        stage=stage,
    )
    if template_candidates is not None:
        allowed_user_ids = {item.user_id for item in template_candidates}
        invalid_user_ids = [
            user_id for user_id in user_ids if user_id not in allowed_user_ids
        ]
        if invalid_user_ids:
            raise ValueError(
                f"{PROMOTION_STAGE_LABELS[stage]}审批人超出当前模板候选范围: {invalid_user_ids}"
            )
        return

    approvers = (
        db.query(User)
        .filter(User.user_id.in_(user_ids), User.status == UserStatus.ACTIVE)
        .all()
    )
    approver_map = {item.user_id: item for item in approvers}
    missing_user_ids = [user_id for user_id in user_ids if user_id not in approver_map]
    if missing_user_ids:
        raise ValueError(
            f"{PROMOTION_STAGE_LABELS[stage]}审批人不存在或已停用: {missing_user_ids}"
        )

    if stage == "department_manager":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_department_manager_approver(
                item,
                record.campus,
                record.department,
                record.position,
            )
        ]
        if invalid_users:
            raise ValueError(
                "部门主管阶段只能选择当前神殿当前部门的管理岗，或管理岗申请时的上一级审批岗: "
                + "、".join(invalid_users)
            )

    if stage == "principal":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_principal_approver(item, record.campus)
        ]
        if invalid_users:
            raise ValueError(
                "校长阶段只能选择当前神殿岗位名称包含“校长”的人员: "
                + "、".join(invalid_users)
            )

    if stage == "biz_director":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_biz_director_approver(
                item, record.department, record.position
            )
        ]
        if invalid_users:
            raise ValueError(
                "业务条线总监阶段只能选择最高议事厅对应条线的管理岗人员: "
                + "、".join(invalid_users)
            )

    if stage == "hr_director":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_hr_director_candidate(item)
        ]
        if invalid_users:
            raise ValueError(
                "人资总监阶段只能选择最高议事厅人资相关部门中职位包含“总监”的人员: "
                + "、".join(invalid_users)
            )

    if stage == "chairman":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_chairman_position(item.position)
        ]
        if invalid_users:
            raise ValueError(
                "董事长阶段只能选择职位为“董事长”的人员: " + "、".join(invalid_users)
            )


def _set_selected_approver_user_ids(
    db: Session,
    record: PromotionApplication,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record, db)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized, PROMOTION_APPROVAL_STAGES
    )
    return normalized


def build_approver_candidate_preview(
    db: Session,
    *,
    campus: str,
    department: str,
    position: str,
    created_by_user_id: Optional[int] = None,
    selected_approver_user_ids: Optional[dict[str, list[int]]] = None,
) -> list[dict]:
    record = PromotionApplication(
        campus=campus.strip(),
        department=department.strip(),
        position=position.strip(),
        created_by_user_id=created_by_user_id,
    )
    flow_stages = get_flow_stages(record, db)
    preview_map = normalize_selected_approver_map(
        selected_approver_user_ids, flow_stages
    )
    preview_items: list[dict] = []
    for stage in flow_stages:
        candidate_users = get_stage_candidate_users(db, record, stage)
        if preview_map.get(stage):
            recommended_user_ids = preview_map[stage]
        else:
            recommended_user_ids = [
                item.user_id for item in resolve_stage_approvers(db, record, stage)
            ]
        preview_items.append(
            {
                "stage": stage,
                "stage_label": PROMOTION_STAGE_LABELS[stage],
                "recommended_user_ids": recommended_user_ids,
                "approvers": [_serialize_approver(item) for item in candidate_users],
            }
        )
    return preview_items


def list_approval_configs(
    db: Session,
    campus: Optional[str] = None,
    apply_department: Optional[str] = None,
    apply_position: Optional[str] = None,
    stage: Optional[str] = None,
) -> list[PromotionApprovalConfig]:
    query = db.query(PromotionApprovalConfig).options(
        selectinload(PromotionApprovalConfig.approvers)
    )
    if campus:
        query = query.filter(
            PromotionApprovalConfig.campus.in_(_get_config_campus_values(campus))
        )
    if apply_department is not None:
        query = query.filter(
            PromotionApprovalConfig.apply_department
            == _normalize_scope_value(apply_department)
        )
    if apply_position is not None:
        query = query.filter(
            PromotionApprovalConfig.apply_position
            == _normalize_scope_value(apply_position)
        )
    if stage:
        query = query.filter(PromotionApprovalConfig.stage == stage)
    return query.order_by(
        PromotionApprovalConfig.campus.asc(),
        PromotionApprovalConfig.apply_department.asc(),
        PromotionApprovalConfig.apply_position.asc(),
        PromotionApprovalConfig.stage.asc(),
    ).all()


def upsert_approval_config(
    db: Session,
    payload: PromotionApprovalConfigUpsert,
) -> PromotionApprovalConfig:
    if payload.stage not in PROMOTION_APPROVAL_STAGES:
        raise ValueError("审批阶段不合法")
    if not payload.approver_user_ids:
        raise ValueError("请至少配置一个审批人")
    if _is_management_center_campus(payload.campus) and payload.stage == "principal":
        raise ValueError("最高议事厅晋升审批不包含校长环节")
    if payload.stage == "chairman" and not _should_require_chairman(
        payload.campus,
        payload.apply_position,
    ):
        raise ValueError("董事长阶段只允许配置最高议事厅或校长岗位范围")

    normalized_campus = _normalize_config_campus_value(payload.campus)
    campus_values = _get_config_campus_values(payload.campus)

    approvers = (
        db.query(User)
        .filter(
            User.user_id.in_(payload.approver_user_ids),
            User.status == UserStatus.ACTIVE,
        )
        .all()
    )
    approver_map = {item.user_id: item for item in approvers}
    missing_user_ids = [
        user_id for user_id in payload.approver_user_ids if user_id not in approver_map
    ]
    if missing_user_ids:
        raise ValueError(f"审批人不存在或已停用: {missing_user_ids}")

    if payload.stage == "department_manager":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_department_manager_approver(
                item,
                payload.campus.strip(),
                payload.apply_department or "",
                payload.apply_position or "",
            )
        ]
        if invalid_users:
            raise ValueError(
                "部门主管阶段只能配置当前神殿当前部门的管理岗，或管理岗申请时的上一级审批岗: "
                + "、".join(invalid_users)
            )

    if payload.stage == "principal":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_principal_approver(item, payload.campus.strip())
        ]
        if invalid_users:
            raise ValueError(
                "校长阶段只能配置当前神殿岗位名称包含“校长”的人员: "
                + "、".join(invalid_users)
            )

    if payload.stage == "biz_director":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_biz_director_approver(
                item,
                payload.apply_department or "",
                payload.apply_position or "",
            )
        ]
        if invalid_users:
            raise ValueError(
                "业务条线总监阶段只能配置最高议事厅对应条线的管理岗人员: "
                + "、".join(invalid_users)
            )

    if payload.stage == "hr_director":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_hr_director_candidate(item)
        ]
        if invalid_users:
            raise ValueError(
                "人资总监阶段只能配置最高议事厅人资相关部门中职位包含“总监”的人员: "
                + "、".join(invalid_users)
            )

    if payload.stage == "chairman":
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_chairman_position(item.position)
        ]
        if invalid_users:
            raise ValueError(
                "董事长阶段只能配置职位为“董事长”的人员: " + "、".join(invalid_users)
            )

    apply_department = _normalize_scope_value(payload.apply_department)
    apply_position = _normalize_scope_value(payload.apply_position)
    record = (
        db.query(PromotionApprovalConfig)
        .options(selectinload(PromotionApprovalConfig.approvers))
        .filter(
            PromotionApprovalConfig.campus.in_(campus_values),
            PromotionApprovalConfig.apply_department == apply_department,
            PromotionApprovalConfig.apply_position == apply_position,
            PromotionApprovalConfig.stage == payload.stage,
        )
        .order_by(PromotionApprovalConfig.id.asc())
        .first()
    )

    if not record:
        record = PromotionApprovalConfig(
            campus=normalized_campus,
            apply_department=apply_department,
            apply_position=apply_position,
            stage=payload.stage,
            is_active=payload.is_active,
        )
        db.add(record)
        db.flush()
    else:
        record.campus = normalized_campus
        record.is_active = payload.is_active
        record.approvers.clear()
        db.flush()

    for index, user_id in enumerate(payload.approver_user_ids):
        user = approver_map[user_id]
        record.approvers.append(
            PromotionApprovalConfigApprover(
                approver_user_id=user.user_id,
                approver_name=user.real_name,
                approver_department=user.department,
                approver_position=user.position,
                approver_campus=user.campus,
                sort_order=index,
            )
        )

    db.commit()
    db.refresh(record)
    return record


def delete_approval_config(db: Session, config_id: int) -> bool:
    record = (
        db.query(PromotionApprovalConfig)
        .filter(PromotionApprovalConfig.id == config_id)
        .first()
    )
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_application(db: Session, application_id: int) -> Optional[PromotionApplication]:
    return (
        db.query(PromotionApplication)
        .options(selectinload(PromotionApplication.approval_actions))
        .filter(PromotionApplication.id == application_id)
        .first()
    )


def _has_manage_privilege(user: User, record: PromotionApplication) -> bool:
    return record.created_by_user_id == user.user_id


def _has_approval_history(record: PromotionApplication, user: Optional[User]) -> bool:
    if user is None:
        return False
    return any(
        action.approver_user_id == user.user_id for action in record.approval_actions
    )


def _is_current_stage_approver(
    db: Session,
    record: PromotionApplication,
    user: Optional[User],
) -> bool:
    if user is None or record.status != "pending" or not record.current_stage:
        return False
    allowed_user_ids = get_stage_approver_ids(db, record, record.current_stage)
    return user.user_id in allowed_user_ids


def can_view_application(
    db: Session,
    record: PromotionApplication,
    user: Optional[User],
) -> bool:
    if user is None:
        return False
    if record.created_by_user_id == user.user_id:
        return True
    if record.status == "draft":
        return False
    if _has_approval_history(record, user):
        return True
    return _is_current_stage_approver(db, record, user)


def list_applications(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    current_user: Optional[User] = None,
) -> list[PromotionApplication]:
    query = db.query(PromotionApplication).options(
        selectinload(PromotionApplication.approval_actions)
    )
    if campus:
        campus_values = _get_config_campus_values(campus)
        if len(campus_values) > 1:
            query = query.filter(PromotionApplication.campus.in_(campus_values))
        else:
            query = query.filter(PromotionApplication.campus == campus)
    if status:
        query = query.filter(PromotionApplication.status == status)
    if department:
        query = query.filter(PromotionApplication.department == department)
    records = query.order_by(PromotionApplication.created_at.desc()).all()
    if current_user is None:
        return records
    return [
        record for record in records if can_view_application(db, record, current_user)
    ]


def create_application(
    db: Session,
    payload: PromotionApplicationCreate,
    current_user: User,
) -> PromotionApplication:
    from app.crud.human_resources import (
        appointment_interview_record as appointment_interview_record_crud,
    )
    from app.crud.human_resources import promotion_interview as promotion_interview_crud
    applicant_name, applicant_campus, applicant_department, applicant_position = (
        _require_applicant_identity(current_user)
    )

    (
        promoted_base_salary,
        promoted_performance_salary,
        promoted_salary,
    ) = _normalize_promoted_salary_fields(
        promoted_base_salary=payload.promoted_base_salary,
        promoted_performance_salary=payload.promoted_performance_salary,
        promoted_salary=payload.promoted_salary,
    )

    record = PromotionApplication(
        application_no=_generate_application_no(),
        fill_date=payload.fill_date,
        campus=applicant_campus,
        name=applicant_name,
        native_place=_normalize_optional_str(payload.native_place),
        age=payload.age,
        entry_date=payload.entry_date,
        department=applicant_department,
        position=applicant_position,
        work_overview=payload.work_overview.strip(),
        promotion_reason=payload.promotion_reason.strip(),
        confidence_and_expectation=payload.confidence_and_expectation.strip(),
        original_level=_normalize_optional_str(payload.original_level),
        original_salary=payload.original_salary,
        promoted_level=_normalize_optional_str(payload.promoted_level),
        promoted_base_salary=promoted_base_salary,
        promoted_performance_salary=promoted_performance_salary,
        promoted_salary=promoted_salary,
        status="draft",
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    _validate_application_text_fields(record)
    _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)
    db.add(record)
    db.flush()
    linked_interview = promotion_interview_crud.sync_record_from_application(db, record)
    appointment_interview_record_crud.ensure_record_for_qualified_interview(
        db, linked_interview
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def update_application(
    db: Session,
    record: PromotionApplication,
    payload: PromotionApplicationUpdate,
    current_user: User,
) -> PromotionApplication:
    from app.crud.human_resources import (
        appointment_interview_record as appointment_interview_record_crud,
    )
    from app.crud.human_resources import promotion_interview as promotion_interview_crud

    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    applicant_name, applicant_campus, applicant_department, applicant_position = (
        _require_applicant_identity(current_user)
    )

    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)
    payload_data.pop("campus", None)
    payload_data.pop("name", None)
    payload_data.pop("department", None)
    payload_data.pop("position", None)
    compensation_payload_data = {
        key: payload_data.pop(key)
        for key in (
            "original_level",
            "original_salary",
            "promoted_level",
            "promoted_base_salary",
            "promoted_performance_salary",
            "promoted_salary",
        )
        if key in payload_data
    }
    required_string_fields = {
        "campus",
        "name",
        "department",
        "position",
        "work_overview",
        "promotion_reason",
        "confidence_and_expectation",
    }
    optional_string_fields = {"native_place"}

    for field, value in payload_data.items():
        if isinstance(value, str):
            value = value.strip()
            if field in required_string_fields and not value:
                raise ValueError(f"{field} 不能为空")
            if field in optional_string_fields:
                value = value or None
        setattr(record, field, value)

    record.campus = applicant_campus
    record.name = applicant_name
    record.department = applicant_department
    record.position = applicant_position

    _validate_application_text_fields(record)
    _apply_promotion_compensation_fields(record, compensation_payload_data)

    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    linked_interview = promotion_interview_crud.sync_record_from_application(db, record)
    appointment_interview_record_crud.ensure_record_for_qualified_interview(
        db, linked_interview
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def delete_application(
    db: Session,
    record: PromotionApplication,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def validate_full_approval_chain(
    db: Session, record: PromotionApplication
) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record, db):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(PROMOTION_STAGE_LABELS[stage])
    return missing_stages


def _apply_promotion_compensation_fields(
    record: PromotionApplication,
    payload_data: dict[str, object],
) -> None:
    if not payload_data:
        return

    if "original_level" in payload_data:
        record.original_level = _normalize_optional_str(
            payload_data.get("original_level")
        )
    if "original_salary" in payload_data:
        record.original_salary = payload_data.get("original_salary")
    if "promoted_level" in payload_data:
        record.promoted_level = _normalize_optional_str(
            payload_data.get("promoted_level")
        )

    if {
        "promoted_base_salary",
        "promoted_performance_salary",
        "promoted_salary",
    } & payload_data.keys():
        promoted_base_salary = payload_data.get(
            "promoted_base_salary", record.promoted_base_salary
        )
        promoted_performance_salary = payload_data.get(
            "promoted_performance_salary", record.promoted_performance_salary
        )
        promoted_salary = payload_data.get("promoted_salary", record.promoted_salary)
        (
            record.promoted_base_salary,
            record.promoted_performance_salary,
            record.promoted_salary,
        ) = _normalize_promoted_salary_fields(
            promoted_base_salary=promoted_base_salary,
            promoted_performance_salary=promoted_performance_salary,
            promoted_salary=promoted_salary,
        )


def _validate_required_compensation_fields(
    record: PromotionApplication,
    stage: str,
) -> None:
    missing_fields = [
        label
        for field_name, label in PROMOTION_REQUIRED_SALARY_FIELDS.items()
        if getattr(record, field_name) is None
    ]
    if missing_fields:
        raise ValueError(
            f"{PROMOTION_STAGE_LABELS[stage]}审批前请先填写：{'、'.join(missing_fields)}"
        )


def _clear_stage_results(record: PromotionApplication) -> None:
    record.department_manager_opinion = None
    record.department_manager_passed = None
    record.principal_opinion = None
    record.principal_passed = None
    record.biz_director_opinion = None
    record.biz_director_passed = None
    record.hr_director_opinion = None
    record.hr_director_passed = None
    record.chairman_opinion = None
    record.chairman_passed = None
    record.is_passed = None


def _set_stage_result(
    record: PromotionApplication,
    stage: str,
    *,
    approved: bool,
    comment: Optional[str],
) -> None:
    normalized_comment = _normalize_optional_str(comment)
    if stage == "department_manager":
        record.department_manager_opinion = normalized_comment
        record.department_manager_passed = approved
    elif stage == "principal":
        record.principal_opinion = normalized_comment
        record.principal_passed = approved
    elif stage == "biz_director":
        record.biz_director_opinion = normalized_comment
        record.biz_director_passed = approved
    elif stage == "hr_director":
        record.hr_director_opinion = normalized_comment
        record.hr_director_passed = approved
    elif stage == "chairman":
        record.chairman_opinion = normalized_comment
        record.chairman_passed = approved


def get_stage_approver_ids(
    db: Session,
    record: PromotionApplication,
    stage: str,
) -> list[int]:
    approvers = resolve_stage_approvers(db, record, stage)
    return [item.user_id for item in approvers]


def _create_application_notification(
    db: Session,
    *,
    record: PromotionApplication,
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
        PromotionApplicationNotification(
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


def get_unread_notification_count(db: Session, recipient_user_id: int) -> int:
    return (
        db.query(PromotionApplicationNotification)
        .filter(
            PromotionApplicationNotification.recipient_user_id == recipient_user_id,
            PromotionApplicationNotification.is_read.is_(False),
        )
        .count()
    )


def list_application_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[PromotionApplicationNotification]:
    query = (
        db.query(PromotionApplicationNotification)
        .join(
            PromotionApplication,
            PromotionApplication.id == PromotionApplicationNotification.application_id,
        )
        .options(selectinload(PromotionApplicationNotification.application))
        .filter(PromotionApplicationNotification.recipient_user_id == recipient_user_id)
    )
    if unread_only:
        query = query.filter(PromotionApplicationNotification.is_read.is_(False))
    return query.order_by(PromotionApplicationNotification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[PromotionApplicationNotification]:
    record = (
        db.query(PromotionApplicationNotification)
        .filter(
            PromotionApplicationNotification.id == notification_id,
            PromotionApplicationNotification.recipient_user_id == recipient_user_id,
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
        db.query(PromotionApplicationNotification)
        .filter(
            PromotionApplicationNotification.recipient_user_id == recipient_user_id,
            PromotionApplicationNotification.is_read.is_(False),
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
    db: Session,
    record: PromotionApplication,
    current_user: User,
) -> PromotionApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

    _validate_application_text_fields(record)

    missing_stages = validate_full_approval_chain(db, record)
    if missing_stages:
        raise ValueError(f"审批链不完整，缺少：{'、'.join(missing_stages)}")

    flow_stages = get_flow_stages(record, db)
    record.status = "pending"
    record.current_stage = flow_stages[0]
    record.rejection_reason = None
    record.completed_at = None
    record.submitted_at = datetime.now()
    _clear_stage_results(record)

    db.add(
        PromotionApplicationApprovalAction(
            application_id=record.id,
            stage="submit",
            action="submit",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment="提交审批",
        )
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def approve_application(
    db: Session,
    record: PromotionApplication,
    current_user: User,
    payload_data: Optional[dict[str, object]] = None,
) -> PromotionApplication:
    from app.crud.human_resources import (
        appointment_interview_record as appointment_interview_record_crud,
    )
    from app.crud.human_resources import promotion_interview as promotion_interview_crud

    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(PromotionApplicationApprovalAction)
        .filter(
            PromotionApplicationApprovalAction.application_id == record.id,
            PromotionApplicationApprovalAction.stage == current_stage,
            PromotionApplicationApprovalAction.approver_user_id == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    approval_payload_data = dict(payload_data or {})
    raw_comment = approval_payload_data.pop("comment", None)
    comment = raw_comment if isinstance(raw_comment, str) else None
    _apply_promotion_compensation_fields(record, approval_payload_data)
    _validate_required_compensation_fields(record, current_stage)

    _set_stage_result(record, current_stage, approved=True, comment=comment)
    db.add(
        PromotionApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=_normalize_optional_str(comment),
        )
    )
    linked_interview = promotion_interview_crud.sync_record_from_application(db, record)
    appointment_interview_record_crud.ensure_record_for_qualified_interview(
        db, linked_interview
    )

    flow_stages = get_flow_stages(record, db)
    stage_index = flow_stages.index(current_stage)
    if stage_index == len(flow_stages) - 1:
        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        record.is_passed = True
        employee_archive_crud.sync_archive_from_promotion_application(db, record)
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"晋升申请已通过：{record.name}/{record.department}",
            content=(
                f"你的晋升申请《{record.application_no}》已完成全部审批并通过。"
                f"当前环节：{PROMOTION_STAGE_LABELS[current_stage]}。"
                f"{f' 审批意见：{comment.strip()}' if comment and comment.strip() else ''}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )
    else:
        next_stage = flow_stages[stage_index + 1]
        next_stage_approvers = get_stage_approver_ids(db, record, next_stage)
        if not next_stage_approvers:
            raise ValueError(
                f"下一阶段“{PROMOTION_STAGE_LABELS[next_stage]}”未找到审批人，无法继续流转"
            )
        record.current_stage = next_stage
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"晋升申请流转更新：{record.name}/{record.department}",
            content=(
                f"你的晋升申请《{record.application_no}》已通过【{PROMOTION_STAGE_LABELS[current_stage]}】审批，"
                f"当前已流转至【{PROMOTION_STAGE_LABELS[next_stage]}】。"
                f"{f' 审批意见：{comment.strip()}' if comment and comment.strip() else ''}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def reject_application(
    db: Session,
    record: PromotionApplication,
    current_user: User,
    comment: Optional[str],
) -> PromotionApplication:
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
        PromotionApplicationApprovalAction(
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
        title=f"晋升申请已驳回：{record.name}/{record.department}",
        content=(
            f"你的晋升申请《{record.application_no}》在【{PROMOTION_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{normalized_comment}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def build_approval_flow(db: Session, record: PromotionApplication) -> list[dict]:
    steps: list[dict] = []
    flow_stages = get_flow_stages(record, db)
    actions_by_stage: dict[str, list[PromotionApplicationApprovalAction]] = {
        stage: [] for stage in flow_stages
    }
    for action in record.approval_actions:
        if action.stage in actions_by_stage:
            actions_by_stage[action.stage].append(action)

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

        approvers = resolve_stage_approvers(db, record, stage)
        action_label = None
        if latest_action:
            action_label = {
                "approve": "通过",
                "reject": "驳回",
                "submit": "提交",
            }.get(latest_action.action, latest_action.action)

        steps.append(
            {
                "stage": stage,
                "stage_label": PROMOTION_STAGE_LABELS[stage],
                "status": status,
                "status_label": PROMOTION_FLOW_STATUS_LABELS[status],
                "approvers": [_serialize_approver(item) for item in approvers],
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
    return steps


def serialize_notification(record: PromotionApplicationNotification) -> dict:
    application = record.application
    return {
        "id": record.id,
        "application_id": record.application_id,
        "application_no": application.application_no if application else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": PROMOTION_STAGE_LABELS.get(record.stage or "", record.stage),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_config(record: PromotionApprovalConfig) -> dict:
    return {
        "id": record.id,
        "campus": record.campus,
        "apply_department": record.apply_department or None,
        "apply_position": record.apply_position or None,
        "stage": record.stage,
        "stage_label": PROMOTION_STAGE_LABELS.get(record.stage, record.stage),
        "is_active": record.is_active,
        "approvers": [
            {
                "id": item.id,
                "approver_user_id": item.approver_user_id,
                "approver_name": item.approver_name,
                "approver_department": item.approver_department,
                "approver_position": item.approver_position,
                "approver_campus": item.approver_campus,
                "sort_order": item.sort_order,
            }
            for item in record.approvers
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def serialize_application(
    record: PromotionApplication,
    current_user: Optional[User],
    db: Session,
) -> dict:
    current_approvers = []
    can_approve = False
    approval_flow = build_approval_flow(db, record)
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
        "fill_date": record.fill_date,
        "campus": record.campus,
        "name": record.name,
        "native_place": record.native_place,
        "age": record.age,
        "entry_date": record.entry_date,
        "department": record.department,
        "position": record.position,
        "work_overview": record.work_overview,
        "promotion_reason": record.promotion_reason,
        "confidence_and_expectation": record.confidence_and_expectation,
        "original_level": record.original_level,
        "original_salary": record.original_salary,
        "promoted_level": record.promoted_level,
        "promoted_base_salary": record.promoted_base_salary
        if record.promoted_base_salary is not None
        else record.promoted_salary,
        "promoted_performance_salary": record.promoted_performance_salary,
        "promoted_salary": record.promoted_salary,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "department_manager_opinion": record.department_manager_opinion,
        "department_manager_passed": record.department_manager_passed,
        "principal_opinion": record.principal_opinion,
        "principal_passed": record.principal_passed,
        "biz_director_opinion": record.biz_director_opinion,
        "biz_director_passed": record.biz_director_passed,
        "hr_director_opinion": record.hr_director_opinion,
        "hr_director_passed": record.hr_director_passed,
        "chairman_opinion": record.chairman_opinion,
        "chairman_passed": record.chairman_passed,
        "is_passed": record.is_passed,
        "status": record.status,
        "status_label": PROMOTION_STATUS_LABELS.get(record.status, record.status),
        "current_stage": record.current_stage,
        "current_stage_label": PROMOTION_STAGE_LABELS.get(
            record.current_stage or "", None
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
        "approval_flow": approval_flow,
        "approval_actions": [
            {
                "id": action.id,
                "stage": action.stage,
                "stage_label": PROMOTION_STAGE_LABELS.get(action.stage, action.stage),
                "action": action.action,
                "approver_user_id": action.approver_user_id,
                "approver_name": action.approver_name,
                "comment": action.comment,
                "created_at": action.created_at,
            }
            for action in record.approval_actions
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
