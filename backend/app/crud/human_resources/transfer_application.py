"""
集团人资基础 - 调岗申请 CRUD
"""

from __future__ import annotations

from datetime import datetime
import re
from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.transfer_application import (
    TransferApplication,
    TransferApplicationApprovalAction,
    TransferApplicationNotification,
)
from app.models.user import User, UserStatus
from app.schemas.human_resources.transfer_application import (
    TRANSFER_APPROVAL_STAGES,
    TRANSFER_FLOW_STATUS_LABELS,
    TRANSFER_STAGE_LABELS,
    TRANSFER_STATUS_LABELS,
    TransferApplicationCreate,
    TransferApplicationUpdate,
)

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
MANAGEMENT_ROLE_KEYWORDS = (
    "主管",
    "经理",
    "总监",
    "部长",
    "主任",
    "负责人",
    "校长",
    "副校长",
)
DIRECTOR_POSITION_KEYWORD = "总监"
TRANSFER_REASON_MIN_LENGTH = 30
TRANSFER_REQUIRED_SALARY_FIELDS = {
    "new_salary": "新工资",
}
DEPARTMENT_MANAGER_RULES = {
    "management_center": (
        {
            "department_keywords": ("市场",),
            "position_patterns": ((("经理",), ("副经理",)),),
        },
        {
            "department_keywords": ("财务",),
            "position_patterns": ((("总监",), ()),),
        },
        {
            "department_keywords": ("学术",),
            "position_patterns": ((("副总监",), ()), (("总监",), ())),
        },
        {
            "department_keywords": ("教质",),
            "position_patterns": ((("经理",), ()), (("总监",), ())),
        },
        {
            "department_keywords": ("运营",),
            "position_patterns": ((("总监",), ()),),
        },
        {
            "department_keywords": ("人资", "人力", "人事", "行政"),
            "position_patterns": ((("总监",), ()),),
        },
    ),
    "branch": (
        {
            "department_keywords": ("咨询",),
            "position_patterns": ((("分析规划师主管",), ()),),
        },
        {
            "department_keywords": ("学术",),
            "position_patterns": ((("学术经理",), ()), (("学术副经理",), ())),
        },
        {
            "department_keywords": ("教质",),
            "position_patterns": ((("教化司经理",), ()), (("教化司副经理",), ())),
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
            "position_patterns": ((("智慧司经理",), ("副经理",)), (("学术经理",), ("副经理",))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司经理",), ("副经理",)), (("教质经理",), ("副经理",))),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((("前端副校长",), ()),),
        },
    ),
    "jimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司副经理",), ()), (("学术副经理",), ())),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教质经理",), ()), (("教化司经理",), ())),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((("前端副校长",), ()),),
        },
        {
            "apply_department_keywords": ("渠道",),
            "candidate_department_keywords": ("渠道",),
            "position_patterns": ((("渠道部经理",), ()), (("渠道经理",), ())),
        },
    ),
    "shimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司经理",), ("副经理",)), (("学术经理",), ("副经理",))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司副经理",), ()), (("教质副经理",), ())),
        },
    ),
    "jinmei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司副经理",), ()), (("学术副经理",), ())),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司经理",), ()), (("教质经理",), ())),
        },
    ),
    "yuanmei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司经理",), ("副经理",)), (("学术经理",), ("副经理",))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司经理",), ()), (("教质经理",), ())),
        },
    ),
    "taimei": (
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司副经理",), ()), (("教质副经理",), ())),
        },
    ),
    "guimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司经理",), ("副经理",)), (("学术经理",), ("副经理",))),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((("分析规划师主管",), ()),),
        },
    ),
}
OUT_DEPARTMENT_MANAGER_SPECIAL_RULES = {
    "management_center": (
        {
            "apply_department_keywords": ("市场",),
            "candidate_department_keywords": ("市场",),
            "position_patterns": ((('市场部经理',), ()), (("市场经理",), ())),
        },
        {
            "apply_department_keywords": ("财务",),
            "candidate_department_keywords": ("财务",),
            "position_patterns": ((('神藏司总监',), ()), (("财务总监",), ())),
        },
    ),
    "shengbang": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (("学术经理",), ('副经理',))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((('教化司经理',), ('副经理',)), (("教质经理",), ('副经理',))),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((("前端副校长",), ()),),
        },
        {
            "apply_department_keywords": ("渠道",),
            "candidate_department_keywords": ("渠道",),
            "position_patterns": ((("渠道部副校长",), ()), (("渠道副校长",), ())),
        },
    ),
    "jimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司副经理",), ()), (("学术副经理",), ())),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教质经理",), ()), (("教化司经理",), ())),
        },
        {
            "apply_department_keywords": ("咨询",),
            "candidate_department_keywords": ("咨询",),
            "position_patterns": ((("前端副校长",), ()),),
        },
        {
            "apply_department_keywords": ("渠道",),
            "candidate_department_keywords": ("渠道",),
            "position_patterns": ((("渠道部经理",), ()), (("渠道经理",), ())),
        },
    ),
    "shimei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (("学术经理",), ('副经理',))),
        },
        {
            "apply_department_keywords": ("教质",),
            "position_patterns": ((("副校长",), ()),),
            "allow_cross_department": True,
        },
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ('副校长',)),),
            "allow_cross_department": True,
        },
    ),
    "jinmei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((("智慧司副经理",), ()), (("学术副经理",), ())),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司经理",), ()), (("教质经理",), ())),
        },
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ('副校长',)),),
            "allow_cross_department": True,
        },
    ),
    "yuanmei": (
        {
            "apply_department_keywords": ("学术",),
            "candidate_department_keywords": ("学术",),
            "position_patterns": ((('智慧司经理',), ('副经理',)), (("学术经理",), ('副经理',))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("教化司经理",), ()), (("教质经理",), ())),
        },
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ('副校长',)),),
            "allow_cross_department": True,
        },
    ),
    "taimei": (
        {
            "apply_department_keywords": ("学术", "教质"),
            "position_patterns": ((("后端副校长",), ()),),
            "allow_cross_department": True,
        },
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ('副校长',)),),
            "allow_cross_department": True,
        },
    ),
    "guimei": (
        {
            "apply_department_keywords": ("学术", "教质"),
            "position_patterns": ((("后端副校长",), ()),),
            "allow_cross_department": True,
        },
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ('副校长',)),),
            "allow_cross_department": True,
        },
    ),
}
IN_DEPARTMENT_MANAGER_SPECIAL_RULES = OUT_DEPARTMENT_MANAGER_SPECIAL_RULES
BIZ_DIRECTOR_SKIP_DEPARTMENT_KEYWORDS = ("市场",)
BIZ_DIRECTOR_RULES = (
    {
        "apply_department_keywords": ("财务",),
        "candidate_department_keywords": ("财务",),
        "position_patterns": ((("神藏司总监",), ()), (("财务总监",), ())),
    },
    {
        "apply_department_keywords": ("教质",),
        "candidate_department_keywords": ("教质",),
        "position_patterns": ((("教化司总监",), ()), (("教质总监",), ())),
    },
    {
        "apply_department_keywords": ("学术",),
        "candidate_department_keywords": ("学术",),
        "position_patterns": ((("智慧司副经理",), ()), (("学术副经理",), ())),
    },
    {
        "apply_department_keywords": ("运营", "咨询", "渠道", "线上事业部", "线上", "线下事业部", "线下"),
        "candidate_department_keywords": ("运营",),
        "position_patterns": ((("运营部总监",), ()), (("运营总监",), ())),
    },
)
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


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    normalized = _normalize_scope_value(value)
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


