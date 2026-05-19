"""市场部视频剪辑制作明细 - Service层"""

from __future__ import annotations

from typing import List

from app.crud.market.video_production_detail import (
    get_video_production_details,
    replace_video_production_details,
)
from app.schemas.market.video_production_detail import (
    VideoProductionDetailCreate,
    VideoProductionDetailListResponse,
    VideoProductionDetailOut,
)
from sqlalchemy.orm import Session

# ============================================================
# 视频制作明细 Service
# ============================================================

def get_video_production_detail_list(
    db: Session,
    year: int,
    month: int,
) -> VideoProductionDetailListResponse:
    """获取指定年月的视频制作明细列表
    
    Args:
        db: 数据库会话
        year: 年份，如：2025
        month: 月份，如：9
    
    Returns:
        视频制作明细列表响应
    """
    details_db = get_video_production_details(db, year, month)
    
    items = [
        VideoProductionDetailOut.model_validate(detail)
        for detail in details_db
    ]
    
    return VideoProductionDetailListResponse(
        year=year,
        month=month,
        items=items,
        total=len(items),
    )


def save_video_production_detail_list(
    db: Session,
    year: int,
    month: int,
    items: List[VideoProductionDetailCreate],
) -> VideoProductionDetailListResponse:
    """保存视频制作明细列表（整表覆盖）
    
    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        items: 视频明细列表
    
    Returns:
        保存后的视频制作明细列表响应
    """
    saved_entities = replace_video_production_details(db, year, month, items)
    
    saved_items = [
        VideoProductionDetailOut.model_validate(entity)
        for entity in saved_entities
    ]
    
    return VideoProductionDetailListResponse(
        year=year,
        month=month,
        items=saved_items,
        total=len(saved_items),
    )
