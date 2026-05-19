"""
集团人资基础 - 晋升申请 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user, get_current_admin_user
from .....core.database import get_db
from .....crud.human_resources import dashboard as dashboard_crud
from .....crud.human_resources import promotion_application as crud
from .....models.user import User
from .....schemas.human_resources.promotion_application import (
    PromotionApplicationActionPayload,
    PromotionApplicationCreate,
    PromotionApplicationOut,
    PromotionApplicationUpdate,
    PromotionApprovalConfigOut,
    PromotionApprovalConfigUpsert,
    PromotionApprovalPreviewInput,
    PromotionApproverCandidateOut,
)
from .....services.approvals import approval_stream_broker

router = APIRouter()


@router.get(
    "/promotion-approval-configs",
    response_model=List[PromotionApprovalConfigOut],
    summary="获取晋升审批配置",
)
def list_promotion_approval_configs(
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
    "/promotion-approval-configs",
    response_model=PromotionApprovalConfigOut,
    summary="新增或更新晋升审批配置",
)
def upsert_promotion_approval_config(
    payload: PromotionApprovalConfigUpsert,
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
    "/promotion-approval-configs/{config_id}",
    summary="删除晋升审批配置",
)
def delete_promotion_approval_config(
    config_id: int = Path(..., description="配置ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    if not crud.delete_approval_config(db, config_id):
        raise HTTPException(status_code=404, detail="配置不存在")
    return {"success": True}


@router.get(
    "/promotion-applications",
    response_model=List[PromotionApplicationOut],
    summary="获取晋升申请列表",
)
def list_promotion_applications(
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
    "/promotion-applications/approver-preview",
    response_model=List[PromotionApproverCandidateOut],
    summary="预览晋升申请审批候选人与默认审批人",
)
def preview_promotion_application_approvers(
    payload: PromotionApprovalPreviewInput,
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
    "/promotion-applications",
    response_model=PromotionApplicationOut,
    summary="创建晋升申请",
)
def create_promotion_application(
    payload: PromotionApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_application(db, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            campus=record.campus,
            department=record.department,
            position=record.position,
            anchor_date=record.fill_date,
        )
        return crud.serialize_application(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/promotion-applications/{application_id}",
    response_model=PromotionApplicationOut,
    summary="获取晋升申请详情",
)
def get_promotion_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升申请不存在")
    if not crud.can_view_application(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该申请")
    return crud.serialize_application(record, current_user, db)


@router.put(
    "/promotion-applications/{application_id}",
    response_model=PromotionApplicationOut,
    summary="更新晋升申请",
)
def update_promotion_application(
    application_id: int = Path(..., description="申请ID"),
    payload: PromotionApplicationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升申请不存在")
    original_campus = record.campus
    original_department = record.department
    original_position = record.position
    original_fill_date = record.fill_date
    try:
        updated = crud.update_application(db, record, payload, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
            anchor_date=updated.fill_date or original_fill_date,
        )
        dashboard_crud.refresh_dashboard_for_values(
            db,
            campus=original_campus,
            department=original_department,
            position=original_position,
            anchor_date=original_fill_date,
        )
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/promotion-applications/{application_id}",
    summary="删除晋升申请",
)
def delete_promotion_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升申请不存在")
    campus = record.campus
    department = record.department
    position = record.position
    fill_date = record.fill_date
    try:
        crud.delete_application(db, record, current_user)
        dashboard_crud.refresh_dashboard_for_values(
            db,
            campus=campus,
            department=department,
            position=position,
            anchor_date=fill_date,
        )
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/promotion-applications/{application_id}/submit",
    response_model=PromotionApplicationOut,
    summary="提交晋升申请审批",
)
def submit_promotion_application(
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升申请不存在")
    try:
        updated = crud.submit_application(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/promotion-applications/{application_id}/approve",
    response_model=PromotionApplicationOut,
    summary="审批通过晋升申请",
)
def approve_promotion_application(
    application_id: int = Path(..., description="申请ID"),
    payload: PromotionApplicationActionPayload = Body(
        default=PromotionApplicationActionPayload()
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升申请不存在")
    try:
        updated = crud.approve_application(
            db,
            record,
            current_user,
            payload.model_dump(exclude_unset=True),
        )
        dashboard_crud.refresh_dashboard_for_values(
            db,
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
            anchor_date=updated.completed_at.date() if updated.completed_at else updated.fill_date,
        )
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/promotion-applications/{application_id}/reject",
    response_model=PromotionApplicationOut,
    summary="驳回晋升申请",
)
def reject_promotion_application(
    application_id: int = Path(..., description="申请ID"),
    payload: PromotionApplicationActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升申请不存在")
    try:
        updated = crud.reject_application(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
