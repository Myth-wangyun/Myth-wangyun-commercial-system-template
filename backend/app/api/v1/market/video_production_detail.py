"""市场部视频剪辑制作明细 - API路由

提供视频制作明细的查询和保存API
"""

from app.core.database import get_db
from app.schemas.market.video_production_detail import (
    VideoProductionDetailListResponse,
    VideoProductionDetailSaveRequest,
)
from app.services.market.video_production_detail import (
    get_video_production_detail_list,
    save_video_production_detail_list,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix='/video-production-detail', tags=['市场部视频制作明细'])


# ============================================================
# 视频制作明细 API
# ============================================================

@router.get(
    '',
    response_model=VideoProductionDetailListResponse,
    summary='获取视频制作明细列表',
)
def get_video_production_details(
    year: int = Query(..., description='年份，如：2025'),
    month: int = Query(..., ge=1, le=12, description='月份(1-12)，如：9'),
    db: Session = Depends(get_db),
):
    """获取指定年月的视频制作明细列表"""
    return get_video_production_detail_list(db, year, month)


@router.post(
    '/save',
    response_model=VideoProductionDetailListResponse,
    summary='保存视频制作明细列表',
)
def save_video_production_details(
    payload: VideoProductionDetailSaveRequest,
    db: Session = Depends(get_db),
):
    """保存视频制作明细列表（整表覆盖）"""
    return save_video_production_detail_list(
        db,
        payload.year,
        payload.month,
        payload.items,
    )
