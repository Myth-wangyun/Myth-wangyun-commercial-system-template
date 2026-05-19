"""
教学质量模块 - 神殿教化司月度个人统计学员异动表（年维度）API
前缀：/api/v1/teaching-quality
GET  /campus-monthly-personal-stu-movement?campus=..&year=YYYY
POST /campus-monthly-personal-stu-movement { 神殿名称, 年份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_personal_stu_movement_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_monthly_personal_stu_movement_db import (
    init_monthly_personal_stu_movement_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    name: str
    totalStudents: Optional[int] = None
    newRefundCount: Optional[int] = None
    oldRefundCount: Optional[int] = None
    totalRefundCount: Optional[int] = None
    suspensionCount: Optional[int] = None
    longLeaveCount: Optional[int] = None
    longNoClassCount: Optional[int] = None
    holidayCount: Optional[int] = None
    otherCount: Optional[int] = None
    totalMovementCount: Optional[int] = None
    remark: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化月度个人学员异动表失败: {e}")


@router.get("/campus-monthly-personal-stu-movement", response_model=ListOutput, summary="获取月度个人统计学员异动明细")
def get_monthly_personal_movement(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                totalStudents=r.累计带生人数,
                newRefundCount=r.新生退费人数,
                oldRefundCount=r.老生退费人数,
                totalRefundCount=r.退费总人数,
                suspensionCount=r.休学人数,
                longLeaveCount=r.长期请假人数,
                longNoClassCount=r.长期不上课人数,
                holidayCount=r.寒暑假人数,
                otherCount=r.其他情况人数,
                totalMovementCount=r.异动总人数,
                remark=r.备注,
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post("/campus-monthly-personal-stu-movement", response_model=ListOutput, summary="保存月度个人统计学员异动明细（覆盖写入）")
def save_monthly_personal_movement(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                totalStudents=r.累计带生人数,
                newRefundCount=r.新生退费人数,
                oldRefundCount=r.老生退费人数,
                totalRefundCount=r.退费总人数,
                suspensionCount=r.休学人数,
                longLeaveCount=r.长期请假人数,
                longNoClassCount=r.长期不上课人数,
                holidayCount=r.寒暑假人数,
                otherCount=r.其他情况人数,
                totalMovementCount=r.异动总人数,
                remark=r.备注,
            )
        )
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)

