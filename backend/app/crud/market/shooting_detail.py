"""
市场部月拍摄明细表 CRUD
"""
from typing import List

from sqlalchemy.orm import Session

from app.models.market.shooting_detail import 市场部月拍摄明细表
from app.schemas.market.shooting_detail import ShootingDetailBase


def get_shooting_details(db: Session, year: int, month: int) -> List[市场部月拍摄明细表]:
    """
    获取指定年月的拍摄明细
    
    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        
    Returns:
        拍摄明细列表
    """
    return (
        db.query(市场部月拍摄明细表)
        .filter(
            市场部月拍摄明细表.year == year,
            市场部月拍摄明细表.month == month
        )
        .order_by(市场部月拍摄明细表.sequence.asc(), 市场部月拍摄明细表.id.asc())
        .all()
    )


def replace_shooting_details(
    db: Session,
    year: int,
    month: int,
    items: List[ShootingDetailBase]
) -> List[市场部月拍摄明细表]:
    """
    替换指定年月的拍摄明细（先删除后插入）
    
    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        items: 拍摄明细数据列表
        
    Returns:
        新插入的拍摄明细列表
    """
    # 删除旧数据
    db.query(市场部月拍摄明细表).filter(
        市场部月拍摄明细表.year == year,
        市场部月拍摄明细表.month == month
    ).delete()
    
    # 插入新数据
    new_records = []
    for idx, item in enumerate(items, start=1):
        record = 市场部月拍摄明细表(
            year=year,
            month=month,
            sequence=idx,
            shooting_date=item.shooting_date,
            shooting_campus=item.shooting_campus,
            appearing_teacher=item.appearing_teacher,
            appearing_reward_standard=item.appearing_reward_standard,
            appearing_reward_amount=item.appearing_reward_amount or 0,
            assisting_teacher=item.assisting_teacher,
            responsible_campus=item.responsible_campus,
            assisting_reward_standard=item.assisting_reward_standard,
            assisting_reward_amount=item.assisting_reward_amount or 0,
            total_reward_amount=item.total_reward_amount or 0,
            remark=item.remark,
        )
        db.add(record)
        new_records.append(record)
    
    db.commit()
    
    # 刷新数据
    for record in new_records:
        db.refresh(record)
    
    return new_records
