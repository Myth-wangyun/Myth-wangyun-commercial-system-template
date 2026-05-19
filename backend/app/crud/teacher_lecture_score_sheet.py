from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.teacher_lecture_score_sheet import TeacherLectureScoreSheet
from app.schemas.teacher_lecture_score_sheet import (
    TeacherLectureScoreSheetCreate,
    TeacherLectureScoreSheetUpdate,
)


def get(db: Session, record_id: int) -> Optional[TeacherLectureScoreSheet]:
    return db.query(TeacherLectureScoreSheet).filter(TeacherLectureScoreSheet.id == record_id).first()


def get_multi(
    db: Session,
    *,
    campus_name: Optional[str] = None,
    teacher_name: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[TeacherLectureScoreSheet]:
    query = db.query(TeacherLectureScoreSheet)
    if campus_name:
        query = query.filter(TeacherLectureScoreSheet.campus_name == campus_name)
    if teacher_name:
        query = query.filter(TeacherLectureScoreSheet.teacher_name == teacher_name)
    if year:
        query = query.filter(TeacherLectureScoreSheet.year == year)
    return query.order_by(TeacherLectureScoreSheet.updated_at.desc()).offset(skip).limit(limit).all()


def create(db: Session, obj_in: TeacherLectureScoreSheetCreate) -> TeacherLectureScoreSheet:
    db_obj = TeacherLectureScoreSheet(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, db_obj: TeacherLectureScoreSheet, obj_in: TeacherLectureScoreSheetUpdate) -> TeacherLectureScoreSheet:
    data = obj_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, record_id: int) -> Optional[TeacherLectureScoreSheet]:
    obj = db.query(TeacherLectureScoreSheet).get(record_id)
    if obj is None:
        return None
    db.delete(obj)
    db.commit()
    return obj
