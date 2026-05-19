"""
集团人资基础 - 招聘需求申请与审批配置 API
"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user, get_current_admin_user
from .....core.database import get_db
from .....crud.human_resources import recruitment_request as crud
from .....crud.human_resources.dashboard_scope import resolve_recruitment_request_scope
from .....models.user import User
from .....schemas.human_resources.recruitment_request import (
    RecruitmentApprovalConfigOut,
    RecruitmentApprovalConfigUpsert,
    RecruitmentApprovalPreviewInput,
    RecruitmentApproverCandidateOut,
    RecruitmentRequestActionPayload,
    RecruitmentRequestCreate,
    RecruitmentRequestOut,
    RecruitmentRequestUpdate,
)
from .....services.approvals import approval_stream_broker
from ._dashboard_refresh import schedule_dashboard_refresh

router = APIRouter()


@router.get(
    "/recruitment-approval-configs",
    response_model=List[RecruitmentApprovalConfigOut],
    summary="获取招聘审批配置",
)
def list_recruitment_approval_configs(
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
    "/recruitment-approval-configs",
    response_model=RecruitmentApprovalConfigOut,
    summary="新增或更新招聘审批配置",
)
def upsert_recruitment_approval_config(
    payload: RecruitmentApprovalConfigUpsert,
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
    "/recruitment-approval-configs/{config_id}",
    summary="删除招聘审批配置",
)
def delete_recruitment_approval_config(
    config_id: int = Path(..., description="配置ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    if not crud.delete_approval_config(db, config_id):
        raise HTTPException(status_code=404, detail="配置不存在")
    return {"success": True}


@router.get(
    "/recruitment-requests",
    response_model=List[RecruitmentRequestOut],
    summary="获取招聘需求申请列表",
)
def list_recruitment_requests(
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
    items, total = crud.list_requests_page(
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
        crud.serialize_request(
            item,
            current_user,
            db,
            stage_approver_cache=stage_approver_cache,
        )
        for item in items
    ]


@router.post(
    "/recruitment-requests/approver-preview",
    response_model=List[RecruitmentApproverCandidateOut],
    summary="预览招聘申请审批候选人与默认审批人",
)
def preview_recruitment_request_approvers(
    payload: RecruitmentApprovalPreviewInput,
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
    "/recruitment-requests",
    response_model=RecruitmentRequestOut,
    summary="创建招聘需求申请",
)
def create_recruitment_request(
    payload: RecruitmentRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.create_request(db, payload, current_user)
    schedule_dashboard_refresh(
        background_tasks,
        anchor_date=record.apply_date,
        campus=record.campus,
        department=record.department,
        position=record.position,
    )
    return crud.serialize_request(record, current_user, db)


@router.get(
    "/recruitment-requests/{request_id}",
    response_model=RecruitmentRequestOut,
    summary="获取招聘需求申请详情",
)
def get_recruitment_request(
    request_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_request(db, request_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    if not crud.can_view_request(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该申请")
    return crud.serialize_request(record, current_user, db)


@router.put(
    "/recruitment-requests/{request_id}",
    response_model=RecruitmentRequestOut,
    summary="更新招聘需求申请",
)
def update_recruitment_request(
    background_tasks: BackgroundTasks,
    request_id: int = Path(..., description="申请ID"),
    payload: RecruitmentRequestUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_request(db, request_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.update_request(db, record, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=updated.apply_date,
            campus=updated.campus,
            department=updated.department,
            position=updated.position,
        )
        return crud.serialize_request(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/recruitment-requests/{request_id}",
    summary="删除招聘需求申请",
)
def delete_recruitment_request(
    background_tasks: BackgroundTasks,
    request_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_request(db, request_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        anchor_date = record.apply_date
        campus = record.campus
        department = record.department
        position = record.position
        crud.delete_request(db, record, current_user)
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
    "/recruitment-requests/{request_id}/submit",
    response_model=RecruitmentRequestOut,
    summary="提交招聘需求申请审批",
)
def submit_recruitment_request(
    request_id: int = Path(..., description="申请ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_request(db, request_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.submit_request(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_request(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/recruitment-requests/{request_id}/approve",
    response_model=RecruitmentRequestOut,
    summary="审批通过招聘需求申请",
)
def approve_recruitment_request(
    background_tasks: BackgroundTasks,
    request_id: int = Path(..., description="申请ID"),
    payload: RecruitmentRequestActionPayload = Body(default=RecruitmentRequestActionPayload()),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_request(db, request_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.approve_request(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        if updated.status == "approved":
            schedule_dashboard_refresh(
                background_tasks,
                anchor_date=updated.apply_date,
                campus=updated.campus,
                department=updated.department,
                position=updated.position,
                scope=resolve_recruitment_request_scope(
                    campus=updated.campus,
                    department=updated.department,
                    position=updated.position,
                ),
            )
        return crud.serialize_request(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/recruitment-requests/{request_id}/reject",
    response_model=RecruitmentRequestOut,
    summary="驳回招聘需求申请",
)
def reject_recruitment_request(
    request_id: int = Path(..., description="申请ID"),
    payload: RecruitmentRequestActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_request(db, request_id)
    if not record:
        raise HTTPException(status_code=404, detail="申请不存在")
    try:
        updated = crud.reject_request(db, record, current_user, payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_request(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
