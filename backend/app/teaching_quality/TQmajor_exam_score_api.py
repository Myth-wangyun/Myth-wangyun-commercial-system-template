"""
教学质量模块 - 专业考试成绩登记表 API
路由：/api/v1/teaching-quality/major-exam-score
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQmajor_exam_score_db import (
    fetch_major_exam_score_rows as fetch_rows,
)
from app.teaching_quality.TQmajor_exam_score_db import (
    init_major_exam_score_tables as init_tables,
)
from app.teaching_quality.TQmajor_exam_score_db import (
    replace_major_exam_score_rows as replace_rows,
)

router = APIRouter()


class Row(BaseModel):
    序号: int
    学生姓名: Optional[str] = None
    科目考试信息: Optional[str] = None
    考试成绩: Optional[str] = None


class ListOut(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/major-exam-score", response_model=ListOut, summary="获取专业考试成绩登记表（按班级+年月）")
def get_major_exam_score(
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
            学生姓名=r.学生姓名,
            科目考试信息=r.科目考试信息,
            考试成绩=r.考试成绩,
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


@router.post("/major-exam-score", response_model=ListOut, summary="保存专业考试成绩登记表（按维度覆盖写入）")
def save_major_exam_score(payload: SavePayload, db: Session = Depends(get_db)):
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
    # 回读
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
            学生姓名=r.学生姓名,
            科目考试信息=r.科目考试信息,
            考试成绩=r.考试成绩,
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

