from __future__ import annotations

from typing import List

from app.crud.market.account_sentiment import get_by_campus, replace_by_campus
from app.schemas.market.account_sentiment import AccountSentimentRowCreate
from sqlalchemy.orm import Session


def list_rows(db: Session, campus_name: str):
    return get_by_campus(db, campus_name)


def bulk_save(db: Session, campus_name: str, rows: List[AccountSentimentRowCreate]):
    return replace_by_campus(db, campus_name, rows)

