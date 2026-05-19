"""
学员满意度月度汇总：按神殿+年份聚合教员每月满意度平均分
"""

from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import student_satisfaction_detail as crud


class SatisfactionMonthStat(BaseModel):
    teacher_name: str
    month: int
    score: float | None

    model_config = ConfigDict(
        from_attributes=True,
    )


router = APIRouter()


@router.get(
    "/satisfaction-monthly",
    response_model=List[SatisfactionMonthStat],
    summary="按神殿+年份获取教员月度学员满意度平均分",
)
def get_satisfaction_monthly(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """
    逻辑：复用 student_satisfaction_detail 聚合逻辑，按教员+月份返回平均分。
    支持 rows 中 m1..m12 或 {month, score} 格式。
    """
    agg = crud.compute_avg_from_details(db, campus=campus, year=year)
    result: List[SatisfactionMonthStat] = []
    for row in agg:
        for m in range(1, 13):
            val = getattr(row, f"m{m}", None)
            if val is None:
                continue
            result.append(
                SatisfactionMonthStat(teacher_name=row.teacher_name, month=m, score=val)
            )
    return result
