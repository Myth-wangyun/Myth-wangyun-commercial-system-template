"""市场部视频剪辑制作明细 - CRUD操作"""

from __future__ import annotations

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.market.video_production_detail import 市场部视频制作明细表
from app.schemas.market.video_production_detail import VideoProductionDetailCreate

# ============================================================
# 视频制作明细 CRUD
# ============================================================

def get_video_production_details(
    db: Session,
    year: int,
    month: int,
) -> List[市场部视频制作明细表]:
    """获取指定年月的视频制作明细列表"""
    return (
        db.query(市场部视频制作明细表)
        .filter(
            and_(
                市场部视频制作明细表.year == year,
                市场部视频制作明细表.month == month,
            )
        )
        .order_by(市场部视频制作明细表.sequence.asc(), 市场部视频制作明细表.id.asc())
        .all()
    )


def replace_video_production_details(
    db: Session,
    year: int,
    month: int,
    items: List[VideoProductionDetailCreate],
) -> List[市场部视频制作明细表]:
    """替换指定年月的视频制作明细（整表覆盖）
    
    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        items: 视频明细列表
    
    Returns:
        新插入的明细列表
    """
    # 删除该年月的旧数据
    db.query(市场部视频制作明细表).filter(
        and_(
            市场部视频制作明细表.year == year,
            市场部视频制作明细表.month == month,
        )
    ).delete(synchronize_session=False)

    # 插入新数据
    entities = []
    for idx, item in enumerate(items, start=1):
        entity = 市场部视频制作明细表(
            year=year,
            month=month,
            sequence=item.sequence or idx,
            copywriting_date=item.copywriting_date or '',
            theme=item.theme or '',
            target_audience=item.target_audience or '',
            campus=item.campus or '',
            actual_shooting_date=item.actual_shooting_date or '',
            video_name=item.video_name or '',
            duration=item.duration,
            remark_link=item.remark_link or '',
        )
        db.add(entity)
        entities.append(entity)

    if entities:
        db.commit()
        for entity in entities:
            db.refresh(entity)

    return entities
