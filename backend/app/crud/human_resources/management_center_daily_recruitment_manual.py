"""
最高议事厅日度核心数据看板 - 招聘及入职手填数据 CRUD
"""

from __future__ import annotations

import json
from datetime import date

from sqlalchemy.orm import Session

from app.models.human_resources import ManagementCenterDailyRecruitmentManual
from app.models.user import User
from app.schemas.human_resources.management_center_daily_recruitment_manual import (
    ManagementCenterDailyRecruitmentManualUpsert,
)


def _serialize_names(names: list[str]) -> str:
    return json.dumps(names, ensure_ascii=False)


def _deserialize_names(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        if isinstance(item, str):
            normalized = item.strip()
            if normalized:
                result.append(normalized)
    return result


def _to_schema_record(
    record: ManagementCenterDailyRecruitmentManual,
) -> ManagementCenterDailyRecruitmentManual:
    record.transfer_names = _deserialize_names(record.transfer_names_json)
    record.optimize_names = _deserialize_names(record.optimize_names_json)
    record.resign_names = _deserialize_names(record.resign_names_json)
    return record


def list_records(
    db: Session,
    *,
    start_date: date,
    end_date: date,
) -> list[ManagementCenterDailyRecruitmentManual]:
    records = (
        db.query(ManagementCenterDailyRecruitmentManual)
        .filter(ManagementCenterDailyRecruitmentManual.stat_date >= start_date)
        .filter(ManagementCenterDailyRecruitmentManual.stat_date < end_date)
        .order_by(
            ManagementCenterDailyRecruitmentManual.stat_date.asc(),
            ManagementCenterDailyRecruitmentManual.department.asc(),
        )
        .all()
    )
    return [_to_schema_record(record) for record in records]


def upsert_record(
    db: Session,
    payload: ManagementCenterDailyRecruitmentManualUpsert,
    current_user: User,
) -> ManagementCenterDailyRecruitmentManual:
    record = (
        db.query(ManagementCenterDailyRecruitmentManual)
        .filter(ManagementCenterDailyRecruitmentManual.stat_date == payload.stat_date)
        .filter(ManagementCenterDailyRecruitmentManual.department == payload.department)
        .first()
    )

    if not record:
        record = ManagementCenterDailyRecruitmentManual(
            stat_date=payload.stat_date,
            department=payload.department,
        )
        db.add(record)

    record.authorized_posts = payload.authorized_posts
    record.current_posts = payload.current_posts
    record.planned_optimize_count = payload.planned_optimize_count
    record.actual_optimize_count = payload.actual_optimize_count
    record.transfer_names_json = _serialize_names(payload.transfer_names)
    record.optimize_names_json = _serialize_names(payload.optimize_names)
    record.resign_names_json = _serialize_names(payload.resign_names)
    record.updated_by_user_id = current_user.user_id
    record.updated_by_name = current_user.real_name

    db.commit()
    db.refresh(record)
    return _to_schema_record(record)
