"""
集团人资基础 - 晋升面试评价表 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import promotion_interview as crud
from .....models.user import User
from .....schemas.human_resources import (
    PromotionInterviewCreate,
    PromotionInterviewOut,
    PromotionInterviewUpdate,
)

router = APIRouter()


@router.get(
    "/promotion-interviews",
    response_model=List[PromotionInterviewOut],
    summary="获取晋升面试评价表列表",
)
def list_promotion_interviews(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    status: Optional[str] = Query(None, description="按状态过滤"),
    search: Optional[str] = Query(None, description="按姓名/岗位/评价人搜索"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return crud.list_records(
        db,
        campus=campus,
        department=department,
        status=status,
        search=search,
    )


@router.post(
    "/promotion-interviews",
    response_model=PromotionInterviewOut,
    summary="创建晋升面试评价记录",
)
def create_promotion_interview(
    payload: PromotionInterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.create_record(db, payload, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/promotion-interviews/{record_id}",
    response_model=PromotionInterviewOut,
    summary="获取晋升面试评价详情",
)
def get_promotion_interview(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升面试评价记录不存在")
    return record


@router.put(
    "/promotion-interviews/{record_id}",
    response_model=PromotionInterviewOut,
    summary="更新晋升面试评价记录",
)
def update_promotion_interview(
    record_id: int = Path(..., description="记录ID"),
    payload: PromotionInterviewUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升面试评价记录不存在")
    try:
        return crud.update_record(db, record, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/promotion-interviews/{record_id}",
    summary="删除晋升面试评价记录",
)
def delete_promotion_interview(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="晋升面试评价记录不存在")
    crud.delete_record(db, record)
    return {"success": True}
