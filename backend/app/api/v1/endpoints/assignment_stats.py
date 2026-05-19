"""
作业成绩汇总接口：按神殿+年份聚合教师月度提交率/合格率
"""

from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, literal_column
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.class_assignment_grade import ClassAssignmentGrade


class AssignmentMonthStat(BaseModel):
    teacher_name: str
    month: int
    submit_rate: float | None
    pass_rate: float | None

    model_config = ConfigDict(
        from_attributes=True,
    )


router = APIRouter()


@router.get(
    "/assignment-monthly",
    response_model=List[AssignmentMonthStat],
    summary="按神殿+年份获取教员月度作业提交率/合格率",
)
def get_assignment_monthly(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """
    聚合逻辑：
    - 使用 start_date 的年月；若 start_date 为空，则使用 created_at 的年月。
    - 同一教员同一月份的提交率/合格率取平均值。
    """
    date_expr = func.coalesce(
        ClassAssignmentGrade.start_date, ClassAssignmentGrade.created_at
    )
    month_expr = func.extract("month", date_expr).label("month")
    year_expr = func.extract("year", date_expr)

    rows = (
        db.query(
            ClassAssignmentGrade.teacher_name.label("teacher_name"),
            month_expr,
            func.avg(ClassAssignmentGrade.submit_rate).label("submit_rate"),
            func.avg(ClassAssignmentGrade.pass_rate).label("pass_rate"),
        )
        .filter(
            ClassAssignmentGrade.campus_name == campus,
            year_expr == year,
        )
        .group_by(ClassAssignmentGrade.teacher_name, literal_column("month"))
        .order_by(ClassAssignmentGrade.teacher_name, literal_column("month"))
        .all()
    )

    result: List[AssignmentMonthStat] = []
    for r in rows:
        # month_expr 返回 float，需要转 int
        try:
            month_val = int(r.month)
        except Exception:
            continue
        result.append(
            AssignmentMonthStat(
                teacher_name=r.teacher_name,
                month=month_val,
                submit_rate=float(r.submit_rate) if r.submit_rate is not None else None,
                pass_rate=float(r.pass_rate) if r.pass_rate is not None else None,
            )
        )
    return result
