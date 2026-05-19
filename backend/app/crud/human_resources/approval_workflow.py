"""
规则化审批流程 CRUD 与解析器。
"""

from __future__ import annotations

import json
from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.models.human_resources.approval_workflow import (
    ApprovalFlowTemplate,
    ApprovalFlowTemplateNode,
    OrgResponsibilityBinding,
)
from app.models.user import User, UserStatus

APPROVAL_FLOW_TYPE_LABELS = {
    "recruitment_request": "招聘申请",
    "regularization_application": "转正申请",
    "social_insurance_application": "社保申请",
    "promotion_application": "晋升申请",
    "appointment_interview_record": "任命访谈记录",
}

FLOW_STAGE_LABELS = {
    "recruitment_request": {
        "department_head": "部门负责人",
        "principal": "校长",
        "hr_director": "人资总监",
        "chairman": "董事长",
    },
    "regularization_application": {
        "department_head": "部门负责人",
        "vice_principal": "副校长",
        "hr": "集团人力资源部",
        "principal": "校长",
        "chairman": "董事长",
    },
    "social_insurance_application": {
        "department_head": "部门主管",
        "hr": "人事部",
        "principal": "校长",
        "chairman": "董事长",
    },
    "promotion_application": {
        "department_manager": "部门主管",
        "principal": "校长",
        "biz_director": "业务条线总监",
        "hr_director": "人资总监",
        "chairman": "董事长",
    },
    "appointment_interview_record": {
        "principal": "校长",
        "hr_director": "人资意见",
        "chairman": "董事长意见",
    },
}

APPROVER_SOURCE_TYPES = {"responsibility_code", "user_ids", "position"}
MANAGEMENT_CENTER_ALIASES = {"最高议事厅", "最高议事厅神殿"}
CHAIRMAN_REQUIRED_DEPARTMENT_KEYWORDS = ("市场部", "神藏司", "人资行政部", "线上事业部")
MANAGEMENT_POSITION_KEYWORDS = ("主管", "经理", "总监", "部长", "主任", "负责人")
HR_ADMIN_DEPARTMENT_MARKERS = (
    "人资行政",
    "人事行政",
    "人力资源",
    "人事部",
    "人资部",
    "人资",
)


def _normalize_scope_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.strip()


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


def _normalize_management_campus(value: Optional[str]) -> str:
    normalized = _normalize_scope_value(value)
    if normalized in MANAGEMENT_CENTER_ALIASES:
        return "最高议事厅"
    return normalized


def _is_management_center_campus(value: Optional[str]) -> bool:
    return _normalize_scope_value(value) in MANAGEMENT_CENTER_ALIASES


def _campus_matches_scope(
    scope_campus: Optional[str], target_campus: Optional[str]
) -> bool:
    normalized_scope = _normalize_scope_value(scope_campus)
    normalized_target = _normalize_scope_value(target_campus)
    if not normalized_scope:
        return True
    if not normalized_target:
        return False
    if _is_management_center_campus(normalized_scope):
        return _is_management_center_campus(normalized_target)
    if _is_management_center_campus(normalized_target):
        return _is_management_center_campus(normalized_scope)
    return normalized_scope == normalized_target


def _text_scope_matches(
    scope_value: Optional[str], target_value: Optional[str]
) -> bool:
    normalized_scope = _normalize_compact_text(scope_value)
    if not normalized_scope:
        return True
    return normalized_scope == _normalize_compact_text(target_value)


def _serialize_user(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.real_name,
        "department": user.department,
        "position": user.position,
        "campus": user.campus,
    }


def _validate_flow_type(flow_type: str) -> str:
    normalized = _normalize_scope_value(flow_type)
    if normalized not in FLOW_STAGE_LABELS:
        raise ValueError("不支持的流程类型")
    return normalized


def _validate_stage(flow_type: str, stage: str) -> str:
    normalized = _normalize_scope_value(stage)
    if normalized not in FLOW_STAGE_LABELS[flow_type]:
        raise ValueError(
            f"流程 {APPROVAL_FLOW_TYPE_LABELS[flow_type]} 不支持阶段 {stage}"
        )
    return normalized


