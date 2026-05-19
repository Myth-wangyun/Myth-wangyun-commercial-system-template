"""市场部剪辑周度汇报表 - API路由

提供剪辑周度汇报的查询和保存API
"""

from app.core.database import get_db
from app.schemas.market.weekly_edit_report import (
    WeeklyEditReportListResponse,
    WeeklyEditReportSaveRequest,
)
from app.services.market.weekly_edit_report import (
    get_weekly_edit_report_list,
    save_weekly_edit_report_list,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix='/weekly-edit-report', tags=['市场部剪辑周度汇报'])


# ============================================================
# 剪辑周度汇报 API
# ============================================================

@router.get(
    '',
    response_model=WeeklyEditReportListResponse,
    summary='获取剪辑周度汇报列表',
)
def get_weekly_edit_reports(
    year: int = Query(..., description='年份，如：2025'),
    month: int = Query(..., ge=1, le=12, description='月份(1-12)，如：9'),
    db: Session = Depends(get_db),
):
    """获取指定年月的剪辑周度汇报列表"""
    return get_weekly_edit_report_list(db, year, month)


@router.post(
    '/save',
    response_model=WeeklyEditReportListResponse,
    summary='保存剪辑周度汇报列表',
)
def save_weekly_edit_reports(
    payload: WeeklyEditReportSaveRequest,
    db: Session = Depends(get_db),
):
    """保存剪辑周度汇报列表（整表覆盖）"""
    return save_weekly_edit_report_list(
        db,
        payload.year,
        payload.month,
        payload.items,
    )
