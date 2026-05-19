from __future__ import annotations

from typing import List

from app.models.market.employee_interview_records import MarketEmployeeInterviewRecord
from app.schemas.market.employee_interview_records import EmployeeInterviewRecordRowIn
from sqlalchemy.orm import Session


def list_rows(db: Session, year: int) -> List[MarketEmployeeInterviewRecord]:
    return (
        db.query(MarketEmployeeInterviewRecord)
        .filter(MarketEmployeeInterviewRecord.year == year)
        .order_by(MarketEmployeeInterviewRecord.id.asc())
        .all()
    )


def bulk_save(db: Session, rows: List[EmployeeInterviewRecordRowIn]) -> List[MarketEmployeeInterviewRecord]:
    saved: List[MarketEmployeeInterviewRecord] = []

    for r in rows:
        if r.id is not None:
            obj = db.query(MarketEmployeeInterviewRecord).filter(MarketEmployeeInterviewRecord.id == r.id).first()
        else:
            obj = None

        if obj is None:
            obj = MarketEmployeeInterviewRecord()
            db.add(obj)

        obj.year = r.year
        obj.interview_date = r.interview_date
        obj.interviewee = r.interviewee

        obj.jan_interviewer = r.jan_interviewer
        obj.jan_content = r.jan_content
        obj.feb_interviewer = r.feb_interviewer
        obj.feb_content = r.feb_content
        obj.mar_interviewer = r.mar_interviewer
        obj.mar_content = r.mar_content
        obj.apr_interviewer = r.apr_interviewer
        obj.apr_content = r.apr_content
        obj.may_interviewer = r.may_interviewer
        obj.may_content = r.may_content
        obj.jun_interviewer = r.jun_interviewer
        obj.jun_content = r.jun_content
        obj.jul_interviewer = r.jul_interviewer
        obj.jul_content = r.jul_content
        obj.aug_interviewer = r.aug_interviewer
        obj.aug_content = r.aug_content
        obj.sep_interviewer = r.sep_interviewer
        obj.sep_content = r.sep_content
        obj.oct_interviewer = r.oct_interviewer
        obj.oct_content = r.oct_content
        obj.nov_interviewer = r.nov_interviewer
        obj.nov_content = r.nov_content
        obj.dec_interviewer = r.dec_interviewer
        obj.dec_content = r.dec_content

        saved.append(obj)

    db.commit()

    for obj in saved:
        db.refresh(obj)

    return saved


def delete_row(db: Session, record_id: int) -> bool:
    obj = db.query(MarketEmployeeInterviewRecord).filter(MarketEmployeeInterviewRecord.id == record_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