def _user_matches_campus_bucket(
    user_campus: Optional[str], campus_bucket: Optional[str]
) -> bool:
    if campus_bucket is None:
        return False
    return _resolve_campus_bucket(user_campus) == campus_bucket


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


def _matches_line_keywords(
    user_department: Optional[str],
    user_position: Optional[str],
    keywords: tuple[str, ...],
) -> bool:
    if not keywords:
        return False
    haystack = f"{_normalize_compact_text(user_department)}|{_normalize_compact_text(user_position)}"
    return any(keyword in haystack for keyword in keywords)


def _department_matches(
    user_department: Optional[str], target_department: Optional[str]
) -> bool:
    normalized_user_department = _normalize_department_key(user_department)
    normalized_target_department = _normalize_department_key(target_department)
    return bool(
        normalized_user_department
        and normalized_user_department == normalized_target_department
    )


def _generate_application_no() -> str:
    return f"TGSQ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


def _sum_new_salary_parts(
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


def _normalize_new_salary_fields(
    *,
    new_base_salary: Optional[float],
    new_performance_salary: Optional[float],
    new_salary: Optional[float],
) -> tuple[Optional[float], Optional[float], Optional[float]]:
    if new_base_salary is None and new_performance_salary is None:
        if new_salary is None:
            return None, None, None
        return new_salary, None, new_salary
    return (
        new_base_salary,
        new_performance_salary,
        _sum_new_salary_parts(new_base_salary, new_performance_salary),
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


def _is_school_leader_position(position: Optional[str]) -> bool:
    return "校长" in _normalize_compact_text(position)


def _is_principal_position(
    campus_bucket: Optional[str],
    position: Optional[str],
) -> bool:
    del campus_bucket
    normalized = _normalize_compact_text(position)
    if not normalized or "校长" not in normalized:
        return False
    vice_index = normalized.find("副")
    principal_index = normalized.find("校长")
    return vice_index == -1 or vice_index > principal_index


def _is_director_position(position: Optional[str]) -> bool:
    return DIRECTOR_POSITION_KEYWORD in _normalize_compact_text(position)


def _is_chairman_position(position: Optional[str]) -> bool:
    return _normalize_scope_value(position) == "董事长"


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in ("人资", "人事", "人力", "行政"))


def _is_hr_director_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in ("人资", "人事", "人力"))


