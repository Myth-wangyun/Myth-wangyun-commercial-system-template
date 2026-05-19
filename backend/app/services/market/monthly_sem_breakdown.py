"""市场部月度SEM推广分解表 - Service

业务逻辑层
"""

from typing import List

from app.crud.market.monthly_sem_breakdown import get_sem_breakdown_list as crud_get_list
from app.crud.market.monthly_sem_breakdown import save_sem_breakdown_list as crud_save_list
from app.schemas.market.monthly_sem_breakdown import SEMBreakdownBase
from sqlalchemy.orm import Session


def get_sem_breakdown_list(
    db: Session,
    year: int,
    month: int
) -> List[SEMBreakdownBase]:
    """获取SEM推广分解列表"""
    return crud_get_list(db, year, month)


def save_sem_breakdown_list(
    db: Session,
    year: int,
    month: int,
    data: List[SEMBreakdownBase]
) -> bool:
    """保存SEM推广分解数据"""
    return crud_save_list(db, year, month, data)
