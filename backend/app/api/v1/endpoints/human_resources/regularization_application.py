"""
集团人资基础 - 转正申请 API
"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user, get_current_admin_user
from .....core.database import get_db
from .....crud.human_resources import regularization_application as crud
from .....models.user import User
from .....schemas.human_resources.regularization_application import (
    RegularizationApplicationActionPayload,
    RegularizationApplicationCreate,
    RegularizationApplicationOut,
    RegularizationApplicationUpdate,
    RegularizationApprovalConfigOut,
    RegularizationApprovalConfigUpsert,
    RegularizationApprovalPreviewInput,
    RegularizationApproverCandidateOut,
)
from .....services.approvals import approval_stream_broker
from ._dashboard_refresh import schedule_dashboard_refresh

router = APIRouter()


@router.get(
    "/regularization-approval-configs",
    response_model=List[RegularizationApprovalConfigOut],
    summary="获取转正审批配置",
)
def list_regularization_approval_configs(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    apply_department: Optional[str] = Query(None, description="按申请部门过滤"),
    apply_position: Optional[str] = Query(None, description="按申请职位过滤"),
    stage: Optional[str] = Query(None, description="按审批阶段过滤"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return [
        crud.serialize_config(item)
        for item in crud.list_approval_configs(
            db,
            campus=campus,
            apply_department=apply_department,
            apply_position=apply_position,
            stage=stage,
        )
    ]


@router.put(
    "/regularization-approval-configs",
    response_model=RegularizationApprovalConfigOut,
    summary="新增或更新转正审批配置",
)
def upsert_regularization_approval_config(
    payload: RegularizationApprovalConfigUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    try:
        record = crud.upsert_approval_config(db, payload)
        return crud.serialize_config(record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/regularization-approval-configs/{config_id}",
    summary="删除转正审批配置",
)
def delete_regularization_approval_config(
    config_id: int = Path(..., description="配置ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    if not crud.delete_approval_config(db, config_id):
        raise HTTPException(status_code=404, detail="配置不存在")
    return {"success": True}


@router.get(
    "/regularization-applications",
    response_model=List[RegularizationApplicationOut],
    summary="获取转正申请列表",
)
def list_regularization_applications(
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
    "/regularization-applications/approver-preview",
    response_model=List[RegularizationApproverCandidateOut],
    summary="预览转正申请审批候选人与默认审批人",
)
def preview_regularization_application_approvers(
    payload: RegularizationApprovalPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.build_approver_candidate_preview(
        db,
        campus=payload.campus,
        department=payload.department,
        position=payload.position,
        created_by_user_id=current_user.user_id,
    )


@router.post(
    "/regularization-applications",
    response_model=RegularizationApplicationOut,
    summary="创建转正申请",
)
def create_regularization_application(
    payload: RegularizationApplicationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=record.fill_date,
            campus=record.campus,
            department=record.department,
            position=record.position,
            source="regularization_application_create",
        )
        return crud.serialize_application(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/regularization-applications/{application_id}",
    response_model=RegularizationApplicationOut,
    summary="获取转正申请详情",
)
def get_regularization_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="转正申请不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该申请")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/regularization-applications/{application_id}",
    response_model=RegularizationApplicationOut,
    summary="更新转正申请",
)
def update_regularization_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    payload: RegularizationApplicationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="转正申请不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=(updated.completed_at.date() if updated.completed_at else updated.fill_date),
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
            source="regularization_application_update",
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/regularization-applications/{application_id}",
    summary="删除转正申请",
)
def delete_regularization_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="转正申请不存在")
    try:
        anchor_date = record.completed_at.date() if record.completed_at else record.fill_date
        campus = record.campus
        department = record.department
        position = record.position
        crud.delete_application(db, record, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=anchor_date,
            campus=campus,
            department=department,
            position=position,
            source="regularization_application_delete",
        )
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/regularization-applications/{application_id}/submit",
    response_model=RegularizationApplicationOut,
    summary="提交转正申请审批",
)
def submit_regularization_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="转正申请不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/regularization-applications/{application_id}/approve",
    response_model=RegularizationApplicationOut,
    summary="审批通过转正申请",
)
def approve_regularization_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    payload: RegularizationApplicationActionPayload = Body(
        default=RegularizationApplicationActionPayload()
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="转正申请不存在")
    try:
        updated = crud.approve_application(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=(updated.completed_at.date() if updated.completed_at else updated.fill_date),
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
            source="regularization_application_approve",
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/regularization-applications/{application_id}/reject",
    response_model=RegularizationApplicationOut,
    summary="驳回转正申请",
)
def reject_regularization_application(
    application_id: int = Path(..., description="申请ID"),
    payload: RegularizationApplicationActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="转正申请不存在")
    try:
        updated = crud.reject_application(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