def _is_hr_director_candidate(user: User) -> bool:
    return (
        _is_management_center_campus(user.campus)
        and _is_hr_director_department(user.department)
        and _is_director_position(user.position)
    )


def _is_department_head_candidate_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or normalized == "董事长":
        return False
    return _is_management_role_position(position) or "校长" in normalized


def _should_require_chairman(position: Optional[str]) -> bool:
    return _is_management_role_position(position) and not _is_chairman_position(
        position
    )


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
    rule_group_key = "management_center" if campus_bucket == "management_center" else "branch"
    for rule in DEPARTMENT_MANAGER_RULES.get(rule_group_key, ()):
        if _matches_keyword_family(department, rule["department_keywords"]):
            return rule
    return None


def _get_special_department_manager_rule_from_rules(
    special_rules: dict[str, tuple[dict, ...]],
    campus_bucket: Optional[str],
    apply_department: Optional[str],
) -> Optional[dict]:
    if campus_bucket is None:
        return None
    for rule in special_rules.get(campus_bucket, ()): 
        if _matches_keyword_family(apply_department, rule["apply_department_keywords"]):
            return rule
    return None


def _get_special_department_manager_rule(
    campus_bucket: Optional[str],
    apply_department: Optional[str],
) -> Optional[dict]:
    return _get_special_department_manager_rule_from_rules(
        SPECIAL_DEPARTMENT_MANAGER_RULES,
        campus_bucket,
        apply_department,
    )


def _should_skip_biz_director_stage(department: Optional[str]) -> bool:
    return _matches_keyword_family(
        department,
        BIZ_DIRECTOR_SKIP_DEPARTMENT_KEYWORDS,
    ) or _is_hr_admin_department(department)


def _get_biz_director_rule(
    department: Optional[str],
    position: Optional[str],
) -> Optional[dict]:
    del position
    if _should_skip_biz_director_stage(department):
        return None
    for rule in BIZ_DIRECTOR_RULES:
        if _matches_keyword_family(department, rule["apply_department_keywords"]):
            return rule
    return None


def _matches_biz_director_rule(approver: User, rule: dict) -> bool:
    if not _is_management_center_campus(approver.campus):
        return False
    if not _matches_any_position_patterns(approver.position, rule["position_patterns"]):
        return False
    candidate_department_keywords = rule.get("candidate_department_keywords")
    if candidate_department_keywords and not _matches_keyword_family(
        approver.department,
        candidate_department_keywords,
    ):
        return False
    return True


def _has_legacy_biz_director_stage(record: TransferApplication) -> bool:
    if record.current_stage == "biz_director":
        return True
    if record.biz_director_passed is not None:
        return True
    return any(
        getattr(action, "stage", None) == "biz_director"
        for action in getattr(record, "approval_actions", []) or []
    )


def _should_require_biz_director(record: TransferApplication) -> bool:
    if _has_legacy_biz_director_stage(record):
        return True
    return _get_biz_director_rule(record.target_department, record.target_position) is not None


