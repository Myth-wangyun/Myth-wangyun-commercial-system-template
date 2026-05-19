"""
教学质量模块 - 神殿教化司学籍统计表 API（单表）
前缀：/api/v1/teaching-quality
GET  /campus-enrollment-statistics?campus=..&year=YYYY
POST /campus-enrollment-statistics  { 神殿名称, 年份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_enrollment_statistics_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_enrollment_statistics_db import (
    init_campus_enrollment_statistics_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    campus: Optional[str] = None
    # 中专层次
    secondaryThreeYearRegistered: Optional[int] = None
    secondaryOneYearRegistered: Optional[int] = None
    secondaryOtherRegistered: Optional[int] = None
    secondaryTargetRegistered: Optional[int] = None
    secondaryTargetTime: Optional[str] = None
    secondaryActualRegistered: Optional[int] = None
    # 大学层次
    collegeAdultExamRegistered: Optional[int] = None
    collegeOpenUnivRegistered: Optional[int] = None
    collegeOtherRegistered: Optional[int] = None
    collegeTargetRegistered: Optional[int] = None
    collegeTargetTime: Optional[str] = None
    collegeActualRegistered: Optional[int] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _norm_campus(c: str) -> str:
    return (c or "").replace("神殿", "").strip()

@router.get("/campus-enrollment-statistics", response_model=ListOutput, summary="获取神殿教化司学籍统计表（全年）")
def get_campus_enrollment_statistics(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    campus_norm = _norm_campus(campus)

    # 兼容：盛邦 / 主神殿 / 去后缀
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)
    if not rows:
        rows = fetch_rows(db, 神殿名称=campus_norm, 年份=year)
    if not rows and not campus_norm.endswith("神殿"):
        rows = fetch_rows(db, 神殿名称=f"{campus_norm}神殿", 年份=year)

    # 若数据库无数据，返回空 12 月默认结构
    if not rows:
        out = [
            Row(
                month=i,
                campus=campus,
                secondaryThreeYearRegistered=0,
                secondaryOneYearRegistered=0,
                secondaryOtherRegistered=0,
                secondaryTargetRegistered=0,
                secondaryTargetTime="",
                secondaryActualRegistered=0,
                collegeAdultExamRegistered=0,
                collegeOpenUnivRegistered=0,
                collegeOtherRegistered=0,
                collegeTargetRegistered=0,
                collegeTargetTime="",
                collegeActualRegistered=0,
            )
            for i in range(1, 13)
        ]
        return ListOutput(神殿名称=campus, 年份=year, 行列表=out)

    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                campus=r.神殿名称,
                secondaryThreeYearRegistered=r.中专3年学籍注册人数,
                secondaryOneYearRegistered=r.中专1年制人数,
                secondaryOtherRegistered=r.中专其他已注册人数,
                secondaryTargetRegistered=r.中专目标注册人数,
                secondaryTargetTime=r.中专目标注册时间,
                secondaryActualRegistered=r.中专实际注册人数,
                collegeAdultExamRegistered=r.大学成考注册人数,
                collegeOpenUnivRegistered=r.大学国开注册人数,
                collegeOtherRegistered=r.大学其他已注册人数,
                collegeTargetRegistered=r.大学目标注册人数,
                collegeTargetTime=r.大学目标注册时间,
                collegeActualRegistered=r.大学实际注册人数,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post("/campus-enrollment-statistics", response_model=ListOutput, summary="保存神殿教化司学籍统计表（覆盖写入全年）")
def save_campus_enrollment_statistics(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    # 回读
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                campus=r.神殿名称,
                secondaryThreeYearRegistered=r.中专3年学籍注册人数,
                secondaryOneYearRegistered=r.中专1年制人数,
                secondaryOtherRegistered=r.中专其他已注册人数,
                secondaryTargetRegistered=r.中专目标注册人数,
                secondaryTargetTime=r.中专目标注册时间,
                secondaryActualRegistered=r.中专实际注册人数,
                collegeAdultExamRegistered=r.大学成考注册人数,
                collegeOpenUnivRegistered=r.大学国开注册人数,
                collegeOtherRegistered=r.大学其他已注册人数,
                collegeTargetRegistered=r.大学目标注册人数,
                collegeTargetTime=r.大学目标注册时间,
                collegeActualRegistered=r.大学实际注册人数,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)

