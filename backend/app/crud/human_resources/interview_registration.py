"""
集团人资基础 - 面试登记表 CRUD
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.crud.human_resources import employee_archive as employee_archive_crud
from app.models.human_resources import InterviewRegistration
from app.models.user import User
from app.schemas.human_resources.interview_registration import (
    InterviewRegistrationCreate,
    InterviewRegistrationUpdate,
)


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def list_records(
    db: Session,
    *,
    campus_name: Optional[str] = None,
    search: Optional[str] = None,
) -> list[InterviewRegistration]:
    query = db.query(InterviewRegistration)

    if campus_name:
        query = query.filter(InterviewRegistration.campus_name == campus_name.strip())

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InterviewRegistration.name.ilike(keyword),
                InterviewRegistration.region.ilike(keyword),
                InterviewRegistration.campus_name.ilike(keyword),
                InterviewRegistration.position.ilike(keyword),
                InterviewRegistration.phone.ilike(keyword),
                InterviewRegistration.source.ilike(keyword),
                InterviewRegistration.inviter.ilike(keyword),
            )
        )

    return query.order_by(
        InterviewRegistration.invite_date.desc().nullslast(),
        InterviewRegistration.created_at.desc(),
    ).all()


def get_record(db: Session, record_id: int) -> Optional[InterviewRegistration]:
    return (
        db.query(InterviewRegistration)
        .filter(InterviewRegistration.id == record_id)
        .first()
    )


def create_record(
    db: Session,
    payload: InterviewRegistrationCreate,
    current_user: User,
) -> InterviewRegistration:
    record = InterviewRegistration(
        region=_normalize_optional_str(payload.region),
        campus_name=_normalize_optional_str(payload.campus_name),
        name=payload.name.strip(),
        source=_normalize_optional_str(payload.source),
        phone=_normalize_optional_str(payload.phone),
        position=_normalize_optional_str(payload.position),
        invite_date=payload.invite_date,
        inviter=_normalize_optional_str(payload.inviter),
        scheduled_time=_normalize_optional_str(payload.scheduled_time),
        attended_first=_normalize_optional_str(payload.attended_first),
        first_interviewer=_normalize_optional_str(payload.first_interviewer),
        first_evaluation=_normalize_optional_str(payload.first_evaluation),
        first_hire_decision=_normalize_optional_str(payload.first_hire_decision),
        attended_second=_normalize_optional_str(payload.attended_second),
        second_time=_normalize_optional_str(payload.second_time),
        second_evaluation=_normalize_optional_str(payload.second_evaluation),
        final_hire_decision=_normalize_optional_str(payload.final_hire_decision),
        reported=_normalize_optional_str(payload.reported),
        onboard_date=payload.onboard_date,
        not_onboard_reason=_normalize_optional_str(payload.not_onboard_reason),
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    db.add(record)
    employee_archive_crud.sync_archive_from_interview_registration(
        db,
        name=record.name,
        campus=record.campus_name,
        position=record.position,
        phone=record.phone,
        onboard_date=record.onboard_date,
        final_hire_decision=record.final_hire_decision,
        reported=record.reported,
    )
    db.commit()
    db.refresh(record)
    return record


def update_record(
    db: Session,
    record: InterviewRegistration,
    payload: InterviewRegistrationUpdate,
) -> InterviewRegistration:
    for field, value in payload.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = _normalize_optional_str(value)
        setattr(record, field, value)

    employee_archive_crud.sync_archive_from_interview_registration(
        db,
        name=record.name,
        campus=record.campus_name,
        position=record.position,
        phone=record.phone,
        onboard_date=record.onboard_date,
        final_hire_decision=record.final_hire_decision,
        reported=record.reported,
    )
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: InterviewRegistration) -> None:
    db.delete(record)
    db.commit()
