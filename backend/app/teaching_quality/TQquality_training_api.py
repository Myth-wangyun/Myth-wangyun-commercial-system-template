"""
教学质量模块 - 素质训练登记表 API
路由：/api/v1/teaching-quality/quality-training
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQquality_training_db import (
    fetch_quality_training_rows,
    init_quality_training_tables,
    replace_quality_training_rows,
)

router = APIRouter()


# ===== Schemas =====
class QTRow(BaseModel):
    序号: int
    时间: Optional[str] = None
    内容: Optional[str] = None
    几节课: Optional[str] = None
    作业提交率: Optional[str] = None
    考试合格率: Optional[str] = None
    问题汇总: Optional[str] = None


class QTList(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[QTRow] = Field(default_factory=list)


@router.get("/quality-training", response_model=QTList, summary="获取素质训练登记表（按班级+年月）")
def get_quality_training(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_quality_training_tables()
    rows = fetch_quality_training_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out = [
        QTRow(
            序号=r.序号,
            时间=r.时间,
            内容=r.内容,
            几节课=r.几节课,
            作业提交率=r.作业提交率,
            考试合格率=r.考试合格率,
            问题汇总=r.问题汇总,
        )
        for r in rows
    ]
    return QTList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


class QTSavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[QTRow] = Field(default_factory=list)


@router.post("/quality-training", response_model=QTList, summary="保存素质训练登记表（按维度覆盖写入）")
def save_quality_training(payload: QTSavePayload, db: Session = Depends(get_db)):
    init_quality_training_tables()
    replace_quality_training_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 回读
    rows = fetch_quality_training_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
    )
    out = [
        QTRow(
            序号=r.序号,
            时间=r.时间,
            内容=r.内容,
            几节课=r.几节课,
            作业提交率=r.作业提交率,
            考试合格率=r.考试合格率,
            问题汇总=r.问题汇总,
        )
        for r in rows
    ]
    return QTList(
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )

