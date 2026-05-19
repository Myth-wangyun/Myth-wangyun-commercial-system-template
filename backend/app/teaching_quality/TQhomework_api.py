"""
教学质量模块 - 作业登记表 API
路由：/api/v1/teaching-quality/homework
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQhomework_db import (
    fetch_homework_rows,
    init_homework_tables,
    replace_homework_rows,
)

router = APIRouter()


class HomeworkRow(BaseModel):
    序号: int
    日期: Optional[str] = None
    课程名称: Optional[str] = None
    章节: Optional[str] = None
    班级人数: Optional[int] = None
    班主任: Optional[str] = None
    教员: Optional[str] = None
    作业提交率: Optional[int] = None
    作业合格率: Optional[int] = None
    备注: Optional[str] = None


class HomeworkList(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[HomeworkRow] = Field(default_factory=list)


@router.get("/homework", response_model=HomeworkList, summary="获取作业登记表（按班级+年月）")
def get_homework(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_homework_tables()
    rows = fetch_homework_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out = [
        HomeworkRow(
            序号=r.序号,
            日期=r.日期,
            课程名称=r.课程名称,
            章节=r.章节,
            班级人数=r.班级人数,
            班主任=r.班主任,
            教员=r.教员,
            作业提交率=r.作业提交率,
            作业合格率=r.作业合格率,
            备注=r.备注,
        )
        for r in rows
    ]
    return HomeworkList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


class SavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[HomeworkRow] = Field(default_factory=list)


@router.post("/homework", response_model=HomeworkList, summary="保存作业登记表（按维度覆盖写入）")
def save_homework(payload: SavePayload, db: Session = Depends(get_db)):
    init_homework_tables()
    replace_homework_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 回读
    rows = fetch_homework_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
    )
    out = [
        HomeworkRow(
            序号=r.序号,
            日期=r.日期,
            课程名称=r.课程名称,
            章节=r.章节,
            班级人数=r.班级人数,
            班主任=r.班主任,
            教员=r.教员,
            作业提交率=r.作业提交率,
            作业合格率=r.作业合格率,
            备注=r.备注,
        )
        for r in rows
    ]
    return HomeworkList(
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )

