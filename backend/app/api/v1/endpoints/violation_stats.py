"""
学员违纪月度汇总：按神殿+年份返回教员每月违纪次数
"""

from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_violation as crud


class ViolationMonthStat(BaseModel):
    teacher_name: str
    month: int
    count: float | None

    model_config = ConfigDict(
        from_attributes=True,
    )


router = APIRouter()


@router.get(
    "/violation-monthly",
    response_model=List[ViolationMonthStat],
    summary="按神殿+年份获取教员月度学员违纪次数",
)
def get_violation_monthly(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """
    从教员功能分析学员违纪表按教员+月份返回 m1..m12 的值。
    """
    rows = crud.获取违纪数据(db, campus, year)
    result: List[ViolationMonthStat] = []
    for r in rows:
        for m in range(1, 13):
            val = getattr(r, f"m{m}", None)
            if val is None:
                continue
            result.append(
                ViolationMonthStat(teacher_name=r.姓名 or "", month=m, count=val)
            )
    return result
