"""
集团人资基础 - 员工社保办理申请与审批配置 API
"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user, get_current_admin_user
from .....core.database import get_db
from .....crud.human_resources import social_insurance_application as crud
from .....models.user import User
from .....schemas.human_resources.social_insurance_application import (
    SocialInsuranceApplicationActionPayload,
    SocialInsuranceApplicationCreate,
    SocialInsuranceApplicationOut,
    SocialInsuranceApplicationUpdate,
    SocialInsuranceApprovalConfigOut,
    SocialInsuranceApprovalConfigUpsert,
    SocialInsuranceApprovalPreviewInput,
    SocialInsuranceApproverCandidateOut,
)
from .....services.approvals import approval_stream_broker
from ._dashboard_refresh import schedule_dashboard_refresh

router = APIRouter()


@router.get(
    "/social-insurance-approval-configs",
    response_model=List[SocialInsuranceApprovalConfigOut],
    summary="获取社保审批配置",
)
def list_social_insurance_approval_configs(
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
    "/social-insurance-approval-configs",
    response_model=SocialInsuranceApprovalConfigOut,
    summary="新增或更新社保审批配置",
)
def upsert_social_insurance_approval_config(
    payload: SocialInsuranceApprovalConfigUpsert,
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
    "/social-insurance-approval-configs/{config_id}",
    summary="删除社保审批配置",
)
def delete_social_insurance_approval_config(
    config_id: int = Path(..., description="配置ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    if not crud.delete_approval_config(db, config_id):
        raise HTTPException(status_code=404, detail="配置不存在")
    return {"success": True}


@router.get(
    "/social-insurance-applications",
    response_model=List[SocialInsuranceApplicationOut],
    summary="获取员工社保办理申请列表",
)
def list_social_insurance_applications(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    status: Optional[str] = Query(None, description="按状态过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    search: Optional[str] = Query(None, description="按关键词过滤"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
    response: Response = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stage_approver_cache: crud.StageApproverCache = {}
    items, total = crud.list_applications_page(
        db,
        campus=campus,
        status=status,
        department=department,
        search=search,
        current_user=current_user,
        page=page,
        page_size=page_size,
    )
    if response is not None:
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)
    return [
        crud.serialize_application(
            item,
            current_user,
            db,
            stage_approver_cache=stage_approver_cache,
        )
        for item in items
    ]


@router.post(
    "/social-insurance-applications/approver-preview",
    response_model=List[SocialInsuranceApproverCandidateOut],
    summary="预览社保申请审批候选人与默认审批人",
)
def preview_social_insurance_application_approvers(
    payload: SocialInsuranceApprovalPreviewInput,
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
    "/social-insurance-applications",
    response_model=SocialInsuranceApplicationOut,
    summary="创建员工社保办理申请",
)
def create_social_insurance_application(
    payload: SocialInsuranceApplicationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.create_application(db, payload, current_user)
    schedule_dashboard_refresh(
        background_tasks,
        anchor_date=record.hr_start_date or record.fill_date,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    return crud.serialize_application(record, current_user, db)


@router.get(
    "/social-insurance-applications/{application_id}",
    response_model=SocialInsuranceApplicationOut,
    summary="获取员工社保办理申请详情",
)
def get_social_insurance_application(
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
    "/social-insurance-applications/{application_id}",
    response_model=SocialInsuranceApplicationOut,
    summary="更新员工社保办理申请",
)
def update_social_insurance_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    payload: SocialInsuranceApplicationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.update_application(db, record, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=updated.hr_start_date or updated.fill_date,
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
    "/social-insurance-applications/{application_id}",
    summary="删除员工社保办理申请",
)
def delete_social_insurance_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        anchor_date = record.hr_start_date or record.fill_date
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
        )
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/social-insurance-applications/{application_id}/submit",
    response_model=SocialInsuranceApplicationOut,
    summary="提交员工社保办理申请审批",
)
def submit_social_insurance_application(
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
    "/social-insurance-applications/{application_id}/approve",
    response_model=SocialInsuranceApplicationOut,
    summary="审批通过员工社保办理申请",
)
def approve_social_insurance_application(
    background_tasks: BackgroundTasks,
    application_id: int = Path(..., description="申请ID"),
    payload: SocialInsuranceApplicationActionPayload = Body(
        default=SocialInsuranceApplicationActionPayload()
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.approve_application(
            db,
            record,
            current_user,
            comment=payload.comment,
            hr_payment_content=payload.hr_payment_content,
            hr_payment_base=payload.hr_payment_base,
            hr_start_date=payload.hr_start_date,
            hr_insurance_place=payload.hr_insurance_place,
        )
        approval_stream_broker.touch()
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=updated.hr_start_date or updated.fill_date,
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
    "/social-insurance-applications/{application_id}/reject",
    response_model=SocialInsuranceApplicationOut,
    summary="驳回员工社保办理申请",
)
def reject_social_insurance_application(
    application_id: int = Path(..., description="申请ID"),
    payload: SocialInsuranceApplicationActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_application(db, application_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.reject_application(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_application(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
