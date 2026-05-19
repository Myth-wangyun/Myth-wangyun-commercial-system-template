"""
集团人资基础 - 培训申请表 API
"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import training_application as crud
from .....models.user import User
from .....schemas.human_resources.training_application import (
    TrainingApplicationActionPayload,
    TrainingApplicationApprovalPreviewInput,
    TrainingApplicationApproverCandidateOut,
    TrainingApplicationCreate,
    TrainingApplicationOut,
    TrainingApplicationUpdate,
)
from .....services.approvals import approval_stream_broker
from ._dashboard_refresh import schedule_dashboard_refresh

router = APIRouter()


@router.get("/training-applications", response_model=List[TrainingApplicationOut], summary="获取培训申请表列表")
def list_training_applications(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    status: Optional[str] = Query(None, description="按状态过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    category: Optional[str] = Query(None, description="按培训类别过滤"),
    search: Optional[str] = Query(None, description="按关键词过滤"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
    response: Response = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, total = crud.list_applications_page(
        db,
        campus=campus,
        status=status,
        department=department,
        category=category,
        search=search,
        current_user=current_user,
        page=page,
        page_size=page_size,
    )
    if response is not None:
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)
    return [crud.serialize_application(item, current_user, db) for item in items]


@router.post(
    "/training-applications/approver-preview",
    response_model=List[TrainingApplicationApproverCandidateOut],
    summary="预览培训申请表审批人候选",
)
def preview_training_application_approvers(
    payload: TrainingApplicationApprovalPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.build_approver_candidate_preview(
            db,
            campus=payload.campus,
            department=payload.department,
            category=payload.category,
            is_internal_training=payload.is_internal_training,
            is_key_staff_training=payload.is_key_staff_training,
            include_chairman_approval=payload.include_chairman_approval,
            total_amount=payload.total_amount,
            created_by_user_id=current_user.user_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/training-applications", response_model=TrainingApplicationOut, summary="创建培训申请表")
def create_training_application(
    payload: TrainingApplicationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=record.start_date,
            campus=record.campus,
            department=record.department,
        )
        return crud.serialize_application(record, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/training-applications/{application_id}",
    response_model=TrainingApplicationOut,
    summary="获取培训申请表详情",
)
def get_training_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训申请表不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该培训申请表")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/training-applications/{application_id}",
    response_model=TrainingApplicationOut,
    summary="更新培训申请表",
)
def update_training_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    payload: TrainingApplicationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训申请表不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=updated.start_date,
            campus=updated.campus,
            department=updated.department,
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/training-applications/{application_id}", summary="删除培训申请表")
def delete_training_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训申请表不存在")
    try:
        anchor_date = record.start_date
        campus = record.campus
        department = record.department
        crud.delete_application(db, record, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=anchor_date,
            campus=campus,
            department=department,
        )
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/training-applications/{application_id}/submit",
    response_model=TrainingApplicationOut,
    summary="提交培训申请表审批",
)
def submit_training_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训申请表不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/training-applications/{application_id}/approve",
    response_model=TrainingApplicationOut,
    summary="审批通过培训申请表",
)
def approve_training_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    payload: TrainingApplicationActionPayload = Body(default=TrainingApplicationActionPayload()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训申请表不存在")
    try:
        updated = crud.approve_application(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=updated.start_date,
            campus=updated.campus,
            department=updated.department,
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/training-applications/{application_id}/reject",
    response_model=TrainingApplicationOut,
    summary="驳回培训申请表",
)
def reject_training_application(
    application_id: int = Path(..., description="申请ID"),
    payload: TrainingApplicationActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训申请表不存在")
    try:
        updated = crud.reject_application(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
