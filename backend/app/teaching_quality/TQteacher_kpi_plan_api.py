"""
教学质量模块 - 班主任KPI计划 API（FastAPI Router）
位于 teaching-quality 目录，通过 app/api/v1/__init__.py 动态加载并挂载到 /api/v1/teaching-quality。
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQteacher_kpi_plan_db import (
    fetch_teacher,
    init_teacher_kpi_tables,
    replace_teacher,
)

router = APIRouter()


# ===== Schemas =====
class TeacherMainRow(BaseModel):
    序号: int
    姓名: str | None = None
    KPI指标: str | None = None
    KPI名称: str | None = None
    计算细则: str | None = None
    数据来源: str | None = None
    权重: float | None = None
    备注: str | None = None
    得分: float | None = None
    KPI值: float | None = None
    行类型: str | None = None  # data/total


class TeacherKpiList(BaseModel):
    神殿名称: str
    年份: Optional[int] = None
    月份: Optional[int] = None
    主表: List[TeacherMainRow] = Field(default_factory=list)


@router.get("/teacher-kpi", response_model=TeacherKpiList, summary="按神殿/年月获取班主任KPI计划（仅主表）")
def get_teacher_kpi(
    campus: str = Query(..., alias="campus"),
    year: Optional[int] = Query(None, alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_teacher_kpi_tables()
    rows = fetch_teacher(db, 神殿名称=campus, 年份=year, 月份=month)
    main_out = [
        TeacherMainRow(
            序号=r.序号,
            姓名=r.姓名,
            KPI指标=r.KPI指标,
            KPI名称=r.KPI名称,
            计算细则=r.计算细则,
            数据来源=r.数据来源,
            权重=r.权重,
            备注=r.备注,
            得分=r.得分,
            KPI值=r.KPI值,
            行类型=r.行类型,
        )
        for r in rows
    ]
    return TeacherKpiList(神殿名称=campus, 年份=year, 月份=month, 主表=main_out)


class TeacherSavePayload(BaseModel):
    神殿名称: str
    年份: Optional[int] = None
    月份: Optional[int] = None
    主表: List[TeacherMainRow] = Field(default_factory=list)


@router.post("/teacher-kpi", response_model=TeacherKpiList, summary="保存班主任KPI计划（仅主表，按神殿/年月覆盖写入）")
def save_teacher_kpi(payload: TeacherSavePayload, db: Session = Depends(get_db)):
    init_teacher_kpi_tables()
    replace_teacher(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        主表=[row.model_dump() for row in payload.主表],
    )
    db.commit()
    rows = fetch_teacher(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    main_out = [
        TeacherMainRow(
            序号=r.序号,
            姓名=r.姓名,
            KPI指标=r.KPI指标,
            KPI名称=r.KPI名称,
            计算细则=r.计算细则,
            数据来源=r.数据来源,
            权重=r.权重,
            备注=r.备注,
            得分=r.得分,
            KPI值=r.KPI值,
            行类型=r.行类型,
        )
        for r in rows
    ]
    return TeacherKpiList(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 主表=main_out)
