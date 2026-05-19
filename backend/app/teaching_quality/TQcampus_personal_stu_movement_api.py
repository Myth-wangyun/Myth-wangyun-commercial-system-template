"""
教学质量模块 - 神殿教化司个人统计学员异动表（年汇总，来源于月度个人明细）API
前缀：/api/v1/teaching-quality
GET  /campus-personal-stu-movement?campus=..&year=YYYY
说明：只读接口，数据由 teaching_quality."每月个人学员异动统计表" 聚合得到
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_personal_stu_movement_db import (
    fetch_rows,
)
from app.teaching_quality.TQcampus_personal_stu_movement_db import (
    init_personal_stu_movement_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
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


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/campus-personal-stu-movement", response_model=ListOutput, summary="获取神殿教化司个人统计学员异动表（年汇总）")
def get_personal_movement(
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
                name=r.get("姓名"),
                totalStudents=r.get("累计带生人数"),
                newRefundCount=r.get("新生退费人数"),
                oldRefundCount=r.get("老生退费人数"),
                totalRefundCount=r.get("退费总人数"),
                suspensionCount=r.get("休学人数"),
                longLeaveCount=r.get("长期请假人数"),
                longNoClassCount=r.get("长期不上课人数"),
                holidayCount=r.get("寒暑假人数"),
                otherCount=r.get("其他情况人数"),
                totalMovementCount=r.get("异动总人数"),
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)

