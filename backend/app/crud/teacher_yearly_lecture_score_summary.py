from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.teacher_yearly_lecture_score_summary import TeacherYearlyLectureScoreSummary
from app.schemas.teacher_yearly_lecture_score_summary import (
    TeacherYearlyLectureScoreSummaryCreate,
    TeacherYearlyLectureScoreSummaryUpdate,
)


def list_records(
    db: Session,
    year: Optional[int] = None,
    campus_name: Optional[str] = None,
) -> List[TeacherYearlyLectureScoreSummary]:
    query = db.query(TeacherYearlyLectureScoreSummary)
    if year is not None:
        query = query.filter(TeacherYearlyLectureScoreSummary.year == year)
    if campus_name is not None:
        query = query.filter(TeacherYearlyLectureScoreSummary.campus_name == campus_name)
    return query.order_by(TeacherYearlyLectureScoreSummary.id.desc()).all()


def get_record(db: Session, record_id: int) -> Optional[TeacherYearlyLectureScoreSummary]:
    return db.query(TeacherYearlyLectureScoreSummary).filter_by(id=record_id).first()


def get_by_year(db: Session, year: int, campus_name: Optional[str] = None) -> Optional[TeacherYearlyLectureScoreSummary]:
    query = db.query(TeacherYearlyLectureScoreSummary).filter_by(year=year)
    if campus_name is not None:
        query = query.filter_by(campus_name=campus_name)
    return query.first()


def create_record(db: Session, data: TeacherYearlyLectureScoreSummaryCreate) -> TeacherYearlyLectureScoreSummary:
    obj = TeacherYearlyLectureScoreSummary(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_record(db: Session, record_id: int, data: TeacherYearlyLectureScoreSummaryUpdate) -> Optional[TeacherYearlyLectureScoreSummary]:
    obj = db.query(TeacherYearlyLectureScoreSummary).filter_by(id=record_id).first()
    if not obj:
        return None
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def upsert_by_year(db: Session, year: int, summary_data: List[Dict], campus_name: Optional[str] = None) -> TeacherYearlyLectureScoreSummary:
    """根据年份和神殿创建或更新汇总记录"""
    existing = get_by_year(db, year, campus_name)
    if existing:
        existing.summary_data = summary_data
        db.commit()
        db.refresh(existing)
        return existing
    else:
        obj = TeacherYearlyLectureScoreSummary(year=year, summary_data=summary_data, campus_name=campus_name)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj


def delete_record(db: Session, record_id: int) -> bool:
    obj = db.query(TeacherYearlyLectureScoreSummary).filter_by(id=record_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

