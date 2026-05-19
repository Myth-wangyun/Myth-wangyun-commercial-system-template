"""
教学质量模块 - 员工访谈表 API（FastAPI Router）
位于 teaching-quality 目录，通过动态加载挂载到 /api/v1/teaching-quality。
"""
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQemployee_interview_db import (
    fetch_rows,
    init_employee_interview_tables,
    replace_rows,
)

router = APIRouter()


class RowInput(BaseModel):
    序号: int
    访谈对象: str = ""
    访谈时间: str | None = None
    访谈内容: str | None = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[RowInput]


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[RowInput] = Field(default_factory=list)


@router.get("/employee-interview", response_model=ListOutput, summary="按神殿+年+月获取员工访谈表")
def get_employee_interview(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_employee_interview_tables()
    rows = fetch_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    out_rows: List[RowInput] = [
        RowInput(
            序号=r.序号, 访谈对象=r.访谈对象 or "", 访谈时间=r.访谈时间, 访谈内容=r.访谈内容
        )
        for r in rows
    ]
    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post("/employee-interview", response_model=ListOutput, summary="保存员工访谈表（覆盖写入，按年+月）")
def save_employee_interview(payload: SavePayload, db: Session = Depends(get_db)):
    init_employee_interview_tables()
    db_rows: List[Dict[str, Any]] = [
        {"序号": r.序号, "访谈对象": r.访谈对象, "访谈时间": r.访谈时间, "访谈内容": r.访谈内容}
        for r in payload.行列表
    ]
    replace_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=db_rows)
    db.commit()
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    out_rows: List[RowInput] = [
        RowInput(
            序号=r.序号, 访谈对象=r.访谈对象 or "", 访谈时间=r.访谈时间, 访谈内容=r.访谈内容
        )
        for r in rows
    ]
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

