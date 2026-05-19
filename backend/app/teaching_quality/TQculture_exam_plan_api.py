"""
教学质量模块 - 企业文化考试计划表 API
路由：/api/v1/teaching-quality/culture-exam-plan
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQculture_exam_plan_db import (
    fetch_culture_exam_plan_rows,
    init_culture_exam_plan_tables,
    replace_culture_exam_plan_rows,
)

router = APIRouter()


class CultureExamPlanRow(BaseModel):
    序号: int
    考试时间: Optional[str] = None
    考试地点: Optional[str] = None
    考试方式: Optional[str] = None
    考试主题: Optional[str] = None
    考试内容概述: Optional[str] = None
    考试对象: Optional[str] = None
    监考人: Optional[str] = None
    考场布置: Optional[str] = None
    需准备资料: Optional[str] = None
    备注: Optional[str] = None


class CultureExamPlanList(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[CultureExamPlanRow] = Field(default_factory=list)


@router.get("/culture-exam-plan", response_model=CultureExamPlanList, summary="获取企业文化考试计划表")
def get_culture_exam_plan(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_culture_exam_plan_tables()
    rows = fetch_culture_exam_plan_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    out = [
        CultureExamPlanRow(
            序号=r.序号,
            考试时间=r.考试时间,
            考试地点=r.考试地点,
            考试方式=r.考试方式,
            考试主题=r.考试主题,
            考试内容概述=r.考试内容概述,
            考试对象=r.考试对象,
            监考人=r.监考人,
            考场布置=r.考场布置,
            需准备资料=r.需准备资料,
            备注=r.备注,
        )
        for r in rows
    ]
    return CultureExamPlanList(神殿名称=campus, 年份=year, 月份=month, 行列表=out)


class CultureExamPlanSavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[CultureExamPlanRow] = Field(default_factory=list)


def _has_content(row: CultureExamPlanRow) -> bool:
    return any(
        [
            row.考试时间,
            row.考试地点,
            row.考试方式,
            row.考试主题,
            row.考试内容概述,
            row.考试对象,
            row.监考人,
            row.考场布置,
            row.需准备资料,
            row.备注,
        ]
    )


@router.post("/culture-exam-plan", response_model=CultureExamPlanList, summary="保存企业文化考试计划表（覆盖写入）")
def save_culture_exam_plan(payload: CultureExamPlanSavePayload, db: Session = Depends(get_db)):
    init_culture_exam_plan_tables()
    cleaned = [row.model_dump() for row in payload.行列表 if _has_content(row)]
    replace_culture_exam_plan_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=cleaned,
    )
    db.commit()
    rows = fetch_culture_exam_plan_rows(
        db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份
    )
    out = [
        CultureExamPlanRow(
            序号=r.序号,
            考试时间=r.考试时间,
            考试地点=r.考试地点,
            考试方式=r.考试方式,
            考试主题=r.考试主题,
            考试内容概述=r.考试内容概述,
            考试对象=r.考试对象,
            监考人=r.监考人,
            考场布置=r.考场布置,
            需准备资料=r.需准备资料,
            备注=r.备注,
        )
        for r in rows
    ]
    return CultureExamPlanList(
        神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out
    )
