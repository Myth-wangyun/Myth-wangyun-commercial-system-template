"""
教学质量模块 - 班学员千分制每月累计统计 API
路由：/api/v1/teaching-quality/thousand-score
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_thousand_score_db import (
    fetch_thousand_score_rows as fetch_rows,
)
from app.teaching_quality.TQclass_thousand_score_db import (
    init_thousand_score_tables as init_tables,
)
from app.teaching_quality.TQclass_thousand_score_db import (
    replace_thousand_score_rows as replace_rows,
)

router = APIRouter()


class Row(BaseModel):
    序号: int
    学员姓名: Optional[str] = None
    加分: Optional[int] = None
    扣分: Optional[int] = None
    累计分: Optional[int] = None
    总扣分: Optional[int] = None
    加分内容: Optional[str] = None  # 现在存储加分分数（数字字符串）
    上次分数: Optional[int] = None
    剩余: Optional[int] = None
    分类明细: Optional[Dict[str, Any]] = None
    备注: Optional[str] = None
    批注明细: Optional[Dict[str, str]] = None  # 批注：字段名 -> 批注内容


class ListOut(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/thousand-score", response_model=ListOut, summary="获取班学员千分制每月累计统计（按班级+年月）")
def get_thousand_score(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out = [
        Row(
            序号=r.序号,
            学员姓名=r.学员姓名,
            加分=r.加分,
            扣分=r.扣分,
            累计分=r.累计分,
            总扣分=r.总扣分,
            加分内容=r.加分内容,
            上次分数=r.上次分数,
            剩余=r.剩余,
            分类明细=r.分类明细,
            备注=r.备注,
            批注明细=getattr(r, '批注明细', None),
        )
        for r in rows
    ]
    return ListOut(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


class SavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.post("/thousand-score", response_model=ListOut, summary="保存班学员千分制每月累计统计（按维度覆盖写入）")
def save_thousand_score(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    rows = fetch_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
    )
    out = [
        Row(
            序号=r.序号,
            学员姓名=r.学员姓名,
            加分=r.加分,
            扣分=r.扣分,
            累计分=r.累计分,
            总扣分=r.总扣分,
            加分内容=r.加分内容,
            上次分数=r.上次分数,
            剩余=r.剩余,
            分类明细=r.分类明细,
            备注=r.备注,
            批注明细=getattr(r, '批注明细', None),
        )
        for r in rows
    ]
    return ListOut(
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )

