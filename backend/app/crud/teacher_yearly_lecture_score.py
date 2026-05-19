from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.teacher_yearly_lecture_score import TeacherYearlyLectureScore
from app.schemas.teacher_yearly_lecture_score import (
    TeacherYearlyLectureScoreCreate,
    TeacherYearlyLectureScoreUpdate,
)


def list_records(
    db: Session,
    teacher_name: Optional[str] = None,
    class_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[TeacherYearlyLectureScore]:
    query = db.query(TeacherYearlyLectureScore)
    if teacher_name:
        query = query.filter(TeacherYearlyLectureScore.teacher_name == teacher_name)
    if class_name:
        query = query.filter(TeacherYearlyLectureScore.class_name == class_name)
    if start_date:
        query = query.filter(TeacherYearlyLectureScore.date >= start_date)
    if end_date:
        query = query.filter(TeacherYearlyLectureScore.date <= end_date)
    return query.order_by(TeacherYearlyLectureScore.id.desc()).all()


def get_record(db: Session, record_id: int) -> Optional[TeacherYearlyLectureScore]:
    return db.query(TeacherYearlyLectureScore).filter_by(id=record_id).first()


def create_record(db: Session, data: TeacherYearlyLectureScoreCreate) -> TeacherYearlyLectureScore:
    obj = TeacherYearlyLectureScore(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_record(db: Session, record_id: int, data: TeacherYearlyLectureScoreUpdate) -> Optional[TeacherYearlyLectureScore]:
    obj = db.query(TeacherYearlyLectureScore).filter_by(id=record_id).first()
    if not obj:
        return None
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_record(db: Session, record_id: int) -> bool:
    obj = db.query(TeacherYearlyLectureScore).filter_by(id=record_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

