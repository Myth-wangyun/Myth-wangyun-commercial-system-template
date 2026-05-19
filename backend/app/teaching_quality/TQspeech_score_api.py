"""
教学质量模块 - 班级演讲评分表 API
路由：/api/v1/teaching-quality/speech-score
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQspeech_score_db import (
    fetch_speech_score_rows as fetch_rows,
)
from app.teaching_quality.TQspeech_score_db import (
    init_speech_score_tables as init_tables,
)
from app.teaching_quality.TQspeech_score_db import (
    replace_speech_score_rows as replace_rows,
)

router = APIRouter()


class Row(BaseModel):
    序号: int
    姓名: Optional[str] = None
    日期: Optional[str] = None
    演讲主题: Optional[str] = None
    评分: Optional[int] = None


class ListOut(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/speech-score", response_model=ListOut, summary="获取班级演讲评分表（按班级+年月）")
def get_speech_score(
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
            姓名=r.姓名,
            日期=r.日期,
            演讲主题=r.演讲主题,
            评分=r.评分,
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


@router.post("/speech-score", response_model=ListOut, summary="保存班级演讲评分表（按维度覆盖写入）")
def save_speech_score(payload: SavePayload, db: Session = Depends(get_db)):
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
            姓名=r.姓名,
            日期=r.日期,
            演讲主题=r.演讲主题,
            评分=r.评分,
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

