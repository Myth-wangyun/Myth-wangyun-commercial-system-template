import asyncio
import json
from typing import Any, Dict

from app.core.auth import get_current_active_user
from app.core.database import SessionLocal, get_db
from app.crud.consult import transfer_approval_config as transfer_approval_config_crud
from app.crud.human_resources import appointment_interview_record as appointment_interview_crud
from app.crud.human_resources import promotion_application as promotion_crud
from app.crud.human_resources import recruitment_request as recruitment_request_crud
from app.crud.human_resources import regularization_application as regularization_crud
from app.crud.human_resources import resignation_approval as resignation_approval_crud
from app.crud.human_resources import social_insurance_application as social_insurance_crud
from app.crud.human_resources import training_application as training_application_crud
from app.crud.human_resources import transfer_application as transfer_application_crud
from app.crud.human_resources import unpaid_leave_application as unpaid_leave_crud
from app.crud.human_resources import work_handover as work_handover_crud
from app.models.consult.consultation_record import 咨询量明细表
from app.models.consult.export_approval import 导出审批人, 导出申请
from app.models.user import User
from app.services.approvals import approval_stream_broker
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

router = APIRouter()


def _sort_items_desc(items: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: str(item.get(key) or ''), reverse=True)


def _build_pending_item(
    *,
    item_id: str,
    item_type: str,
    title: str,
    applicant: str,
    submitted_at: str,
    action_path: str,
    raw_id: int,
    campus: str | None = None,
    department: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    return {
        'id': item_id,
        'type': item_type,
        'title': title,
        'applicant': applicant,
        'campus': campus,
        'department': department,
        'submitted_at': submitted_at,
        'description': description,
        'action_path': action_path,
        'raw_id': raw_id,
    }


def _build_history_item(
    *,
    item_id: str,
    item_type: str,
    raw_id: int,
    request_no: str,
    title: str,
    applicant: str,
    status: str,
    status_label: str,
    updated_at: str,
    campus: str | None = None,
    department: str | None = None,
    current_stage_label: str | None = None,
) -> dict[str, Any]:
    return {
        'id': item_id,
        'type': item_type,
        'raw_id': raw_id,
        'request_no': request_no,
        'title': title,
        'applicant': applicant,
        'campus': campus,
        'department': department,
        'status': status,
        'status_label': status_label,
        'current_stage_label': current_stage_label,
        'updated_at': updated_at,
    }


def build_pending_approval_items(db: Session, current_user: User) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    appointment_interview_records = appointment_interview_crud.list_records(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in appointment_interview_records:
        serialized = appointment_interview_crud.serialize_record(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"appointment-interview-{serialized['id']}",
                item_type='appointment_interview',
                title=f"任命访谈记录审批 - {serialized.get('interviewee') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('interviewer') or '未知申请人',
                campus=serialized.get('campus'),
                department='人资部',
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('current_stage_label') or '待审批'} / 访谈人：{serialized.get('interviewer') or ''}",
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    recruitment_records = recruitment_request_crud.list_requests(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in recruitment_records:
        serialized = recruitment_request_crud.serialize_request(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"recruitment-{serialized['id']}",
                item_type='recruitment',
                title=f"招聘需求审批 - {serialized.get('department') or ''}/{serialized.get('position') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=serialized.get('reason'),
                action_path='/humanresources/base/recruitment-onboarding',
                raw_id=serialized['id'],
            )
        )

    training_records = training_application_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in training_records:
        serialized = training_application_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"training-application-{serialized['id']}",
                item_type='training_application',
                title=f"培训申请审批 - {serialized.get('department') or ''}/{serialized.get('category') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('objective') or ''} / {serialized.get('trainees') or ''}",
                action_path='/humanresources/base/training-management',
                raw_id=serialized['id'],
            )
        )

    regularization_records = regularization_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in regularization_records:
        serialized = regularization_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"regularization-{serialized['id']}",
                item_type='regularization',
                title=f"转正申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=serialized.get('position'),
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    promotion_records = promotion_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in promotion_records:
        serialized = promotion_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"promotion-{serialized['id']}",
                item_type='promotion',
                title=f"晋升申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('position') or ''} -> {serialized.get('promoted_level') or '未填晋升职级'}",
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    social_insurance_records = social_insurance_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in social_insurance_records:
        serialized = social_insurance_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"social-insurance-{serialized['id']}",
                item_type='social_insurance',
                title=f"社保申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('position') or ''} / {serialized.get('insurance_type') or ''}",
                action_path='/humanresources/base/social-insurance',
                raw_id=serialized['id'],
            )
        )

    transfer_application_records = transfer_application_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in transfer_application_records:
        serialized = transfer_application_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"transfer-application-{serialized['id']}",
                item_type='transfer_application',
                title=f"调岗申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('applicant_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('position') or ''} -> {serialized.get('target_department') or ''}/{serialized.get('target_position') or ''}",
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    unpaid_leave_records = unpaid_leave_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in unpaid_leave_records:
        serialized = unpaid_leave_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"unpaid-leave-{serialized['id']}",
                item_type='unpaid_leave',
                title=f"停薪留职申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=serialized.get('position'),
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    work_handover_records = work_handover_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in work_handover_records:
        serialized = work_handover_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"work-handover-{serialized['id']}",
                item_type='work_handover',
                title=f"工作交接表审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('position') or ''} / 离职日期：{serialized.get('leave_date') or ''}",
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    resignation_records = resignation_approval_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    for record in resignation_records:
        serialized = resignation_approval_crud.serialize_application(record, current_user, db)
        if not serialized.get('can_approve'):
            continue
        items.append(
            _build_pending_item(
                item_id=f"resignation-approval-{serialized['id']}",
                item_type='resignation_approval',
                title=f"离职审批单审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                submitted_at=serialized.get('submitted_at') or serialized.get('created_at') or '',
                description=f"{serialized.get('position') or ''} / 离职日期：{serialized.get('leave_date') or ''}",
                action_path='/humanresources/base/hr-planning',
                raw_id=serialized['id'],
            )
        )

    approver_campuses = transfer_approval_config_crud.get_user_approver_campuses(
        db,
        _get_user_id(current_user),
    )
    if approver_campuses:
        transfer_records = (
            db.query(咨询量明细表)
            .filter(
                咨询量明细表.转量审批状态 == '待审批',
                咨询量明细表.目标神殿.in_(approver_campuses),
            )
            .all()
        )
        for record in transfer_records:
            items.append(
                _build_pending_item(
                    item_id=f"transfer-{record.记录ID}",
                    item_type='transfer',
                    title=f"跨神殿转量审批 - {record.咨询者姓名 or record.电话 or ''}",
                    applicant=record.转量操作人 or '未知申请人',
                    campus=record.目标神殿,
                    department='祈福司',
                    submitted_at=record.转量时间.isoformat() if record.转量时间 else '',
                    description=record.转量原因,
                    action_path='/consult/type-count-system',
                    raw_id=record.记录ID,
                )
            )

    user_id = _get_user_id(current_user)
    is_export_approver = (
        db.query(导出审批人)
        .filter(导出审批人.user_id == user_id, 导出审批人.is_active.is_(True))
        .count()
        > 0
    )
    if is_export_approver:
        export_records = (
            db.query(导出申请)
            .filter(导出申请.status == 'pending')
            .order_by(导出申请.created_at.desc())
            .all()
        )
        for record in export_records:
            items.append(
                _build_pending_item(
                    item_id=f"export-{record.id}",
                    item_type='export',
                    title=f"咨询量导出审批 - {record.applicant_name}",
                    applicant=record.applicant_name,
                    campus=record.applicant_campus,
                    department='祈福司',
                    submitted_at=record.created_at.isoformat() if record.created_at else '',
                    description=record.reason,
                    action_path='/consult/export-approval',
                    raw_id=record.id,
                )
            )

    return _sort_items_desc(items, 'submitted_at')


def build_pending_approval_payload(db: Session, current_user: User) -> dict[str, Any]:
    items = build_pending_approval_items(db, current_user)
    counts = {
        'appointment_interview_count': 0,
        'recruitment_count': 0,
        'training_application_count': 0,
        'regularization_count': 0,
        'promotion_count': 0,
        'social_insurance_count': 0,
        'transfer_application_count': 0,
        'unpaid_leave_count': 0,
        'work_handover_count': 0,
        'resignation_approval_count': 0,
        'transfer_count': 0,
        'export_count': 0,
    }
    for item in items:
        if item['type'] == 'appointment_interview':
            counts['appointment_interview_count'] += 1
        elif item['type'] == 'recruitment':
            counts['recruitment_count'] += 1
        elif item['type'] == 'training_application':
            counts['training_application_count'] += 1
        elif item['type'] == 'regularization':
            counts['regularization_count'] += 1
        elif item['type'] == 'promotion':
            counts['promotion_count'] += 1
        elif item['type'] == 'social_insurance':
            counts['social_insurance_count'] += 1
        elif item['type'] == 'transfer_application':
            counts['transfer_application_count'] += 1
        elif item['type'] == 'unpaid_leave':
            counts['unpaid_leave_count'] += 1
        elif item['type'] == 'work_handover':
            counts['work_handover_count'] += 1
        elif item['type'] == 'resignation_approval':
            counts['resignation_approval_count'] += 1
        elif item['type'] == 'transfer':
            counts['transfer_count'] += 1
        elif item['type'] == 'export':
            counts['export_count'] += 1

    return {
        'total': len(items),
        **counts,
        'items': items,
    }


def build_approval_history_items(db: Session, current_user: User) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    appointment_records = appointment_interview_crud.list_records(db, current_user=current_user)
    for record in appointment_records:
        serialized = appointment_interview_crud.serialize_record(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"appointment-interview-{serialized['id']}",
                item_type='appointment_interview',
                raw_id=serialized['id'],
                request_no=f"RMFT{str(serialized['id']).zfill(6)}",
                title=f"任命访谈记录审批 - {serialized.get('interviewee') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('interviewer') or '未知申请人',
                campus=serialized.get('campus'),
                department='人资部',
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    recruitment_records = recruitment_request_crud.list_requests(db, current_user=current_user)
    for record in recruitment_records:
        serialized = recruitment_request_crud.serialize_request(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"recruitment-{serialized['id']}",
                item_type='recruitment',
                raw_id=serialized['id'],
                request_no=serialized.get('request_no') or '',
                title=f"招聘需求审批 - {serialized.get('department') or ''}/{serialized.get('position') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    training_records = training_application_crud.list_applications(db, current_user=current_user)
    for record in training_records:
        serialized = training_application_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"training-application-{serialized['id']}",
                item_type='training_application',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"培训申请审批 - {serialized.get('department') or ''}/{serialized.get('category') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    regularization_records = regularization_crud.list_applications(db, current_user=current_user)
    for record in regularization_records:
        serialized = regularization_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"regularization-{serialized['id']}",
                item_type='regularization',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"转正申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    promotion_records = promotion_crud.list_applications(db, current_user=current_user)
    for record in promotion_records:
        serialized = promotion_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"promotion-{serialized['id']}",
                item_type='promotion',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"晋升申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    social_insurance_records = social_insurance_crud.list_applications(db, current_user=current_user)
    for record in social_insurance_records:
        serialized = social_insurance_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"social-insurance-{serialized['id']}",
                item_type='social_insurance',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"社保申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    transfer_application_records = transfer_application_crud.list_applications(db, current_user=current_user)
    for record in transfer_application_records:
        serialized = transfer_application_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"transfer-application-{serialized['id']}",
                item_type='transfer_application',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"调岗申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('applicant_name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    unpaid_leave_records = unpaid_leave_crud.list_applications(db, current_user=current_user)
    for record in unpaid_leave_records:
        serialized = unpaid_leave_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"unpaid-leave-{serialized['id']}",
                item_type='unpaid_leave',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"停薪留职申请审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    work_handover_records = work_handover_crud.list_applications(db, current_user=current_user)
    for record in work_handover_records:
        serialized = work_handover_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"work-handover-{serialized['id']}",
                item_type='work_handover',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"工作交接表审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    resignation_records = resignation_approval_crud.list_applications(db, current_user=current_user)
    for record in resignation_records:
        serialized = resignation_approval_crud.serialize_application(record, current_user, db)
        if serialized.get('status') == 'draft':
            continue
        items.append(
            _build_history_item(
                item_id=f"resignation-approval-{serialized['id']}",
                item_type='resignation_approval',
                raw_id=serialized['id'],
                request_no=serialized.get('application_no') or '',
                title=f"离职审批单审批 - {serialized.get('department') or ''}/{serialized.get('name') or ''}",
                applicant=serialized.get('created_by_name') or serialized.get('name') or '未知申请人',
                campus=serialized.get('campus'),
                department=serialized.get('department'),
                status=serialized.get('status') or '',
                status_label=serialized.get('status_label') or '',
                current_stage_label=serialized.get('current_stage_label'),
                updated_at=serialized.get('updated_at') or '',
            )
        )

    return _sort_items_desc(items, 'updated_at')


def _get_user_id(current_user: User) -> int:
    user_id = getattr(current_user, 'user_id', None)
    if isinstance(user_id, int):
        return user_id
    raise RuntimeError('当前登录用户缺少 user_id')


def _get_export_pending_count(db: Session, current_user: User) -> int:
    user_id = _get_user_id(current_user)
    is_export_approver = (
        db.query(导出审批人)
        .filter(导出审批人.user_id == user_id, 导出审批人.is_active.is_(True))
        .count()
        > 0
    )
    if not is_export_approver:
        return 0
    return db.query(导出申请).filter(导出申请.status == 'pending').count()


def _get_transfer_pending_count(db: Session, current_user: User) -> int:
    user_id = _get_user_id(current_user)
    query = db.query(咨询量明细表).filter(咨询量明细表.转量审批状态 == '待审批')
    approver_campuses = transfer_approval_config_crud.get_user_approver_campuses(db, user_id)
    if not approver_campuses:
        return 0
    return query.filter(咨询量明细表.目标神殿.in_(approver_campuses)).count()


def _get_recruitment_pending_count(db: Session, current_user: User) -> int:
    user_id = _get_user_id(current_user)
    records = recruitment_request_crud.list_requests(db, status='pending')
    pending_count = 0
    for record in records:
        current_stage = getattr(record, 'current_stage', None)
        if not current_stage:
            continue
        approver_ids = recruitment_request_crud.get_stage_approver_ids(db, record, current_stage)
        if user_id in approver_ids:
            pending_count += 1
    return pending_count


def _get_regularization_pending_count(db: Session, current_user: User) -> int:
    records = regularization_crud.list_applications(db, status='pending', current_user=current_user)
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and regularization_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_promotion_pending_count(db: Session, current_user: User) -> int:
    records = promotion_crud.list_applications(db, status='pending', current_user=current_user)
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and promotion_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_social_insurance_pending_count(db: Session, current_user: User) -> int:
    records = social_insurance_crud.list_applications(db, status='pending', current_user=current_user)
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and social_insurance_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_transfer_application_pending_count(db: Session, current_user: User) -> int:
    records = transfer_application_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and transfer_application_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_unpaid_leave_pending_count(db: Session, current_user: User) -> int:
    records = unpaid_leave_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and unpaid_leave_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_appointment_interview_pending_count(db: Session, current_user: User) -> int:
    records = appointment_interview_crud.list_records(
        db,
        status='pending',
        current_user=current_user,
    )
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and appointment_interview_crud.serialize_record(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_work_handover_pending_count(db: Session, current_user: User) -> int:
    records = work_handover_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and work_handover_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_training_application_pending_count(db: Session, current_user: User) -> int:
    records = training_application_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and training_application_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def _get_resignation_approval_pending_count(db: Session, current_user: User) -> int:
    records = resignation_approval_crud.list_applications(
        db,
        status='pending',
        current_user=current_user,
    )
    pending_count = 0
    for record in records:
        if getattr(record, 'status', None) != 'pending':
            continue
        if getattr(record, 'current_stage', None) and resignation_approval_crud.serialize_application(
            record,
            current_user,
            db,
        )['can_approve']:
            pending_count += 1
    return pending_count


def build_approval_summary(db: Session, current_user: User) -> Dict[str, int]:
    user_id = _get_user_id(current_user)
    recruitment_count = _get_recruitment_pending_count(db, current_user)
    regularization_count = _get_regularization_pending_count(db, current_user)
    promotion_count = _get_promotion_pending_count(db, current_user)
    social_insurance_count = _get_social_insurance_pending_count(db, current_user)
    transfer_application_count = _get_transfer_application_pending_count(db, current_user)
    unpaid_leave_count = _get_unpaid_leave_pending_count(db, current_user)
    appointment_interview_count = _get_appointment_interview_pending_count(db, current_user)
    work_handover_count = _get_work_handover_pending_count(db, current_user)
    training_application_count = _get_training_application_pending_count(db, current_user)
    resignation_approval_count = _get_resignation_approval_pending_count(db, current_user)
    transfer_count = _get_transfer_pending_count(db, current_user)
    export_count = _get_export_pending_count(db, current_user)
    notification_count = (
        recruitment_request_crud.get_unread_notification_count(db, user_id)
        + regularization_crud.get_unread_notification_count(db, user_id)
        + promotion_crud.get_unread_notification_count(db, user_id)
        + social_insurance_crud.get_unread_notification_count(db, user_id)
        + transfer_application_crud.get_unread_notification_count(db, user_id)
        + unpaid_leave_crud.get_unread_notification_count(db, user_id)
        + appointment_interview_crud.get_unread_notification_count(db, user_id)
        + work_handover_crud.get_unread_notification_count(db, user_id)
        + training_application_crud.get_unread_notification_count(db, user_id)
        + resignation_approval_crud.get_unread_notification_count(db, user_id)
    )
    return {
        'total': recruitment_count
        + regularization_count
        + promotion_count
        + social_insurance_count
        + transfer_application_count
        + unpaid_leave_count
        + appointment_interview_count
        + work_handover_count
        + training_application_count
        + resignation_approval_count
        + transfer_count
        + export_count,
        'attention_total': recruitment_count
        + regularization_count
        + promotion_count
        + social_insurance_count
        + transfer_application_count
        + unpaid_leave_count
        + appointment_interview_count
        + work_handover_count
        + training_application_count
        + resignation_approval_count
        + transfer_count
        + export_count
        + notification_count,
        'recruitment_count': recruitment_count,
        'regularization_count': regularization_count,
        'promotion_count': promotion_count,
        'social_insurance_count': social_insurance_count,
        'transfer_application_count': transfer_application_count,
        'unpaid_leave_count': unpaid_leave_count,
        'appointment_interview_count': appointment_interview_count,
        'work_handover_count': work_handover_count,
        'training_application_count': training_application_count,
        'resignation_approval_count': resignation_approval_count,
        'transfer_count': transfer_count,
        'export_count': export_count,
        'notification_count': notification_count,
    }


@router.get('/summary', summary='获取当前用户待审批汇总')
def get_approval_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return build_approval_summary(db, current_user)


@router.get('/pending-items', summary='获取当前用户待审批明细')
def get_approval_pending_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return build_pending_approval_payload(db, current_user)


@router.get('/history', summary='获取当前用户审批历史')
def get_approval_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    data = build_approval_history_items(db, current_user)
    return {
        'data': data,
        'total': len(data),
    }


@router.get('/notifications', summary='获取当前用户审批通知列表')
def get_approval_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user_id = _get_user_id(current_user)
    recruitment_records = recruitment_request_crud.list_request_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    regularization_records = regularization_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    promotion_records = promotion_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    social_insurance_records = social_insurance_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    transfer_application_records = transfer_application_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    unpaid_leave_records = unpaid_leave_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    appointment_interview_records = appointment_interview_crud.list_record_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    work_handover_records = work_handover_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    training_application_records = training_application_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    resignation_approval_records = resignation_approval_crud.list_application_notifications(
        db,
        user_id,
        unread_only=unread_only,
    )
    data = [
        {
            'biz_type': 'recruitment',
            **recruitment_request_crud.serialize_notification(item),
        }
        for item in recruitment_records
    ] + [
        {
            'biz_type': 'regularization',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [regularization_crud.serialize_notification(item) for item in regularization_records]
    ] + [
        {
            'biz_type': 'promotion',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [promotion_crud.serialize_notification(item) for item in promotion_records]
    ] + [
        {
            'biz_type': 'social_insurance',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [social_insurance_crud.serialize_notification(item) for item in social_insurance_records]
    ] + [
        {
            'biz_type': 'transfer_application',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [
            transfer_application_crud.serialize_notification(item)
            for item in transfer_application_records
        ]
    ] + [
        {
            'biz_type': 'unpaid_leave',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [
            unpaid_leave_crud.serialize_notification(item)
            for item in unpaid_leave_records
        ]
    ] + [
        {
            'biz_type': 'work_handover',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [work_handover_crud.serialize_notification(item) for item in work_handover_records]
    ] + [
        {
            'biz_type': 'training_application',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [
            training_application_crud.serialize_notification(item)
            for item in training_application_records
        ]
    ] + [
        {
            'biz_type': 'resignation_approval',
            'request_id': item['application_id'],
            'request_no': item['application_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'application_id', 'application_no'}
            },
        }
        for item in [
            resignation_approval_crud.serialize_notification(item)
            for item in resignation_approval_records
        ]
    ] + [
        {
            'biz_type': 'appointment_interview',
            'request_id': item['record_id'],
            'request_no': item['record_no'],
            **{
                key: value
                for key, value in item.items()
                if key not in {'record_id', 'record_no'}
            },
        }
        for item in [
            appointment_interview_crud.serialize_notification(item)
            for item in appointment_interview_records
        ]
    ]
    data.sort(key=lambda item: item['created_at'], reverse=True)
    return {
        'data': data,
        'total': len(data),
    }


@router.post('/notifications/read-all', summary='全部标记审批通知为已读')
def read_all_approval_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user_id = _get_user_id(current_user)
    updated_count = recruitment_request_crud.mark_all_notifications_read(
        db, user_id
    ) + regularization_crud.mark_all_notifications_read(
        db, user_id
    ) + promotion_crud.mark_all_notifications_read(
        db, user_id
    ) + social_insurance_crud.mark_all_notifications_read(
        db, user_id
    ) + transfer_application_crud.mark_all_notifications_read(
        db, user_id
    ) + unpaid_leave_crud.mark_all_notifications_read(
        db, user_id
    ) + appointment_interview_crud.mark_all_notifications_read(
        db, user_id
    ) + work_handover_crud.mark_all_notifications_read(
        db, user_id
    ) + training_application_crud.mark_all_notifications_read(
        db, user_id
    ) + resignation_approval_crud.mark_all_notifications_read(
        db, user_id
    )
    approval_stream_broker.touch()
    return {'success': True, 'updated_count': updated_count}


@router.post('/notifications/{notification_id}/read', summary='标记审批通知为已读')
def read_approval_notification(
    notification_id: int,
    biz_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user_id = _get_user_id(current_user)
    if biz_type == 'social_insurance':
        record = social_insurance_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'regularization':
        record = regularization_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'promotion':
        record = promotion_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'transfer_application':
        record = transfer_application_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'appointment_interview':
        record = appointment_interview_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'work_handover':
        record = work_handover_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'training_application':
        record = training_application_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'resignation_approval':
        record = resignation_approval_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'unpaid_leave':
        record = unpaid_leave_crud.mark_notification_read(db, notification_id, user_id)
    elif biz_type == 'recruitment':
        record = recruitment_request_crud.mark_notification_read(db, notification_id, user_id)
    else:
        record = recruitment_request_crud.mark_notification_read(
            db, notification_id, user_id
        ) or regularization_crud.mark_notification_read(
            db, notification_id, user_id
        ) or promotion_crud.mark_notification_read(
            db, notification_id, user_id
        ) or social_insurance_crud.mark_notification_read(
            db, notification_id, user_id
        ) or transfer_application_crud.mark_notification_read(
            db, notification_id, user_id
        ) or unpaid_leave_crud.mark_notification_read(
            db, notification_id, user_id
        ) or appointment_interview_crud.mark_notification_read(
            db, notification_id, user_id
        ) or work_handover_crud.mark_notification_read(
            db, notification_id, user_id
        ) or training_application_crud.mark_notification_read(
            db, notification_id, user_id
        ) or resignation_approval_crud.mark_notification_read(
            db, notification_id, user_id
        )
    if not record:
        return {'success': False, 'updated': False}
    approval_stream_broker.touch()
    return {'success': True, 'updated': True}


@router.get('/stream', summary='审批中心实时提醒流')
async def stream_approval_summary(
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    async def event_generator():
        last_payload = None
        version = approval_stream_broker.version
        while True:
            if await request.is_disconnected():
                break

            db = SessionLocal()
            try:
                payload = build_approval_summary(db, current_user)
            finally:
                db.close()

            if payload != last_payload:
                yield f"event: summary\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
                last_payload = payload
            next_version = await asyncio.to_thread(
                approval_stream_broker.wait_for_change,
                version,
                30.0,
            )
            if next_version == version:
                yield ': keep-alive\n\n'
            version = next_version

    return StreamingResponse(
        event_generator(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    )
