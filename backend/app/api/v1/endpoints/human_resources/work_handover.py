"""
集团人资基础 - 工作交接表 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import work_handover as crud
from .....models.user import User
from .....schemas.human_resources.work_handover import (
    WorkHandoverActionPayload,
    WorkHandoverApprovalPreviewInput,
    WorkHandoverApproverCandidateOut,
    WorkHandoverCreate,
    WorkHandoverFormAssigneePreviewOut,
    WorkHandoverOut,
    WorkHandoverUpdate,
)
from .....services.approvals import approval_stream_broker

router = APIRouter()


@router.get(
    "/work-handovers",
    response_model=List[WorkHandoverOut],
    summary="获取工作交接表列表",
)
def list_work_handovers(
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
    "/work-handovers/approver-preview",
    response_model=List[WorkHandoverApproverCandidateOut],
    summary="预览工作交接表审批人候选",
)
def preview_work_handover_approvers(
    payload: WorkHandoverApprovalPreviewInput,
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
    "/work-handovers/form-assignee-preview",
    response_model=WorkHandoverFormAssigneePreviewOut,
    summary="预览工作交接表接收人与财务签字候选",
)
def preview_work_handover_form_assignees(
    payload: WorkHandoverApprovalPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.build_form_assignee_preview(
            db,
            campus=payload.campus,
            department=payload.department,
            position=payload.position,
            created_by_user_id=current_user.user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/work-handovers",
    response_model=WorkHandoverOut,
    summary="创建工作交接表",
)
def create_work_handover(
    payload: WorkHandoverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        return crud.serialize_application(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/work-handovers/{application_id}",
    response_model=WorkHandoverOut,
    summary="获取工作交接表详情",
)
def get_work_handover(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="工作交接表不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该工作交接表")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/work-handovers/{application_id}",
    response_model=WorkHandoverOut,
    summary="更新工作交接表",
)
def update_work_handover(
    application_id: int = Path(..., description="申请ID"),
    payload: WorkHandoverUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="工作交接表不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/work-handovers/{application_id}",
    summary="删除工作交接表",
)
def delete_work_handover(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="工作交接表不存在")
    try:
        crud.delete_application(db, record, current_user)
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/work-handovers/{application_id}/submit",
    response_model=WorkHandoverOut,
    summary="提交工作交接表审批",
)
def submit_work_handover(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="工作交接表不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/work-handovers/{application_id}/approve",
    response_model=WorkHandoverOut,
    summary="审批通过工作交接表",
)
def approve_work_handover(
    application_id: int = Path(..., description="申请ID"),
    payload: WorkHandoverActionPayload = Body(default=WorkHandoverActionPayload()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="工作交接表不存在")
    try:
        updated = crud.approve_application(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/work-handovers/{application_id}/reject",
    response_model=WorkHandoverOut,
    summary="驳回工作交接表",
)
def reject_work_handover(
    application_id: int = Path(..., description="申请ID"),
    payload: WorkHandoverActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="工作交接表不存在")
    try:
        updated = crud.reject_application(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
