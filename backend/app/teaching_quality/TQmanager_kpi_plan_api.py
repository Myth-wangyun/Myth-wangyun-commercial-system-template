"""
教学质量模块 - 教质经理KPI计划 API（FastAPI Router）
位于 teaching-quality 目录，通过 app/api/v1/__init__.py 动态加载并挂载到 /api/v1/teaching-quality。
"""
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQmanager_kpi_plan_db import (
    fetch_rows,
    init_manager_kpi_tables,
    replace_rows,
)

router = APIRouter()


# ===== Schemas =====
class RowInput(BaseModel):
    序号: int
    姓名: str | None = None
    项目指标: str | None = None
    KPI指标: str | None = None
    KPI名称: str | None = None
    计算细则: str | None = None
    数据来源: str | None = None
    权重: float | None = None
    项目描述: str | None = None
    自我打分: float | None = None
    上级领导打分: float | None = None
    KPI值: float | None = None
    备注: str | None = None
    行类型: str | None = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int | None = None
    月份: int | None = None
    行列表: List[RowInput]


class SavePayload(BaseModel):
    神殿名称: str
    年份: int | None = None
    月份: int | None = None
    行列表: List[RowInput] = Field(default_factory=list)


@router.get("/manager-kpi", response_model=ListOutput, summary="按神殿(+年+月)获取教质经理KPI计划")
def get_manager_kpi(
    campus: str = Query(..., alias="campus"),
    year: int | None = Query(None, alias="year"),
    month: int | None = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_manager_kpi_tables()
    rows = fetch_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    out: List[RowInput] = [
        RowInput(
            序号=r.序号,
            姓名=r.姓名,
            项目指标=r.项目指标,
            KPI指标=r.KPI指标,
            KPI名称=r.KPI名称,
            计算细则=r.计算细则,
            数据来源=r.数据来源,
            权重=r.权重,
            项目描述=r.项目描述,
            自我打分=r.自我打分,
            上级领导打分=r.上级领导打分,
            KPI值=r.KPI值,
            备注=r.备注,
            行类型=r.行类型,
        )
        for r in rows
    ]
    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out)


@router.post("/manager-kpi", response_model=ListOutput, summary="保存教质经理KPI计划（覆盖当前维度）")
def save_manager_kpi(payload: SavePayload, db: Session = Depends(get_db)):
    init_manager_kpi_tables()
    # 按前端顺序保存
    rows: List[Dict[str, Any]] = [
        {
            "序号": r.序号,
            "姓名": r.姓名,
            "项目指标": r.项目指标,
            "KPI指标": r.KPI指标,
            "KPI名称": r.KPI名称,
            "计算细则": r.计算细则,
            "数据来源": r.数据来源,
            "权重": r.权重,
            "项目描述": r.项目描述,
            "自我打分": r.自我打分,
            "上级领导打分": r.上级领导打分,
            "KPI值": r.KPI值,
            "备注": r.备注,
            "行类型": r.行类型,
        }
        for r in payload.行列表
    ]
    replace_rows(db, 神殿名称=payload.神殿名称, 行列表=rows, 年份=payload.年份, 月份=payload.月份)
    db.commit()
    # 返回最新
    rows_db = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    out: List[RowInput] = [
        RowInput(
            序号=r.序号,
            姓名=r.姓名,
            项目指标=r.项目指标,
            KPI指标=r.KPI指标,
            KPI名称=r.KPI名称,
            计算细则=r.计算细则,
            数据来源=r.数据来源,
            权重=r.权重,
            项目描述=r.项目描述,
            自我打分=r.自我打分,
            上级领导打分=r.上级领导打分,
            KPI值=r.KPI值,
            备注=r.备注,
            行类型=r.行类型,
        )
        for r in rows_db
    ]
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out)

