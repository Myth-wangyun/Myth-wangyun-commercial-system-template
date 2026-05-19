"""
考试合格率汇总接口：按神殿+年份聚合教员月度考试合格率
"""

from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.class_exam_score import ClassExamScore


class ExamMonthStat(BaseModel):
    teacher_name: str
    month: int
    pass_rate: float | None

    model_config = ConfigDict(
        from_attributes=True,
    )


router = APIRouter()


@router.get(
    "/exam-monthly",
    response_model=List[ExamMonthStat],
    summary="按神殿+年份获取教员月度考试合格率",
)
def get_exam_monthly(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    """
    聚合逻辑：
    - 使用 first_exam_date 的年月；若为空则用 created_at 的年月。
    - 合格率计算优先使用 pass_count/class_size；若缺失则尝试从 scores_final.students 的 passed 字段推导。
    - 同一教员同一月取平均值。
    """
    rows = (
        db.query(ClassExamScore)
        .filter(
            ClassExamScore.campus_name == campus,
            func.extract(
                "year",
                func.coalesce(
                    ClassExamScore.first_exam_date, ClassExamScore.created_at
                ),
            )
            == year,
        )
        .all()
    )

    # 聚合：key=(teacher, month) -> [rates...]
    buckets: dict[tuple[str, int], list[float]] = {}

    for row in rows:
        dt: date | datetime | None = row.first_exam_date or row.created_at
        month_val = dt.month if dt else 0
        if month_val < 1 or month_val > 12:
            continue

        # 先尝试从学生成绩推导，通过率（避免 pass_count 为空/未维护）
        rate: float | None = None
        try:
            students = (row.scores_final or {}).get("students") or []
            total = len(students)
            if total > 0:
                passed = 0
                for stu in students:
                    if not isinstance(stu, dict):
                        continue
                    if stu.get("passed") is True:
                        passed += 1
                        continue
                    scores = []
                    for k in [
                        "vocabularyScore",
                        "writtenScore",
                        "written_score",
                        "labScore",
                        "lab_score",
                        "dailyScore",
                        "daily_score",
                        "computerExamScore",
                    ]:
                        val = stu.get(k)
                        if val is None:
                            continue
                        try:
                            num = float(val)
                            scores.append(num)
                        except Exception:
                            continue
                    if scores:
                        avg_score = sum(scores) / len(scores)
                        if avg_score >= 60:
                            passed += 1
                rate = passed / total * 100.0
        except Exception:
            rate = None

        # 如果没有学生明细推导成功，再使用 pass_count/class_size
        if (
            rate is None
            and row.class_size
            and row.class_size > 0
            and row.pass_count is not None
        ):
            rate = float(row.pass_count) / float(row.class_size) * 100.0

        if rate is None:
            continue

        key = (row.instructor_name or "", month_val)
        buckets.setdefault(key, []).append(rate)

    result: List[ExamMonthStat] = []
    for (teacher, month), values in buckets.items():
        if not values:
            continue
        avg_rate = sum(values) / len(values)
        result.append(
            ExamMonthStat(teacher_name=teacher, month=month, pass_rate=avg_rate)
        )

    return result
