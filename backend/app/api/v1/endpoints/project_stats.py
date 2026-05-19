"""
项目合格率汇总接口：按神殿+年份聚合教员月度项目合格率
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.project_grade_register import ProjectGradeRegister


class ProjectMonthStat(BaseModel):
    teacher_name: str
    month: int
    pass_rate: float | None

    model_config = ConfigDict(
        from_attributes=True,
    )


router = APIRouter()


@router.get(
    "/project-monthly",
    response_model=List[ProjectMonthStat],
    summary="按神殿+年份获取教员月度项目合格率",
)
def get_project_monthly(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """
    聚合逻辑：
    - 使用 project_attempt_dates 中第一个日期的月份；如果没有，则使用 created_at 的月份。
    - 合格率 = pass_count / project_count * 100，缺失时尝试学生明细推导。
    - 同一教员同一月取平均值。
    """
    rows = (
        db.query(ProjectGradeRegister)
        .filter(
            ProjectGradeRegister.campus_name == campus,
            func.extract(
                "year",
                func.coalesce(ProjectGradeRegister.created_at, datetime.utcnow()),
            )
            == year,
        )
        .all()
    )

    buckets: dict[tuple[str, int], list[float]] = {}

    for row in rows:
        month_val = 0
        # 尝试从 project_attempt_dates 解析月份
        try:
            dates = row.project_attempt_dates or []
            parsed = None
            for d in dates:
                if not d:
                    continue
                try:
                    parsed = datetime.fromisoformat(str(d))
                    break
                except Exception:
                    try:
                        parsed = datetime.strptime(str(d), "%Y/%m/%d")
                        break
                    except Exception:
                        continue
            if parsed:
                month_val = parsed.month
        except Exception:
            month_val = 0
        if month_val == 0:
            dt = row.created_at or datetime.utcnow()
            month_val = dt.month
        if month_val < 1 or month_val > 12:
            continue

        rate: float | None = None
        if row.project_count and row.project_count > 0 and row.pass_count is not None:
            rate = float(row.pass_count) / float(row.project_count) * 100.0
        if rate is None:
            # 兜底：从 students 推导（按最佳尝试分数>=60计合格）
            try:
                students = row.students or []
                total = 0
                passed = 0
                for stu in students:
                    if not isinstance(stu, dict):
                        continue
                    # 遍历 p{n}a{1|2|3}
                    best = -1.0
                    for key, val in stu.items():
                        if (
                            isinstance(key, str)
                            and key.startswith("p")
                            and isinstance(val, dict)
                        ):
                            sc = val.get("score")
                            if sc is None:
                                continue
                            try:
                                num = float(sc)
                                if num > best:
                                    best = num
                            except Exception:
                                continue
                    if best >= 0:
                        total += 1
                        if best >= 60:
                            passed += 1
                if total > 0:
                    rate = passed / total * 100.0
            except Exception:
                rate = None

        if rate is None:
            continue
        key = (row.teacher_name or "", month_val)
        buckets.setdefault(key, []).append(rate)

    result: List[ProjectMonthStat] = []
    for (teacher, month), values in buckets.items():
        if not values:
            continue
        avg_rate = sum(values) / len(values)
        result.append(
            ProjectMonthStat(teacher_name=teacher, month=month, pass_rate=avg_rate)
        )

    return result
