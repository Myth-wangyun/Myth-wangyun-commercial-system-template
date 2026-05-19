"""
集团人资基础 - 转正申请 CRUD
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources import approval_workflow as workflow_crud
from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources import work_report as work_report_crud
from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.regularization_application import (
    RegularizationApplication,
    RegularizationApplicationApprovalAction,
    RegularizationApplicationNotification,
    RegularizationApprovalConfig,
    RegularizationApprovalConfigApprover,
)
from app.models.user import User, UserStatus
from app.schemas.human_resources.regularization_application import (
    REGULARIZATION_APPROVAL_STAGES,
    REGULARIZATION_FLOW_STATUS_LABELS,
    REGULARIZATION_STAGE_LABELS,
    REGULARIZATION_STATUS_LABELS,
    RegularizationApplicationCreate,
    RegularizationApplicationUpdate,
    RegularizationApprovalConfigUpsert,
)

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
MANAGEMENT_CENTER_HR_DEPARTMENT_KEYWORDS = ("人资", "人力资源", "人事")
FLOW_TYPE = "regularization_application"
WORK_REPORT_REQUIRED_MESSAGE = "请先填写述职报告后再填写转正申请表"
REGULARIZATION_MAIN_WORK_MIN_LENGTH = 120
REGULARIZATION_SELF_EVALUATION_MIN_LENGTH = 50

DEPARTMENT_HEAD_RULES = {
    "management_center": (
        {
            "department_keywords": ("市场",),
            "position_patterns": ((("经理",), ("副经理",)),),
        },
        {
            "department_keywords": MANAGEMENT_CENTER_HR_DEPARTMENT_KEYWORDS,
            "position_patterns": ((("总监",), ()),),
        },
        {
            "department_keywords": ("教质",),
            "position_patterns": ((("总监",), ()),),
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
            "department_keywords": ("运营",),
            "position_patterns": ((("总监",), ()),),
        },
    ),
    "shengbang": (
        {"department_keywords": ("学术",), "position_patterns": ((("智慧司经理",), ()),)},
        {"department_keywords": ("教质",), "position_patterns": ((("教化司经理",), ()),)},
        {"department_keywords": ("咨询",), "position_patterns": ((("分析规划师主管",), ()),)},
        {"department_keywords": ("渠道",), "position_patterns": ((("渠道部经理",), ()),)},
    ),
    "jimei": (
        {
            "department_keywords": ("学术",),
            "position_patterns": ((("智慧司副经理",), ()), (("智慧司经理",), ())),
        },
        {"department_keywords": ("教质",), "position_patterns": ((("教化司经理",), ()),)},
        {"department_keywords": ("咨询",), "position_patterns": ((("分析规划师主管",), ()),)},
        {"department_keywords": ("渠道",), "position_patterns": ((("渠道部经理",), ()),)},
    ),
    "shimei": (
        {"department_keywords": ("学术",), "position_patterns": ((("智慧司经理",), ()),)},
        {
            "department_keywords": ("教质",),
            "position_patterns": ((("教化司副经理",), ()), (("教化司经理",), ())),
        },
    ),
    "jinmei": (
        {
            "department_keywords": ("学术",),
            "position_patterns": ((("智慧司副经理",), ()), (("智慧司经理",), ())),
        },
        {"department_keywords": ("教质",), "position_patterns": ((("教化司经理",), ()),)},
    ),
    "yuanmei": (
        {"department_keywords": ("学术",), "position_patterns": ((("智慧司经理",), ()),)},
        {"department_keywords": ("教质",), "position_patterns": ((("教化司经理",), ()),)},
    ),
    "taimei": (
        {
            "department_keywords": ("教质",),
            "position_patterns": ((("教化司副经理",), ()), (("教化司经理",), ())),
        },
    ),
    "guimei": (
        {"department_keywords": ("学术",), "position_patterns": ((("智慧司经理",), ()),)},
        {"department_keywords": ("咨询",), "position_patterns": ((("分析规划师主管",), ()),)},
    ),
}

VICE_PRINCIPAL_RULES = {
    "shengbang": (
        {
            "department_keywords": ("学术", "教质", "后端"),
            "position_patterns": ((("后端副校长",), ()),),
        },
        {"department_keywords": ("咨询",), "position_patterns": ((("前端副校长",), ()),)},
        {"department_keywords": ("渠道",), "position_patterns": ((("渠道部副校长",), ()),)},
    ),
    "jimei": (
        {
            "department_keywords": ("学术", "教质", "后端"),
            "position_patterns": ((("后端副校长",), ()),),
        },
        {"department_keywords": ("咨询",), "position_patterns": ((("神殿副校长",), ()),)},
    ),
    "shimei": (
        {
            "department_keywords": ("教质", "后端"),
            "position_patterns": ((("后端副校长",), ()), (("副校长",), ())),
        },
    ),
    "jinmei": (
        {
            "department_keywords": ("学术", "教质", "后端"),
            "position_patterns": ((("后端副校长",), ()),),
        },
    ),
    "taimei": (
        {
            "department_keywords": ("教质", "后端"),
            "position_patterns": ((("后端副校长",), ()),),
        },
    ),
    "guimei": (
        {
            "department_keywords": ("学术", "教质", "后端"),
            "position_patterns": ((("后端副校长",), ()),),
        },
    ),
}

DEFAULT_PRINCIPAL_PATTERNS = ((("校长",), ("副校长",)),)
PRINCIPAL_PATTERNS_BY_BUCKET = {
    "jimei": ((("校长",), ("副校长",)), (("副总监",), ())),
    "yuanmei": ((("校长",), ("副校长",)), (("执行副校长",), ())),
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


def _count_meaningful_characters(value: Optional[str]) -> int:
    return sum(1 for char in (value or "").strip() if not char.isspace())


def _require_applicant_identity(current_user: User) -> tuple[str, str, str, str]:
    applicant_name = (current_user.real_name or current_user.username or "").strip()
    applicant_campus = (current_user.campus or "").strip()
    applicant_department = (current_user.department or "").strip()
    applicant_position = (current_user.position or "").strip()

    if not applicant_name:
        raise ValueError("当前账号缺少姓名信息，无法填写转正申请")
    if not applicant_campus:
        raise ValueError("当前账号缺少神殿信息，无法填写转正申请")
    if not applicant_department:
        raise ValueError("当前账号缺少部门信息，无法填写转正申请")
    if not applicant_position:
        raise ValueError("当前账号缺少岗位信息，无法填写转正申请")

    return (
        applicant_name,
        applicant_campus,
        applicant_department,
        applicant_position,
    )


def _validate_regularization_text_fields(
    *,
    main_work: Optional[str],
    self_evaluation: Optional[str],
) -> None:
    if main_work is not None and (
        _count_meaningful_characters(main_work) < REGULARIZATION_MAIN_WORK_MIN_LENGTH
    ):
        raise ValueError(
            f"试用期主要工作不能少于{REGULARIZATION_MAIN_WORK_MIN_LENGTH}字"
        )

    if self_evaluation is not None and (
        _count_meaningful_characters(self_evaluation)
        < REGULARIZATION_SELF_EVALUATION_MIN_LENGTH
    ):
        raise ValueError(
            f"自我鉴定不能少于{REGULARIZATION_SELF_EVALUATION_MIN_LENGTH}字"
        )


def _generate_application_no() -> str:
    return f"ZZSQ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


def _is_management_center_campus(campus: Optional[str]) -> bool:
    return bool(campus and campus.strip() in MANAGEMENT_CENTER_CAMPUS_VALUES)


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


def _is_hr_admin_department(department: Optional[str]) -> bool:
    return _matches_keyword_family(department, MANAGEMENT_CENTER_HR_DEPARTMENT_KEYWORDS)


def _is_department_manager_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(
        keyword in normalized
        for keyword in ("主管", "经理", "总监", "部长", "主任", "负责人")
    )


def _is_department_head_like_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or normalized == "董事长" or "校长" in normalized:
        return False
    return _is_department_manager_position(normalized)


def _is_school_leader_position(position: Optional[str]) -> bool:
    return "校长" in _normalize_compact_text(position)


def _is_any_vice_principal_position(position: Optional[str]) -> bool:
    return "副校长" in _normalize_compact_text(position)


def _is_principal_position(
    campus_bucket: Optional[str],
    position: Optional[str],
) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized:
        return False
    if campus_bucket == "jimei" and normalized == "副总监":
        return True
    if campus_bucket == "yuanmei" and normalized == "执行副校长":
        return True
    return "校长" in normalized and "副校长" not in normalized


def _is_group_hr_director_position(
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> bool:
    return (
        _is_management_center_campus(campus)
        and _is_hr_admin_department(department)
        and "总监" in _normalize_compact_text(position)
    )


def _is_group_hr_director_candidate(user: User) -> bool:
    return _is_group_hr_director_position(user.campus, user.department, user.position)


def _is_chairman_position(position: Optional[str]) -> bool:
    return _normalize_scope_value(position) == "董事长"


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


def _position_priority(position: Optional[str]) -> int:
    normalized = _normalize_compact_text(position)
    if normalized == "董事长":
        return 0
    if "校长" in normalized and "副校长" not in normalized:
        return 1
    if "副校长" in normalized:
        return 2
    if "总监" in normalized:
        return 3
    if "经理" in normalized:
        return 4
    if "主管" in normalized:
        return 5
    if "负责人" in normalized:
        return 6
    if "部长" in normalized:
        return 7
    if "主任" in normalized:
        return 8
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
    record: RegularizationApplication,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids,
        REGULARIZATION_APPROVAL_STAGES,
    )


def _resolve_selected_stage_approvers(
    db: Session,
    record: RegularizationApplication,
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


def _resolve_scoped_users(
    db: Session,
    record: RegularizationApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    campus_bucket = _resolve_campus_bucket(record.campus)
    if campus_bucket is None:
        return _sort_and_dedupe_users(
            [user for user in users if _campus_matches_scope(user.campus, record.campus)]
        )
    return _sort_and_dedupe_users(
        [user for user in users if _user_matches_campus_bucket(user.campus, campus_bucket)]
    )


def _resolve_users_by_patterns(
    users: list[User],
    *,
    department_keywords: tuple[str, ...] = (),
    position_patterns: tuple[tuple[tuple[str, ...], tuple[str, ...]], ...] = (),
) -> list[User]:
    candidates: list[User] = []
    for user in users:
        if department_keywords and not _matches_keyword_family(
            user.department, department_keywords
        ):
            continue
        if position_patterns and not _matches_any_position_patterns(
            user.position, position_patterns
        ):
            continue
        candidates.append(user)
    return _sort_and_dedupe_users(candidates)


def _get_department_head_rule(
    campus_bucket: Optional[str],
    department: Optional[str],
) -> Optional[dict[str, tuple]]:
    if campus_bucket is None:
        return None
    for rule in DEPARTMENT_HEAD_RULES.get(campus_bucket, ()):
        if _matches_keyword_family(department, rule["department_keywords"]):
            return rule
    return None


def _get_vice_principal_rule(
    campus_bucket: Optional[str],
    department: Optional[str],
) -> Optional[dict[str, tuple]]:
    if campus_bucket is None:
        return None
    for rule in VICE_PRINCIPAL_RULES.get(campus_bucket, ()):
        if _matches_keyword_family(department, rule["department_keywords"]):
            return rule
    return None


def _should_include_department_head_stage(
    record: RegularizationApplication,
) -> bool:
    campus_bucket = _resolve_campus_bucket(record.campus)
    if _is_any_vice_principal_position(record.position) or _is_principal_position(
        campus_bucket, record.position
    ):
        return False

    rule = _get_department_head_rule(campus_bucket, record.department)
    if rule:
        return not _matches_any_position_patterns(record.position, rule["position_patterns"])

    return not _is_department_head_like_position(record.position)


def _should_include_vice_principal_stage(
    record: RegularizationApplication,
) -> bool:
    campus_bucket = _resolve_campus_bucket(record.campus)
    if campus_bucket in {None, "management_center"}:
        return False
    if _is_any_vice_principal_position(record.position) or _is_principal_position(
        campus_bucket, record.position
    ):
        return False
    return _get_vice_principal_rule(campus_bucket, record.department) is not None


def _should_include_principal_stage(
    record: RegularizationApplication,
) -> bool:
    campus_bucket = _resolve_campus_bucket(record.campus)
    if campus_bucket in {None, "management_center"}:
        return False
    return not _is_principal_position(campus_bucket, record.position)


def _should_include_hr_stage(record: RegularizationApplication) -> bool:
    return not _is_group_hr_director_position(
        record.campus,
        record.department,
        record.position,
    )


def _should_require_chairman(
    campus: Optional[str],
    position: Optional[str],
) -> bool:
    return _is_management_center_campus(campus) or _is_principal_position(
        _resolve_campus_bucket(campus), position
    )


def _is_valid_department_head_approver(
    approver: User,
    campus: str,
    apply_department: str,
    _apply_position: str,
) -> bool:
    campus_bucket = _resolve_campus_bucket(campus)
    if campus_bucket is None:
        if not _campus_matches_scope(approver.campus, campus):
            return False
    elif not _user_matches_campus_bucket(approver.campus, campus_bucket):
        return False

    rule = _get_department_head_rule(campus_bucket, apply_department)
    if rule:
        return _matches_keyword_family(
            approver.department, rule["department_keywords"]
        ) and _matches_any_position_patterns(
            approver.position, rule["position_patterns"]
        )

    if _normalize_compact_text(apply_department):
        return _is_same_department_scope(
            approver.department, apply_department
        ) and _is_department_head_like_position(approver.position)

    return _is_department_head_like_position(approver.position)


def _is_valid_vice_principal_approver(
    approver: User,
    campus: str,
    apply_department: str,
) -> bool:
    campus_bucket = _resolve_campus_bucket(campus)
    rule = _get_vice_principal_rule(campus_bucket, apply_department)
    if campus_bucket in {None, "management_center"} or rule is None:
        return False
    return _user_matches_campus_bucket(
        approver.campus, campus_bucket
    ) and _matches_any_position_patterns(approver.position, rule["position_patterns"])


def _is_valid_principal_approver(
    approver: User,
    campus: str,
) -> bool:
    campus_bucket = _resolve_campus_bucket(campus)
    if campus_bucket in {None, "management_center"}:
        return False
    patterns = PRINCIPAL_PATTERNS_BY_BUCKET.get(campus_bucket, DEFAULT_PRINCIPAL_PATTERNS)
    return _user_matches_campus_bucket(
        approver.campus, campus_bucket
    ) and _matches_any_position_patterns(approver.position, patterns)


def _resolve_department_head_fallback(
    db: Session,
    record: RegularizationApplication,
) -> list[User]:
    if not _should_include_department_head_stage(record):
        return []

    scoped_users = _resolve_scoped_users(db, record)
    campus_bucket = _resolve_campus_bucket(record.campus)
    rule = _get_department_head_rule(campus_bucket, record.department)
    if rule is not None:
        explicit_candidates = _resolve_users_by_patterns(
            scoped_users,
            department_keywords=rule["department_keywords"],
            position_patterns=rule["position_patterns"],
        )
        if explicit_candidates:
            return explicit_candidates

    if _normalize_compact_text(record.department):
        return _sort_and_dedupe_users(
            [
                user
                for user in scoped_users
                if _is_same_department_scope(user.department, record.department)
                and _is_department_head_like_position(user.position)
            ]
        )

    return _sort_and_dedupe_users(
        [user for user in scoped_users if _is_department_head_like_position(user.position)]
    )


def _resolve_vice_principal_fallback(
    db: Session,
    record: RegularizationApplication,
) -> list[User]:
    if not _should_include_vice_principal_stage(record):
        return []

    scoped_users = _resolve_scoped_users(db, record)
    campus_bucket = _resolve_campus_bucket(record.campus)
    rule = _get_vice_principal_rule(campus_bucket, record.department)
    if rule is None:
        return []
    return _resolve_users_by_patterns(
        scoped_users,
        position_patterns=rule["position_patterns"],
    )


def _resolve_hr_fallback(
    db: Session,
    record: RegularizationApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return _sort_and_dedupe_users(
        [user for user in users if _is_group_hr_director_candidate(user)]
    )


def _resolve_principal_fallback(
    db: Session,
    record: RegularizationApplication,
) -> list[User]:
    if not _should_include_principal_stage(record):
        return []

    scoped_users = _resolve_scoped_users(db, record)
    campus_bucket = _resolve_campus_bucket(record.campus)
    patterns = PRINCIPAL_PATTERNS_BY_BUCKET.get(campus_bucket, DEFAULT_PRINCIPAL_PATTERNS)
    return _resolve_users_by_patterns(scoped_users, position_patterns=patterns)


def _resolve_chairman_fallback(
    db: Session,
    record: RegularizationApplication,
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
    record: RegularizationApplication,
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

    if stage == "department_head":
        return _resolve_department_head_fallback(db, record)
    if stage == "vice_principal":
        return _resolve_vice_principal_fallback(db, record)
    if stage == "hr":
        return _resolve_hr_fallback(db, record)
    if stage == "principal":
        return _resolve_principal_fallback(db, record)
    if stage == "chairman":
        return _resolve_chairman_fallback(db, record)
    return []


def _resolve_config(
    db: Session,
    campus: Optional[str],
    apply_department: str,
    apply_position: str,
    stage: str,
) -> Optional[RegularizationApprovalConfig]:
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
            db.query(RegularizationApprovalConfig)
            .options(selectinload(RegularizationApprovalConfig.approvers))
            .filter(
                RegularizationApprovalConfig.campus.in_(campus_values),
                RegularizationApprovalConfig.apply_department == candidate_dept,
                RegularizationApprovalConfig.apply_position == candidate_pos,
                RegularizationApprovalConfig.stage == stage,
                RegularizationApprovalConfig.is_active.is_(True),
            )
            .order_by(RegularizationApprovalConfig.id.asc())
            .first()
        )
        if config and config.approvers:
            return config
    return None


def get_flow_stages(
    record: RegularizationApplication, db: Optional[Session] = None
) -> list[str]:
    del db
    stages: list[str] = []

    if _should_include_department_head_stage(record):
        stages.append("department_head")
    if _should_include_vice_principal_stage(record):
        stages.append("vice_principal")
    if _should_include_principal_stage(record):
        stages.append("principal")
    if _should_include_hr_stage(record):
        stages.append("hr")
    if _should_require_chairman(record.campus, record.position):
        stages.append("chairman")

    return stages


def resolve_stage_approvers(
    db: Session,
    record: RegularizationApplication,
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
    record: RegularizationApplication,
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
                f"{REGULARIZATION_STAGE_LABELS[stage]}审批人超出当前模板候选范围: {invalid_user_ids}"
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
            f"{REGULARIZATION_STAGE_LABELS[stage]}审批人不存在或已停用: {missing_user_ids}"
        )

    if stage == "hr":
        invalid_hr_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_group_hr_director_candidate(item)
        ]
        if invalid_hr_users:
            raise ValueError(
                "集团人力资源部阶段只能选择最高议事厅人资总监作为审批人: "
                + "、".join(invalid_hr_users)
            )

    if stage == "vice_principal":
        invalid_vice_principals = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_vice_principal_approver(
                item,
                record.campus,
                record.department,
            )
        ]
        if invalid_vice_principals:
            raise ValueError(
                "副校长阶段只能选择当前神殿与部门规则内的副校长岗位审批人: "
                + "、".join(invalid_vice_principals)
            )

    if stage == "principal":
        invalid_principals = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_principal_approver(item, record.campus)
        ]
        if invalid_principals:
            raise ValueError(
                "校长阶段只能选择当前神殿校长岗位作为审批人: "
                + "、".join(invalid_principals)
            )

    if stage == "chairman":
        invalid_chairmen = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_chairman_position(item.position)
        ]
        if invalid_chairmen:
            raise ValueError(
                "董事长阶段只能选择职位为“董事长”的人员作为审批人: "
                + "、".join(invalid_chairmen)
            )

    if stage == "department_head":
        invalid_department_heads = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_department_head_approver(
                item,
                record.campus,
                record.department,
                record.position,
            )
        ]
        if invalid_department_heads:
            raise ValueError(
                "部门负责人阶段只能选择当前部门与岗位规则内的负责人: "
                + "、".join(invalid_department_heads)
            )


def _set_selected_approver_user_ids(
    db: Session,
    record: RegularizationApplication,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record, db)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        REGULARIZATION_APPROVAL_STAGES,
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
    record = RegularizationApplication(
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
                "stage_label": REGULARIZATION_STAGE_LABELS[stage],
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
) -> list[RegularizationApprovalConfig]:
    query = db.query(RegularizationApprovalConfig).options(
        selectinload(RegularizationApprovalConfig.approvers)
    )
    if campus:
        query = query.filter(
            RegularizationApprovalConfig.campus.in_(_get_config_campus_values(campus))
        )
    if apply_department is not None:
        query = query.filter(
            RegularizationApprovalConfig.apply_department
            == _normalize_scope_value(apply_department)
        )
    if apply_position is not None:
        query = query.filter(
            RegularizationApprovalConfig.apply_position
            == _normalize_scope_value(apply_position)
        )
    if stage:
        query = query.filter(RegularizationApprovalConfig.stage == stage)
    return query.order_by(
        RegularizationApprovalConfig.campus.asc(),
        RegularizationApprovalConfig.apply_department.asc(),
        RegularizationApprovalConfig.apply_position.asc(),
        RegularizationApprovalConfig.stage.asc(),
    ).all()


def upsert_approval_config(
    db: Session,
    payload: RegularizationApprovalConfigUpsert,
) -> RegularizationApprovalConfig:
    if payload.stage not in REGULARIZATION_APPROVAL_STAGES:
        raise ValueError("审批阶段不合法")
    if not payload.approver_user_ids:
        raise ValueError("请至少配置一个审批人")
    if _is_management_center_campus(payload.campus) and payload.stage in {
        "vice_principal",
        "principal",
    }:
        raise ValueError("最高议事厅转正审批不包含副校长或校长环节，请改配其他环节")

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

    if payload.stage == "hr":
        invalid_hr_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_group_hr_director_candidate(item)
        ]
        if invalid_hr_users:
            raise ValueError(
                "集团人力资源部阶段只能配置最高议事厅人资总监作为审批人: "
                + "、".join(invalid_hr_users)
            )

    if payload.stage == "vice_principal":
        invalid_vice_principals = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_vice_principal_approver(
                item,
                payload.campus.strip(),
                payload.apply_department or "",
            )
        ]
        if invalid_vice_principals:
            raise ValueError(
                "副校长阶段只能配置当前神殿与部门规则内的副校长岗位人员: "
                + "、".join(invalid_vice_principals)
            )

    if payload.stage == "principal":
        invalid_principals = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_principal_approver(item, payload.campus.strip())
        ]
        if invalid_principals:
            raise ValueError(
                "校长阶段只能配置当前神殿校长岗位人员作为审批人: "
                + "、".join(invalid_principals)
            )

    if payload.stage == "chairman":
        invalid_chairmen = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_chairman_position(item.position)
        ]
        if invalid_chairmen:
            raise ValueError(
                "董事长阶段只能配置职位为“董事长”的人员作为审批人: "
                + "、".join(invalid_chairmen)
            )

    if payload.stage == "department_head":
        invalid_department_heads = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_valid_department_head_approver(
                item,
                payload.campus.strip(),
                payload.apply_department or "",
                payload.apply_position or "",
            )
        ]
        if invalid_department_heads:
            raise ValueError(
                "部门负责人阶段只能配置当前部门与岗位规则内的负责人: "
                + "、".join(invalid_department_heads)
            )

    apply_department = _normalize_scope_value(payload.apply_department)
    apply_position = _normalize_scope_value(payload.apply_position)

    record = (
        db.query(RegularizationApprovalConfig)
        .options(selectinload(RegularizationApprovalConfig.approvers))
        .filter(
            RegularizationApprovalConfig.campus.in_(campus_values),
            RegularizationApprovalConfig.apply_department == apply_department,
            RegularizationApprovalConfig.apply_position == apply_position,
            RegularizationApprovalConfig.stage == payload.stage,
        )
        .order_by(RegularizationApprovalConfig.id.asc())
        .first()
    )

    if not record:
        record = RegularizationApprovalConfig(
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
            RegularizationApprovalConfigApprover(
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
        db.query(RegularizationApprovalConfig)
        .filter(RegularizationApprovalConfig.id == config_id)
        .first()
    )
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_application(
    db: Session, application_id: int
) -> Optional[RegularizationApplication]:
    return (
        db.query(RegularizationApplication)
        .options(selectinload(RegularizationApplication.approval_actions))
        .filter(RegularizationApplication.id == application_id)
        .first()
    )


def _has_manage_privilege(user: User, record: RegularizationApplication) -> bool:
    return record.created_by_user_id == user.user_id


def _has_approval_history(
    record: RegularizationApplication, user: Optional[User]
) -> bool:
    if user is None:
        return False
    return any(
        action.approver_user_id == user.user_id for action in record.approval_actions
    )


def _is_current_stage_approver(
    db: Session,
    record: RegularizationApplication,
    user: Optional[User],
) -> bool:
    if user is None or record.status != "pending" or not record.current_stage:
        return False
    allowed_user_ids = get_stage_approver_ids(db, record, record.current_stage)
    return user.user_id in allowed_user_ids


def can_view_application(
    db: Session,
    record: RegularizationApplication,
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
) -> list[RegularizationApplication]:
    query = db.query(RegularizationApplication).options(
        selectinload(RegularizationApplication.approval_actions)
    )
    if campus:
        query = query.filter(RegularizationApplication.campus == campus)
    if status:
        query = query.filter(RegularizationApplication.status == status)
    if department:
        query = query.filter(RegularizationApplication.department == department)
    records = query.order_by(RegularizationApplication.created_at.desc()).all()
    if current_user is None:
        return records
    return [
        record for record in records if can_view_application(db, record, current_user)
    ]


def create_application(
    db: Session,
    payload: RegularizationApplicationCreate,
    current_user: User,
) -> RegularizationApplication:
    applicant_name, applicant_campus, applicant_department, applicant_position = (
        _require_applicant_identity(current_user)
    )
    work_report_crud.ensure_user_completed_report(
        db,
        current_user.user_id,
        WORK_REPORT_REQUIRED_MESSAGE,
    )

    main_work = payload.main_work.strip()
    self_evaluation = payload.self_evaluation.strip()
    _validate_regularization_text_fields(
        main_work=main_work,
        self_evaluation=self_evaluation,
    )

    if payload.probation_end < payload.probation_start:
        raise ValueError("试用期结束日期不能早于开始日期")

    record = RegularizationApplication(
        application_no=_generate_application_no(),
        fill_date=payload.fill_date,
        campus=applicant_campus,
        name=applicant_name,
        department=applicant_department,
        position=applicant_position,
        gender=_normalize_optional_str(payload.gender),
        entry_date=payload.entry_date,
        regular_salary=payload.regular_salary,
        probation_start=payload.probation_start,
        probation_end=payload.probation_end,
        probation_salary=payload.probation_salary,
        main_work=main_work,
        suggestion=_normalize_optional_str(payload.suggestion),
        self_evaluation=self_evaluation,
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
    record: RegularizationApplication,
    payload: RegularizationApplicationUpdate,
    current_user: User,
) -> RegularizationApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    work_report_crud.ensure_user_completed_report(
        db,
        record.created_by_user_id,
        WORK_REPORT_REQUIRED_MESSAGE,
    )
    applicant_name, applicant_campus, applicant_department, applicant_position = (
        _require_applicant_identity(current_user)
    )
    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)
    payload_data.pop("campus", None)
    payload_data.pop("name", None)
    payload_data.pop("department", None)
    payload_data.pop("position", None)
    required_string_fields = {
        "campus",
        "name",
        "department",
        "position",
        "main_work",
        "self_evaluation",
    }
    optional_string_fields = {"gender", "suggestion"}

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

    _validate_regularization_text_fields(
        main_work=record.main_work,
        self_evaluation=record.self_evaluation,
    )

    if record.probation_end < record.probation_start:
        raise ValueError("试用期结束日期不能早于开始日期")

    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def delete_application(
    db: Session,
    record: RegularizationApplication,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def validate_full_approval_chain(
    db: Session, record: RegularizationApplication
) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record, db):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(REGULARIZATION_STAGE_LABELS[stage])
    return missing_stages


def _clear_stage_results(record: RegularizationApplication) -> None:
    record.department_head_opinion = None
    record.department_head_passed = None
    record.vice_principal_opinion = None
    record.vice_principal_passed = None
    record.hr_opinion = None
    record.hr_passed = None
    record.principal_opinion = None
    record.principal_passed = None
    record.chairman_opinion = None
    record.chairman_passed = None
    record.is_passed = None


def _set_stage_result(
    record: RegularizationApplication,
    stage: str,
    *,
    approved: bool,
    comment: Optional[str],
) -> None:
    normalized_comment = _normalize_optional_str(comment)
    if stage == "department_head":
        record.department_head_opinion = normalized_comment
        record.department_head_passed = approved
    elif stage == "vice_principal":
        record.vice_principal_opinion = normalized_comment
        record.vice_principal_passed = approved
    elif stage == "hr":
        record.hr_opinion = normalized_comment
        record.hr_passed = approved
    elif stage == "principal":
        record.principal_opinion = normalized_comment
        record.principal_passed = approved
    elif stage == "chairman":
        record.chairman_opinion = normalized_comment
        record.chairman_passed = approved


def get_stage_approver_ids(
    db: Session,
    record: RegularizationApplication,
    stage: str,
) -> list[int]:
    approvers = resolve_stage_approvers(db, record, stage)
    return [item.user_id for item in approvers]


def _build_auto_approved_stage_comment(
    previous_stage: str,
    stage: str,
    comment: Optional[str],
) -> str:
    previous_label = REGULARIZATION_STAGE_LABELS.get(previous_stage, previous_stage)
    stage_label = REGULARIZATION_STAGE_LABELS.get(stage, stage)
    normalized_comment = _normalize_optional_str(comment)
    message = (
        f"同一审批人连续负责【{previous_label}】与【{stage_label}】, 系统已自动通过当前环节"
    )
    if normalized_comment:
        return f"{message}。上一环节意见：{normalized_comment}"
    return message


def _auto_approve_following_same_user_stages(
    db: Session,
    record: RegularizationApplication,
    *,
    flow_stages: list[str],
    start_index: int,
    current_user: User,
    comment: Optional[str],
) -> tuple[list[str], Optional[str]]:
    auto_approved_stages: list[str] = []
    stage_index = start_index

    while stage_index < len(flow_stages) - 1:
        next_stage = flow_stages[stage_index + 1]
        next_stage_approvers = get_stage_approver_ids(db, record, next_stage)
        if not next_stage_approvers:
            raise ValueError(
                f"下一阶段“{REGULARIZATION_STAGE_LABELS[next_stage]}”未找到审批人，无法继续流转"
            )

        if set(next_stage_approvers) != {current_user.user_id}:
            return auto_approved_stages, next_stage

        previous_stage = flow_stages[stage_index]
        auto_comment = _build_auto_approved_stage_comment(
            previous_stage,
            next_stage,
            comment,
        )
        _set_stage_result(record, next_stage, approved=True, comment=auto_comment)
        db.add(
            RegularizationApplicationApprovalAction(
                application_id=record.id,
                stage=next_stage,
                action="approve",
                approver_user_id=current_user.user_id,
                approver_name=current_user.real_name,
                comment=auto_comment,
            )
        )
        auto_approved_stages.append(next_stage)
        stage_index += 1

    return auto_approved_stages, None


def _create_application_notification(
    db: Session,
    *,
    record: RegularizationApplication,
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
        RegularizationApplicationNotification(
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
        db.query(RegularizationApplicationNotification)
        .filter(
            RegularizationApplicationNotification.recipient_user_id
            == recipient_user_id,
            RegularizationApplicationNotification.is_read.is_(False),
        )
        .count()
    )


def list_application_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[RegularizationApplicationNotification]:
    query = (
        db.query(RegularizationApplicationNotification)
        .join(
            RegularizationApplication,
            RegularizationApplication.id
            == RegularizationApplicationNotification.application_id,
        )
        .options(selectinload(RegularizationApplicationNotification.application))
        .filter(
            RegularizationApplicationNotification.recipient_user_id == recipient_user_id
        )
    )
    if unread_only:
        query = query.filter(RegularizationApplicationNotification.is_read.is_(False))
    return query.order_by(RegularizationApplicationNotification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[RegularizationApplicationNotification]:
    record = (
        db.query(RegularizationApplicationNotification)
        .filter(
            RegularizationApplicationNotification.id == notification_id,
            RegularizationApplicationNotification.recipient_user_id
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
        db.query(RegularizationApplicationNotification)
        .filter(
            RegularizationApplicationNotification.recipient_user_id
            == recipient_user_id,
            RegularizationApplicationNotification.is_read.is_(False),
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
    record: RegularizationApplication,
    current_user: User,
) -> RegularizationApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

    if record.probation_end < record.probation_start:
        raise ValueError("试用期结束日期不能早于开始日期")

    work_report_crud.ensure_user_completed_report(
        db,
        record.created_by_user_id,
        WORK_REPORT_REQUIRED_MESSAGE,
    )

    missing_stages = validate_full_approval_chain(db, record)
    if missing_stages:
        raise ValueError(f"审批链不完整，缺少：{'、'.join(missing_stages)}")

    flow_stages = get_flow_stages(record, db)
    if not flow_stages:
        raise ValueError("当前申请未匹配到任何审批环节，请检查申请人信息与审批规则")

    record.status = "pending"
    record.current_stage = flow_stages[0]
    record.rejection_reason = None
    record.completed_at = None
    record.submitted_at = datetime.now()
    _clear_stage_results(record)

    db.add(
        RegularizationApplicationApprovalAction(
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
    record: RegularizationApplication,
    current_user: User,
    comment: Optional[str],
) -> RegularizationApplication:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(RegularizationApplicationApprovalAction)
        .filter(
            RegularizationApplicationApprovalAction.application_id == record.id,
            RegularizationApplicationApprovalAction.stage == current_stage,
            RegularizationApplicationApprovalAction.approver_user_id
            == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    normalized_comment = _normalize_optional_str(comment)

    _set_stage_result(record, current_stage, approved=True, comment=normalized_comment)
    db.add(
        RegularizationApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=normalized_comment,
        )
    )

    flow_stages = get_flow_stages(record, db)
    stage_index = flow_stages.index(current_stage)
    completed_stages = [current_stage]
    next_stage: Optional[str] = None
    if stage_index < len(flow_stages) - 1:
        auto_approved_stages, next_stage = _auto_approve_following_same_user_stages(
            db,
            record,
            flow_stages=flow_stages,
            start_index=stage_index,
            current_user=current_user,
            comment=normalized_comment,
        )
        completed_stages.extend(auto_approved_stages)

    last_completed_stage = completed_stages[-1]
    if last_completed_stage == flow_stages[-1]:
        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        record.is_passed = True
        employee_archive_crud.sync_archive_from_regularization_approval(db, record)
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"转正申请已通过：{record.name}/{record.department}",
            content=(
                f"你的转正申请《{record.application_no}》已完成全部审批并通过。"
                f"当前环节：{REGULARIZATION_STAGE_LABELS[last_completed_stage]}。"
                f"{f' 审批意见：{normalized_comment}' if normalized_comment else ''}"
            ),
            stage=last_completed_stage,
            action_by_user=current_user,
        )
    else:
        if not next_stage:
            raise ValueError("审批流转失败，未识别下一审批阶段")
        record.current_stage = next_stage
        approved_stage_labels = "、".join(
            REGULARIZATION_STAGE_LABELS[stage] for stage in completed_stages
        )
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"转正申请流转更新：{record.name}/{record.department}",
            content=(
                f"你的转正申请《{record.application_no}》已通过【{approved_stage_labels}】审批，"
                f"当前已流转至【{REGULARIZATION_STAGE_LABELS[next_stage]}】。"
                f"{f' 审批意见：{normalized_comment}' if normalized_comment else ''}"
            ),
            stage=last_completed_stage,
            action_by_user=current_user,
        )

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def reject_application(
    db: Session,
    record: RegularizationApplication,
    current_user: User,
    comment: Optional[str],
) -> RegularizationApplication:
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
        RegularizationApplicationApprovalAction(
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
        title=f"转正申请已驳回：{record.name}/{record.department}",
        content=(
            f"你的转正申请《{record.application_no}》在【{REGULARIZATION_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{normalized_comment}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def build_approval_flow(db: Session, record: RegularizationApplication) -> list[dict]:
    steps: list[dict] = []
    flow_stages = get_flow_stages(record, db)
    actions_by_stage: dict[str, list[RegularizationApplicationApprovalAction]] = {
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
                "stage_label": REGULARIZATION_STAGE_LABELS[stage],
                "status": status,
                "status_label": REGULARIZATION_FLOW_STATUS_LABELS[status],
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


def serialize_notification(record: RegularizationApplicationNotification) -> dict:
    application = record.application
    return {
        "id": record.id,
        "application_id": record.application_id,
        "application_no": application.application_no if application else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": REGULARIZATION_STAGE_LABELS.get(
            record.stage or "", record.stage
        ),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_config(record: RegularizationApprovalConfig) -> dict:
    return {
        "id": record.id,
        "campus": record.campus,
        "apply_department": record.apply_department or None,
        "apply_position": record.apply_position or None,
        "stage": record.stage,
        "stage_label": REGULARIZATION_STAGE_LABELS.get(record.stage, record.stage),
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
    record: RegularizationApplication,
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
        "department": record.department,
        "position": record.position,
        "gender": record.gender,
        "entry_date": record.entry_date,
        "regular_salary": record.regular_salary,
        "probation_start": record.probation_start,
        "probation_end": record.probation_end,
        "probation_salary": record.probation_salary,
        "main_work": record.main_work,
        "suggestion": record.suggestion,
        "self_evaluation": record.self_evaluation,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "department_head_opinion": record.department_head_opinion,
        "department_head_passed": record.department_head_passed,
        "vice_principal_opinion": record.vice_principal_opinion,
        "vice_principal_passed": record.vice_principal_passed,
        "hr_opinion": record.hr_opinion,
        "hr_passed": record.hr_passed,
        "principal_opinion": record.principal_opinion,
        "principal_passed": record.principal_passed,
        "chairman_opinion": record.chairman_opinion,
        "chairman_passed": record.chairman_passed,
        "is_passed": record.is_passed,
        "status": record.status,
        "status_label": REGULARIZATION_STATUS_LABELS.get(record.status, record.status),
        "current_stage": record.current_stage,
        "current_stage_label": REGULARIZATION_STAGE_LABELS.get(
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
                "stage_label": REGULARIZATION_STAGE_LABELS.get(
                    action.stage, action.stage
                ),
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
