"""集团人资基础 - 面试登记表 API"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import interview_registration as crud
from .....crud.human_resources.dashboard_scope import resolve_interview_registration_scope
from .....models.user import User
from .....schemas.human_resources import (
    InterviewRegistrationCreate,
    InterviewRegistrationOut,
    InterviewRegistrationUpdate,
)
from ._dashboard_refresh import schedule_scope_dashboard_chain_refresh

router = APIRouter()


@router.get(
    "/interview-registrations",
    response_model=List[InterviewRegistrationOut],
    summary="获取面试登记表列表",
)
def list_interview_registrations(
    campus_name: Optional[str] = Query(None, description="按神殿过滤"),
    search: Optional[str] = Query(None, description="按姓名/岗位/电话等搜索"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return crud.list_records(db, campus_name=campus_name, search=search)


@router.post(
    "/interview-registrations",
    response_model=InterviewRegistrationOut,
    summary="创建面试登记记录",
)
def create_interview_registration(
    payload: InterviewRegistrationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.create_record(db, payload, current_user)
    scope = resolve_interview_registration_scope(
        campus=record.campus_name,
        position=record.position,
    )
    if scope:
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            anchor_date=record.invite_date or record.onboard_date,
            scope=scope,
            source="interview_registration_create",
        )
    return record


@router.get(
    "/interview-registrations/{record_id}",
    response_model=InterviewRegistrationOut,
    summary="获取面试登记记录详情",
)
def get_interview_registration(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="面试登记记录不存在")
    return record


@router.put(
    "/interview-registrations/{record_id}",
    response_model=InterviewRegistrationOut,
    summary="更新面试登记记录",
)
def update_interview_registration(
    background_tasks: BackgroundTasks,
    record_id: int = Path(..., description="记录ID"),
    payload: InterviewRegistrationUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="面试登记记录不存在")
    previous_anchor_date = record.invite_date or record.onboard_date
    previous_scope = resolve_interview_registration_scope(
        campus=record.campus_name,
        position=record.position,
    )
    updated = crud.update_record(db, record, payload)
    current_anchor_date = updated.invite_date or updated.onboard_date
    current_scope = resolve_interview_registration_scope(
        campus=updated.campus_name,
        position=updated.position,
    )
    if previous_scope and previous_anchor_date:
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            anchor_date=previous_anchor_date,
            scope=previous_scope,
            source="interview_registration_update_previous",
        )
    if current_scope and current_anchor_date:
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            anchor_date=current_anchor_date,
            scope=current_scope,
            source="interview_registration_update_current",
        )
    return updated


@router.delete(
    "/interview-registrations/{record_id}",
    summary="删除面试登记记录",
)
def delete_interview_registration(
    background_tasks: BackgroundTasks,
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="面试登记记录不存在")
    anchor_date = record.invite_date or record.onboard_date
    scope = resolve_interview_registration_scope(
        campus=record.campus_name,
        position=record.position,
    )
    crud.delete_record(db, record)
    if scope:
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            anchor_date=anchor_date,
            scope=scope,
            source="interview_registration_delete",
        )
    return {"success": True}
