"""
教学质量模块 - 神殿教化司学员异动表（月度汇总，年维度）API
前缀：/api/v1/teaching-quality
GET  /campus-stu-movement-summary?campus=..&year=YYYY
POST /campus-stu-movement-summary { 神殿名称, 年份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_stu_movement_summary_db import (
    fetch_rows,
)

# replace_rows 已被废弃

router = APIRouter()


class Row(BaseModel):
    month: int
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


@router.get("/campus-stu-movement-summary", response_model=ListOutput, summary="获取神殿教化司学员异动表（月度汇总）")
def get_campus_movement_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    # init_tables() # 依赖的个人异动表已初始化，此处无需重复调用
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.get("月份"),
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

