"""
集团人资基础 - 停薪留职申请 CRUD
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.unpaid_leave_application import (
    UnpaidLeaveApplication,
    UnpaidLeaveApplicationApprovalAction,
    UnpaidLeaveApplicationNotification,
)
from app.models.user import User, UserStatus
from app.schemas.human_resources.unpaid_leave_application import (
    UNPAID_LEAVE_APPROVAL_STAGES,
    UNPAID_LEAVE_FLOW_STATUS_LABELS,
    UNPAID_LEAVE_STAGE_LABELS,
    UNPAID_LEAVE_STATUS_LABELS,
    UnpaidLeaveApplicationCreate,
    UnpaidLeaveApplicationUpdate,
)

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
MANAGEMENT_ROLE_KEYWORDS = ("主管", "经理", "部长", "主任", "负责人", "校长", "副校长")
DIRECTOR_POSITION_KEYWORD = "总监"
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
DEPARTMENT_HEAD_RULES = {
    "management_center": (
        {
            "apply_department_keywords": ("市场",),
            "candidate_department_keywords": ("市场",),
            "position_patterns": ((("市场部经理",), ()), (("市场经理",), ())),
        },
        {
            "apply_department_keywords": ("财务",),
            "candidate_department_keywords": ("财务",),
            "position_patterns": ((("神藏司总监",), ()), (("财务总监",), ())),
        },
        {
            "apply_department_keywords": ("人资", "人事", "人力"),
            "candidate_department_keywords": ("人资", "人事", "人力"),
            "position_patterns": ((("人资部总监",), ()), (("人资总监",), ()), (("人力资源总监",), ())),
        },
    ),
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
            "position_patterns": ((("智慧司经理",), ("副经理",)), (("学术经理",), ("副经理",))),
        },
        {
            "apply_department_keywords": ("教质",),
            "candidate_department_keywords": ("教质",),
            "position_patterns": ((("副校长",), ()),),
        },
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ("副",)),),
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
            "position_patterns": ((("校长",), ("副",)),),
            "allow_cross_department": True,
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
        {
            "apply_department_keywords": ("咨询", "渠道"),
            "position_patterns": ((("校长",), ("副",)),),
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
            "position_patterns": ((("校长",), ("副",)),),
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
            "position_patterns": ((("校长",), ("副",)),),
            "allow_cross_department": True,
        },
    ),
}
DEPARTMENT_HEAD_POSITION_RULES = (
    {
        "apply_position_patterns": ((("学术副校长",), ()),),
        "candidate_department_keywords": ("学术",),
        "position_patterns": ((("智慧司副经理",), ()), (("学术副经理",), ())),
        "management_center_only": True,
        "allow_cross_department": True,
    },
    {
        "apply_position_patterns": ((("教质副校长",), ()),),
        "candidate_department_keywords": ("教质",),
        "position_patterns": ((("教化司总监",), ()), (("教质总监",), ())),
        "management_center_only": True,
        "allow_cross_department": True,
    },
    {
        "apply_position_patterns": (
            (("前端副校长",), ()),
            (("渠道副校长",), ()),
            (("副校长",), ("学术", "教质", "前端", "渠道", "后端")),
            (("校长",), ("副",)),
        ),
        "candidate_department_keywords": ("运营",),
        "position_patterns": ((("运营部总监",), ()), (("运营总监",), ())),
        "management_center_only": True,
        "allow_cross_department": True,
    },
)


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.strip()


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    normalized = _normalize_scope_value(value)
    return normalized or None


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


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
    user_campus: Optional[str],
    campus_bucket: Optional[str],
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
    return f"TXLZ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


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
    return user_campus == selected_campus


def _is_management_role_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in MANAGEMENT_ROLE_KEYWORDS)


def _is_department_manager_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(
        keyword in normalized for keyword in ("主管", "经理", "部长", "主任", "负责人")
    )


def _is_school_leader_position(position: Optional[str]) -> bool:
    return "校长" in _normalize_compact_text(position)


def _is_director_position(position: Optional[str]) -> bool:
    return DIRECTOR_POSITION_KEYWORD in _normalize_compact_text(position)


def _is_chairman_position(position: Optional[str]) -> bool:
    return _normalize_scope_value(position) == "董事长"


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in ("人资", "人事", "人力", "行政"))


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


def _resolve_scoped_users(
    db: Session,
    record: UnpaidLeaveApplication,
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


def _get_department_head_rule(
    campus_bucket: Optional[str],
    department: Optional[str],
) -> Optional[dict]:
    if campus_bucket is None:
        return None
    for rule in DEPARTMENT_HEAD_RULES.get(campus_bucket, ()): 
        if _matches_keyword_family(department, rule["apply_department_keywords"]):
            return rule
    return None


def _get_department_head_position_rule(position: Optional[str]) -> Optional[dict]:
    for rule in DEPARTMENT_HEAD_POSITION_RULES:
        if _matches_any_position_patterns(position, rule["apply_position_patterns"]):
            return rule
    return None


def _matches_department_head_rule(
    approver: User,
    apply_department: Optional[str],
    rule: dict,
) -> bool:
    if rule.get("management_center_only") and not _is_management_center_campus(
        approver.campus
    ):
        return False
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


def _get_selected_approver_user_ids(
    record: UnpaidLeaveApplication,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids,
        UNPAID_LEAVE_APPROVAL_STAGES,
    )


def _resolve_selected_stage_approvers(
    db: Session,
    record: UnpaidLeaveApplication,
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


def _resolve_department_head_candidates(
    db: Session,
    record: UnpaidLeaveApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    position_rule = _get_department_head_position_rule(record.position)
    if position_rule is not None:
        position_candidates = [
            user
            for user in users
            if _matches_department_head_rule(user, record.department, position_rule)
        ]
        if position_candidates:
            return _sort_and_dedupe_users(position_candidates)

    same_scope_users = _resolve_scoped_users(db, record)
    campus_bucket = _resolve_campus_bucket(record.campus)
    explicit_rule = _get_department_head_rule(campus_bucket, record.department)
    if explicit_rule is not None:
        explicit_candidates = [
            user
            for user in same_scope_users
            if _matches_department_head_rule(user, record.department, explicit_rule)
        ]
        if explicit_candidates:
            return _sort_and_dedupe_users(explicit_candidates)

    school_leaders = [
        user for user in same_scope_users if _is_school_leader_position(user.position)
    ]

    if _is_management_role_position(record.position):
        return _sort_and_dedupe_users(school_leaders)

    department_heads = [
        user
        for user in same_scope_users
        if _department_matches(user.department, record.department)
        and _is_department_manager_position(user.position)
    ]
    if department_heads:
        return _sort_and_dedupe_users(department_heads)

    fallback_heads = [
        user
        for user in same_scope_users
        if _is_department_manager_position(user.position)
        or _is_school_leader_position(user.position)
    ]
    return _sort_and_dedupe_users(fallback_heads)


def _resolve_biz_director_candidates(
    db: Session,
    record: UnpaidLeaveApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    keywords = _get_line_keywords(record.department, record.position)
    matched_directors = [
        user
        for user in users
        if _is_director_position(user.position)
        and _matches_line_keywords(user.department, user.position, keywords)
    ]
    if matched_directors:
        return _sort_and_dedupe_users(matched_directors)

    any_directors = [user for user in users if _is_director_position(user.position)]
    return _sort_and_dedupe_users(any_directors)


def _resolve_hr_candidates(
    db: Session,
    record: UnpaidLeaveApplication,
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
            if _is_management_center_campus(user.campus)
            and _is_hr_admin_department(user.department)
        ]
    )


def _resolve_chairman_candidates(
    db: Session,
    record: UnpaidLeaveApplication,
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
    record: UnpaidLeaveApplication,
    stage: str,
) -> list[User]:
    if stage == "department_head":
        return _resolve_department_head_candidates(db, record)
    if stage == "biz_director":
        return _resolve_biz_director_candidates(db, record)
    if stage == "hr":
        return _resolve_hr_candidates(db, record)
    if stage == "chairman":
        return _resolve_chairman_candidates(db, record)
    return []


def get_flow_stages(record: UnpaidLeaveApplication) -> list[str]:
    del record
    return ["department_head", "biz_director", "hr", "chairman"]


def resolve_stage_approvers(
    db: Session,
    record: UnpaidLeaveApplication,
    stage: str,
) -> list[User]:
    selected_users = _resolve_selected_stage_approvers(db, record, stage)
    if selected_users:
        return selected_users
    return get_stage_candidate_users(db, record, stage)


def _validate_selected_stage_approvers(
    db: Session,
    record: UnpaidLeaveApplication,
    stage: str,
    user_ids: list[int],
) -> None:
    candidate_user_ids = {
        item.user_id for item in get_stage_candidate_users(db, record, stage)
    }
    if not candidate_user_ids:
        raise ValueError(f"{UNPAID_LEAVE_STAGE_LABELS[stage]}未找到可选审批人")
    invalid_user_ids = [
        user_id for user_id in user_ids if user_id not in candidate_user_ids
    ]
    if invalid_user_ids:
        raise ValueError(
            f"{UNPAID_LEAVE_STAGE_LABELS[stage]}审批人超出当前候选范围: {invalid_user_ids}"
        )


def _set_selected_approver_user_ids(
    db: Session,
    record: UnpaidLeaveApplication,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        UNPAID_LEAVE_APPROVAL_STAGES,
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
    record = UnpaidLeaveApplication(
        campus=campus.strip(),
        department=department.strip(),
        position=position.strip(),
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
                "stage_label": UNPAID_LEAVE_STAGE_LABELS[stage],
                "recommended_user_ids": recommended_user_ids,
                "approvers": [_serialize_approver(item) for item in candidate_users],
            }
        )
    return preview_items


def get_application(
    db: Session, application_id: int
) -> Optional[UnpaidLeaveApplication]:
    return (
        db.query(UnpaidLeaveApplication)
        .options(selectinload(UnpaidLeaveApplication.approval_actions))
        .filter(UnpaidLeaveApplication.id == application_id)
        .first()
    )


def _has_manage_privilege(user: User, record: UnpaidLeaveApplication) -> bool:
    return record.created_by_user_id == user.user_id


def _has_approval_history(record: UnpaidLeaveApplication, user: Optional[User]) -> bool:
    if user is None:
        return False
    return any(
        action.approver_user_id == user.user_id for action in record.approval_actions
    )


def _is_current_stage_approver(
    db: Session,
    record: UnpaidLeaveApplication,
    user: Optional[User],
) -> bool:
    if user is None or record.status != "pending" or not record.current_stage:
        return False
    allowed_user_ids = get_stage_approver_ids(db, record, record.current_stage)
    return user.user_id in allowed_user_ids


def can_view_application(
    db: Session,
    record: UnpaidLeaveApplication,
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
) -> list[UnpaidLeaveApplication]:
    query = db.query(UnpaidLeaveApplication).options(
        selectinload(UnpaidLeaveApplication.approval_actions)
    )
    if campus:
        query = query.filter(UnpaidLeaveApplication.campus == campus)
    if status:
        query = query.filter(UnpaidLeaveApplication.status == status)
    if department:
        query = query.filter(UnpaidLeaveApplication.department == department)
    records = query.order_by(UnpaidLeaveApplication.created_at.desc()).all()
    if current_user is None:
        return records
    return [
        record for record in records if can_view_application(db, record, current_user)
    ]


def create_application(
    db: Session,
    payload: UnpaidLeaveApplicationCreate,
    current_user: User,
) -> UnpaidLeaveApplication:
    record = UnpaidLeaveApplication(
        application_no=_generate_application_no(),
        fill_date=payload.fill_date,
        campus=payload.campus.strip(),
        name=payload.name.strip(),
        gender=_normalize_optional_str(payload.gender),
        department=payload.department.strip(),
        position=payload.position.strip(),
        entry_date=payload.entry_date,
        birth_date=payload.birth_date,
        phone=_normalize_optional_str(payload.phone),
        email=_normalize_optional_str(payload.email),
        home_address=_normalize_optional_str(payload.home_address),
        current_address=_normalize_optional_str(payload.current_address),
        reason=payload.reason.strip(),
        status="draft",
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)
    db.add(record)
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def update_application(
    db: Session,
    record: UnpaidLeaveApplication,
    payload: UnpaidLeaveApplicationUpdate,
    current_user: User,
) -> UnpaidLeaveApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)
    required_string_fields = {"campus", "name", "department", "position", "reason"}

    for field, value in payload_data.items():
        if isinstance(value, str):
            value = value.strip()
            if field in required_string_fields and not value:
                raise ValueError(f"{field} 不能为空")
            value = value or None
        setattr(record, field, value)

    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def delete_application(
    db: Session,
    record: UnpaidLeaveApplication,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def validate_full_approval_chain(
    db: Session, record: UnpaidLeaveApplication
) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(UNPAID_LEAVE_STAGE_LABELS[stage])
    return missing_stages


def _clear_stage_results(record: UnpaidLeaveApplication) -> None:
    record.department_head_opinion = None
    record.department_head_passed = None
    record.biz_director_opinion = None
    record.biz_director_passed = None
    record.hr_opinion = None
    record.hr_passed = None
    record.chairman_opinion = None
    record.chairman_passed = None
    record.is_passed = None


def _set_stage_result(
    record: UnpaidLeaveApplication,
    stage: str,
    *,
    approved: bool,
    comment: Optional[str],
) -> None:
    normalized_comment = _normalize_optional_str(comment)
    if stage == "department_head":
        record.department_head_opinion = normalized_comment
        record.department_head_passed = approved
    elif stage == "biz_director":
        record.biz_director_opinion = normalized_comment
        record.biz_director_passed = approved
    elif stage == "hr":
        record.hr_opinion = normalized_comment
        record.hr_passed = approved
    elif stage == "chairman":
        record.chairman_opinion = normalized_comment
        record.chairman_passed = approved


def get_stage_approver_ids(
    db: Session,
    record: UnpaidLeaveApplication,
    stage: str,
) -> list[int]:
    approvers = resolve_stage_approvers(db, record, stage)
    return [item.user_id for item in approvers]


def _create_application_notification(
    db: Session,
    *,
    record: UnpaidLeaveApplication,
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
        UnpaidLeaveApplicationNotification(
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
    record: UnpaidLeaveApplication,
    stage: str,
    action_by_user: Optional[User],
) -> None:
    stage_approvers = resolve_stage_approvers(db, record, stage)
    for approver in stage_approvers:
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=approver.user_id,
            notification_type="pending_stage",
            title=f"停薪留职申请待审批：{record.name}/{record.department}",
            content=(
                f"停薪留职申请《{record.application_no}》已流转至【{UNPAID_LEAVE_STAGE_LABELS[stage]}】环节，请及时处理。"
            ),
            stage=stage,
            action_by_user=action_by_user,
        )


def get_unread_notification_count(db: Session, recipient_user_id: int) -> int:
    return (
        db.query(UnpaidLeaveApplicationNotification)
        .filter(
            UnpaidLeaveApplicationNotification.recipient_user_id == recipient_user_id,
            UnpaidLeaveApplicationNotification.is_read.is_(False),
        )
        .count()
    )


def list_application_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[UnpaidLeaveApplicationNotification]:
    query = (
        db.query(UnpaidLeaveApplicationNotification)
        .join(
            UnpaidLeaveApplication,
            UnpaidLeaveApplication.id
            == UnpaidLeaveApplicationNotification.application_id,
        )
        .options(selectinload(UnpaidLeaveApplicationNotification.application))
        .filter(
            UnpaidLeaveApplicationNotification.recipient_user_id == recipient_user_id
        )
    )
    if unread_only:
        query = query.filter(UnpaidLeaveApplicationNotification.is_read.is_(False))
    return query.order_by(UnpaidLeaveApplicationNotification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[UnpaidLeaveApplicationNotification]:
    record = (
        db.query(UnpaidLeaveApplicationNotification)
        .filter(
            UnpaidLeaveApplicationNotification.id == notification_id,
            UnpaidLeaveApplicationNotification.recipient_user_id == recipient_user_id,
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
        db.query(UnpaidLeaveApplicationNotification)
        .filter(
            UnpaidLeaveApplicationNotification.recipient_user_id == recipient_user_id,
            UnpaidLeaveApplicationNotification.is_read.is_(False),
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
    record: UnpaidLeaveApplication,
    current_user: User,
) -> UnpaidLeaveApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

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
        UnpaidLeaveApplicationApprovalAction(
            application_id=record.id,
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
    return get_application(db, record.id) or record


def approve_application(
    db: Session,
    record: UnpaidLeaveApplication,
    current_user: User,
    comment: Optional[str],
) -> UnpaidLeaveApplication:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(UnpaidLeaveApplicationApprovalAction)
        .filter(
            UnpaidLeaveApplicationApprovalAction.application_id == record.id,
            UnpaidLeaveApplicationApprovalAction.stage == current_stage,
            UnpaidLeaveApplicationApprovalAction.approver_user_id
            == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    normalized_comment = _normalize_optional_str(comment)
    _set_stage_result(record, current_stage, approved=True, comment=normalized_comment)
    db.add(
        UnpaidLeaveApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=normalized_comment,
        )
    )

    flow_stages = get_flow_stages(record)
    stage_index = flow_stages.index(current_stage)
    if stage_index == len(flow_stages) - 1:
        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        record.is_passed = True
        employee_archive_crud.sync_archive_from_unpaid_leave_approval(db, record)
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"停薪留职申请已通过：{record.name}/{record.department}",
            content=(
                f"你的停薪留职申请《{record.application_no}》已完成全部审批并通过。"
                f" 当前环节：{UNPAID_LEAVE_STAGE_LABELS[current_stage]}。"
                f"{f' 审批意见：{normalized_comment}' if normalized_comment else ''}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )
    else:
        next_stage = flow_stages[stage_index + 1]
        next_stage_approvers = get_stage_approver_ids(db, record, next_stage)
        if not next_stage_approvers:
            raise ValueError(
                f"下一阶段“{UNPAID_LEAVE_STAGE_LABELS[next_stage]}”未找到审批人，无法继续流转"
            )
        record.current_stage = next_stage
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"停薪留职申请流转更新：{record.name}/{record.department}",
            content=(
                f"你的停薪留职申请《{record.application_no}》已通过【{UNPAID_LEAVE_STAGE_LABELS[current_stage]}】审批，"
                f" 当前已流转至【{UNPAID_LEAVE_STAGE_LABELS[next_stage]}】。"
                f"{f' 审批意见：{normalized_comment}' if normalized_comment else ''}"
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
    return get_application(db, record.id) or record


def reject_application(
    db: Session,
    record: UnpaidLeaveApplication,
    current_user: User,
    comment: Optional[str],
) -> UnpaidLeaveApplication:
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
        UnpaidLeaveApplicationApprovalAction(
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
        title=f"停薪留职申请已驳回：{record.name}/{record.department}",
        content=(
            f"你的停薪留职申请《{record.application_no}》在【{UNPAID_LEAVE_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{normalized_comment}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def build_approval_flow(db: Session, record: UnpaidLeaveApplication) -> list[dict]:
    steps: list[dict] = []
    flow_stages = get_flow_stages(record)
    actions_by_stage: dict[str, list[UnpaidLeaveApplicationApprovalAction]] = {
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
                "stage_label": UNPAID_LEAVE_STAGE_LABELS[stage],
                "status": status,
                "status_label": UNPAID_LEAVE_FLOW_STATUS_LABELS[status],
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
    return steps


def serialize_notification(record: UnpaidLeaveApplicationNotification) -> dict:
    application = record.application
    return {
        "id": record.id,
        "application_id": record.application_id,
        "application_no": application.application_no if application else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": UNPAID_LEAVE_STAGE_LABELS.get(record.stage or "", record.stage),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_application(
    record: UnpaidLeaveApplication,
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
        "gender": record.gender,
        "department": record.department,
        "position": record.position,
        "entry_date": record.entry_date,
        "birth_date": record.birth_date,
        "phone": record.phone,
        "email": record.email,
        "home_address": record.home_address,
        "current_address": record.current_address,
        "reason": record.reason,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "department_head_opinion": record.department_head_opinion,
        "department_head_passed": record.department_head_passed,
        "biz_director_opinion": record.biz_director_opinion,
        "biz_director_passed": record.biz_director_passed,
        "hr_opinion": record.hr_opinion,
        "hr_passed": record.hr_passed,
        "chairman_opinion": record.chairman_opinion,
        "chairman_passed": record.chairman_passed,
        "is_passed": record.is_passed,
        "status": record.status,
        "status_label": UNPAID_LEAVE_STATUS_LABELS.get(record.status, record.status),
        "current_stage": record.current_stage,
        "current_stage_label": UNPAID_LEAVE_STAGE_LABELS.get(
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
                "stage_label": (
                    "提交"
                    if item.stage == "submit"
                    else UNPAID_LEAVE_STAGE_LABELS.get(item.stage, item.stage)
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
