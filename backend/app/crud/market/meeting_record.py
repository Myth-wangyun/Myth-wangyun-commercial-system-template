from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from app.models.market import MarketMeetingRecord
from app.schemas.market.meeting_record import MeetingRecordRowCreate


def list_rows(db: Session) -> List[MarketMeetingRecord]:
    return db.query(MarketMeetingRecord).order_by(MarketMeetingRecord.id.asc()).all()


def replace_all(db: Session, rows: List[MeetingRecordRowCreate]) -> List[MarketMeetingRecord]:
    db.query(MarketMeetingRecord).delete(synchronize_session=False)

    entities: List[MarketMeetingRecord] = []
    for r in rows:
        entities.append(
            MarketMeetingRecord(
                meeting_time=r.meeting_time or '',
                location=r.location or '',
                host=r.host or '',
                important_leader=r.important_leader or '',
                participants=r.participants or '',
                agenda=r.agenda or '',
                issues_resolved=r.issues_resolved or '',
                issues_pending=r.issues_pending or '',
                file_path=r.file_path or '',
                file_name=r.file_name or '',
            )
        )

    if entities:
        db.add_all(entities)

    db.commit()

    return list_rows(db)

