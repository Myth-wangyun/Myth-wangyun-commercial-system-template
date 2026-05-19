"""
集团人资基础 - 招聘需求申请与审批配置 CRUD
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.crud.human_resources import approval_workflow as workflow_crud
from app.crud.human_resources import employee_archive as employee_archive_crud
from app.crud.human_resources.approval_selection import (
    dump_selected_approver_map,
    normalize_selected_approver_map,
    parse_selected_approver_map,
)
from app.models.human_resources.recruitment_request import (
    RecruitmentApprovalConfig,
    RecruitmentApprovalConfigApprover,
    RecruitmentRequest,
    RecruitmentRequestApprovalAction,
    RecruitmentRequestNotification,
)
from app.models.user import User, UserStatus
from app.schemas.human_resources.recruitment_request import (
    RECRUITMENT_APPROVAL_STAGES,
    RECRUITMENT_FLOW_STATUS_LABELS,
    RECRUITMENT_STAGE_LABELS,
    RECRUITMENT_STATUS_LABELS,
    RecruitmentApprovalConfigUpsert,
    RecruitmentRequestCreate,
    RecruitmentRequestUpdate,
)

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
FLOW_TYPE = "recruitment_request"
StageApproverCache = dict[tuple[int, str], list[User]]
MANAGEMENT_CENTER_DEPARTMENT_RULES = (
    {
        "department_keywords": ("市场",),
        "head_position_patterns": (("经理",), ("副经理",)),
    },
    {
        "department_keywords": ("人资", "人力资源", "人事"),
        "head_position_patterns": (("主管",), ()),
    },
    {
        "department_keywords": ("教质",),
        "head_position_patterns": (("总监",), ("副总监",)),
    },
    {
        "department_keywords": ("财务",),
        "head_position_patterns": (("总监",), ("副总监",)),
    },
    {
        "department_keywords": ("学术",),
        "head_position_patterns": (("副总监",), ()),
    },
)


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    normalized = value.strip()
    return normalized


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


def _has_all_keywords(value: Optional[str], keywords: tuple[str, ...]) -> bool:
    normalized = _normalize_compact_text(value)
    return bool(normalized) and all(keyword in normalized for keyword in keywords)


def _generate_request_no() -> str:
    return f"ZPSQ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


def _is_management_center_campus(campus: Optional[str]) -> bool:
    return bool(campus and campus.strip() in MANAGEMENT_CENTER_CAMPUS_VALUES)


def _campus_matches_scope(user_campus: Optional[str], selected_campus: Optional[str]) -> bool:
    if not selected_campus:
        return True
    if not user_campus:
        return True
    if _is_management_center_campus(selected_campus):
        return _is_management_center_campus(user_campus)
    return user_campus == selected_campus


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in ("人资行政", "人事行政", "人力资源", "人事部", "人资部", "人资"))


def _is_chairman_position(position: Optional[str]) -> bool:
    return bool(position and position.strip() == "董事长")


def _is_management_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in ("主管", "经理", "总监", "部长", "主任", "负责人", "校长"))


def _matches_keyword_family(value: Optional[str], keywords: tuple[str, ...]) -> bool:
    normalized = _normalize_compact_text(value)
    return any(keyword in normalized for keyword in keywords)


def _matches_position_pattern(
    position: Optional[str],
    include_keywords: tuple[str, ...],
    exclude_keywords: tuple[str, ...],
) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or not any(keyword in normalized for keyword in include_keywords):
        return False
    return not any(keyword in normalized for keyword in exclude_keywords)


def _matches_department_family(
    user_department: Optional[str],
    apply_department: Optional[str],
) -> bool:
    normalized_user = _normalize_compact_text(user_department)
    normalized_apply = _normalize_compact_text(apply_department)
    if not normalized_user or not normalized_apply:
        return False
    return (
        normalized_user == normalized_apply
        or normalized_apply in normalized_user
        or normalized_user in normalized_apply
    )


def _get_management_center_department_rule(department: Optional[str]) -> Optional[dict]:
    for rule in MANAGEMENT_CENTER_DEPARTMENT_RULES:
        if _matches_keyword_family(department, rule["department_keywords"]):
            return rule
    return None


def _is_management_center_department_head(
    department: Optional[str],
    position: Optional[str],
) -> bool:
    rule = _get_management_center_department_rule(department)
    if rule:
        include_keywords, exclude_keywords = rule["head_position_patterns"]
        return _matches_position_pattern(position, include_keywords, exclude_keywords)
    return _is_management_position(position)


def _resolve_management_center_flow_stages(
    department: Optional[str],
    position: Optional[str],
) -> list[str]:
    stages = ["hr_director", "chairman"]
    if not _is_management_center_department_head(department, position):
        stages.insert(0, "department_head")
    return stages


def _resolve_management_center_department_head_users(
    users: list[User],
    department: Optional[str],
) -> list[User]:
    department_users = [user for user in users if _matches_department_family(user.department, department)]
    if not department_users:
        return []

    rule = _get_management_center_department_rule(department)
    if rule:
        include_keywords, exclude_keywords = rule["head_position_patterns"]
        preferred_users = [
            user
            for user in department_users
            if _matches_position_pattern(user.position, include_keywords, exclude_keywords)
        ]
        if preferred_users:
            return preferred_users

    return [user for user in department_users if _is_management_position(user.position)]


def _resolve_management_center_hr_director_users(users: list[User]) -> list[User]:
    return [
        user
        for user in users
        if _is_management_center_campus(user.campus)
        and _is_hr_admin_department(user.department)
        and "总监" in _normalize_compact_text(user.position)
    ]


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


def _user_matches_campus_bucket(user_campus: Optional[str], campus_bucket: Optional[str]) -> bool:
    if campus_bucket is None:
        return False
    return _resolve_campus_bucket(user_campus) == campus_bucket


def _resolve_bucket_users(
    db: Session,
    record: RecruitmentRequest,
    campus_bucket: Optional[str],
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return [user for user in users if _user_matches_campus_bucket(user.campus, campus_bucket)]


def _resolve_users_by_patterns(
    users: list[User],
    *,
    department_keywords: tuple[str, ...] = (),
    position_patterns: tuple[tuple[tuple[str, ...], tuple[str, ...]], ...] = (),
) -> list[User]:
    resolved: list[User] = []
    seen_user_ids: set[int] = set()
    for user in users:
        if department_keywords and not _matches_keyword_family(user.department, department_keywords):
            continue
        if position_patterns and not any(
            _matches_position_pattern(user.position, include_keywords, exclude_keywords)
            for include_keywords, exclude_keywords in position_patterns
        ):
            continue
        if user.user_id in seen_user_ids:
            continue
        seen_user_ids.add(user.user_id)
        resolved.append(user)
    return resolved


def _resolve_branch_principal_users(campus_bucket: str, users: list[User]) -> list[User]:
    principal_patterns: dict[str, tuple[tuple[tuple[str, ...], tuple[str, ...]], ...]] = {
        "shengbang": ((("校长",), ("副校长",)),),
        "jinmei": ((("校长",), ("副校长",)),),
        "taimei": ((("校长",), ("副校长",)),),
        "jimei": ((("校长",), ("副校长",)), (("副总监",), ())),
        "shimei": ((("校长",), ("副校长",)),),
        "yuanmei": ((("校长",), ("副校长",)), (("执行副校长",), ())),
        "guimei": ((("校长",), ("副校长",)),),
    }
    return _resolve_users_by_patterns(
        users,
        position_patterns=principal_patterns.get(campus_bucket, ((("校长",), ("副校长",)),)),
    )


def _resolve_branch_backend_users(campus_bucket: str, users: list[User]) -> list[User]:
    backend_patterns: dict[str, tuple[tuple[tuple[str, ...], tuple[str, ...]], ...]] = {
        "shengbang": ((("后端副校长",), ()),),
        "jinmei": ((("后端副校长",), ()),),
        "taimei": ((("后端副校长",), ()),),
        "jimei": ((("后端副校长",), ()),),
        "shimei": ((("后端副校长",), ()), (("副校长",), ())),
        "guimei": ((("后端副校长",), ()),),
    }
    return _resolve_users_by_patterns(
        users,
        position_patterns=backend_patterns.get(campus_bucket, ()),
    )


def _resolve_academic_manager_users(users: list[User]) -> list[User]:
    return _resolve_users_by_patterns(
        users,
        department_keywords=("学术",),
        position_patterns=((("经理",), ("副经理",)), (("智慧司经理",), ("副经理",))),
    )


def _resolve_teaching_quality_manager_users(users: list[User]) -> list[User]:
    return _resolve_users_by_patterns(
        users,
        department_keywords=("教质",),
        position_patterns=((("经理",), ("副经理",)), (("教化司经理",), ("副经理",))),
    )


def _is_branch_principal_position(campus_bucket: Optional[str], position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or campus_bucket is None:
        return False
    if campus_bucket == "jimei":
        return normalized == "副总监" or ("校长" in normalized and "副校长" not in normalized)
    if campus_bucket == "yuanmei":
        return normalized == "执行副校长" or ("校长" in normalized and "副校长" not in normalized)
    return "校长" in normalized and "副校长" not in normalized


def _is_backend_position(campus_bucket: Optional[str], position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or campus_bucket is None:
        return False
    if "后端副校长" in normalized:
        return True
    return campus_bucket == "shimei" and normalized == "副校长"


def _is_academic_manager(position: Optional[str]) -> bool:
    return _matches_position_pattern(position, ("经理",), ("副经理",))


def _is_academic_deputy(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return "学术" in normalized and "副经理" in normalized


def _build_stage_specs(
    steps: list[tuple[str, str, list[User]]],
) -> list[dict[str, object]]:
    if len(steps) > len(RECRUITMENT_APPROVAL_STAGES):
        raise ValueError("招聘审批链超过当前系统支持的最大阶段数")
    stage_names = [stage for stage, _, _ in steps]
    if len(stage_names) != len(set(stage_names)):
        raise ValueError("招聘审批链存在重复阶段配置")
    return [
        {
            "stage": stage,
            "label": label,
            "approvers": approvers,
        }
        for stage, label, approvers in steps
    ]


def _resolve_special_stage_specs(
    db: Session,
    record: RecruitmentRequest,
) -> Optional[list[dict[str, object]]]:
    campus_bucket = _resolve_campus_bucket(record.campus)
    if campus_bucket is None:
        return None

    applicant = _get_request_applicant(db, record)
    applicant_department = applicant.department if applicant and applicant.department else record.department
    applicant_position = applicant.position if applicant and applicant.position else None

    if campus_bucket == "management_center":
        scoped_users = _resolve_scoped_users(db, record)
        active_users = (
            _base_active_user_query(db)
            .filter(User.user_id != record.created_by_user_id)
            .all()
        )
        steps: list[tuple[str, str, list[User]]] = []
        if not _is_management_center_department_head(applicant_department, applicant_position):
            steps.append(
                (
                    "department_head",
                    "部门负责人",
                    _resolve_management_center_department_head_users(scoped_users, applicant_department),
                )
            )
        steps.append(("hr_director", "人资总监", _resolve_management_center_hr_director_users(active_users)))
        steps.append(("chairman", "董事长", [user for user in active_users if _is_chairman_position(user.position)]))
        return _build_stage_specs(steps)

    bucket_users = _resolve_bucket_users(db, record, campus_bucket)
    principal_users = _resolve_branch_principal_users(campus_bucket, bucket_users)
    backend_users = _resolve_branch_backend_users(campus_bucket, bucket_users)
    hr_users = _resolve_management_center_hr_director_users(
        [
            user
            for user in _base_active_user_query(db).filter(User.user_id != record.created_by_user_id).all()
            if _is_management_center_campus(user.campus)
        ]
    )

    applicant_department_text = _normalize_compact_text(applicant_department)

    if _is_branch_principal_position(campus_bucket, applicant_position):
        return _build_stage_specs([("hr_director", "人资总监", hr_users)])

    if _is_backend_position(campus_bucket, applicant_position):
        return _build_stage_specs([
            ("principal", "校长", principal_users),
            ("hr_director", "人资总监", hr_users),
        ])

    if campus_bucket in {"shengbang", "jinmei", "taimei", "jimei", "yuanmei", "guimei"}:
        if "学术" in applicant_department_text:
            if campus_bucket in {"jinmei", "jimei", "guimei"}:
                return _build_stage_specs([
                    ("department_head", "后端副校长", backend_users),
                    ("principal", "校长", principal_users),
                    ("hr_director", "人资总监", hr_users),
                ])
            if campus_bucket in {"yuanmei"}:
                return _build_stage_specs([
                    ("principal", "校长", principal_users),
                    ("hr_director", "人资总监", hr_users),
                ])
            if campus_bucket in {"shengbang"}:
                return _build_stage_specs([
                    ("department_head", "后端副校长", backend_users),
                    ("principal", "校长", principal_users),
                    ("hr_director", "人资总监", hr_users),
                ])
        if "教质" in applicant_department_text:
            if campus_bucket in {"shengbang", "jinmei", "taimei", "jimei"}:
                return _build_stage_specs([
                    ("department_head", "后端副校长", backend_users),
                    ("principal", "校长", principal_users),
                    ("hr_director", "人资总监", hr_users),
                ])
            if campus_bucket == "yuanmei":
                return _build_stage_specs([
                    ("principal", "校长", principal_users),
                    ("hr_director", "人资总监", hr_users),
                ])
        if campus_bucket == "jimei" and ("咨询" in applicant_department_text or "渠道" in applicant_department_text):
            return _build_stage_specs([
                ("principal", "校长", principal_users),
                ("hr_director", "人资总监", hr_users),
            ])
        if campus_bucket == "shengbang" and ("咨询" in applicant_department_text or "渠道" in applicant_department_text):
            return _build_stage_specs([
                ("principal", "校长", principal_users),
                ("hr_director", "人资总监", hr_users),
            ])

    if campus_bucket == "shimei":
        if "学术" in applicant_department_text:
            if _is_academic_deputy(applicant_position):
                return _build_stage_specs([
                    ("department_head", "智慧司经理", _resolve_academic_manager_users(bucket_users)),
                    ("principal", "后端副校长", backend_users),
                    ("hr_director", "校长", principal_users),
                    ("chairman", "人资总监", hr_users),
                ])
            if _is_academic_manager(applicant_position):
                return _build_stage_specs([
                    ("principal", "校长", principal_users),
                    ("hr_director", "人资总监", hr_users),
                ])
        if "教质" in applicant_department_text:
            return _build_stage_specs([
                ("department_head", "后端副校长", backend_users),
                ("principal", "校长", principal_users),
                ("hr_director", "人资总监", hr_users),
            ])

    return _build_stage_specs([
        ("principal", "校长", principal_users),
        ("hr_director", "人资总监", hr_users),
    ])


def _get_special_stage_spec(
    db: Session,
    record: RecruitmentRequest,
    stage: str,
) -> Optional[dict[str, object]]:
    specs = _resolve_special_stage_specs(db, record)
    if not specs:
        return None
    for spec in specs:
        if spec["stage"] == stage:
            return spec
    return None


def get_stage_label(
    record: RecruitmentRequest,
    stage: Optional[str],
    db: Optional[Session] = None,
) -> Optional[str]:
    if not stage:
        return None
    if db is not None:
        spec = _get_special_stage_spec(db, record, stage)
        if spec is not None:
            return str(spec["label"])
    return RECRUITMENT_STAGE_LABELS.get(stage, stage)


def resolve_management_center_flow_stages(
    department: Optional[str],
    position: Optional[str],
) -> list[str]:
    return _resolve_management_center_flow_stages(department, position)


def resolve_management_center_department_head_users(
    users: list[User],
    department: Optional[str],
) -> list[User]:
    return _resolve_management_center_department_head_users(users, department)


def resolve_management_center_hr_director_users(users: list[User]) -> list[User]:
    return _resolve_management_center_hr_director_users(users)


def _get_request_applicant(db: Session, record: RecruitmentRequest) -> Optional[User]:
    if not record.created_by_user_id:
        return None
    return (
        db.query(User)
        .filter(
            User.user_id == record.created_by_user_id,
            User.status == UserStatus.ACTIVE,
        )
        .first()
    )


def _resolve_management_center_stage_approvers(
    db: Session,
    record: RecruitmentRequest,
    stage: str,
) -> Optional[list[User]]:
    if not _is_management_center_campus(record.campus):
        return None

    scoped_users = _resolve_scoped_users(db, record)
    active_users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )

    if stage == "department_head":
        return _resolve_management_center_department_head_users(scoped_users, record.department)
    if stage == "principal":
        return []
    if stage == "hr_director":
        return _resolve_management_center_hr_director_users(active_users)
    if stage == "chairman":
        return [user for user in active_users if _is_chairman_position(user.position)]
    return None


def _has_manage_privilege(user: User, record: RecruitmentRequest) -> bool:
    return record.created_by_user_id == user.user_id


def _is_current_stage_approver(
    db: Session,
    record: RecruitmentRequest,
    user: Optional[User],
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> bool:
    if user is None or record.status != "pending" or not record.current_stage:
        return False
    allowed_user_ids = get_stage_approver_ids(
        db,
        record,
        record.current_stage,
        stage_approver_cache=stage_approver_cache,
    )
    return user.user_id in allowed_user_ids


def _is_any_stage_approver(
    db: Session,
    record: RecruitmentRequest,
    user: Optional[User],
) -> bool:
    if user is None:
        return False
    for stage in get_flow_stages(record, db):
        if user.user_id in get_stage_approver_ids(db, record, stage):
            return True
    return False


def _has_approval_history(record: RecruitmentRequest, user: Optional[User]) -> bool:
    if user is None:
        return False
    return any(action.approver_user_id == user.user_id for action in record.approval_actions)


def can_view_request(
    db: Session,
    record: RecruitmentRequest,
    user: Optional[User],
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> bool:
    if user is None:
        return False
    if record.created_by_user_id == user.user_id:
        return True
    if record.status == "draft":
        return False
    if _has_approval_history(record, user):
        return True
    return _is_current_stage_approver(
        db,
        record,
        user,
        stage_approver_cache=stage_approver_cache,
    )


def _serialize_approver(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.real_name,
        "department": user.department,
        "position": user.position,
        "campus": user.campus,
    }


def _get_selected_approver_user_ids(record: RecruitmentRequest) -> dict[str, list[int]]:
    return parse_selected_approver_map(record.selected_approver_user_ids, RECRUITMENT_APPROVAL_STAGES)


def _resolve_selected_stage_approvers(
    db: Session,
    record: RecruitmentRequest,
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


def _base_active_user_query(db: Session):
    return db.query(User).filter(User.status == UserStatus.ACTIVE)


def _resolve_scoped_users(
    db: Session,
    record: RecruitmentRequest,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return [user for user in users if _campus_matches_scope(user.campus, record.campus)]


def get_stage_candidate_users(
    db: Session,
    record: RecruitmentRequest,
    stage: str,
) -> list[User]:
    special_spec = _get_special_stage_spec(db, record, stage)
    if special_spec is not None:
        return list(special_spec["approvers"])

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

    if stage in {"department_head", "principal"}:
        return _resolve_scoped_users(db, record)
    if stage == "hr_director":
        users = (
            _base_active_user_query(db)
            .filter(User.user_id != record.created_by_user_id)
            .all()
        )
        return [
            user
            for user in users
            if _is_management_center_campus(user.campus) and _is_hr_admin_department(user.department)
        ]
    if stage == "chairman":
        return [user for user in _base_active_user_query(db).all() if _is_chairman_position(user.position)]
    return []


def _resolve_config(
    db: Session,
    campus: Optional[str],
    apply_department: str,
    apply_position: str,
    stage: str,
) -> Optional[RecruitmentApprovalConfig]:
    if not campus:
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
            db.query(RecruitmentApprovalConfig)
            .options(selectinload(RecruitmentApprovalConfig.approvers))
            .filter(
                RecruitmentApprovalConfig.campus == campus,
                RecruitmentApprovalConfig.apply_department == candidate_dept,
                RecruitmentApprovalConfig.apply_position == candidate_pos,
                RecruitmentApprovalConfig.stage == stage,
                RecruitmentApprovalConfig.is_active.is_(True),
            )
            .first()
        )
        if config and config.approvers:
            return config
    return None


def get_flow_stages(record: RecruitmentRequest, db: Optional[Session] = None) -> list[str]:
    if db is not None:
        special_specs = _resolve_special_stage_specs(db, record)
        if special_specs:
            return [str(spec["stage"]) for spec in special_specs]

        template_stages = workflow_crud.resolve_flow_stage_order(
            db,
            flow_type=FLOW_TYPE,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        if template_stages is not None:
            return template_stages
    return list(RECRUITMENT_APPROVAL_STAGES)


def resolve_stage_approvers(
    db: Session,
    record: RecruitmentRequest,
    stage: str,
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> list[User]:
    cache_key = (int(record.id or 0), stage)
    if stage_approver_cache is not None and cache_key in stage_approver_cache:
        return stage_approver_cache[cache_key]

    selected_users = _resolve_selected_stage_approvers(db, record, stage)
    if selected_users:
        if stage_approver_cache is not None:
            stage_approver_cache[cache_key] = selected_users
        return selected_users

    special_spec = _get_special_stage_spec(db, record, stage)
    if special_spec is not None:
        special_users = list(special_spec["approvers"])
        if stage_approver_cache is not None:
            stage_approver_cache[cache_key] = special_users
        return special_users

    template_users = workflow_crud.resolve_template_stage_approvers(
        db,
        flow_type=FLOW_TYPE,
        campus=record.campus,
        department=record.department,
        position=record.position,
        stage=stage,
    )
    if template_users is not None:
        if stage_approver_cache is not None:
            stage_approver_cache[cache_key] = template_users
        return template_users

    config = _resolve_config(db, record.campus, record.department, record.position, stage)
    if config:
        user_ids = [item.approver_user_id for item in config.approvers]
        if user_ids:
            users = (
                db.query(User)
                .filter(
                    User.user_id.in_(user_ids),
                    User.status == UserStatus.ACTIVE,
                )
                .all()
            )
            user_map = {user.user_id: user for user in users}
            resolved_users = [
                user_map[user_id] for user_id in user_ids if user_id in user_map
            ]
            if stage_approver_cache is not None:
                stage_approver_cache[cache_key] = resolved_users
            return resolved_users

    resolved_users = get_stage_candidate_users(db, record, stage)
    if stage_approver_cache is not None:
        stage_approver_cache[cache_key] = resolved_users
    return resolved_users


def _validate_selected_stage_approvers(
    db: Session,
    record: RecruitmentRequest,
    stage: str,
    user_ids: list[int],
) -> None:
    stage_label = get_stage_label(record, stage, db) or stage
    special_spec = _get_special_stage_spec(db, record, stage)
    if special_spec is not None:
        allowed_user_ids = {item.user_id for item in list(special_spec["approvers"])}
        invalid_user_ids = [user_id for user_id in user_ids if user_id not in allowed_user_ids]
        if invalid_user_ids:
            raise ValueError(
                f"{stage_label}审批人超出当前岗位规则候选范围: {invalid_user_ids}"
            )
        return

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
        invalid_user_ids = [user_id for user_id in user_ids if user_id not in allowed_user_ids]
        if invalid_user_ids:
            raise ValueError(
                f"{stage_label}审批人超出当前模板候选范围: {invalid_user_ids}"
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
        raise ValueError(f"{stage_label}审批人不存在或已停用: {missing_user_ids}")

    if stage in {"department_head", "principal"}:
        invalid_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _campus_matches_scope(item.campus, record.campus)
        ]
        if invalid_users:
            raise ValueError(
                f"{stage_label}阶段只能选择当前神殿范围内的审批人: "
                + "、".join(invalid_users)
            )

    if stage == "hr_director":
        invalid_hr_directors = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_management_center_campus(item.campus)
            or not _is_hr_admin_department(item.department)
            or "总监" not in _normalize_compact_text(item.position)
        ]
        if invalid_hr_directors:
            raise ValueError(
                "人资总监阶段只能选择最高议事厅人资相关部门中职位包含“总监”的人员作为审批人: "
                + "、".join(invalid_hr_directors)
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


def _set_selected_approver_user_ids(
    db: Session,
    record: RecruitmentRequest,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    normalized = normalize_selected_approver_map(value, get_flow_stages(record, db))
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        RECRUITMENT_APPROVAL_STAGES,
    )
    return normalized


def build_approver_candidate_preview(
    db: Session,
    *,
    campus: Optional[str],
    department: str,
    position: str,
    created_by_user_id: Optional[int] = None,
    selected_approver_user_ids: Optional[dict[str, list[int]]] = None,
) -> list[dict]:
    record = RecruitmentRequest(
        campus=campus.strip() if isinstance(campus, str) else campus,
        department=department.strip(),
        position=position.strip(),
        created_by_user_id=created_by_user_id,
    )
    flow_stages = get_flow_stages(record, db)
    preview_map = normalize_selected_approver_map(selected_approver_user_ids, flow_stages)
    preview_items: list[dict] = []
    for stage in flow_stages:
        candidate_users = get_stage_candidate_users(db, record, stage)
        if preview_map.get(stage):
            recommended_user_ids = preview_map[stage]
        else:
            recommended_user_ids = [item.user_id for item in resolve_stage_approvers(db, record, stage)]
        preview_items.append(
            {
                "stage": stage,
                "stage_label": get_stage_label(record, stage, db),
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
) -> list[RecruitmentApprovalConfig]:
    query = db.query(RecruitmentApprovalConfig).options(
        selectinload(RecruitmentApprovalConfig.approvers)
    )
    if campus:
        query = query.filter(RecruitmentApprovalConfig.campus == campus)
    if apply_department is not None:
        query = query.filter(
            RecruitmentApprovalConfig.apply_department == _normalize_scope_value(apply_department)
        )
    if apply_position is not None:
        query = query.filter(
            RecruitmentApprovalConfig.apply_position == _normalize_scope_value(apply_position)
        )
    if stage:
        query = query.filter(RecruitmentApprovalConfig.stage == stage)
    return (
        query.order_by(
            RecruitmentApprovalConfig.campus.asc(),
            RecruitmentApprovalConfig.apply_department.asc(),
            RecruitmentApprovalConfig.apply_position.asc(),
            RecruitmentApprovalConfig.stage.asc(),
        )
        .all()
    )


def upsert_approval_config(
    db: Session,
    payload: RecruitmentApprovalConfigUpsert,
) -> RecruitmentApprovalConfig:
    if payload.stage not in RECRUITMENT_APPROVAL_STAGES:
        raise ValueError("审批阶段不合法")
    if not payload.approver_user_ids:
        raise ValueError("请至少配置一个审批人")

    approvers = (
        db.query(User)
        .filter(
            User.user_id.in_(payload.approver_user_ids),
            User.status == UserStatus.ACTIVE,
        )
        .all()
    )
    approver_map = {item.user_id: item for item in approvers}
    missing_user_ids = [user_id for user_id in payload.approver_user_ids if user_id not in approver_map]
    if missing_user_ids:
        raise ValueError(f"审批人不存在或已停用: {missing_user_ids}")

    if payload.stage == "hr_director":
        invalid_hr_directors = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_management_center_campus(item.campus)
            or not _is_hr_admin_department(item.department)
            or "总监" not in _normalize_compact_text(item.position)
        ]
        if invalid_hr_directors:
            raise ValueError(
                "人资总监阶段只能配置最高议事厅人资相关部门中职位包含“总监”的人员作为审批人: "
                + "、".join(invalid_hr_directors)
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

    apply_department = _normalize_scope_value(payload.apply_department)
    apply_position = _normalize_scope_value(payload.apply_position)

    record = (
        db.query(RecruitmentApprovalConfig)
        .options(selectinload(RecruitmentApprovalConfig.approvers))
        .filter(
            RecruitmentApprovalConfig.campus == payload.campus.strip(),
            RecruitmentApprovalConfig.apply_department == apply_department,
            RecruitmentApprovalConfig.apply_position == apply_position,
            RecruitmentApprovalConfig.stage == payload.stage,
        )
        .first()
    )

    if not record:
        record = RecruitmentApprovalConfig(
            campus=payload.campus.strip(),
            apply_department=apply_department,
            apply_position=apply_position,
            stage=payload.stage,
            is_active=payload.is_active,
        )
        db.add(record)
        db.flush()
    else:
        record.is_active = payload.is_active
        record.approvers.clear()
        db.flush()

    for index, user_id in enumerate(payload.approver_user_ids):
        user = approver_map[user_id]
        record.approvers.append(
            RecruitmentApprovalConfigApprover(
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
    record = db.query(RecruitmentApprovalConfig).filter(RecruitmentApprovalConfig.id == config_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_request(db: Session, request_id: int) -> Optional[RecruitmentRequest]:
    return (
        db.query(RecruitmentRequest)
        .options(selectinload(RecruitmentRequest.approval_actions))
        .filter(RecruitmentRequest.id == request_id)
        .first()
    )


def list_requests(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
) -> list[RecruitmentRequest]:
    query = db.query(RecruitmentRequest).options(
        selectinload(RecruitmentRequest.approval_actions)
    )
    if campus:
        query = query.filter(RecruitmentRequest.campus == campus)
    if status:
        query = query.filter(RecruitmentRequest.status == status)
    if department:
        query = query.filter(RecruitmentRequest.department == department)
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                RecruitmentRequest.request_no.ilike(keyword),
                RecruitmentRequest.department.ilike(keyword),
                RecruitmentRequest.position.ilike(keyword),
                RecruitmentRequest.reason.ilike(keyword),
                RecruitmentRequest.created_by_name.ilike(keyword),
            )
        )
    records = query.order_by(RecruitmentRequest.created_at.desc()).all()
    if current_user is None:
        return records
    stage_approver_cache: StageApproverCache = {}
    return [
        record
        for record in records
        if can_view_request(
            db,
            record,
            current_user,
            stage_approver_cache=stage_approver_cache,
        )
    ]


def list_requests_page(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[RecruitmentRequest], int]:
    records = list_requests(
        db,
        campus=campus,
        status=status,
        department=department,
        search=search,
        current_user=current_user,
    )
    start = max(page - 1, 0) * page_size
    end = start + page_size
    return records[start:end], len(records)


def create_request(
    db: Session,
    payload: RecruitmentRequestCreate,
    current_user: User,
) -> RecruitmentRequest:
    record = RecruitmentRequest(
        request_no=_generate_request_no(),
        campus=(payload.campus or current_user.campus or "").strip() or None,
        apply_date=payload.apply_date,
        department=payload.department.strip(),
        position=payload.position.strip(),
        headcount=payload.headcount,
        reason=payload.reason.strip(),
        expected_date=payload.expected_date,
        gender=payload.gender,
        age=payload.age,
        marital_status=payload.marital_status,
        education=payload.education,
        major=payload.major,
        skills_experience=payload.skills_experience,
        suggested_salary=payload.suggested_salary,
        job_responsibilities=payload.job_responsibilities,
        analysis_and_reason=payload.analysis_and_reason,
        internal_candidate_has=payload.internal_candidate_has,
        internal_candidate_department=payload.internal_candidate_department,
        internal_candidate_name=payload.internal_candidate_name,
        status="draft",
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    _set_selected_approver_user_ids(db, record, payload.selected_approver_user_ids)
    db.add(record)
    db.commit()
    db.refresh(record)
    return get_request(db, record.id) or record


def update_request(
    db: Session,
    record: RecruitmentRequest,
    payload: RecruitmentRequestUpdate,
    current_user: User,
) -> RecruitmentRequest:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)

    for field, value in payload_data.items():
        if field in {"department", "position", "reason"} and isinstance(value, str):
            value = value.strip()
        if field == "campus" and isinstance(value, str):
            value = value.strip() or None
        setattr(record, field, value)

    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_request(db, record.id) or record


def delete_request(
    db: Session,
    record: RecruitmentRequest,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def _set_stage_comment(record: RecruitmentRequest, stage: str, comment: Optional[str]) -> None:
    field_map = {
        "department_head": "dept_manager_opinion",
        "principal": "principal_opinion",
        "hr_director": "hr_director_opinion",
        "chairman": "chairman_approval",
    }
    field_name = field_map.get(stage)
    if field_name:
        setattr(record, field_name, comment or "")


def _clear_stage_comments(record: RecruitmentRequest) -> None:
    record.dept_manager_opinion = ""
    record.principal_opinion = ""
    record.hr_director_opinion = ""
    record.chairman_approval = ""


def _create_request_notification(
    db: Session,
    *,
    record: RecruitmentRequest,
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
        RecruitmentRequestNotification(
            request_id=record.id,
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
        db.query(RecruitmentRequestNotification)
        .filter(
            RecruitmentRequestNotification.recipient_user_id == recipient_user_id,
            RecruitmentRequestNotification.is_read.is_(False),
        )
        .count()
    )


def list_request_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[RecruitmentRequestNotification]:
    query = (
        db.query(RecruitmentRequestNotification)
        .join(RecruitmentRequest, RecruitmentRequest.id == RecruitmentRequestNotification.request_id)
        .options(selectinload(RecruitmentRequestNotification.request))
        .filter(RecruitmentRequestNotification.recipient_user_id == recipient_user_id)
    )
    if unread_only:
        query = query.filter(RecruitmentRequestNotification.is_read.is_(False))
    return query.order_by(RecruitmentRequestNotification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[RecruitmentRequestNotification]:
    record = (
        db.query(RecruitmentRequestNotification)
        .filter(
            RecruitmentRequestNotification.id == notification_id,
            RecruitmentRequestNotification.recipient_user_id == recipient_user_id,
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
        db.query(RecruitmentRequestNotification)
        .filter(
            RecruitmentRequestNotification.recipient_user_id == recipient_user_id,
            RecruitmentRequestNotification.is_read.is_(False),
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


def build_approval_flow(
    db: Session,
    record: RecruitmentRequest,
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> list[dict]:
    steps: list[dict] = []
    flow_stages = get_flow_stages(record, db)
    actions_by_stage: dict[str, list[RecruitmentRequestApprovalAction]] = {
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

        approvers = resolve_stage_approvers(
            db,
            record,
            stage,
            stage_approver_cache=stage_approver_cache,
        )

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
                "stage_label": get_stage_label(record, stage, db),
                "status": status,
                "status_label": RECRUITMENT_FLOW_STATUS_LABELS[status],
                "approvers": [_serialize_approver(item) for item in approvers],
                "action": latest_action.action if latest_action else None,
                "action_label": action_label,
                "acted_by_user_id": latest_action.approver_user_id if latest_action else None,
                "acted_by_name": latest_action.approver_name if latest_action else None,
                "comment": latest_action.comment if latest_action else None,
                "acted_at": latest_action.created_at if latest_action else None,
            }
        )
    return steps


def serialize_notification(record: RecruitmentRequestNotification) -> dict:
    request = record.request
    return {
        "id": record.id,
        "request_id": record.request_id,
        "request_no": request.request_no if request else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": get_stage_label(request, record.stage, None) if request else RECRUITMENT_STAGE_LABELS.get(record.stage or "", record.stage),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def validate_full_approval_chain(db: Session, record: RecruitmentRequest) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record, db):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(get_stage_label(record, stage, db) or stage)
    return missing_stages


def submit_request(
    db: Session,
    record: RecruitmentRequest,
    current_user: User,
) -> RecruitmentRequest:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权提交该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许提交")

    missing_stages = validate_full_approval_chain(db, record)
    if missing_stages:
        raise ValueError(f"审批配置不完整，缺少：{'、'.join(missing_stages)}")

    flow_stages = get_flow_stages(record, db)
    record.status = "pending"
    record.current_stage = flow_stages[0]
    record.rejection_reason = None
    record.completed_at = None
    record.submitted_at = datetime.now()
    _clear_stage_comments(record)
    db.add(
        RecruitmentRequestApprovalAction(
            request_id=record.id,
            stage="submit",
            action="submit",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment="提交审批",
        )
    )
    db.commit()
    db.refresh(record)
    return get_request(db, record.id) or record


def get_stage_approver_ids(
    db: Session,
    record: RecruitmentRequest,
    stage: str,
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> list[int]:
    approvers = resolve_stage_approvers(
        db,
        record,
        stage,
        stage_approver_cache=stage_approver_cache,
    )
    return [item.user_id for item in approvers]


def approve_request(
    db: Session,
    record: RecruitmentRequest,
    current_user: User,
    comment: Optional[str],
) -> RecruitmentRequest:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(RecruitmentRequestApprovalAction)
        .filter(
            RecruitmentRequestApprovalAction.request_id == record.id,
            RecruitmentRequestApprovalAction.stage == current_stage,
            RecruitmentRequestApprovalAction.approver_user_id == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    _set_stage_comment(record, current_stage, comment)
    db.add(
        RecruitmentRequestApprovalAction(
            request_id=record.id,
            stage=current_stage,
            action="approve",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=comment,
        )
    )

    flow_stages = get_flow_stages(record, db)
    stage_index = flow_stages.index(current_stage)
    if stage_index == len(flow_stages) - 1:
        record.status = "approved"
        record.current_stage = None
        record.completed_at = datetime.now()
        employee_archive_crud.sync_archive_from_recruitment_request(db, record)
        _create_request_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"招聘申请已通过：{record.department}/{record.position}",
            content=(
                f"你的招聘申请《{record.request_no}》已完成全部审批并通过。"
                f"当前环节：{get_stage_label(record, current_stage, db)}。"
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
                f"下一阶段“{get_stage_label(record, next_stage, db)}”未配置审批人，无法继续流转"
            )
        record.current_stage = next_stage
        _create_request_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"招聘申请流转更新：{record.department}/{record.position}",
            content=(
                f"你的招聘申请《{record.request_no}》已通过【{get_stage_label(record, current_stage, db)}】审批，"
                f"当前已流转至【{get_stage_label(record, next_stage, db)}】。"
                f"{f' 审批意见：{comment.strip()}' if comment and comment.strip() else ''}"
            ),
            stage=current_stage,
            action_by_user=current_user,
        )

    db.commit()
    db.refresh(record)
    return get_request(db, record.id) or record


def reject_request(
    db: Session,
    record: RecruitmentRequest,
    current_user: User,
    comment: Optional[str],
) -> RecruitmentRequest:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    if not comment or not comment.strip():
        raise ValueError("驳回时必须填写审批意见")

    _set_stage_comment(record, current_stage, comment.strip())
    record.status = "rejected"
    record.current_stage = None
    record.rejection_reason = comment.strip()
    record.completed_at = datetime.now()
    db.add(
        RecruitmentRequestApprovalAction(
            request_id=record.id,
            stage=current_stage,
            action="reject",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=comment.strip(),
        )
    )
    _create_request_notification(
        db,
        record=record,
        recipient_user_id=record.created_by_user_id,
        notification_type="rejected",
        title=f"招聘申请已驳回：{record.department}/{record.position}",
        content=(
            f"你的招聘申请《{record.request_no}》在【{get_stage_label(record, current_stage, db)}】被驳回。"
            f" 驳回原因：{comment.strip()}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )
    db.commit()
    db.refresh(record)
    return get_request(db, record.id) or record


def serialize_config(record: RecruitmentApprovalConfig) -> dict:
    return {
        "id": record.id,
        "campus": record.campus,
        "apply_department": record.apply_department or None,
        "apply_position": record.apply_position or None,
        "stage": record.stage,
        "stage_label": RECRUITMENT_STAGE_LABELS.get(record.stage, record.stage),
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
            for item in sorted(record.approvers, key=lambda row: row.sort_order)
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def serialize_request(
    record: RecruitmentRequest,
    current_user: Optional[User],
    db: Session,
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> dict:
    current_approvers = []
    can_approve = False
    approval_flow = build_approval_flow(
        db,
        record,
        stage_approver_cache=stage_approver_cache,
    )
    if record.status == "pending" and record.current_stage:
        stage_approvers = resolve_stage_approvers(
            db,
            record,
            record.current_stage,
            stage_approver_cache=stage_approver_cache,
        )
        current_approvers = [_serialize_approver(item) for item in stage_approvers]
        if current_user:
            can_approve = any(item.user_id == current_user.user_id for item in stage_approvers)

    can_manage = current_user is not None and _has_manage_privilege(current_user, record)

    return {
        "id": record.id,
        "request_no": record.request_no,
        "campus": record.campus,
        "apply_date": record.apply_date,
        "department": record.department,
        "position": record.position,
        "headcount": record.headcount,
        "reason": record.reason,
        "expected_date": record.expected_date,
        "gender": record.gender,
        "age": record.age,
        "marital_status": record.marital_status,
        "education": record.education,
        "major": record.major,
        "skills_experience": record.skills_experience,
        "suggested_salary": record.suggested_salary,
        "job_responsibilities": record.job_responsibilities,
        "analysis_and_reason": record.analysis_and_reason,
        "internal_candidate_has": record.internal_candidate_has,
        "internal_candidate_department": record.internal_candidate_department,
        "internal_candidate_name": record.internal_candidate_name,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "dept_manager_opinion": record.dept_manager_opinion,
        "principal_opinion": record.principal_opinion,
        "hr_director_opinion": record.hr_director_opinion,
        "chairman_approval": record.chairman_approval,
        "status": record.status,
        "status_label": RECRUITMENT_STATUS_LABELS.get(record.status, record.status),
        "current_stage": record.current_stage,
        "current_stage_label": get_stage_label(record, record.current_stage, db),
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
                "stage_label": get_stage_label(record, action.stage, db),
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