def _matches_special_department_manager_rule(
    approver: User,
    apply_department: Optional[str],
    rule: dict,
) -> bool:
    if not _matches_any_position_patterns(approver.position, rule["position_patterns"]):
        return False

    candidate_department_keywords = rule.get("candidate_department_keywords")
    if candidate_department_keywords and not _matches_keyword_family(
        approver.department,
        candidate_department_keywords,
    ):
        return False

    if rule.get("allow_cross_department"):
        return True

    return _is_same_department_scope(approver.department, apply_department)


def _resolve_scoped_users(
    db: Session,
    record: TransferApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    campus_bucket = _resolve_campus_bucket(record.campus)
    if campus_bucket == "management_center":
        return [user for user in users if _is_management_center_campus(user.campus)]
    if campus_bucket is not None:
        return [
            user for user in users if _user_matches_campus_bucket(user.campus, campus_bucket)
        ]
    return [user for user in users if _campus_matches_scope(user.campus, record.campus)]


def _is_valid_principal_approver(approver: User, campus: str) -> bool:
    campus_bucket = _resolve_campus_bucket(campus)
    if campus_bucket == "management_center":
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
    rule = _get_biz_director_rule(apply_department, apply_position)
    if rule is None:
        return False
    return _matches_biz_director_rule(approver, rule)


def _is_valid_department_manager_approver(
    approver: User,
    campus: str,
    apply_department: str,
    apply_position: str,
    special_rules: Optional[dict[str, tuple[dict, ...]]] = None,
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

    special_rule = _get_special_department_manager_rule_from_rules(
        special_rules or SPECIAL_DEPARTMENT_MANAGER_RULES,
        campus_bucket,
        apply_department,
    )
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
        if _matches_any_position_patterns(approver.position, rule["position_patterns"]):
            return True
        return _is_principal_position(campus_bucket, approver.position)

    return _is_same_department_scope(
        approver.department, apply_department
    ) and _is_department_head_candidate_position(approver.position)


def _resolve_department_manager_candidates(
    db: Session,
    record: TransferApplication,
    *,
    department: str,
    position: str,
    special_rules: Optional[dict[str, tuple[dict, ...]]] = None,
) -> list[User]:
    same_scope_users = _resolve_scoped_users(db, record)
    campus_bucket = _resolve_campus_bucket(record.campus)
    active_special_rules = special_rules or SPECIAL_DEPARTMENT_MANAGER_RULES

    special_rule = _get_special_department_manager_rule_from_rules(
        active_special_rules,
        campus_bucket,
        department,
    )
    if special_rule is not None:
        special_candidates = [
            user
            for user in same_scope_users
            if _matches_special_department_manager_rule(
                user,
                department,
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
            department,
            position,
            active_special_rules,
        )
        and _is_same_department_scope(user.department, department)
    ]
    if same_department_rule_users:
        return _sort_and_dedupe_users(same_department_rule_users)

    if _get_department_manager_rule(campus_bucket, department) is not None:
        same_department_principals = [
            user
            for user in same_scope_users
            if _is_same_department_scope(user.department, department)
            and _is_principal_position(campus_bucket, user.position)
        ]
        if same_department_principals:
            return _sort_and_dedupe_users(same_department_principals)

    same_department_managers = [
        user
        for user in same_scope_users
        if _is_same_department_scope(user.department, department)
        and _is_department_head_candidate_position(user.position)
    ]
    if same_department_managers:
        return _sort_and_dedupe_users(same_department_managers)

    target_is_management_role = _is_management_role_position(position)
    if _is_management_center_campus(record.campus) and target_is_management_role:
        return _resolve_biz_director_candidates(
            db,
            record,
            department=department,
            position=position,
        )
    if target_is_management_role:
        principals = [
            user
            for user in same_scope_users
            if _is_valid_principal_approver(user, record.campus)
        ]
        return _sort_and_dedupe_users(principals)

    rule = _get_department_manager_rule(campus_bucket, department)
    if rule is not None:
        scoped_rule_users = [
            user
            for user in same_scope_users
            if _matches_any_position_patterns(user.position, rule["position_patterns"])
        ]
        if scoped_rule_users:
            return _sort_and_dedupe_users(scoped_rule_users)
    return []


def _get_selected_approver_user_ids(
    record: TransferApplication,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids,
        TRANSFER_APPROVAL_STAGES,
    )


def _resolve_selected_stage_approvers(
    db: Session,
    record: TransferApplication,
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


def _resolve_out_department_manager_candidates(
    db: Session,
    record: TransferApplication,
) -> list[User]:
    return _resolve_department_manager_candidates(
        db,
        record,
        department=record.department,
        position=record.position,
        special_rules=OUT_DEPARTMENT_MANAGER_SPECIAL_RULES,
    )


def _resolve_hr_candidates(
    db: Session,
    record: TransferApplication,
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
            if _is_hr_director_candidate(user)
        ]
    )


def _resolve_in_department_manager_candidates(
    db: Session,
    record: TransferApplication,
) -> list[User]:
    return _resolve_department_manager_candidates(
        db,
        record,
        department=record.target_department,
        position=record.target_position,
        special_rules=IN_DEPARTMENT_MANAGER_SPECIAL_RULES,
    )


def _resolve_biz_director_candidates(
    db: Session,
    record: TransferApplication,
    *,
    department: Optional[str] = None,
    position: Optional[str] = None,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    effective_department = department or record.target_department
    effective_position = position or record.target_position
    rule = _get_biz_director_rule(effective_department, effective_position)
    if rule is None:
        return []

    management_center_users = [
        user for user in users if _is_management_center_campus(user.campus)
    ]
    matched_users = [
        user for user in management_center_users if _matches_biz_director_rule(user, rule)
    ]
    return _sort_and_dedupe_users(matched_users)


def _resolve_chairman_candidates(
    db: Session,
    record: TransferApplication,
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
    db: Session,
    record: TransferApplication,
    stage: str,
) -> list[User]:
    if stage == "out_department_manager":
        return _resolve_out_department_manager_candidates(db, record)
    if stage in {"hr_first_review", "hr_final_review"}:
        return _resolve_hr_candidates(db, record)
    if stage == "in_department_manager":
        return _resolve_in_department_manager_candidates(db, record)
    if stage == "biz_director":
        return _resolve_biz_director_candidates(db, record)
    if stage == "chairman":
        return _resolve_chairman_candidates(db, record)
    return []


def get_flow_stages(record: TransferApplication) -> list[str]:
    stages = [
        "out_department_manager",
        "hr_first_review",
        "in_department_manager",
        "hr_final_review",
    ]
    if _should_require_biz_director(record):
        stages.insert(3, "biz_director")
    if _should_require_chairman(record.position):
        stages.append("chairman")
    return stages


def resolve_stage_approvers(
    db: Session,
    record: TransferApplication,
    stage: str,
) -> list[User]:
    selected_users = _resolve_selected_stage_approvers(db, record, stage)
    if selected_users:
        return selected_users
    return get_stage_candidate_users(db, record, stage)


def _validate_selected_stage_approvers(
    db: Session,
    record: TransferApplication,
    stage: str,
    user_ids: list[int],
) -> None:
    candidate_user_ids = {
        item.user_id for item in get_stage_candidate_users(db, record, stage)
    }
    if not candidate_user_ids:
        raise ValueError(f"{TRANSFER_STAGE_LABELS[stage]}未找到可选审批人")
    invalid_user_ids = [
        user_id for user_id in user_ids if user_id not in candidate_user_ids
    ]
    if invalid_user_ids:
        raise ValueError(
            f"{TRANSFER_STAGE_LABELS[stage]}审批人超出当前候选范围: {invalid_user_ids}"
        )


def _set_selected_approver_user_ids(
    db: Session,
    record: TransferApplication,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        TRANSFER_APPROVAL_STAGES,
    )
    return normalized


def build_approver_candidate_preview(
    db: Session,
    *,
    campus: str,
    department: str,
    position: str,
    target_department: str,
    target_position: str,
    created_by_user_id: Optional[int] = None,
    selected_approver_user_ids: Optional[dict[str, list[int]]] = None,
) -> list[dict]:
    record = TransferApplication(
        campus=campus.strip(),
        department=department.strip(),
        position=position.strip(),
        target_department=target_department.strip(),
        target_position=target_position.strip(),
        created_by_user_id=created_by_user_id,
    )
    flow_stages = get_flow_stages(record)
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
                "stage_label": TRANSFER_STAGE_LABELS[stage],
                "recommended_user_ids": recommended_user_ids,
                "approvers": [_serialize_approver(item) for item in candidate_users],
            }
        )
    return preview_items


def get_application(db: Session, application_id: int) -> Optional[TransferApplication]:
    return (
        db.query(TransferApplication)
        .options(selectinload(TransferApplication.approval_actions))
        .filter(TransferApplication.id == application_id)
        .first()
    )


def _has_manage_privilege(user: User, record: TransferApplication) -> bool:
    return record.created_by_user_id == user.user_id


def _has_approval_history(record: TransferApplication, user: Optional[User]) -> bool:
    if user is None:
        return False
    return any(
        action.approver_user_id == user.user_id for action in record.approval_actions
    )


def _is_current_stage_approver(
    db: Session,
    record: TransferApplication,
    user: Optional[User],
) -> bool:
    if user is None or record.status != "pending" or not record.current_stage:
        return False
    allowed_user_ids = get_stage_approver_ids(db, record, record.current_stage)
    return user.user_id in allowed_user_ids


def can_view_application(
    db: Session,
    record: TransferApplication,
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
) -> list[TransferApplication]:
    query = db.query(TransferApplication).options(
        selectinload(TransferApplication.approval_actions)
    )
    if campus:
        query = query.filter(TransferApplication.campus == campus)
    if status:
        query = query.filter(TransferApplication.status == status)
    if department:
        query = query.filter(TransferApplication.department == department)
    records = query.order_by(TransferApplication.created_at.desc()).all()
    if current_user is None:
        return records
    return [
        record for record in records if can_view_application(db, record, current_user)
    ]


def _validate_business_fields(record: TransferApplication) -> None:
    if _get_effective_text_length(record.reason) < TRANSFER_REASON_MIN_LENGTH:
        raise ValueError(f"调岗原因不少于{TRANSFER_REASON_MIN_LENGTH}字")

    if _normalize_scope_value(record.department) == _normalize_scope_value(
        record.target_department
    ) and _normalize_scope_value(record.position) == _normalize_scope_value(
        record.target_position
    ):
        raise ValueError("调岗前后部门和岗位不能同时完全相同")


def create_application(
    db: Session,
    payload: TransferApplicationCreate,
    current_user: User,
) -> TransferApplication:
    new_base_salary, new_performance_salary, new_salary = _normalize_new_salary_fields(
        new_base_salary=payload.new_base_salary,
        new_performance_salary=payload.new_performance_salary,
        new_salary=payload.new_salary,
    )

    record = TransferApplication(
        application_no=_generate_application_no(),
        apply_date=payload.apply_date,
        campus=payload.campus.strip(),
        name=payload.name.strip(),
        department=payload.department.strip(),
        position=payload.position.strip(),
        entry_date=payload.entry_date,
        original_salary=payload.original_salary,
        target_department=payload.target_department.strip(),
        target_position=payload.target_position.strip(),
        new_base_salary=new_base_salary,
        new_performance_salary=new_performance_salary,
        new_salary=new_salary,
        reason=payload.reason.strip(),
        applicant_name=_normalize_optional_str(payload.applicant_name)
        or current_user.real_name,
        status="draft",
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    _validate_business_fields(record)
    _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)
    db.add(record)
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def update_application(
    db: Session,
    record: TransferApplication,
    payload: TransferApplicationUpdate,
    current_user: User,
) -> TransferApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)
    required_string_fields = {
        "campus",
        "name",
        "department",
        "position",
        "target_department",
        "target_position",
        "reason",
    }
    optional_string_fields = {"applicant_name"}

    for field, value in payload_data.items():
        if isinstance(value, str):
            value = value.strip()
            if field in required_string_fields and not value:
                raise ValueError(f"{field} 不能为空")
            if field in optional_string_fields:
                value = value or None
        setattr(record, field, value)

    if {"new_base_salary", "new_performance_salary"} & payload_data.keys():
        record.new_salary = _sum_new_salary_parts(
            record.new_base_salary,
            record.new_performance_salary,
        )
    elif "new_salary" in payload_data:
        (
            record.new_base_salary,
            record.new_performance_salary,
            record.new_salary,
        ) = _normalize_new_salary_fields(
            new_base_salary=None,
            new_performance_salary=None,
            new_salary=record.new_salary,
        )

    _validate_business_fields(record)
    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def delete_application(
    db: Session,
    record: TransferApplication,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def validate_full_approval_chain(db: Session, record: TransferApplication) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(TRANSFER_STAGE_LABELS[stage])
    return missing_stages


def _apply_transfer_salary_fields(
    record: TransferApplication,
    payload_data: dict[str, object],
) -> None:
    if not payload_data:
        return

    if {"new_base_salary", "new_performance_salary", "new_salary"} & payload_data.keys():
        new_base_salary = payload_data.get("new_base_salary", record.new_base_salary)
        new_performance_salary = payload_data.get(
            "new_performance_salary", record.new_performance_salary
        )
        new_salary = payload_data.get("new_salary", record.new_salary)
        (
            record.new_base_salary,
            record.new_performance_salary,
            record.new_salary,
        ) = _normalize_new_salary_fields(
            new_base_salary=new_base_salary,
            new_performance_salary=new_performance_salary,
            new_salary=new_salary,
        )


def _validate_required_salary_fields(
    record: TransferApplication,
    stage: str,
) -> None:
    missing_fields = [
        label
        for field_name, label in TRANSFER_REQUIRED_SALARY_FIELDS.items()
        if getattr(record, field_name) is None
    ]
    if missing_fields:
        raise ValueError(
            f"{TRANSFER_STAGE_LABELS[stage]}审批前请先填写：{'、'.join(missing_fields)}"
        )


def _clear_stage_results(record: TransferApplication) -> None:
    record.out_department_manager_opinion = None
    record.out_department_manager_passed = None
    record.hr_first_review_opinion = None
    record.hr_first_review_passed = None
    record.in_department_manager_opinion = None
    record.in_department_manager_passed = None
    record.biz_director_opinion = None
    record.biz_director_passed = None
    record.hr_final_review_opinion = None
    record.hr_final_review_passed = None
    record.chairman_opinion = None
    record.chairman_passed = None
    record.is_passed = None


def _set_stage_result(
    record: TransferApplication,
    stage: str,
    *,
    approved: bool,
    comment: Optional[str],
) -> None:
    normalized_comment = _normalize_optional_str(comment)
    if stage == "out_department_manager":
        record.out_department_manager_opinion = normalized_comment
        record.out_department_manager_passed = approved
    elif stage == "hr_first_review":
        record.hr_first_review_opinion = normalized_comment
        record.hr_first_review_passed = approved
    elif stage == "in_department_manager":
        record.in_department_manager_opinion = normalized_comment
        record.in_department_manager_passed = approved
    elif stage == "biz_director":
        record.biz_director_opinion = normalized_comment
        record.biz_director_passed = approved
    elif stage == "hr_final_review":
        record.hr_final_review_opinion = normalized_comment
        record.hr_final_review_passed = approved
    elif stage == "chairman":
        record.chairman_opinion = normalized_comment
        record.chairman_passed = approved


def get_stage_approver_ids(
    db: Session,
    record: TransferApplication,
    stage: str,
) -> list[int]:
    approvers = resolve_stage_approvers(db, record, stage)
    return [item.user_id for item in approvers]


def _create_application_notification(
    db: Session,
    *,
    record: TransferApplication,
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
        TransferApplicationNotification(
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
        db.query(TransferApplicationNotification)
        .filter(
            TransferApplicationNotification.recipient_user_id == recipient_user_id,
            TransferApplicationNotification.is_read.is_(False),
        )
        .count()
    )


def list_application_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[TransferApplicationNotification]:
    query = (
        db.query(TransferApplicationNotification)
        .join(
            TransferApplication,
            TransferApplication.id == TransferApplicationNotification.application_id,
        )
        .options(selectinload(TransferApplicationNotification.application))
        .filter(TransferApplicationNotification.recipient_user_id == recipient_user_id)
    )
    if unread_only:
        query = query.filter(TransferApplicationNotification.is_read.is_(False))
    return query.order_by(TransferApplicationNotification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[TransferApplicationNotification]:
    record = (
        db.query(TransferApplicationNotification)
        .filter(
            TransferApplicationNotification.id == notification_id,
            TransferApplicationNotification.recipient_user_id == recipient_user_id,
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
        db.query(TransferApplicationNotification)
        .filter(
            TransferApplicationNotification.recipient_user_id == recipient_user_id,
            TransferApplicationNotification.is_read.is_(False),
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
    record: TransferApplication,
    current_user: User,
) -> TransferApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

    _validate_business_fields(record)
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
        TransferApplicationApprovalAction(
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
    record: TransferApplication,
    current_user: User,
    payload_data: Optional[dict[str, object]] = None,
) -> TransferApplication:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(TransferApplicationApprovalAction)
        .filter(
            TransferApplicationApprovalAction.application_id == record.id,
            TransferApplicationApprovalAction.stage == current_stage,
            TransferApplicationApprovalAction.approver_user_id == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    approval_payload_data = dict(payload_data or {})
    raw_comment = approval_payload_data.pop("comment", None)
    comment = raw_comment if isinstance(raw_comment, str) else None
    _apply_transfer_salary_fields(record, approval_payload_data)
    _validate_required_salary_fields(record, current_stage)

    _set_stage_result(record, current_stage, approved=True, comment=comment)
    db.add(
        TransferApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=_normalize_optional_str(comment),
        )
    )

    flow_stages = get_flow_stages(record)
    stage_index = flow_stages.index(current_stage)
    if stage_index == len(flow_stages) - 1:
        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        record.is_passed = True
        employee_archive_crud.sync_archive_from_transfer_application(db, record)
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"调岗申请已通过：{record.name}/{record.department}",
            content=(
                f"你的调岗申请《{record.application_no}》已完成全部审批并通过。"
                f" 当前环节：{TRANSFER_STAGE_LABELS[current_stage]}。"
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
                f"下一阶段“{TRANSFER_STAGE_LABELS[next_stage]}”未找到审批人，无法继续流转"
            )
        record.current_stage = next_stage
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"调岗申请流转更新：{record.name}/{record.department}",
            content=(
                f"你的调岗申请《{record.application_no}》已通过【{TRANSFER_STAGE_LABELS[current_stage]}】审批，"
                f" 当前已流转至【{TRANSFER_STAGE_LABELS[next_stage]}】。"
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
    record: TransferApplication,
    current_user: User,
    comment: Optional[str],
) -> TransferApplication:
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
        TransferApplicationApprovalAction(
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
        title=f"调岗申请已驳回：{record.name}/{record.department}",
        content=(
            f"你的调岗申请《{record.application_no}》在【{TRANSFER_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{normalized_comment}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def build_approval_flow(db: Session, record: TransferApplication) -> list[dict]:
    steps: list[dict] = []
    flow_stages = get_flow_stages(record)
    actions_by_stage: dict[str, list[TransferApplicationApprovalAction]] = {
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
                "stage_label": TRANSFER_STAGE_LABELS[stage],
                "status": status,
                "status_label": TRANSFER_FLOW_STATUS_LABELS[status],
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


def serialize_notification(record: TransferApplicationNotification) -> dict:
    application = record.application
    return {
        "id": record.id,
        "application_id": record.application_id,
        "application_no": application.application_no if application else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": TRANSFER_STAGE_LABELS.get(record.stage or "", record.stage),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_application(
    record: TransferApplication,
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
        "apply_date": record.apply_date,
        "campus": record.campus,
        "name": record.name,
        "department": record.department,
        "position": record.position,
        "entry_date": record.entry_date,
        "original_salary": record.original_salary,
        "target_department": record.target_department,
        "target_position": record.target_position,
        "new_base_salary": (
            record.new_base_salary
            if record.new_base_salary is not None
            else record.new_salary
        ),
        "new_performance_salary": record.new_performance_salary,
        "new_salary": record.new_salary,
        "reason": record.reason,
        "applicant_name": record.applicant_name,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "out_department_manager_opinion": record.out_department_manager_opinion,
        "out_department_manager_passed": record.out_department_manager_passed,
        "hr_first_review_opinion": record.hr_first_review_opinion,
        "hr_first_review_passed": record.hr_first_review_passed,
        "in_department_manager_opinion": record.in_department_manager_opinion,
        "in_department_manager_passed": record.in_department_manager_passed,
        "biz_director_opinion": record.biz_director_opinion,
        "biz_director_passed": record.biz_director_passed,
        "hr_final_review_opinion": record.hr_final_review_opinion,
        "hr_final_review_passed": record.hr_final_review_passed,
        "chairman_opinion": record.chairman_opinion,
        "chairman_passed": record.chairman_passed,
        "is_passed": record.is_passed,
        "status": record.status,
        "status_label": TRANSFER_STATUS_LABELS.get(record.status, record.status),
        "current_stage": record.current_stage,
        "current_stage_label": TRANSFER_STAGE_LABELS.get(
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
        "approval_flow": approval_flow,
        "approval_actions": [
            {
                "id": item.id,
                "stage": item.stage,
                "stage_label": TRANSFER_STAGE_LABELS.get(item.stage, item.stage),
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
