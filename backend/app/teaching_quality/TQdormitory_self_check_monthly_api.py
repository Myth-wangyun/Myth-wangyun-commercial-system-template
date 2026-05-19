"""
教学质量模块 - 宿舍管理（月度）自查统计 API
路由：/api/v1/teaching-quality/dormitory-self-check-monthly
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQdormitory_self_check_monthly_db import (
    fetch_dormitory_self_check_rows as fetch_rows,
)
from app.teaching_quality.TQdormitory_self_check_monthly_db import (
    init_dormitory_self_check_tables as init_tables,
)
from app.teaching_quality.TQdormitory_self_check_monthly_db import (
    replace_dormitory_self_check_rows as replace_rows,
)

router = APIRouter()


class SelfCheckRow(BaseModel):
    管理老师: str
    序号: int
    宿舍名称: Optional[str] = None
    住宿人数: Optional[int] = None
    是否有投诉或重大事故: Optional[str] = None
    是否每日正常查寝: Optional[str] = None
    是否按时都已收取住宿费: Optional[str] = None
    是否每周开宿舍会: Optional[str] = None
    是否每周检查卫生: Optional[str] = None
    是否及时解决宿舍问题: Optional[str] = None
    学员纪律: Optional[str] = None
    备注: Optional[str] = None


class SelfCheckList(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[SelfCheckRow] = Field(default_factory=list)


@router.get("/dormitory-self-check-monthly", response_model=SelfCheckList, summary="获取宿舍管理（月度）自查统计")
def get_dormitory_self_check(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    recs = fetch_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    rows = [
        SelfCheckRow(
            管理老师=r.管理老师,
            序号=r.序号,
            宿舍名称=r.宿舍名称,
            住宿人数=r.住宿人数,
            是否有投诉或重大事故=r.是否有投诉或重大事故,
            是否每日正常查寝=r.是否每日正常查寝,
            是否按时都已收取住宿费=r.是否按时都已收取住宿费,
            是否每周开宿舍会=r.是否每周开宿舍会,
            是否每周检查卫生=r.是否每周检查卫生,
            是否及时解决宿舍问题=r.是否及时解决宿舍问题,
            学员纪律=r.学员纪律,
            备注=r.备注,
        )
        for r in recs
    ]
    return SelfCheckList(神殿名称=campus, 年份=year, 月份=month, 行列表=rows)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[SelfCheckRow] = Field(default_factory=list)


@router.post("/dormitory-self-check-monthly", response_model=SelfCheckList, summary="保存宿舍管理（月度）自查统计（覆盖写入）")
def save_dormitory_self_check(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    # 回读
    recs = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    rows = [
        SelfCheckRow(
            管理老师=r.管理老师,
            序号=r.序号,
            宿舍名称=r.宿舍名称,
            住宿人数=r.住宿人数,
            是否有投诉或重大事故=r.是否有投诉或重大事故,
            是否每日正常查寝=r.是否每日正常查寝,
            是否按时都已收取住宿费=r.是否按时都已收取住宿费,
            是否每周开宿舍会=r.是否每周开宿舍会,
            是否每周检查卫生=r.是否每周检查卫生,
            是否及时解决宿舍问题=r.是否及时解决宿舍问题,
            学员纪律=r.学员纪律,
            备注=r.备注,
        )
        for r in recs
    ]
    return SelfCheckList(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=rows)