def _validate_source_type(source_type: str) -> str:
    normalized = _normalize_scope_value(source_type)
    if normalized not in APPROVER_SOURCE_TYPES:
        raise ValueError("不支持的审批人来源类型")
    return normalized


def _parse_user_ids(raw_value: Optional[str]) -> list[int]:
    if not raw_value:
        return []
    try:
        loaded = json.loads(raw_value)
        if isinstance(loaded, list):
            candidates = loaded
        else:
            candidates = [loaded]
    except (TypeError, ValueError, json.JSONDecodeError):
        candidates = [item.strip() for item in raw_value.split(",")]

    user_ids: list[int] = []
    seen: set[int] = set()
    for item in candidates:
        try:
            user_id = int(item)
        except (TypeError, ValueError):
            continue
        if user_id <= 0 or user_id in seen:
            continue
        seen.add(user_id)
        user_ids.append(user_id)
    return user_ids


def _is_management_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    return any(keyword in normalized for keyword in MANAGEMENT_POSITION_KEYWORDS)


def _is_school_leader_position(position: Optional[str]) -> bool:
    return "校长" in _normalize_compact_text(position)


def _is_principal_position(position: Optional[str]) -> bool:
    normalized = _normalize_compact_text(position)
    if not normalized or "校长" not in normalized:
        return False
    vice_index = normalized.find("副")
    principal_index = normalized.find("校长")
    return vice_index == -1 or vice_index > principal_index


def _is_chairman_position(position: Optional[str]) -> bool:
    return _normalize_scope_value(position) == "董事长"


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in HR_ADMIN_DEPARTMENT_MARKERS)


