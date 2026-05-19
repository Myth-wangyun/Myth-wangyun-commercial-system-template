"""市场部剪辑月度汇报表 - API路由

提供剪辑月度汇报的查询和保存API
"""

from app.core.database import get_db
from app.schemas.market.monthly_edit_report import (
    MonthlyEditReportSaveRequest,
)
from app.services.market.monthly_edit_report import (
    generate_from_weekly,
    get_monthly_edit_report_list,
    save_monthly_edit_report_list,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix='/monthly-edit-report', tags=['市场部剪辑月度汇报'])


# ============================================================
# 剪辑月度汇报 API
# ============================================================

@router.get(
    '',
    summary='获取剪辑月度汇报列表',
)
def get_list(
    year: int = Query(..., description='年份'),
    db: Session = Depends(get_db)
):
    data = get_monthly_edit_report_list(db, year)
    # 使用 by_alias=True 确保返回 camelCase 字段名
    data_list = [item.model_dump(by_alias=True) for item in data]
    return {'code': 200, 'message': 'success', 'data': data_list}


@router.get(
    '/refresh',
    summary='从周度表刷新剪辑月度汇报数据',
)
def refresh_from_weekly(
    year: int = Query(..., description='年份'),
    db: Session = Depends(get_db)
):
    """强制从周度表重新生成月度数据（忽略已保存的数据）"""
    data = generate_from_weekly(db, year)
    data_list = [item.model_dump(by_alias=True) for item in data]
    return {'code': 200, 'message': 'success', 'data': data_list}


@router.post(
    '/save',
    summary='保存剪辑月度汇报',
)
def save_list(
    request: MonthlyEditReportSaveRequest,
    db: Session = Depends(get_db)
):
    save_monthly_edit_report_list(db, request.year, request.data)
    return {'code': 200, 'message': '保存成功'}
