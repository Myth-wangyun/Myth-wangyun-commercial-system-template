from __future__ import annotations

from typing import List

from app.crud.market.meeting_record import list_rows as crud_list_rows
from app.crud.market.meeting_record import replace_all
from app.schemas.market.meeting_record import MeetingRecordRowCreate
from sqlalchemy.orm import Session


def list_rows(db: Session):
    return crud_list_rows(db)


def bulk_save(db: Session, rows: List[MeetingRecordRowCreate]):
    return replace_all(db, rows)

