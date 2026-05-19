from typing import List, Optional

from app.models.market.partner_contacts import MarketPartnerContact
from sqlalchemy.orm import Session


def list_rows(db: Session, campus: Optional[str] = None) -> List[MarketPartnerContact]:
    q = db.query(MarketPartnerContact)
    if campus:
        q = q.filter(MarketPartnerContact.campus == campus)
    return q.order_by(MarketPartnerContact.id.asc()).all()


def bulk_save(db: Session, campus: str, rows: List[dict]) -> List[MarketPartnerContact]:
    # replace campus dataset with provided rows (upsert by id if provided, otherwise create new)
    existing = db.query(MarketPartnerContact).filter(MarketPartnerContact.campus == campus).all()
    existing_by_id = {r.id: r for r in existing}

    seen_ids = set()
    saved: List[MarketPartnerContact] = []

    for row in rows:
        row_id = row.get('id')
        if row_id and row_id in existing_by_id:
            obj = existing_by_id[row_id]
            seen_ids.add(row_id)
        else:
            obj = MarketPartnerContact(campus=campus)
            db.add(obj)

        obj.campus = campus
        obj.partner_name = row.get('partner_name', '') or ''
        obj.official_website = row.get('official_website', '') or ''
        obj.partner_address = row.get('partner_address', '') or ''
        obj.landline = row.get('landline', '') or ''
        obj.contact_person = row.get('contact_person', '') or ''
        obj.phone = row.get('phone', '') or ''
        obj.wechat = row.get('wechat', '') or ''
        obj.contract_signer = row.get('contract_signer', '') or ''
        obj.contract_sign_date = row.get('contract_sign_date', '') or ''
        obj.contract_expire_date = row.get('contract_expire_date', '') or ''
        obj.negotiation_key_points = row.get('negotiation_key_points', '') or ''
        obj.notes = row.get('notes', '') or ''

        saved.append(obj)

    # delete rows for this campus that weren't included in payload (only for real ids)
    for obj in existing:
        if obj.id not in seen_ids:
            db.delete(obj)

    db.commit()

    # refresh
    for obj in saved:
        db.refresh(obj)

    return list_rows(db, campus)


def delete_row(db: Session, record_id: int) -> bool:
    obj = db.query(MarketPartnerContact).filter(MarketPartnerContact.id == record_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

