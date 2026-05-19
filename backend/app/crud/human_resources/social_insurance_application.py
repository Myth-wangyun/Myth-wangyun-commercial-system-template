"""
集团人资基础 - 员工社保办理申请与审批配置 CRUD
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
from app.models.human_resources.social_insurance_application import (
    SocialInsuranceApplication,
    SocialInsuranceApplicationApprovalAction,
    SocialInsuranceApplicationNotification,
    SocialInsuranceApprovalConfig,
    SocialInsuranceApprovalConfigApprover,
)
from app.models.user import User, UserStatus
from app.schemas.human_resources.social_insurance_application import (
    SOCIAL_INSURANCE_APPROVAL_STAGES,
    SOCIAL_INSURANCE_FLOW_STATUS_LABELS,
    SOCIAL_INSURANCE_STAGE_LABELS,
    SOCIAL_INSURANCE_STATUS_LABELS,
    SocialInsuranceApplicationCreate,
    SocialInsuranceApplicationUpdate,
    SocialInsuranceApprovalConfigUpsert,
)

MANAGEMENT_CENTER_CAMPUS_VALUES = {"最高议事厅", "最高议事厅神殿"}
FLOW_TYPE = "social_insurance_application"
StageApproverCache = dict[tuple[int, str], list[User]]

DEFAULT_DEPARTMENT_HEAD_RULES = [
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿"],
        "department_keywords": ["市场"],
        "positions": ["市场部经理"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿"],
        "department_keywords": ["财务"],
        "positions": ["神藏司总监"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿"],
        "department_keywords": ["人资", "人力资源", "人事"],
        "positions": ["人资部总监"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿"],
        "department_keywords": ["教质"],
        "positions": ["教质总监", "教化司总监"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿"],
        "department_keywords": ["学术"],
        "positions": ["智慧司副经理"],
    },
    {
        "campus_keywords": ["最高议事厅", "最高议事厅神殿"],
        "department_keywords": ["运营"],
        "positions": ["运营总监"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["学术"],
        "positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["教质"],
        "positions": ["教化司经理"],
    },
    {
        "campus_keywords": ["盛邦"],
        "department_keywords": ["咨询"],
        "positions": ["分析规划师主管"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["学术"],
        "positions": ["智慧司副经理"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["教质"],
        "positions": ["教质经理", "教化司经理"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["咨询"],
        "positions": ["分析规划师主管"],
    },
    {
        "campus_keywords": ["冀美"],
        "department_keywords": ["渠道"],
        "positions": ["渠道部经理"],
    },
    {
        "campus_keywords": ["石美"],
        "department_keywords": ["学术"],
        "positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["石美"],
        "department_keywords": ["教质"],
        "positions": ["教化司副经理"],
    },
    {
        "campus_keywords": ["晋美"],
        "department_keywords": ["学术"],
        "positions": ["智慧司副经理"],
    },
    {
        "campus_keywords": ["晋美"],
        "department_keywords": ["教质"],
        "positions": ["教化司经理"],
    },
    {
        "campus_keywords": ["原美"],
        "department_keywords": ["学术"],
        "positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["原美"],
        "department_keywords": ["教质"],
        "positions": ["教化司经理"],
    },
    {
        "campus_keywords": ["太美"],
        "department_keywords": ["教质"],
        "positions": ["教化司副经理"],
    },
    {
        "campus_keywords": ["桂美"],
        "department_keywords": ["学术"],
        "positions": ["智慧司经理"],
    },
    {
        "campus_keywords": ["桂美"],
        "department_keywords": ["咨询"],
        "positions": ["分析规划师主管"],
    },
]


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.strip()


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


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


def _find_department_head_rule(
    campus: Optional[str], department: Optional[str]
) -> Optional[dict[str, list[str]]]:
    normalized_campus = _normalize_compact_text(campus)
    normalized_department = _normalize_compact_text(department)
    if not normalized_campus or not normalized_department:
        return None
    for rule in DEFAULT_DEPARTMENT_HEAD_RULES:
        if not _matches_compact_keyword(normalized_campus, rule["campus_keywords"]):
            continue
        if _matches_compact_keyword(normalized_department, rule["department_keywords"]):
            return rule
    return None


def _matches_rule_position(position: Optional[str], expected_positions: list[str]) -> bool:
    normalized_position = _normalize_compact_text(position)
    if not normalized_position:
        return False
    return any(
        normalized_position == _normalize_compact_text(expected)
        for expected in expected_positions
    )


def _should_include_department_head_stage(record: SocialInsuranceApplication) -> bool:
    rule = _find_department_head_rule(record.campus, record.department)
    if rule is not None:
        return not _matches_rule_position(record.position, rule["positions"])
    return not _is_branch_principal_position(record.position)


def _is_branch_principal_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return bool(normalized and "校长" in normalized and "副校长" not in normalized)


def _is_department_manager_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(
        keyword in normalized
        for keyword in ["主管", "经理", "总监", "部长", "主任", "负责人"]
    )


def _is_school_leader_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in ["校长", "副校长", "执行校长"])


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


def _generate_application_no() -> str:
    return f"SBSQ{datetime.now().strftime('%Y%m%d%H%M%S%f')}"


def _is_management_center_campus(campus: Optional[str]) -> bool:
    return bool(campus and campus.strip() in MANAGEMENT_CENTER_CAMPUS_VALUES)


def _is_hr_admin_department(department: Optional[str]) -> bool:
    return bool(department and "人资行政" in department.replace(" ", ""))


def _should_flow_to_chairman(record: SocialInsuranceApplication) -> bool:
    return _is_management_center_campus(record.campus)


def _is_valid_department_head_approver(
    approver: User,
    campus: str,
    apply_department: str,
    apply_position: str,
) -> bool:
    if not _campus_matches_scope(approver.campus, campus):
        return False

    rule = _find_department_head_rule(campus, apply_department)
    if rule is not None:
        return _matches_rule_position(approver.position, rule["positions"])

    normalized_department = _normalize_compact_text(apply_department)
    normalized_position = _normalize_compact_text(apply_position)
    target_is_management_role = _is_department_manager_position(
        normalized_position
    ) or _is_school_leader_position(normalized_position)

    if target_is_management_role:
        return _is_school_leader_position(approver.position)

    if normalized_department:
        return _normalize_compact_text(
            approver.department
        ) == normalized_department and _is_department_manager_position(
            approver.position
        )

    return _is_department_manager_position(
        approver.position
    ) or _is_school_leader_position(approver.position)


def get_flow_stages(
    record: SocialInsuranceApplication, db: Optional[Session] = None
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
            return template_stages

    stages: list[str] = []
    if _should_include_department_head_stage(record):
        stages.append("department_head")
    stages.append("hr")
    if _should_flow_to_chairman(record):
        stages.append("chairman")
    elif not _is_branch_principal_position(record.position):
        stages.append("principal")
    return stages


def _set_stage_comment(
    record: SocialInsuranceApplication, stage: str, comment: Optional[str]
) -> None:
    field_map = {
        "department_head": "dept_manager_opinion",
        "hr": "hr_opinion",
        "principal": "principal_opinion",
        "chairman": "chairman_opinion",
    }
    field_name = field_map.get(stage)
    if field_name:
        setattr(record, field_name, comment or "")


def _clear_stage_comments(record: SocialInsuranceApplication) -> None:
    record.dept_manager_opinion = ""
    record.hr_opinion = ""
    record.principal_opinion = ""
    record.chairman_opinion = ""


def _serialize_approver(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.real_name,
        "department": user.department,
        "position": user.position,
        "campus": user.campus,
    }


def _get_selected_approver_user_ids(
    record: SocialInsuranceApplication,
) -> dict[str, list[int]]:
    return parse_selected_approver_map(
        record.selected_approver_user_ids,
        SOCIAL_INSURANCE_APPROVAL_STAGES,
    )


def _resolve_selected_stage_approvers(
    db: Session,
    record: SocialInsuranceApplication,
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


def _resolve_department_head_candidates(
    db: Session,
    record: SocialInsuranceApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    campus_scoped_users = [
        user for user in users if _campus_matches_scope(user.campus, record.campus)
    ]
    rule = _find_department_head_rule(record.campus, record.department)
    if rule is not None:
        return [
            user
            for user in campus_scoped_users
            if _matches_rule_position(user.position, rule["positions"])
        ]

    normalized_position = _normalize_compact_text(record.position)
    normalized_department = _normalize_compact_text(record.department)
    position_needs_school_leader = _is_department_manager_position(
        normalized_position
    ) or _is_school_leader_position(normalized_position)

    if position_needs_school_leader:
        return [
            user
            for user in campus_scoped_users
            if _is_school_leader_position(user.position)
        ]

    if normalized_department:
        same_department_managers = [
            user
            for user in campus_scoped_users
            if _normalize_compact_text(user.department) == normalized_department
            and _is_department_manager_position(user.position)
        ]
        if same_department_managers:
            return same_department_managers

    return [
        user
        for user in campus_scoped_users
        if _is_department_manager_position(user.position)
        or _is_school_leader_position(user.position)
    ]


def _resolve_principal_candidates(
    db: Session,
    record: SocialInsuranceApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return [
        user
        for user in users
        if _campus_matches_scope(user.campus, record.campus)
        and _is_branch_principal_position(user.position)
    ]


def _resolve_hr_stage_candidates(
    db: Session,
    record: SocialInsuranceApplication,
) -> list[User]:
    users = (
        _base_active_user_query(db)
        .filter(User.user_id != record.created_by_user_id)
        .all()
    )
    return [
        user
        for user in users
        if _is_management_center_campus(user.campus)
        and _is_hr_admin_department(user.department)
    ]


def _resolve_chairman_candidates(
    db: Session,
    record: SocialInsuranceApplication,
) -> list[User]:
    del record
    users = _base_active_user_query(db).all()
    return [user for user in users if (user.position or "").strip() == "董事长"]


def _resolve_config(
    db: Session,
    campus: Optional[str],
    apply_department: str,
    apply_position: str,
    stage: str,
) -> Optional[SocialInsuranceApprovalConfig]:
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
            db.query(SocialInsuranceApprovalConfig)
            .options(selectinload(SocialInsuranceApprovalConfig.approvers))
            .filter(
                SocialInsuranceApprovalConfig.campus == campus,
                SocialInsuranceApprovalConfig.apply_department == candidate_dept,
                SocialInsuranceApprovalConfig.apply_position == candidate_pos,
                SocialInsuranceApprovalConfig.stage == stage,
                SocialInsuranceApprovalConfig.is_active.is_(True),
            )
            .first()
        )
        if config and config.approvers:
            return config
    return None


def resolve_stage_approvers(
    db: Session,
    record: SocialInsuranceApplication,
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


def get_stage_candidate_users(
    db: Session,
    record: SocialInsuranceApplication,
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
        return _resolve_department_head_candidates(db, record)
    if stage == "hr":
        return _resolve_hr_stage_candidates(db, record)
    if stage == "principal":
        return _resolve_principal_candidates(db, record)
    if stage == "chairman":
        return _resolve_chairman_candidates(db, record)
    return []


def _validate_selected_stage_approvers(
    db: Session,
    record: SocialInsuranceApplication,
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
                f"{SOCIAL_INSURANCE_STAGE_LABELS[stage]}审批人超出当前模板候选范围: {invalid_user_ids}"
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
            f"{SOCIAL_INSURANCE_STAGE_LABELS[stage]}审批人不存在或已停用: {missing_user_ids}"
        )

    if stage == "chairman":
        invalid_chairmen = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if (item.position or "").strip() != "董事长"
        ]
        if invalid_chairmen:
            raise ValueError(
                "董事长阶段只能选择职位为“董事长”的人员作为审批人: "
                + "、".join(invalid_chairmen)
            )

    if stage == "hr":
        invalid_hr_users = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _is_management_center_campus(item.campus)
            or not _is_hr_admin_department(item.department)
        ]
        if invalid_hr_users:
            raise ValueError(
                "人事部阶段只能选择最高议事厅人资行政部人员作为审批人: "
                + "、".join(invalid_hr_users)
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
                "部门主管阶段只能选择当前岗位逻辑范围内的主管级审批人: "
                + "、".join(invalid_department_heads)
            )

    if stage == "principal":
        invalid_principals = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if not _campus_matches_scope(item.campus, record.campus)
        ]
        if invalid_principals:
            raise ValueError(
                "校长阶段只能选择当前神殿范围内的审批人: "
                + "、".join(invalid_principals)
            )


def _set_selected_approver_user_ids(
    db: Session,
    record: SocialInsuranceApplication,
    value: Optional[dict[str, list[int]]],
) -> dict[str, list[int]]:
    allowed_stages = get_flow_stages(record, db)
    normalized = normalize_selected_approver_map(value, allowed_stages)
    for stage, user_ids in normalized.items():
        _validate_selected_stage_approvers(db, record, stage, user_ids)
    record.selected_approver_user_ids = dump_selected_approver_map(
        normalized,
        SOCIAL_INSURANCE_APPROVAL_STAGES,
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
    record = SocialInsuranceApplication(
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
                "stage_label": SOCIAL_INSURANCE_STAGE_LABELS[stage],
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
) -> list[SocialInsuranceApprovalConfig]:
    query = db.query(SocialInsuranceApprovalConfig).options(
        selectinload(SocialInsuranceApprovalConfig.approvers)
    )
    if campus:
        query = query.filter(SocialInsuranceApprovalConfig.campus == campus)
    if apply_department is not None:
        query = query.filter(
            SocialInsuranceApprovalConfig.apply_department
            == _normalize_scope_value(apply_department)
        )
    if apply_position is not None:
        query = query.filter(
            SocialInsuranceApprovalConfig.apply_position
            == _normalize_scope_value(apply_position)
        )
    if stage:
        query = query.filter(SocialInsuranceApprovalConfig.stage == stage)
    return query.order_by(
        SocialInsuranceApprovalConfig.campus.asc(),
        SocialInsuranceApprovalConfig.apply_department.asc(),
        SocialInsuranceApprovalConfig.apply_position.asc(),
        SocialInsuranceApprovalConfig.stage.asc(),
    ).all()


def upsert_approval_config(
    db: Session,
    payload: SocialInsuranceApprovalConfigUpsert,
) -> SocialInsuranceApprovalConfig:
    if payload.stage not in SOCIAL_INSURANCE_APPROVAL_STAGES:
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
    missing_user_ids = [
        user_id for user_id in payload.approver_user_ids if user_id not in approver_map
    ]
    if missing_user_ids:
        raise ValueError(f"审批人不存在或已停用: {missing_user_ids}")

    if payload.stage == "chairman":
        invalid_chairmen = [
            f"{item.real_name}(user_id={item.user_id})"
            for item in approvers
            if (item.position or "").strip() != "董事长"
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
                "部门主管阶段只能配置当前岗位逻辑范围内的主管级审批人: "
                + "、".join(invalid_department_heads)
            )

    apply_department = _normalize_scope_value(payload.apply_department)
    apply_position = _normalize_scope_value(payload.apply_position)

    record = (
        db.query(SocialInsuranceApprovalConfig)
        .options(selectinload(SocialInsuranceApprovalConfig.approvers))
        .filter(
            SocialInsuranceApprovalConfig.campus == payload.campus.strip(),
            SocialInsuranceApprovalConfig.apply_department == apply_department,
            SocialInsuranceApprovalConfig.apply_position == apply_position,
            SocialInsuranceApprovalConfig.stage == payload.stage,
        )
        .first()
    )

    if not record:
        record = SocialInsuranceApprovalConfig(
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
            SocialInsuranceApprovalConfigApprover(
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
        db.query(SocialInsuranceApprovalConfig)
        .filter(SocialInsuranceApprovalConfig.id == config_id)
        .first()
    )
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_application(
    db: Session, application_id: int
) -> Optional[SocialInsuranceApplication]:
    return (
        db.query(SocialInsuranceApplication)
        .options(selectinload(SocialInsuranceApplication.approval_actions))
        .filter(SocialInsuranceApplication.id == application_id)
        .first()
    )


def _has_manage_privilege(user: User, record: SocialInsuranceApplication) -> bool:
    return record.created_by_user_id == user.user_id


def _has_approval_history(
    record: SocialInsuranceApplication, user: Optional[User]
) -> bool:
    if user is None:
        return False
    return any(
        action.approver_user_id == user.user_id for action in record.approval_actions
    )


def _is_current_stage_approver(
    db: Session,
    record: SocialInsuranceApplication,
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


def can_view_application(
    db: Session,
    record: SocialInsuranceApplication,
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


def list_applications(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
) -> list[SocialInsuranceApplication]:
    query = db.query(SocialInsuranceApplication).options(
        selectinload(SocialInsuranceApplication.approval_actions)
    )
    if campus:
        query = query.filter(SocialInsuranceApplication.campus == campus)
    if status:
        query = query.filter(SocialInsuranceApplication.status == status)
    if department:
        query = query.filter(SocialInsuranceApplication.department == department)
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SocialInsuranceApplication.application_no.ilike(keyword),
                SocialInsuranceApplication.name.ilike(keyword),
                SocialInsuranceApplication.department.ilike(keyword),
                SocialInsuranceApplication.position.ilike(keyword),
                SocialInsuranceApplication.phone.ilike(keyword),
                SocialInsuranceApplication.id_number.ilike(keyword),
                SocialInsuranceApplication.created_by_name.ilike(keyword),
                SocialInsuranceApplication.remark.ilike(keyword),
            )
        )
    records = query.order_by(SocialInsuranceApplication.created_at.desc()).all()
    if current_user is None:
        return records
    stage_approver_cache: StageApproverCache = {}
    return [
        record
        for record in records
        if can_view_application(
            db,
            record,
            current_user,
            stage_approver_cache=stage_approver_cache,
        )
    ]


def list_applications_page(
    db: Session,
    *,
    campus: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[SocialInsuranceApplication], int]:
    records = list_applications(
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


def create_application(
    db: Session,
    payload: SocialInsuranceApplicationCreate,
    current_user: User,
) -> SocialInsuranceApplication:
    record = SocialInsuranceApplication(
        application_no=_generate_application_no(),
        fill_date=payload.fill_date,
        campus=payload.campus.strip(),
        account_no=_normalize_optional_str(payload.account_no),
        name=payload.name.strip(),
        department=payload.department.strip(),
        position=payload.position.strip(),
        phone=payload.phone.strip(),
        id_number=payload.id_number.strip(),
        household_type=payload.household_type.strip(),
        id_expiry=payload.id_expiry.strip(),
        hire_date=payload.hire_date,
        registered_address=payload.registered_address.strip(),
        prev_payment_place=_normalize_optional_str(payload.prev_payment_place),
        prev_payment_type=_normalize_optional_str(payload.prev_payment_type),
        prev_payment_base=payload.prev_payment_base,
        insurance_type=payload.insurance_type.strip(),
        remark=_normalize_optional_str(payload.remark),
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
    record: SocialInsuranceApplication,
    payload: SocialInsuranceApplicationUpdate,
    current_user: User,
) -> SocialInsuranceApplication:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权修改该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许编辑")

    payload_data = payload.model_dump(exclude_unset=True)
    selected_approver_user_ids = payload_data.pop("selected_approver_user_ids", None)

    for field, value in payload_data.items():
        if isinstance(value, str):
            value = value.strip()
            if field not in {
                "name",
                "department",
                "position",
                "phone",
                "id_number",
                "household_type",
                "id_expiry",
                "campus",
                "registered_address",
                "insurance_type",
            }:
                value = value or None
        setattr(record, field, value)

    if selected_approver_user_ids is not None:
        _set_selected_approver_user_ids(db, record, selected_approver_user_ids)

    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def delete_application(
    db: Session,
    record: SocialInsuranceApplication,
    current_user: User,
) -> None:
    if not _has_manage_privilege(current_user, record):
        raise PermissionError("无权删除该申请")
    if record.status not in {"draft", "rejected"}:
        raise ValueError("当前状态不允许删除")
    db.delete(record)
    db.commit()


def validate_full_approval_chain(
    db: Session, record: SocialInsuranceApplication
) -> list[str]:
    missing_stages: list[str] = []
    for stage in get_flow_stages(record, db):
        approvers = resolve_stage_approvers(db, record, stage)
        if not approvers:
            missing_stages.append(SOCIAL_INSURANCE_STAGE_LABELS[stage])
    return missing_stages


def get_stage_approver_ids(
    db: Session,
    record: SocialInsuranceApplication,
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


def _create_application_notification(
    db: Session,
    *,
    record: SocialInsuranceApplication,
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
        SocialInsuranceApplicationNotification(
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
        db.query(SocialInsuranceApplicationNotification)
        .filter(
            SocialInsuranceApplicationNotification.recipient_user_id
            == recipient_user_id,
            SocialInsuranceApplicationNotification.is_read.is_(False),
        )
        .count()
    )


def list_application_notifications(
    db: Session,
    recipient_user_id: int,
    *,
    unread_only: bool = False,
) -> list[SocialInsuranceApplicationNotification]:
    query = (
        db.query(SocialInsuranceApplicationNotification)
        .join(
            SocialInsuranceApplication,
            SocialInsuranceApplication.id
            == SocialInsuranceApplicationNotification.application_id,
        )
        .options(selectinload(SocialInsuranceApplicationNotification.application))
        .filter(
            SocialInsuranceApplicationNotification.recipient_user_id
            == recipient_user_id
        )
    )
    if unread_only:
        query = query.filter(SocialInsuranceApplicationNotification.is_read.is_(False))
    return query.order_by(
        SocialInsuranceApplicationNotification.created_at.desc()
    ).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    recipient_user_id: int,
) -> Optional[SocialInsuranceApplicationNotification]:
    record = (
        db.query(SocialInsuranceApplicationNotification)
        .filter(
            SocialInsuranceApplicationNotification.id == notification_id,
            SocialInsuranceApplicationNotification.recipient_user_id
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
        db.query(SocialInsuranceApplicationNotification)
        .filter(
            SocialInsuranceApplicationNotification.recipient_user_id
            == recipient_user_id,
            SocialInsuranceApplicationNotification.is_read.is_(False),
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
    record: SocialInsuranceApplication,
    current_user: User,
) -> SocialInsuranceApplication:
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
        SocialInsuranceApplicationApprovalAction(
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
    record: SocialInsuranceApplication,
    current_user: User,
    *,
    comment: Optional[str],
    hr_payment_content: Optional[str] = None,
    hr_payment_base: Optional[float] = None,
    hr_start_date=None,
    hr_insurance_place: Optional[str] = None,
) -> SocialInsuranceApplication:
    if record.status != "pending" or not record.current_stage:
        raise ValueError("当前申请不在审批中")

    current_stage = record.current_stage
    allowed_user_ids = get_stage_approver_ids(db, record, current_stage)
    if current_user.user_id not in allowed_user_ids:
        raise PermissionError("当前用户不是本阶段审批人")

    already_acted = (
        db.query(SocialInsuranceApplicationApprovalAction)
        .filter(
            SocialInsuranceApplicationApprovalAction.application_id == record.id,
            SocialInsuranceApplicationApprovalAction.stage == current_stage,
            SocialInsuranceApplicationApprovalAction.approver_user_id
            == current_user.user_id,
        )
        .count()
    )
    if already_acted:
        raise ValueError("当前用户已处理过本阶段审批")

    if current_stage == "hr":
        if not hr_payment_content or not hr_payment_content.strip():
            raise ValueError("人事部审批通过时必须填写缴费内容")
        if hr_payment_base is None:
            raise ValueError("人事部审批通过时必须填写缴费基数")
        if hr_start_date is None:
            raise ValueError("人事部审批通过时必须填写缴费起始日期")
        if not hr_insurance_place or not hr_insurance_place.strip():
            raise ValueError("人事部审批通过时必须填写社保办理地")
        record.hr_payment_content = hr_payment_content.strip()
        record.hr_payment_base = hr_payment_base
        record.hr_start_date = hr_start_date
        record.hr_insurance_place = hr_insurance_place.strip()

    _set_stage_comment(record, current_stage, comment)
    db.add(
        SocialInsuranceApplicationApprovalAction(
            application_id=record.id,
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
        employee_archive_crud.sync_archive_from_social_insurance_approval(db, record)
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="approved",
            title=f"社保申请已通过：{record.name}/{record.department}",
            content=(
                f"你的社保办理申请《{record.application_no}》已完成全部审批并通过。"
                f"当前环节：{SOCIAL_INSURANCE_STAGE_LABELS[current_stage]}。"
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
                f"下一阶段“{SOCIAL_INSURANCE_STAGE_LABELS[next_stage]}”未配置审批人，无法继续流转"
            )
        record.current_stage = next_stage
        _create_application_notification(
            db,
            record=record,
            recipient_user_id=record.created_by_user_id,
            notification_type="stage_approved",
            title=f"社保申请流转更新：{record.name}/{record.department}",
            content=(
                f"你的社保办理申请《{record.application_no}》已通过【{SOCIAL_INSURANCE_STAGE_LABELS[current_stage]}】审批，"
                f"当前已流转至【{SOCIAL_INSURANCE_STAGE_LABELS[next_stage]}】。"
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
    record: SocialInsuranceApplication,
    current_user: User,
    comment: Optional[str],
) -> SocialInsuranceApplication:
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
        SocialInsuranceApplicationApprovalAction(
            application_id=record.id,
            stage=current_stage,
            action="reject",
            approver_user_id=current_user.user_id,
            approver_name=current_user.real_name,
            comment=comment.strip(),
        )
    )
    _create_application_notification(
        db,
        record=record,
        recipient_user_id=record.created_by_user_id,
        notification_type="rejected",
        title=f"社保申请已驳回：{record.name}/{record.department}",
        content=(
            f"你的社保办理申请《{record.application_no}》在【{SOCIAL_INSURANCE_STAGE_LABELS[current_stage]}】被驳回。"
            f" 驳回原因：{comment.strip()}"
        ),
        stage=current_stage,
        action_by_user=current_user,
    )
    db.commit()
    db.refresh(record)
    return get_application(db, record.id) or record


def build_approval_flow(
    db: Session,
    record: SocialInsuranceApplication,
    stage_approver_cache: Optional[StageApproverCache] = None,
) -> list[dict]:
    flow_stages = get_flow_stages(record, db)
    actions_by_stage: dict[str, list[SocialInsuranceApplicationApprovalAction]] = {
        stage: [] for stage in flow_stages
    }
    for action in record.approval_actions:
        if action.stage in actions_by_stage:
            actions_by_stage[action.stage].append(action)

    steps: list[dict] = []
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
                "stage_label": SOCIAL_INSURANCE_STAGE_LABELS[stage],
                "status": status,
                "status_label": SOCIAL_INSURANCE_FLOW_STATUS_LABELS[status],
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


def serialize_config(record: SocialInsuranceApprovalConfig) -> dict:
    return {
        "id": record.id,
        "campus": record.campus,
        "apply_department": record.apply_department or None,
        "apply_position": record.apply_position or None,
        "stage": record.stage,
        "stage_label": SOCIAL_INSURANCE_STAGE_LABELS.get(record.stage, record.stage),
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


def serialize_notification(record: SocialInsuranceApplicationNotification) -> dict:
    application = record.application
    return {
        "id": record.id,
        "application_id": record.application_id,
        "application_no": application.application_no if application else "",
        "notification_type": record.notification_type,
        "title": record.title,
        "content": record.content,
        "stage": record.stage,
        "stage_label": SOCIAL_INSURANCE_STAGE_LABELS.get(
            record.stage or "", record.stage
        ),
        "is_read": record.is_read,
        "action_by_user_id": record.action_by_user_id,
        "action_by_name": record.action_by_name,
        "created_at": record.created_at,
        "read_at": record.read_at,
    }


def serialize_application(
    record: SocialInsuranceApplication,
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
        "account_no": record.account_no,
        "name": record.name,
        "department": record.department,
        "position": record.position,
        "phone": record.phone,
        "id_number": record.id_number,
        "household_type": record.household_type,
        "id_expiry": record.id_expiry,
        "hire_date": record.hire_date,
        "registered_address": record.registered_address,
        "prev_payment_place": record.prev_payment_place,
        "prev_payment_type": record.prev_payment_type,
        "prev_payment_base": record.prev_payment_base,
        "insurance_type": record.insurance_type,
        "dept_manager_opinion": record.dept_manager_opinion,
        "hr_payment_content": record.hr_payment_content,
        "hr_payment_base": record.hr_payment_base,
        "hr_start_date": record.hr_start_date,
        "hr_insurance_place": record.hr_insurance_place,
        "hr_opinion": record.hr_opinion,
        "principal_opinion": record.principal_opinion,
        "chairman_opinion": record.chairman_opinion,
        "remark": record.remark,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "status": record.status,
        "status_label": SOCIAL_INSURANCE_STATUS_LABELS.get(
            record.status, record.status
        ),
        "current_stage": record.current_stage,
        "current_stage_label": SOCIAL_INSURANCE_STAGE_LABELS.get(
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
                "stage_label": SOCIAL_INSURANCE_STAGE_LABELS.get(
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
