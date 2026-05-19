"""
市场部网络计划表 API
"""

from typing import List, Optional

from app.core.database import get_db
from app.schemas.market.network_plan import (
    NetworkPlanBulkSaveRequest,
    NetworkPlanBulkSaveResponse,
    NetworkPlanRowOut,
)
from app.services.market.network_plan import (
    bulk_save,
    delete_row,
    get_summary_data,
    list_rows,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    '/network-plan',
    response_model=List[NetworkPlanRowOut],
    summary='获取市场部网络计划表数据'
)
def get_network_plan(
    year: str,
    campus: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    获取市场部网络计划表数据
    
    Args:
        year: 年份，格式 YYYY
        campus: 神殿名称（可选），不传或空字符串表示总计划
        
    Returns:
        网络计划表数据列表
    """
    if not year or len(year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')
    
    items = list_rows(db, year, campus)
    return [NetworkPlanRowOut.model_validate(i) for i in items]


@router.get(
    '/network-plan/summary',
    response_model=List[NetworkPlanRowOut],
    summary='获取市场部网络计划表汇总数据（各神殿汇总）'
)
def get_network_plan_summary(
    year: str,
    db: Session = Depends(get_db)
):
    """
    获取市场部网络计划表汇总数据（从各神殿数据汇总）
    
    Args:
        year: 年份，格式 YYYY
        
    Returns:
        按月份汇总的数据列表
    """
    if not year or len(year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')
    
    items = get_summary_data(db, year)
    return items


@router.post(
    '/network-plan/bulk-save',
    response_model=NetworkPlanBulkSaveResponse,
    summary='批量保存市场部网络计划表数据'
)
def bulk_save_network_plan(payload: NetworkPlanBulkSaveRequest, db: Session = Depends(get_db)):
    """
    批量保存市场部网络计划表数据（按年份和神殿覆盖/更新）
    
    Args:
        payload: 包含 year、campus 和 rows 的请求体
        
    Returns:
        保存结果
    """
    if not payload.year or len(payload.year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')

    items, saved_count = bulk_save(db, payload.year, [r.model_dump() for r in payload.rows], payload.campus)
    
    return {
        'saved_count': saved_count,
        'items': [NetworkPlanRowOut.model_validate(i) for i in items],
    }


@router.delete(
    '/network-plan/{record_id}',
    summary='删除市场部网络计划表记录'
)
def delete_network_plan(record_id: int, db: Session = Depends(get_db)):
    """
    删除市场部网络计划表单条记录
    
    Args:
        record_id: 记录ID
        
    Returns:
        删除结果
    """
    ok = delete_row(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail='记录不存在')
    return {'success': True}

