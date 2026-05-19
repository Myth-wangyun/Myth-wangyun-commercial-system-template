"""
集团人资基础 - 培训目标 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import training_goal as crud
from .....models.user import User
from .....schemas.human_resources.training_goal import (
    TrainingGoalCreate,
    TrainingGoalOut,
    TrainingGoalUpdate,
)

router = APIRouter()


@router.get(
    "/training-goals",
    response_model=List[TrainingGoalOut],
    summary="获取培训目标列表",
)
def list_training_goals(
    year: Optional[str] = Query(None, description="按年度过滤"),
    parent_category: Optional[str] = Query(None, description="按一级分类过滤"),
    level: Optional[str] = Query(None, description="按培训级别过滤"),
    search: Optional[str] = Query(None, description="搜索分类、目标或备注"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    records = crud.list_records(
        db,
        year=year,
        parent_category=parent_category,
        level=level,
        search=search,
    )
    return [crud.serialize_record(item) for item in records]


@router.post(
    "/training-goals",
    response_model=TrainingGoalOut,
    summary="创建培训目标",
)
def create_training_goal(
    payload: TrainingGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_record(db, payload, current_user)
        return crud.serialize_record(record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/training-goals/{record_id}",
    response_model=TrainingGoalOut,
    summary="获取培训目标详情",
)
def get_training_goal(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训目标不存在")
    return crud.serialize_record(record)


@router.put(
    "/training-goals/{record_id}",
    response_model=TrainingGoalOut,
    summary="更新培训目标",
)
def update_training_goal(
    record_id: int = Path(..., description="记录ID"),
    payload: TrainingGoalUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训目标不存在")
    try:
        updated = crud.update_record(db, record, payload)
        return crud.serialize_record(updated)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/training-goals/{record_id}",
    summary="删除培训目标",
)
def delete_training_goal(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="培训目标不存在")
    crud.delete_record(db, record)
    return {"success": True}
