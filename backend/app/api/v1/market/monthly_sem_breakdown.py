"""市场部月度SEM推广分解表 - API路由

提供SEM推广分解的查询和保存API
"""

from app.core.database import get_db
from app.schemas.market.monthly_sem_breakdown import (
    SEMBreakdownSaveRequest,
)
from app.services.market.monthly_sem_breakdown import (
    get_sem_breakdown_list,
    save_sem_breakdown_list,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix='/monthly-sem-breakdown', tags=['市场部月度SEM推广分解'])


# ============================================================
# SEM推广分解 API
# ============================================================

@router.get(
    '',
    summary='获取SEM推广分解列表',
)
def get_list(
    year: int = Query(..., description='年份'),
    month: int = Query(..., description='月份'),
    db: Session = Depends(get_db)
):
    data = get_sem_breakdown_list(db, year, month)
    data_list = [item.model_dump(by_alias=True) for item in data]
    return {'code': 200, 'message': 'success', 'data': data_list}


@router.post(
    '/save',
    summary='保存SEM推广分解',
)
def save_list(
    request: SEMBreakdownSaveRequest,
    db: Session = Depends(get_db)
):
    save_sem_breakdown_list(db, request.year, request.month, request.data)
    return {'code': 200, 'message': '保存成功'}
