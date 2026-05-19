"""
市场部月拍摄明细表 API
"""
from app.core.database import get_db
from app.schemas.market.shooting_detail import (
    ShootingDetailListResponse,
    ShootingDetailSaveRequest,
)
from app.services.market import shooting_detail as service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/shooting-detail", tags=["市场部月拍摄明细"])


@router.get(
    "",
    response_model=ShootingDetailListResponse,
    summary="获取月拍摄明细列表"
)
def get_shooting_details(
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db)
):
    """获取指定年月的拍摄明细"""
    return service.get_shooting_detail_list(db, year, month)


@router.post(
    "/save",
    response_model=ShootingDetailListResponse,
    summary="保存月拍摄明细"
)
def save_shooting_details(
    request: ShootingDetailSaveRequest,
    db: Session = Depends(get_db)
):
    """保存拍摄明细（替换式保存）"""
    return service.save_shooting_details(db, request)
