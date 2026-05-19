"""
教学质量模块 - 班委会情况表 API
路由：/api/v1/teaching-quality/class-committee-meeting-status
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_committee_meeting_status_db import (
    fetch_class_committee_meeting_status_rows as fetch_rows,
)
from app.teaching_quality.TQclass_committee_meeting_status_db import (
    init_class_committee_meeting_status_tables as init_tables,
)
from app.teaching_quality.TQclass_committee_meeting_status_db import (
    replace_class_committee_meeting_status_rows as replace_rows,
)

router = APIRouter()


class Row(BaseModel):
    序号: int
    时间: Optional[str] = None
    地点: Optional[str] = None
    参与人: Optional[str] = None
    主题: Optional[str] = None
    把控关键点: Optional[str] = None


class ListOut(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/class-committee-meeting-status", response_model=ListOut, summary="获取班委会情况表（按班级+年月）")
def get_cc_meeting_status(
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
            时间=r.时间,
            地点=r.地点,
            参与人=r.参与人,
            主题=r.主题,
            把控关键点=r.把控关键点,
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


@router.post("/class-committee-meeting-status", response_model=ListOut, summary="保存班委会情况表（按维度覆盖写入）")
def save_cc_meeting_status(payload: SavePayload, db: Session = Depends(get_db)):
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
            时间=r.时间,
            地点=r.地点,
            参与人=r.参与人,
            主题=r.主题,
            把控关键点=r.把控关键点,
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

