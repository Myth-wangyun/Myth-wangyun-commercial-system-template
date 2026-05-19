"""
集团人资基础 - 调岗申请 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import dashboard as dashboard_crud
from .....crud.human_resources import transfer_application as crud
from .....models.user import User
from .....schemas.human_resources.transfer_application import (
    TransferApplicationActionPayload,
    TransferApplicationCreate,
    TransferApplicationOut,
    TransferApplicationUpdate,
    TransferApprovalPreviewInput,
    TransferApproverCandidateOut,
)
from .....services.approvals import approval_stream_broker

router = APIRouter()


@router.get(
    "/transfer-applications",
    response_model=List[TransferApplicationOut],
    summary="获取调岗申请列表",
)
def list_transfer_applications(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    status: Optional[str] = Query(None, description="按状态过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items = crud.list_applications(
        db,
        campus=campus,
        status=status,
        department=department,
        current_user=current_user,
    )
    return [crud.serialize_application(item, current_user, db) for item in items]


@router.post(
    "/transfer-applications/approver-preview",
    response_model=List[TransferApproverCandidateOut],
    summary="预览调岗申请审批候选人与默认审批人",
)
def preview_transfer_application_approvers(
    payload: TransferApprovalPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.build_approver_candidate_preview(
        db,
        campus=payload.campus,
        department=payload.department,
        position=payload.position,
        target_department=payload.target_department,
        target_position=payload.target_position,
        created_by_user_id=current_user.user_id,
    )


@router.post(
    "/transfer-applications",
    response_model=TransferApplicationOut,
    summary="创建调岗申请",
)
def create_transfer_application(
    payload: TransferApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=record.apply_date,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        return crud.serialize_application(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/transfer-applications/{application_id}",
    response_model=TransferApplicationOut,
    summary="获取调岗申请详情",
)
def get_transfer_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="调岗申请不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该申请")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/transfer-applications/{application_id}",
    response_model=TransferApplicationOut,
    summary="更新调岗申请",
)
def update_transfer_application(
    application_id: int = Path(..., description="申请ID"),
    payload: TransferApplicationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="调岗申请不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=(updated.completed_at.date() if updated.completed_at else updated.apply_date),
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/transfer-applications/{application_id}",
    summary="删除调岗申请",
)
def delete_transfer_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="调岗申请不存在")
    try:
        anchor_date = record.completed_at.date() if record.completed_at else record.apply_date
        campus = record.campus
        department = record.department
        position = record.position
        crud.delete_application(db, record, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=anchor_date,
            campus=campus,
            department=department,
            position=position,
        )
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/transfer-applications/{application_id}/submit",
    response_model=TransferApplicationOut,
    summary="提交调岗申请审批",
)
def submit_transfer_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="调岗申请不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/transfer-applications/{application_id}/approve",
    response_model=TransferApplicationOut,
    summary="审批通过调岗申请",
)
def approve_transfer_application(
    application_id: int = Path(..., description="申请ID"),
    payload: TransferApplicationActionPayload = Body(
        default=TransferApplicationActionPayload()
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="调岗申请不存在")
    try:
        updated = crud.approve_application(
            db,
            record,
            current_user,
            payload.model_dump(exclude_unset=True),
        )
        approval_stream_broker.touch()
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=(updated.completed_at.date() if updated.completed_at else updated.apply_date),
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/transfer-applications/{application_id}/reject",
    response_model=TransferApplicationOut,
    summary="驳回调岗申请",
)
def reject_transfer_application(
    application_id: int = Path(..., description="申请ID"),
    payload: TransferApplicationActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="调岗申请不存在")
    try:
        updated = crud.reject_application(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
