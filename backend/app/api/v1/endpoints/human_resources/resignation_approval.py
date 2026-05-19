"""
集团人资基础 - 离职审批单 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import dashboard as dashboard_crud
from .....crud.human_resources import resignation_approval as crud
from .....models.user import User
from .....schemas.human_resources.resignation_approval import (
    ResignationApprovalActionPayload,
    ResignationApprovalApproverCandidateOut,
    ResignationApprovalCreate,
    ResignationApprovalOut,
    ResignationApprovalPreviewInput,
    ResignationApprovalUpdate,
)
from .....services.approvals import approval_stream_broker

router = APIRouter()


@router.get(
    "/resignation-approvals",
    response_model=List[ResignationApprovalOut],
    summary="获取离职审批单列表",
)
def list_resignation_approvals(
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
    "/resignation-approvals/approver-preview",
    response_model=List[ResignationApprovalApproverCandidateOut],
    summary="预览离职审批单审批人候选",
)
def preview_resignation_approval_approvers(
    payload: ResignationApprovalPreviewInput,
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
    "/resignation-approvals",
    response_model=ResignationApprovalOut,
    summary="创建离职审批单",
)
def create_resignation_approval(
    payload: ResignationApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=record.leave_date,
            campus=record.campus,
            department=record.department,
            position=record.position,
        )
        return crud.serialize_application(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/resignation-approvals/{application_id}",
    response_model=ResignationApprovalOut,
    summary="获取离职审批单详情",
)
def get_resignation_approval(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="离职审批单不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该离职审批单")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/resignation-approvals/{application_id}",
    response_model=ResignationApprovalOut,
    summary="更新离职审批单",
)
def update_resignation_approval(
    application_id: int = Path(..., description="申请ID"),
    payload: ResignationApprovalUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="离职审批单不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=updated.leave_date,
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
    "/resignation-approvals/{application_id}",
    summary="删除离职审批单",
)
def delete_resignation_approval(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="离职审批单不存在")
    try:
        anchor_date = record.leave_date
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
    "/resignation-approvals/{application_id}/submit",
    response_model=ResignationApprovalOut,
    summary="提交离职审批单审批",
)
def submit_resignation_approval(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="离职审批单不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/resignation-approvals/{application_id}/approve",
    response_model=ResignationApprovalOut,
    summary="审批通过离职审批单",
)
def approve_resignation_approval(
    application_id: int = Path(..., description="申请ID"),
    payload: ResignationApprovalActionPayload = Body(default=ResignationApprovalActionPayload()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="离职审批单不存在")
    try:
        updated = crud.approve_application(
            db,
            record,
            current_user,
            comment=payload.comment,
            salary_end_date=payload.salary_end_date,
        )
        approval_stream_broker.touch()
        dashboard_crud.refresh_dashboard_for_values(
            db,
            anchor_date=updated.leave_date,
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
    "/resignation-approvals/{application_id}/reject",
    response_model=ResignationApprovalOut,
    summary="驳回离职审批单",
)
def reject_resignation_approval(
    application_id: int = Path(..., description="申请ID"),
    payload: ResignationApprovalActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="离职审批单不存在")
    try:
        updated = crud.reject_application(
            db,
            record,
            current_user,
            comment=payload.comment,
            salary_end_date=payload.salary_end_date,
        )
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
