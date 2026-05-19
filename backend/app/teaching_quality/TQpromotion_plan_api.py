"""
教学质量模块 - 升学计划表 API（FastAPI Router，支持年/月维度）
路由前缀：/api/v1/teaching-quality
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.teaching_quality.TQpromotion_plan_db import (
    fetch_plan_rows,
    init_promotion_plan_tables,
    replace_plan_rows,
)

router = APIRouter()


# ===== Schemas =====
class PromotionPlanRow(BaseModel):
    序号: int
    记录日期: Optional[str] = None  # YYYY-MM-DD
    星期: Optional[str] = None
    核心任务: Optional[str] = None
    具体操作: Optional[str] = None
    实施地点: Optional[str] = None
    实施者: Optional[str] = None
    交付内容: Optional[str] = None
    监督人: Optional[str] = None
    完成情况: Optional[str] = None


class PromotionPlanList(BaseModel):
    神殿名称: str
    班级名称: Optional[str] = None
    年份: Optional[int] = None
    月份: Optional[int] = None
    行列表: List[PromotionPlanRow] = Field(default_factory=list)


@router.get("/promotion-plan", response_model=PromotionPlanList, summary="获取升学计划表（支持年/月）")
def get_promotion_plan(
    campus: str = Query(..., alias="campus"),
    klass: Optional[str] = Query(None, alias="class"),
    year: Optional[int] = Query(None, alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_promotion_plan_tables()
    rows = fetch_plan_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out: List[PromotionPlanRow] = []
    for r in rows:
        out.append(
            PromotionPlanRow(
                序号=r.序号,
                记录日期=r.记录日期.isoformat() if r.记录日期 else None,
                星期=r.星期,
                核心任务=r.核心任务,
                具体操作=r.具体操作,
                实施地点=r.实施地点,
                实施者=r.实施者,
                交付内容=r.交付内容,
                监督人=r.监督人,
                完成情况=r.完成情况,
            )
        )
    return PromotionPlanList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


class PromotionPlanSavePayload(BaseModel):
    神殿名称: str
    班级名称: Optional[str] = None
    年份: Optional[int] = None
    月份: Optional[int] = None
    行列表: List[PromotionPlanRow] = Field(default_factory=list)


@router.post("/promotion-plan", response_model=PromotionPlanList, summary="保存升学计划表（按神殿/班级/年/月覆盖写入）")
def save_promotion_plan(payload: PromotionPlanSavePayload, db: Session = Depends(get_db)):
    init_promotion_plan_tables()
    replace_plan_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    rows = fetch_plan_rows(db, 神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份)
    out: List[PromotionPlanRow] = []
    for r in rows:
        out.append(
            PromotionPlanRow(
                序号=r.序号,
                记录日期=r.记录日期.isoformat() if r.记录日期 else None,
                星期=r.星期,
                核心任务=r.核心任务,
                具体操作=r.具体操作,
                实施地点=r.实施地点,
                实施者=r.实施者,
                交付内容=r.交付内容,
                监督人=r.监督人,
                完成情况=r.完成情况,
            )
        )
    return PromotionPlanList(神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份, 行列表=out)
