from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from app.models.market import MarketAccountSentimentRegister
from app.schemas.market.account_sentiment import AccountSentimentRowCreate


def get_by_campus(db: Session, campus_name: str) -> List[MarketAccountSentimentRegister]:
    return (
        db.query(MarketAccountSentimentRegister)
        .filter(MarketAccountSentimentRegister.campus_name == campus_name)
        .order_by(MarketAccountSentimentRegister.id.asc())
        .all()
    )


def replace_by_campus(
    db: Session,
    campus_name: str,
    rows: List[AccountSentimentRowCreate],
) -> List[MarketAccountSentimentRegister]:
    # delete old
    db.query(MarketAccountSentimentRegister).filter(
        MarketAccountSentimentRegister.campus_name == campus_name
    ).delete(synchronize_session=False)

    # insert new
    entities: List[MarketAccountSentimentRegister] = []
    for r in rows:
        entities.append(
            MarketAccountSentimentRegister(
                campus_name=campus_name,
                inchargeInside=r.inchargeInside or '',
                inchargeOutside=r.inchargeOutside or '',
                platform=r.platform or '',
                accountId=r.accountId or '',
                nickname=r.nickname or '',
                avatar=r.avatar or '',
                remark=r.remark or '',
            )
        )

    if entities:
        db.add_all(entities)

    db.commit()

    return get_by_campus(db, campus_name)

