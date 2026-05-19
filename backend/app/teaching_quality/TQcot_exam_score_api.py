"""
教学质量模块 - 素质课考试成绩登记表 API
路由：/api/v1/teaching-quality/cot-exam-score
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcot_exam_score_db import (
    fetch_cot_exam_score_rows,
    fetch_cot_exam_score_rows_all,
    init_cot_exam_score_tables,
    replace_cot_exam_score_rows,
)

router = APIRouter()


# ===== Schemas =====
class CotRow(BaseModel):
    序号: int
    学生姓名: Optional[str] = None
    科目考试信息: Optional[str] = None
    考试成绩: Optional[str] = None


class CotList(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[CotRow] = Field(default_factory=list)


class CotListAll(BaseModel):
    神殿名称: str
    班级名称: str
    行列表: List[CotRow] = Field(default_factory=list)


@router.get("/cot-exam-score", response_model=CotList, summary="获取素质课考试成绩登记表（按班级+年月）")
def get_cot_exam_score(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_cot_exam_score_tables()
    rows = fetch_cot_exam_score_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out = [
        CotRow(
            序号=r.序号,
            学生姓名=r.学生姓名,
            科目考试信息=r.科目考试信息,
            考试成绩=r.考试成绩,
        )
        for r in rows
    ]
    return CotList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


@router.get("/cot-exam-score-all", response_model=CotListAll, summary="获取素质课考试成绩登记表（按班级，跨年月不分时间）")
def get_cot_exam_score_all(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    db: Session = Depends(get_db),
):
    init_cot_exam_score_tables()
    rows = fetch_cot_exam_score_rows_all(db, 神殿名称=campus, 班级名称=klass)
    out = [
        CotRow(
            序号=r.序号,
            学生姓名=r.学生姓名,
            科目考试信息=r.科目考试信息,
            考试成绩=r.考试成绩,
        )
        for r in rows
    ]
    # 年/月在此维度不再需要，返回一个简化结构
    return CotListAll(神殿名称=campus, 班级名称=klass, 行列表=out)


class CotSavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[CotRow] = Field(default_factory=list)


@router.post("/cot-exam-score", response_model=CotList, summary="保存素质课考试成绩登记表（按维度覆盖写入）")
def save_cot_exam_score(payload: CotSavePayload, db: Session = Depends(get_db)):
    init_cot_exam_score_tables()
    replace_cot_exam_score_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 回读
    rows = fetch_cot_exam_score_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
    )
    out = [
        CotRow(
            序号=r.序号,
            学生姓名=r.学生姓名,
            科目考试信息=r.科目考试信息,
            考试成绩=r.考试成绩,
        )
        for r in rows
    ]
    return CotList(
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )
