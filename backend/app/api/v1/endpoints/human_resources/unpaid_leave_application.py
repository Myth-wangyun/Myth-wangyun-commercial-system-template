"""
集团人资基础 - 停薪留职申请 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import dashboard as dashboard_crud
from .....crud.human_resources import unpaid_leave_application as crud
from .....models.user import User
from .....schemas.human_resources.unpaid_leave_application import (
    UnpaidLeaveApplicationActionPayload,
    UnpaidLeaveApplicationCreate,
    UnpaidLeaveApplicationOut,
    UnpaidLeaveApplicationUpdate,
    UnpaidLeaveApprovalPreviewInput,
    UnpaidLeaveApproverCandidateOut,
)
from .....services.approvals import approval_stream_broker

router = APIRouter()


@router.get(
    "/unpaid-leave-applications",
    response_model=List[UnpaidLeaveApplicationOut],
    summary="获取停薪留职申请列表",
)
def list_unpaid_leave_applications(
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
    "/unpaid-leave-applications/approver-preview",
    response_model=List[UnpaidLeaveApproverCandidateOut],
    summary="预览停薪留职申请审批人候选",
)
def preview_unpaid_leave_application_approvers(
    payload: UnpaidLeaveApprovalPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.build_approver_candidate_preview(
            db,
            campus=payload.campus,
            department=payload.department,
            position=payload.position,
            created_by_user_id=current_user.user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/unpaid-leave-applications",
    response_model=UnpaidLeaveApplicationOut,
    summary="创建停薪留职申请",
)
def create_unpaid_leave_application(
    payload: UnpaidLeaveApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=record.fill_date,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        return crud.serialize_application(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/unpaid-leave-applications/{application_id}",
    response_model=UnpaidLeaveApplicationOut,
    summary="获取停薪留职申请详情",
)
def get_unpaid_leave_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该申请")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/unpaid-leave-applications/{application_id}",
    response_model=UnpaidLeaveApplicationOut,
    summary="更新停薪留职申请",
)
def update_unpaid_leave_application(
    application_id: int = Path(..., description="申请ID"),
    payload: UnpaidLeaveApplicationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=(updated.completed_at.date() if updated.completed_at else updated.fill_date),
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
    "/unpaid-leave-applications/{application_id}",
    summary="删除停薪留职申请",
)
def delete_unpaid_leave_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        anchor_date = record.completed_at.date() if record.completed_at else record.fill_date
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
    "/unpaid-leave-applications/{application_id}/submit",
    response_model=UnpaidLeaveApplicationOut,
    summary="提交停薪留职申请审批",
)
def submit_unpaid_leave_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/unpaid-leave-applications/{application_id}/approve",
    response_model=UnpaidLeaveApplicationOut,
    summary="审批通过停薪留职申请",
)
def approve_unpaid_leave_application(
    application_id: int = Path(..., description="申请ID"),
    payload: UnpaidLeaveApplicationActionPayload = Body(default=UnpaidLeaveApplicationActionPayload()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.approve_application(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=(updated.completed_at.date() if updated.completed_at else updated.fill_date),
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
    "/unpaid-leave-applications/{application_id}/reject",
    response_model=UnpaidLeaveApplicationOut,
    summary="驳回停薪留职申请",
)
def reject_unpaid_leave_application(
    application_id: int = Path(..., description="申请ID"),
    payload: UnpaidLeaveApplicationActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.reject_application(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
