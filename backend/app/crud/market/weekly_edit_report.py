"""市场部剪辑周度汇报表 - CRUD操作"""

from __future__ import annotations

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.market.weekly_edit_report import 市场部剪辑周度汇报表
from app.schemas.market.weekly_edit_report import WeeklyEditReportCreate

# ============================================================
# 剪辑周度汇报 CRUD
# ============================================================

def get_weekly_edit_reports(
    db: Session,
    year: int,
    month: int,
) -> List[市场部剪辑周度汇报表]:
    """获取指定年月的剪辑周度汇报列表"""
    return (
        db.query(市场部剪辑周度汇报表)
        .filter(
            and_(
                市场部剪辑周度汇报表.year == year,
                市场部剪辑周度汇报表.month == month,
            )
        )
        .order_by(市场部剪辑周度汇报表.id.asc())
        .all()
    )


def replace_weekly_edit_reports(
    db: Session,
    year: int,
    month: int,
    items: List[WeeklyEditReportCreate],
) -> List[市场部剪辑周度汇报表]:
    """替换指定年月的剪辑周度汇报（整表覆盖）

    Args:
        db: 数据库会话
        year: 年份
        month: 月份
        items: 汇报数据列表

    Returns:
        新插入的汇报列表
    """
    # 删除该年月的旧数据
    db.query(市场部剪辑周度汇报表).filter(
        and_(
            市场部剪辑周度汇报表.year == year,
            市场部剪辑周度汇报表.month == month,
        )
    ).delete(synchronize_session=False)

    # 插入新数据
    entities = []
    for item in items:
        entity = 市场部剪辑周度汇报表(
            year=year,
            month=month,
            week=item.week,
            row_type=item.row_type,
            week_label=item.week_label or '',
            week_date_range=item.week_date_range or '',
            campus=item.campus or '',
            audience_type_count=item.audience_type_count or 0,
            planned_articles=item.planned_articles or 0,
            actual_articles=item.actual_articles or 0,
            planned_edit_demand=item.planned_edit_demand or 0,
            completed_edit_demand=item.completed_edit_demand or 0,
            actual_shoot_videos=item.actual_shoot_videos or 0,
            shoot_edit_completion_rate=item.shoot_edit_completion_rate or '',
            shoot_completion_progress=item.shoot_completion_progress or '',
            monthly_edit_plans=item.monthly_edit_plans or 0,
            completed_early_plans=item.completed_early_plans or 0,
            actual_edited_videos=item.actual_edited_videos or 0,
            edit_progress_rate=item.edit_progress_rate or '',
            released_video_count=item.released_video_count or 0,
            release_rate=item.release_rate or '',
            audit_pass_video_count=item.audit_pass_video_count or 0,
            audit_pass_rate=item.audit_pass_rate or '',
            group_activity=item.group_activity or '',
        )
        db.add(entity)
        entities.append(entity)

    if entities:
        db.commit()
        for entity in entities:
            db.refresh(entity)

    return entities
