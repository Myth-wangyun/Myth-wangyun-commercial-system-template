"""市场部剪辑周度汇报表 - Service层"""

from __future__ import annotations

from typing import List

from app.crud.market.weekly_edit_report import (
    get_weekly_edit_reports,
    replace_weekly_edit_reports,
)
from app.schemas.market.weekly_edit_report import (
    WeeklyEditReportCreate,
    WeeklyEditReportListResponse,
    WeeklyEditReportOut,
)
from sqlalchemy.orm import Session

# ============================================================
# 剪辑周度汇报 Service
# ============================================================

def get_weekly_edit_report_list(
    db: Session,
    year: int,
    month: int,
) -> WeeklyEditReportListResponse:
    """获取指定年月的剪辑周度汇报列表

    Args:
        db: 数据库会话
        year: 年份，如：2025
        month: 月份，如：9

    Returns:
        剪辑周度汇报列表响应
    """
    reports_db = get_weekly_edit_reports(db, year, month)

    items = [
        WeeklyEditReportOut.model_validate(report)
        for report in reports_db
    ]

    return WeeklyEditReportListResponse(
        year=year,
        month=month,
        items=items,
        total=len(items),
    )


def save_weekly_edit_report_list(
    db: Session,
    year: int,
    month: int,
    items: List[WeeklyEditReportCreate],
) -> WeeklyEditReportListResponse:
    """保存剪辑周度汇报列表（整表覆盖）

    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        items: 汇报数据列表

    Returns:
        保存后的剪辑周度汇报列表响应
    """
    saved_entities = replace_weekly_edit_reports(db, year, month, items)

    saved_items = [
        WeeklyEditReportOut.model_validate(entity)
        for entity in saved_entities
    ]

    return WeeklyEditReportListResponse(
        year=year,
        month=month,
        items=saved_items,
        total=len(saved_items),
    )
