"""
市场部培训周度表 API
"""

from typing import Any, Dict, List

from app.core.database import get_db
from app.schemas.market.weekly_training import (
    MonthlyTrainingBulkSaveRequest,
    MonthlyTrainingBulkSaveResponse,
    SummaryTrainingBulkSaveRequest,
    SummaryTrainingBulkSaveResponse,
    WeeklyTrainingBulkSaveRequest,
    WeeklyTrainingBulkSaveResponse,
    WeeklyTrainingListResponse,
    WeeklyTrainingRowOut,
    WeeklyTrainingTotals,
)
from app.services.market.weekly_training import (
    bulk_save,
    delete_row,
    get_monthly_summary,
    get_training_summary,
    list_rows,
    save_monthly_remarks,
    save_summary_remarks,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    '/weekly-training',
    response_model=WeeklyTrainingListResponse,
    summary='获取市场部培训周度表数据'
)
def get_weekly_training(year_month: str | None = None, db: Session = Depends(get_db)):
    """
    获取市场部培训周度表数据
    
    Args:
        year_month: 年月筛选，格式 YYYY-MM（可选）
        
    Returns:
        培训周度表数据列表和合计
    """
    items, totals = list_rows(db, year_month)

    return {
        'items': [WeeklyTrainingRowOut.model_validate(i) for i in items],
        'totals': WeeklyTrainingTotals(**totals),
    }


@router.post(
    '/weekly-training/bulk-save',
    response_model=WeeklyTrainingBulkSaveResponse,
    summary='批量保存市场部培训周度表数据'
)
def bulk_save_weekly_training(payload: WeeklyTrainingBulkSaveRequest, db: Session = Depends(get_db)):
    """
    批量保存市场部培训周度表数据（按年月覆盖/更新）
    
    Args:
        payload: 包含 year_month 和 rows 的请求体
        
    Returns:
        保存结果
    """
    if not payload.year_month:
        raise HTTPException(status_code=400, detail='缺少 year_month 参数')

    items, totals = bulk_save(db, payload.year_month, [r.model_dump() for r in payload.rows])
    
    return {
        'saved_count': len(items),
        'items': [WeeklyTrainingRowOut.model_validate(i) for i in items],
        'totals': WeeklyTrainingTotals(**totals),
    }


@router.delete(
    '/weekly-training/{record_id}',
    summary='删除市场部培训周度表记录'
)
def delete_weekly_training(record_id: int, db: Session = Depends(get_db)):
    """
    删除市场部培训周度表单条记录
    
    Args:
        record_id: 记录ID
        
    Returns:
        删除结果
    """
    ok = delete_row(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail='记录不存在')
    return {'success': True}


@router.get(
    '/monthly-training-summary',
    response_model=List[Dict[str, Any]],
    summary='获取市场部培训月度表汇总数据'
)
def get_monthly_training_summary(year: str, db: Session = Depends(get_db)):
    """
    从培训周度表汇总数据生成培训月度表
    
    Args:
        year: 年份，格式 YYYY
        
    Returns:
        月度汇总数据列表
    """
    if not year or len(year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')
    
    return get_monthly_summary(db, year)


@router.post(
    '/monthly-training-remarks/bulk-save',
    response_model=MonthlyTrainingBulkSaveResponse,
    summary='批量保存市场部培训月度表备注'
)
def bulk_save_monthly_remarks(payload: MonthlyTrainingBulkSaveRequest, db: Session = Depends(get_db)):
    """
    批量保存市场部培训月度表备注
    
    Args:
        payload: 包含 year 和 remarks 的请求体
        
    Returns:
        保存结果
    """
    if not payload.year or len(payload.year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')

    saved_count = save_monthly_remarks(
        db,
        payload.year,
        [r.model_dump() for r in payload.remarks]
    )
    
    return {
        'saved_count': saved_count,
    }


@router.get(
    '/training-summary',
    response_model=List[Dict[str, Any]],
    summary='获取市场部培训汇总表数据'
)
def get_training_summary_api(year: str, db: Session = Depends(get_db)):
    """
    从培训周度表汇总数据生成培训汇总表
    
    按岗位汇总该年度的累计培训次数、培训人数、合格人数和考试合格率
    
    Args:
        year: 年份，格式 YYYY
        
    Returns:
        汇总数据列表
    """
    if not year or len(year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')
    
    return get_training_summary(db, year)


@router.post(
    '/training-summary-remarks/bulk-save',
    response_model=SummaryTrainingBulkSaveResponse,
    summary='批量保存市场部培训汇总表备注'
)
def bulk_save_summary_remarks(payload: SummaryTrainingBulkSaveRequest, db: Session = Depends(get_db)):
    """
    批量保存市场部培训汇总表备注
    
    Args:
        payload: 包含 year 和 remarks 的请求体
        
    Returns:
        保存结果
    """
    if not payload.year or len(payload.year) != 4:
        raise HTTPException(status_code=400, detail='请提供有效的年份（格式：YYYY）')

    saved_count = save_summary_remarks(
        db,
        payload.year,
        [r.model_dump() for r in payload.remarks]
    )
    
    return {
        'saved_count': saved_count,
    }

