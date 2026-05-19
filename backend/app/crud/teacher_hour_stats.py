"""
CRUD helpers for teacher hour monthly stats
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.teacher_hour_stats import TeacherHourMonthlyStat


def get_teacher_hour_stats(
    db: Session, campus: str, year: int, month: int, teacher: str
) -> Optional[TeacherHourMonthlyStat]:
    return (
        db.query(TeacherHourMonthlyStat)
        .filter(
            TeacherHourMonthlyStat.campus_name == campus,
            TeacherHourMonthlyStat.year == year,
            TeacherHourMonthlyStat.month == month,
            TeacherHourMonthlyStat.teacher_name == teacher,
        )
        .first()
    )


def save_teacher_hour_stats(
    db: Session,
    campus: str,
    year: int,
    month: int,
    schedule_data: dict,
    teacher_name: str,
) -> TeacherHourMonthlyStat:
    record = get_teacher_hour_stats(db, campus, year, month, teacher_name)
    if record:
        record.schedule_data = schedule_data
        record.teacher_name = teacher_name
        record.teacher_names = [teacher_name]
    else:
        record = TeacherHourMonthlyStat(
            campus_name=campus,
            year=year,
            month=month,
            schedule_data=schedule_data,
            teacher_name=teacher_name,
            teacher_names=[teacher_name],
        )
        db.add(record)
    db.commit()
    db.refresh(record)
    return record