def _matches_department_family(
    user_department: Optional[str], apply_department: Optional[str]
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


def _get_active_users_by_ids(db: Session, user_ids: list[int]) -> list[User]:
    if not user_ids:
        return []
    users = (
        db.query(User)
        .filter(User.user_id.in_(user_ids), User.status == UserStatus.ACTIVE)
        .all()
    )
    user_map = {user.user_id: user for user in users}
    return [user_map[user_id] for user_id in user_ids if user_id in user_map]


def _build_default_nodes(
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> list[dict]:
    if flow_type == "recruitment_request":
        stages = ["department_head", "principal", "hr_director", "chairman"]
    elif flow_type == "regularization_application":
        if _is_management_center_campus(campus):
            stages = ["department_head", "hr", "chairman"]
        else:
            stages = ["department_head", "hr", "principal"]
            normalized_department = _normalize_compact_text(department)
            if any(
                keyword in normalized_department
                for keyword in CHAIRMAN_REQUIRED_DEPARTMENT_KEYWORDS
            ) or _is_school_leader_position(position):
                stages.append("chairman")
    elif flow_type == "social_insurance_application":
        normalized_department = _normalize_compact_text(department)
        if (
            "市场" in normalized_department
            or _is_school_leader_position(position)
            or _is_management_center_campus(campus)
        ):
            stages = ["chairman"]
        else:
            stages = ["department_head", "hr", "principal"]
    elif flow_type == "promotion_application":
        if _is_management_center_campus(campus):
            stages = ["department_manager", "biz_director", "hr_director", "chairman"]
        else:
            stages = ["department_manager", "principal", "biz_director", "hr_director"]
            if _is_principal_position(position):
                stages.append("chairman")
    elif flow_type == "appointment_interview_record":
        if _is_management_center_campus(campus):
            stages = ["hr_director"]
        else:
            stages = ["principal", "hr_director"]
    else:
        raise ValueError("不支持的流程类型")

    return [
        {
            "stage": stage,
            "stage_label": FLOW_STAGE_LABELS[flow_type][stage],
            "node_order": index + 1,
            "approver_source_type": "responsibility_code",
            "approver_source_value": stage,
            "is_required": True,
            "allow_multi_approver": False,
            "applicant_selectable": True,
        }
        for index, stage in enumerate(stages)
    ]


def _validate_template_nodes(flow_type: str, nodes_payload: list) -> list[dict]:
    if not nodes_payload:
        raise ValueError("审批模板至少需要一个节点")

    seen_stages: set[str] = set()
    normalized_nodes: list[dict] = []
    for item in nodes_payload:
        stage = _validate_stage(flow_type, item.stage)
        if stage in seen_stages:
            raise ValueError(f"审批阶段 {stage} 重复")
        seen_stages.add(stage)
        source_type = _validate_source_type(item.approver_source_type)
        source_value = _normalize_scope_value(item.approver_source_value) or None
        if source_type in {"responsibility_code", "position"} and not source_value:
            raise ValueError(f"审批阶段 {stage} 缺少来源值")
        if source_type == "user_ids" and not _parse_user_ids(source_value):
            raise ValueError(f"审批阶段 {stage} 必须提供有效的用户ID列表")
        normalized_nodes.append(
            {
                "stage": stage,
                "stage_label": _normalize_scope_value(item.stage_label)
                or FLOW_STAGE_LABELS[flow_type][stage],
                "node_order": int(item.node_order),
                "approver_source_type": source_type,
                "approver_source_value": source_value,
                "is_required": bool(item.is_required),
                "allow_multi_approver": bool(item.allow_multi_approver),
                "applicant_selectable": bool(item.applicant_selectable),
            }
        )

    normalized_nodes.sort(key=lambda node: (node["node_order"], node["stage"]))
    return normalized_nodes


def _resolve_template_candidates(
    templates: list[ApprovalFlowTemplate],
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> Optional[ApprovalFlowTemplate]:
    matches: list[tuple[int, int, ApprovalFlowTemplate]] = []
    normalized_department = _normalize_scope_value(department)
    normalized_position = _normalize_scope_value(position)
    for template in templates:
        if not _campus_matches_scope(template.campus, campus):
            continue
        if not _text_scope_matches(template.apply_department, normalized_department):
            continue
        if not _text_scope_matches(template.apply_position, normalized_position):
            continue

        score = (
            (4 if _normalize_scope_value(template.apply_position) else 0)
            + (2 if _normalize_scope_value(template.apply_department) else 0)
            + (1 if _normalize_scope_value(template.campus) else 0)
        )
        matches.append((score, template.priority, template))

    if not matches:
        return None
    matches.sort(key=lambda item: (-item[0], -item[1], item[2].id))
    return matches[0][2]


def resolve_matching_template(
    db: Session,
    *,
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> Optional[ApprovalFlowTemplate]:
    normalized_flow_type = _validate_flow_type(flow_type)
    templates = (
        db.query(ApprovalFlowTemplate)
        .options(selectinload(ApprovalFlowTemplate.nodes))
        .filter(
            ApprovalFlowTemplate.flow_type == normalized_flow_type,
            ApprovalFlowTemplate.is_active.is_(True),
        )
        .all()
    )
    return _resolve_template_candidates(templates, campus, department, position)


def _resolve_binding_users(
    db: Session,
    *,
    responsibility_code: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> list[User]:
    bindings = (
        db.query(OrgResponsibilityBinding)
        .filter(
            OrgResponsibilityBinding.responsibility_code == responsibility_code,
            OrgResponsibilityBinding.is_active.is_(True),
        )
        .all()
    )
    matches: list[tuple[int, OrgResponsibilityBinding]] = []
    for binding in bindings:
        if not _campus_matches_scope(binding.campus_scope, campus):
            continue
        if not _text_scope_matches(binding.department_scope, department):
            continue
        if not _text_scope_matches(binding.position_scope, position):
            continue
        score = (
            (4 if _normalize_scope_value(binding.position_scope) else 0)
            + (2 if _normalize_scope_value(binding.department_scope) else 0)
            + (1 if _normalize_scope_value(binding.campus_scope) else 0)
        )
        matches.append((score, binding))

    if not matches:
        return []

    max_score = max(item[0] for item in matches)
    matched_bindings = [item[1] for item in matches if item[0] == max_score]
    matched_bindings.sort(
        key=lambda item: (-int(item.is_primary), item.sort_order, item.id)
    )
    return _get_active_users_by_ids(db, [item.user_id for item in matched_bindings])


def _resolve_responsibility_fallback_users(
    db: Session,
    *,
    responsibility_code: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> list[User]:
    del position
    query = db.query(User).filter(User.status == UserStatus.ACTIVE)

    if responsibility_code == "chairman":
        return query.filter(User.position == "董事长").all()

    if responsibility_code in {"principal"}:
        users = query.all()
        matched = [
            user
            for user in users
            if _campus_matches_scope(user.campus, campus)
            and _is_principal_position(user.position)
        ]
        matched.sort(key=lambda item: (item.campus or "", item.real_name or ""))
        return matched

    if responsibility_code in {"hr", "hr_director"}:
        users = [
            user
            for user in query.all()
            if _is_management_center_campus(user.campus)
            and _is_hr_admin_department(user.department)
        ]
        if responsibility_code == "hr_director":
            return [
                user
                for user in users
                if "总监" in _normalize_compact_text(user.position)
            ]
        return users

    if responsibility_code in {"department_head", "department_manager"}:
        users = query.all()
        department_users = [
            user
            for user in users
            if _campus_matches_scope(user.campus, campus)
            and _matches_department_family(user.department, department)
            and _is_management_position(user.position)
        ]
        if department_users:
            return department_users
        return [
            user
            for user in users
            if _campus_matches_scope(user.campus, campus)
            and _is_school_leader_position(user.position)
        ]

    if responsibility_code == "biz_director":
        users = query.all()
        return [
            user
            for user in users
            if _is_management_center_campus(user.campus)
            and _matches_department_family(user.department, department)
            and "总监" in _normalize_compact_text(user.position)
        ]

    return []


def _resolve_position_users(
    db: Session,
    *,
    target_position: str,
    campus: Optional[str],
    department: Optional[str],
) -> list[User]:
    users = db.query(User).filter(User.status == UserStatus.ACTIVE).all()
    normalized_target = _normalize_compact_text(target_position)
    return [
        user
        for user in users
        if _normalize_compact_text(user.position) == normalized_target
        and _campus_matches_scope(user.campus, campus)
        and _text_scope_matches(department, user.department)
    ]


def _resolve_node_users(
    db: Session,
    *,
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
    source_type: str,
    source_value: Optional[str],
) -> tuple[list[User], str]:
    del flow_type
    if source_type == "user_ids":
        return (
            _get_active_users_by_ids(db, _parse_user_ids(source_value)),
            "specific_users",
        )

    if source_type == "position":
        return (
            _resolve_position_users(
                db,
                target_position=source_value or "",
                campus=campus,
                department=department,
            ),
            "position",
        )

    users = _resolve_binding_users(
        db,
        responsibility_code=source_value or "",
        campus=campus,
        department=department,
        position=position,
    )
    if users:
        return users, "binding"
    return (
        _resolve_responsibility_fallback_users(
            db,
            responsibility_code=source_value or "",
            campus=campus,
            department=department,
            position=position,
        ),
        "heuristic",
    )


def resolve_flow_stage_order(
    db: Session,
    *,
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> Optional[list[str]]:
    template = resolve_matching_template(
        db,
        flow_type=flow_type,
        campus=campus,
        department=department,
        position=position,
    )
    if not template:
        return None
    ordered_nodes = sorted(template.nodes, key=lambda item: (item.node_order, item.id))
    return [item.stage for item in ordered_nodes]


def get_template_stage_candidate_users(
    db: Session,
    *,
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
    stage: str,
) -> Optional[list[User]]:
    template = resolve_matching_template(
        db,
        flow_type=flow_type,
        campus=campus,
        department=department,
        position=position,
    )
    if not template:
        return None
    node = next((item for item in template.nodes if item.stage == stage), None)
    if not node:
        return []
    users, _ = _resolve_node_users(
        db,
        flow_type=flow_type,
        campus=campus,
        department=department,
        position=position,
        source_type=node.approver_source_type,
        source_value=node.approver_source_value,
    )
    return users


def resolve_template_stage_approvers(
    db: Session,
    *,
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
    stage: str,
) -> Optional[list[User]]:
    return get_template_stage_candidate_users(
        db,
        flow_type=flow_type,
        campus=campus,
        department=department,
        position=position,
        stage=stage,
    )


def build_flow_preview(
    db: Session,
    *,
    flow_type: str,
    campus: Optional[str],
    department: Optional[str],
    position: Optional[str],
) -> dict:
    normalized_flow_type = _validate_flow_type(flow_type)
    template = resolve_matching_template(
        db,
        flow_type=normalized_flow_type,
        campus=campus,
        department=department,
        position=position,
    )
    if template:
        node_items = [
            {
                "stage": item.stage,
                "stage_label": item.stage_label,
                "node_order": item.node_order,
                "approver_source_type": item.approver_source_type,
                "approver_source_value": item.approver_source_value,
                "is_required": item.is_required,
                "allow_multi_approver": item.allow_multi_approver,
                "applicant_selectable": item.applicant_selectable,
            }
            for item in sorted(
                template.nodes, key=lambda item: (item.node_order, item.id)
            )
        ]
        resolved_by = "template"
        template_id = template.id
        template_name = template.name
    else:
        node_items = _build_default_nodes(
            normalized_flow_type, campus, department, position
        )
        resolved_by = "default"
        template_id = None
        template_name = None

    stages: list[dict] = []
    for node in node_items:
        source_type = node.get("approver_source_type")
        if not isinstance(source_type, str):
            continue
        source_value = node.get("approver_source_value")
        if source_value is not None and not isinstance(source_value, str):
            source_value = str(source_value)
        approvers, _ = _resolve_node_users(
            db,
            flow_type=normalized_flow_type,
            campus=campus,
            department=department,
            position=position,
            source_type=source_type,
            source_value=source_value,
        )
        stages.append(
            {
                "stage": node["stage"],
                "stage_label": node["stage_label"],
                "node_order": node["node_order"],
                "approver_source_type": source_type,
                "approver_source_value": source_value,
                "recommended_user_ids": [user.user_id for user in approvers],
                "approvers": [_serialize_user(user) for user in approvers],
                "is_required": node["is_required"],
                "allow_multi_approver": node["allow_multi_approver"],
                "applicant_selectable": node["applicant_selectable"],
            }
        )

    return {
        "flow_type": normalized_flow_type,
        "flow_type_label": APPROVAL_FLOW_TYPE_LABELS[normalized_flow_type],
        "template_id": template_id,
        "template_name": template_name,
        "resolved_by": resolved_by,
        "stages": stages,
    }


def serialize_template(template: ApprovalFlowTemplate) -> dict:
    return {
        "id": template.id,
        "flow_type": template.flow_type,
        "name": template.name,
        "campus": _normalize_scope_value(template.campus) or None,
        "apply_department": _normalize_scope_value(template.apply_department) or None,
        "apply_position": _normalize_scope_value(template.apply_position) or None,
        "description": template.description,
        "priority": template.priority,
        "is_active": bool(template.is_active),
        "nodes": [
            {
                "id": node.id,
                "stage": node.stage,
                "stage_label": node.stage_label,
                "node_order": node.node_order,
                "approver_source_type": node.approver_source_type,
                "approver_source_value": node.approver_source_value,
                "is_required": bool(node.is_required),
                "allow_multi_approver": bool(node.allow_multi_approver),
                "applicant_selectable": bool(node.applicant_selectable),
                "created_at": node.created_at,
                "updated_at": node.updated_at,
            }
            for node in sorted(
                template.nodes, key=lambda item: (item.node_order, item.id)
            )
        ],
        "created_at": template.created_at,
        "updated_at": template.updated_at,
    }


def serialize_binding(binding: OrgResponsibilityBinding) -> dict:
    return {
        "id": binding.id,
        "responsibility_code": binding.responsibility_code,
        "responsibility_name": binding.responsibility_name,
        "campus_scope": _normalize_scope_value(binding.campus_scope) or None,
        "department_scope": _normalize_scope_value(binding.department_scope) or None,
        "position_scope": _normalize_scope_value(binding.position_scope) or None,
        "user_id": binding.user_id,
        "user_name": binding.user_name,
        "user_department": binding.user_department,
        "user_position": binding.user_position,
        "user_campus": binding.user_campus,
        "sort_order": binding.sort_order,
        "is_primary": bool(binding.is_primary),
        "is_active": bool(binding.is_active),
        "notes": binding.notes,
        "created_at": binding.created_at,
        "updated_at": binding.updated_at,
    }


def list_templates(
    db: Session,
    *,
    flow_type: Optional[str] = None,
    campus: Optional[str] = None,
    apply_department: Optional[str] = None,
    apply_position: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> list[ApprovalFlowTemplate]:
    query = db.query(ApprovalFlowTemplate).options(
        selectinload(ApprovalFlowTemplate.nodes)
    )
    if flow_type:
        query = query.filter(
            ApprovalFlowTemplate.flow_type == _validate_flow_type(flow_type)
        )
    if campus is not None:
        query = query.filter(
            ApprovalFlowTemplate.campus == _normalize_management_campus(campus)
        )
    if apply_department is not None:
        query = query.filter(
            ApprovalFlowTemplate.apply_department
            == _normalize_scope_value(apply_department)
        )
    if apply_position is not None:
        query = query.filter(
            ApprovalFlowTemplate.apply_position
            == _normalize_scope_value(apply_position)
        )
    if is_active is not None:
        query = query.filter(ApprovalFlowTemplate.is_active.is_(is_active))
    return query.order_by(
        ApprovalFlowTemplate.flow_type.asc(),
        ApprovalFlowTemplate.priority.desc(),
        ApprovalFlowTemplate.campus.asc(),
        ApprovalFlowTemplate.apply_department.asc(),
        ApprovalFlowTemplate.apply_position.asc(),
        ApprovalFlowTemplate.id.asc(),
    ).all()


def get_template(db: Session, template_id: int) -> Optional[ApprovalFlowTemplate]:
    return (
        db.query(ApprovalFlowTemplate)
        .options(selectinload(ApprovalFlowTemplate.nodes))
        .filter(ApprovalFlowTemplate.id == template_id)
        .first()
    )


def _find_conflicting_template(
    db: Session,
    *,
    flow_type: str,
    campus: str,
    apply_department: str,
    apply_position: str,
    exclude_id: Optional[int] = None,
) -> Optional[ApprovalFlowTemplate]:
    query = db.query(ApprovalFlowTemplate).filter(
        ApprovalFlowTemplate.flow_type == flow_type,
        ApprovalFlowTemplate.campus == campus,
        ApprovalFlowTemplate.apply_department == apply_department,
        ApprovalFlowTemplate.apply_position == apply_position,
    )
    if exclude_id is not None:
        query = query.filter(ApprovalFlowTemplate.id != exclude_id)
    return query.first()


def _apply_template_nodes(
    template: ApprovalFlowTemplate, normalized_nodes: list[dict]
) -> None:
    template.nodes.clear()
    for node in normalized_nodes:
        template.nodes.append(
            ApprovalFlowTemplateNode(
                stage=node["stage"],
                stage_label=node["stage_label"],
                node_order=node["node_order"],
                approver_source_type=node["approver_source_type"],
                approver_source_value=node["approver_source_value"],
                is_required=node["is_required"],
                allow_multi_approver=node["allow_multi_approver"],
                applicant_selectable=node["applicant_selectable"],
            )
        )


def create_template(db: Session, payload) -> ApprovalFlowTemplate:
    flow_type = _validate_flow_type(payload.flow_type)
    campus = _normalize_management_campus(payload.campus)
    apply_department = _normalize_scope_value(payload.apply_department)
    apply_position = _normalize_scope_value(payload.apply_position)
    if _find_conflicting_template(
        db,
        flow_type=flow_type,
        campus=campus,
        apply_department=apply_department,
        apply_position=apply_position,
    ):
        raise ValueError("当前流程与适用范围已存在模板")

    normalized_nodes = _validate_template_nodes(flow_type, payload.nodes)
    template = ApprovalFlowTemplate(
        flow_type=flow_type,
        name=_normalize_scope_value(payload.name),
        campus=campus,
        apply_department=apply_department,
        apply_position=apply_position,
        description=payload.description,
        priority=int(payload.priority),
        is_active=bool(payload.is_active),
    )
    _apply_template_nodes(template, normalized_nodes)
    db.add(template)
    db.commit()
    db.refresh(template)
    return get_template(db, template.id) or template


def update_template(
    db: Session, template: ApprovalFlowTemplate, payload
) -> ApprovalFlowTemplate:
    flow_type = _validate_flow_type(payload.flow_type or template.flow_type)
    campus = _normalize_management_campus(
        payload.campus if payload.campus is not None else template.campus
    )
    apply_department = _normalize_scope_value(
        payload.apply_department
        if payload.apply_department is not None
        else template.apply_department
    )
    apply_position = _normalize_scope_value(
        payload.apply_position
        if payload.apply_position is not None
        else template.apply_position
    )
    if _find_conflicting_template(
        db,
        flow_type=flow_type,
        campus=campus,
        apply_department=apply_department,
        apply_position=apply_position,
        exclude_id=template.id,
    ):
        raise ValueError("当前流程与适用范围已存在模板")

    template.flow_type = flow_type
    if payload.name is not None:
        template.name = _normalize_scope_value(payload.name)
    template.campus = campus
    template.apply_department = apply_department
    template.apply_position = apply_position
    if payload.description is not None:
        template.description = payload.description
    if payload.priority is not None:
        template.priority = int(payload.priority)
    if payload.is_active is not None:
        template.is_active = bool(payload.is_active)
    if payload.nodes is not None:
        _apply_template_nodes(
            template, _validate_template_nodes(flow_type, payload.nodes)
        )

    db.add(template)
    db.commit()
    db.refresh(template)
    return get_template(db, template.id) or template


def delete_template(db: Session, template: ApprovalFlowTemplate) -> None:
    db.delete(template)
    db.commit()


def list_bindings(
    db: Session,
    *,
    responsibility_code: Optional[str] = None,
    campus_scope: Optional[str] = None,
    department_scope: Optional[str] = None,
    position_scope: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> list[OrgResponsibilityBinding]:
    query = db.query(OrgResponsibilityBinding)
    if responsibility_code:
        query = query.filter(
            OrgResponsibilityBinding.responsibility_code
            == _normalize_scope_value(responsibility_code)
        )
    if campus_scope is not None:
        query = query.filter(
            OrgResponsibilityBinding.campus_scope
            == _normalize_management_campus(campus_scope)
        )
    if department_scope is not None:
        query = query.filter(
            OrgResponsibilityBinding.department_scope
            == _normalize_scope_value(department_scope)
        )
    if position_scope is not None:
        query = query.filter(
            OrgResponsibilityBinding.position_scope
            == _normalize_scope_value(position_scope)
        )
    if is_active is not None:
        query = query.filter(OrgResponsibilityBinding.is_active.is_(is_active))
    return query.order_by(
        OrgResponsibilityBinding.responsibility_code.asc(),
        OrgResponsibilityBinding.campus_scope.asc(),
        OrgResponsibilityBinding.department_scope.asc(),
        OrgResponsibilityBinding.position_scope.asc(),
        OrgResponsibilityBinding.sort_order.asc(),
        OrgResponsibilityBinding.id.asc(),
    ).all()


def get_binding(db: Session, binding_id: int) -> Optional[OrgResponsibilityBinding]:
    return (
        db.query(OrgResponsibilityBinding)
        .filter(OrgResponsibilityBinding.id == binding_id)
        .first()
    )


def _find_conflicting_binding(
    db: Session,
    *,
    responsibility_code: str,
    campus_scope: str,
    department_scope: str,
    position_scope: str,
    user_id: int,
    exclude_id: Optional[int] = None,
) -> Optional[OrgResponsibilityBinding]:
    query = db.query(OrgResponsibilityBinding).filter(
        OrgResponsibilityBinding.responsibility_code == responsibility_code,
        OrgResponsibilityBinding.campus_scope == campus_scope,
        OrgResponsibilityBinding.department_scope == department_scope,
        OrgResponsibilityBinding.position_scope == position_scope,
        OrgResponsibilityBinding.user_id == user_id,
    )
    if exclude_id is not None:
        query = query.filter(OrgResponsibilityBinding.id != exclude_id)
    return query.first()


def _get_active_user_or_raise(db: Session, user_id: int) -> User:
    user = (
        db.query(User)
        .filter(User.user_id == user_id, User.status == UserStatus.ACTIVE)
        .first()
    )
    if not user:
        raise ValueError("绑定用户不存在或已停用")
    return user


def create_binding(db: Session, payload) -> OrgResponsibilityBinding:
    responsibility_code = _normalize_scope_value(payload.responsibility_code)
    campus_scope = _normalize_management_campus(payload.campus_scope)
    department_scope = _normalize_scope_value(payload.department_scope)
    position_scope = _normalize_scope_value(payload.position_scope)
    user = _get_active_user_or_raise(db, int(payload.user_id))
    if _find_conflicting_binding(
        db,
        responsibility_code=responsibility_code,
        campus_scope=campus_scope,
        department_scope=department_scope,
        position_scope=position_scope,
        user_id=user.user_id,
    ):
        raise ValueError("当前职责范围已经绑定过该用户")

    binding = OrgResponsibilityBinding(
        responsibility_code=responsibility_code,
        responsibility_name=_normalize_scope_value(payload.responsibility_name),
        campus_scope=campus_scope,
        department_scope=department_scope,
        position_scope=position_scope,
        user_id=user.user_id,
        user_name=user.real_name,
        user_department=user.department,
        user_position=user.position,
        user_campus=user.campus,
        sort_order=int(payload.sort_order),
        is_primary=bool(payload.is_primary),
        is_active=bool(payload.is_active),
        notes=payload.notes,
    )
    db.add(binding)
    db.commit()
    db.refresh(binding)
    return binding


def update_binding(
    db: Session, binding: OrgResponsibilityBinding, payload
) -> OrgResponsibilityBinding:
    responsibility_code = _normalize_scope_value(
        payload.responsibility_code or binding.responsibility_code
    )
    campus_scope = _normalize_management_campus(
        payload.campus_scope
        if payload.campus_scope is not None
        else binding.campus_scope
    )
    department_scope = _normalize_scope_value(
        payload.department_scope
        if payload.department_scope is not None
        else binding.department_scope
    )
    position_scope = _normalize_scope_value(
        payload.position_scope
        if payload.position_scope is not None
        else binding.position_scope
    )
    user_id = int(payload.user_id) if payload.user_id is not None else binding.user_id
    user = _get_active_user_or_raise(db, user_id)

    if _find_conflicting_binding(
        db,
        responsibility_code=responsibility_code,
        campus_scope=campus_scope,
        department_scope=department_scope,
        position_scope=position_scope,
        user_id=user.user_id,
        exclude_id=binding.id,
    ):
        raise ValueError("当前职责范围已经绑定过该用户")

    binding.responsibility_code = responsibility_code
    if payload.responsibility_name is not None:
        binding.responsibility_name = _normalize_scope_value(
            payload.responsibility_name
        )
    binding.campus_scope = campus_scope
    binding.department_scope = department_scope
    binding.position_scope = position_scope
    binding.user_id = user.user_id
    binding.user_name = user.real_name
    binding.user_department = user.department
    binding.user_position = user.position
    binding.user_campus = user.campus
    if payload.sort_order is not None:
        binding.sort_order = int(payload.sort_order)
    if payload.is_primary is not None:
        binding.is_primary = bool(payload.is_primary)
    if payload.is_active is not None:
        binding.is_active = bool(payload.is_active)
    if payload.notes is not None:
        binding.notes = payload.notes

    db.add(binding)
    db.commit()
    db.refresh(binding)
    return binding


def delete_binding(db: Session, binding: OrgResponsibilityBinding) -> None:
    db.delete(binding)
    db.commit()
