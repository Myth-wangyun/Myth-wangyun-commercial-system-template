"""
教学质量模块 - 神殿活动计划安排表 API
路由：/api/v1/teaching-quality/campus-activity-plan
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQactivity_plan_arrangement_db import (
    fetch_activity_plan_rows,
    init_activity_plan_tables,
    replace_activity_plan_rows,
)

router = APIRouter()


# ===== Schemas =====
class ActivityPlanRow(BaseModel):
    序号: int
    时间: Optional[str] = None
    地点: Optional[str] = None
    活动形式: Optional[str] = None
    主要内容: Optional[str] = None
    负责人: Optional[str] = None
    预期结果: Optional[str] = None
    过程关键点: Optional[str] = None
    实标结果: Optional[str] = None


class ActivityPlanList(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[ActivityPlanRow] = Field(default_factory=list)


@router.get("/campus-activity-plan", response_model=ActivityPlanList, summary="获取神殿活动计划安排表")
def get_activity_plan(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_activity_plan_tables()
    rows = fetch_activity_plan_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    out = [
        ActivityPlanRow(
            序号=r.序号,
            时间=r.时间,
            地点=r.地点,
            活动形式=r.活动形式,
            主要内容=r.主要内容,
            负责人=r.负责人,
            预期结果=r.预期结果,
            过程关键点=r.过程关键点,
            实标结果=r.实标结果,
        )
        for r in rows
    ]
    return ActivityPlanList(神殿名称=campus, 年份=year, 月份=month, 行列表=out)


class ActivityPlanSavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[ActivityPlanRow] = Field(default_factory=list)


@router.post("/campus-activity-plan", response_model=ActivityPlanList, summary="保存神殿活动计划安排表（按维度覆盖写入）")
def save_activity_plan(payload: ActivityPlanSavePayload, db: Session = Depends(get_db)):
    init_activity_plan_tables()
    replace_activity_plan_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 读取并返回刚保存的数据
    rows = fetch_activity_plan_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
    )
    out = [
        ActivityPlanRow(
            序号=r.序号,
            时间=r.时间,
            地点=r.地点,
            活动形式=r.活动形式,
            主要内容=r.主要内容,
            负责人=r.负责人,
            预期结果=r.预期结果,
            过程关键点=r.过程关键点,
            实标结果=r.实标结果,
        )
        for r in rows
    ]
    return ActivityPlanList(
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )

