"""
教学质量模块 - 企业文化宣讲计划表 API
路由：/api/v1/teaching-quality/culture-presentation-plan
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQculture_presentation_plan_db import (
    delete_plan_rows,
    fetch_plan_rows,
    init_culture_presentation_plan_tables,
    replace_plan_rows,
)

router = APIRouter()


class CulturePresentationRow(BaseModel):
    序号: int
    宣讲时间: Optional[str] = None
    宣讲地点: Optional[str] = None
    宣讲方式: Optional[str] = None
    宣讲主题: Optional[str] = None
    宣讲内容概述: Optional[str] = None
    宣讲对象: Optional[str] = None
    主讲人: Optional[str] = None
    需准备资料: Optional[str] = None
    备注: Optional[str] = None


class CulturePresentationPlan(BaseModel):
    神殿名称: str
    年份: Optional[int] = None
    月份: Optional[int] = None
    行列表: List[CulturePresentationRow] = Field(default_factory=list)


@router.get("/culture-presentation-plan", response_model=CulturePresentationPlan, summary="获取企业文化宣讲计划表")
def get_culture_presentation_plan(
    campus: str = Query(..., alias="campus"),
    year: Optional[int] = Query(None, alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_culture_presentation_plan_tables()
    rows = fetch_plan_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    out = [
        CulturePresentationRow(
            序号=r.序号,
            宣讲时间=r.宣讲时间,
            宣讲地点=r.宣讲地点,
            宣讲方式=r.宣讲方式,
            宣讲主题=r.宣讲主题,
            宣讲内容概述=r.宣讲内容概述,
            宣讲对象=r.宣讲对象,
            主讲人=r.主讲人,
            需准备资料=r.需准备资料,
            备注=r.备注,
        )
        for r in rows
    ]
    return CulturePresentationPlan(神殿名称=campus, 年份=year, 月份=month, 行列表=out)


class CulturePresentationSavePayload(BaseModel):
    神殿名称: str
    年份: Optional[int] = None
    月份: Optional[int] = None
    行列表: List[CulturePresentationRow] = Field(default_factory=list)


def _has_content(row: CulturePresentationRow) -> bool:
    return any(
        [
            row.宣讲时间,
            row.宣讲地点,
            row.宣讲方式,
            row.宣讲主题,
            row.宣讲内容概述,
            row.宣讲对象,
            row.主讲人,
            row.需准备资料,
            row.备注,
        ]
    )


@router.post("/culture-presentation-plan", response_model=CulturePresentationPlan, summary="保存企业文化宣讲计划表（覆盖写入）")
def save_culture_presentation_plan(
    payload: CulturePresentationSavePayload, db: Session = Depends(get_db)
):
    init_culture_presentation_plan_tables()
    cleaned = [row.model_dump() for row in payload.行列表 if _has_content(row)]
    replace_plan_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=cleaned,
    )
    db.commit()
    rows = fetch_plan_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    out = [
        CulturePresentationRow(
            序号=r.序号,
            宣讲时间=r.宣讲时间,
            宣讲地点=r.宣讲地点,
            宣讲方式=r.宣讲方式,
            宣讲主题=r.宣讲主题,
            宣讲内容概述=r.宣讲内容概述,
            宣讲对象=r.宣讲对象,
            主讲人=r.主讲人,
            需准备资料=r.需准备资料,
            备注=r.备注,
        )
        for r in rows
    ]
    return CulturePresentationPlan(
        神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out
    )


@router.put("/culture-presentation-plan", response_model=CulturePresentationPlan, summary="更新企业文化宣讲计划表（覆盖写入）")
def update_culture_presentation_plan(
    payload: CulturePresentationSavePayload, db: Session = Depends(get_db)
):
    return save_culture_presentation_plan(payload, db)


@router.delete("/culture-presentation-plan", summary="删除企业文化宣讲计划表")
def delete_culture_presentation_plan(
    campus: str = Query(..., alias="campus"),
    year: Optional[int] = Query(None, alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_culture_presentation_plan_tables()
    deleted = delete_plan_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    db.commit()
    return {"success": True, "deleted_count": deleted}
