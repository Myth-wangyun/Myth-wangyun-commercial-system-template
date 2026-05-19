"""
市场部月拍摄明细表服务层
"""

from app.crud.market import shooting_detail as crud
from app.schemas.market.shooting_detail import (
    ShootingDetailListResponse,
    ShootingDetailOut,
    ShootingDetailSaveRequest,
)
from sqlalchemy.orm import Session


def get_shooting_detail_list(db: Session, year: int, month: int) -> ShootingDetailListResponse:
    """
    获取拍摄明细列表
    
    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        
    Returns:
        拍摄明细列表响应
    """
    details_db = crud.get_shooting_details(db, year, month)
    
    items = [ShootingDetailOut.model_validate(detail) for detail in details_db]
    
    return ShootingDetailListResponse(
        items=items,
        total=len(items)
    )


def save_shooting_details(
    db: Session,
    request: ShootingDetailSaveRequest
) -> ShootingDetailListResponse:
    """
    保存拍摄明细
    
    Args:
        db: 数据库会话
        request: 保存请求
        
    Returns:
        保存后的拍摄明细列表
    """
    new_records = crud.replace_shooting_details(
        db,
        request.year,
        request.month,
        request.items
    )
    
    items = [ShootingDetailOut.model_validate(record) for record in new_records]
    
    return ShootingDetailListResponse(
        items=items,
        total=len(items)
    )
