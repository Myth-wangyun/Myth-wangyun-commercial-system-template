"""
集团人资基础 - 培训满意度调查 API
"""

from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import training_satisfaction as crud
from .....models.user import User
from .....schemas.human_resources.training_satisfaction import (
    TrainingSatisfactionCreate,
    TrainingSatisfactionOut,
    TrainingSatisfactionUpdate,
)
from ._dashboard_refresh import schedule_dashboard_refresh

router = APIRouter()


@router.get(
    "/training-satisfaction-surveys",
    response_model=List[TrainingSatisfactionOut],
    summary="获取培训满意度调查列表",
)
def list_training_satisfaction_surveys(
    year: Optional[str] = Query(None, description="按年度过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    search: Optional[str] = Query(None, description="按部门/课程/讲师等搜索"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
    response: Response = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    records, total = crud.list_records(
        db,
        year=year,
        department=department,
        search=search,
        page=page,
        page_size=page_size,
        return_total=True,
    )
    if response is not None:
        response.headers["X-Total-Count"] = str(total)
        response.headers["X-Page"] = str(page)
        response.headers["X-Page-Size"] = str(page_size)
    return [crud.serialize_record(item) for item in records]


@router.post(
    "/training-satisfaction-surveys",
    response_model=TrainingSatisfactionOut,
    summary="创建培训满意度调查",
)
def create_training_satisfaction_survey(
    payload: TrainingSatisfactionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_record(db, payload, current_user)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=record.training_date,
            department=record.department,
        )
        return crud.serialize_record(record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/training-satisfaction-surveys/{record_id}",
    response_model=TrainingSatisfactionOut,
    summary="获取培训满意度调查详情",
)
def get_training_satisfaction_survey(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训满意度调查不存在")
    return crud.serialize_record(record)


@router.put(
    "/training-satisfaction-surveys/{record_id}",
    response_model=TrainingSatisfactionOut,
    summary="更新培训满意度调查",
)
def update_training_satisfaction_survey(
    background_tasks: BackgroundTasks,
    record_id: int = Path(..., description="记录ID"),
    payload: TrainingSatisfactionUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训满意度调查不存在")
    try:
        updated = crud.update_record(db, record, payload)
        schedule_dashboard_refresh(
            background_tasks,
            anchor_date=updated.training_date,
            department=updated.department,
        )
        return crud.serialize_record(updated)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/training-satisfaction-surveys/{record_id}",
    summary="删除培训满意度调查",
)
def delete_training_satisfaction_survey(
    background_tasks: BackgroundTasks,
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训满意度调查不存在")
    anchor_date = record.training_date
    department = record.department
    crud.delete_record(db, record)
    schedule_dashboard_refresh(
        background_tasks,
        anchor_date=anchor_date,
        department=department,
    )
    return {"success": True}
