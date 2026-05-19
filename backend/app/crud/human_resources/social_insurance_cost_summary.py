"""
集团人资基础 - 社保费用汇总表 CRUD
"""

from __future__ import annotations

import json
from typing import Optional

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.models.human_resources import SocialInsuranceCostSummary
from app.models.user import User
from app.schemas.human_resources.social_insurance_cost_summary import (
    SocialInsuranceCostSummaryCreate,
    SocialInsuranceCostSummaryUpdate,
)


def _normalize_required_str(value: str, field_label: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_label}不能为空")
    return normalized


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _serialize_employees(employees: list[dict]) -> str:
    return json.dumps(employees, ensure_ascii=False)


def _parse_employees(value: Optional[str]) -> list[dict]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    employees: list[dict] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        employees.append(
            {
                "service_fee": float(item.get("service_fee") or 0),
                "id_number": str(item.get("id_number") or ""),
                "name": str(item.get("name") or "").strip(),
                "injury_base": float(item.get("injury_base") or 0),
                "pension_base": float(item.get("pension_base") or 0),
                "unemployment_base": float(item.get("unemployment_base") or 0),
                "medical_base": float(item.get("medical_base") or 0),
            }
        )
    return employees


def serialize_record(record: SocialInsuranceCostSummary) -> dict:
    return {
        "id": record.id,
        "campus": record.campus,
        "unit_name": record.unit_name,
        "period": record.period,
        "injury_enterprise_rate": record.injury_enterprise_rate,
        "employees": _parse_employees(record.employees_json),
        "remark": record.remark,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def list_records(
    db: Session,
    *,
    campus: Optional[str] = None,
    search: Optional[str] = None,
) -> list[SocialInsuranceCostSummary]:
    query = db.query(SocialInsuranceCostSummary)

    if campus:
        query = query.filter(SocialInsuranceCostSummary.campus == campus.strip())

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SocialInsuranceCostSummary.unit_name.ilike(keyword),
                SocialInsuranceCostSummary.period.ilike(keyword),
                SocialInsuranceCostSummary.remark.ilike(keyword),
                SocialInsuranceCostSummary.employees_json.ilike(keyword),
            )
        )

    return (
        query.order_by(
            desc(SocialInsuranceCostSummary.updated_at),
            desc(SocialInsuranceCostSummary.id),
        )
        .all()
    )


def get_record(db: Session, record_id: int) -> Optional[SocialInsuranceCostSummary]:
    return (
        db.query(SocialInsuranceCostSummary)
        .filter(SocialInsuranceCostSummary.id == record_id)
        .first()
    )


def create_record(
    db: Session,
    payload: SocialInsuranceCostSummaryCreate,
    current_user: User,
) -> SocialInsuranceCostSummary:
    employees = [item.model_dump() for item in payload.employees]
    record = SocialInsuranceCostSummary(
        campus=_normalize_required_str(payload.campus, "所属神殿"),
        unit_name=_normalize_required_str(payload.unit_name, "单位名称"),
        period=_normalize_required_str(payload.period, "期间"),
        injury_enterprise_rate=float(payload.injury_enterprise_rate),
        employees_json=_serialize_employees(employees),
        remark=_normalize_optional_str(payload.remark),
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(
    db: Session,
    record: SocialInsuranceCostSummary,
    payload: SocialInsuranceCostSummaryUpdate,
) -> SocialInsuranceCostSummary:
    data = payload.model_dump(exclude_unset=True)

    if "campus" in data:
        record.campus = _normalize_required_str(data["campus"], "所属神殿")
    if "unit_name" in data:
        record.unit_name = _normalize_required_str(data["unit_name"], "单位名称")
    if "period" in data:
        record.period = _normalize_required_str(data["period"], "期间")
    if "injury_enterprise_rate" in data:
        record.injury_enterprise_rate = float(data["injury_enterprise_rate"])
    if "employees" in data:
        record.employees_json = _serialize_employees(
            [item.model_dump() if hasattr(item, "model_dump") else item for item in data["employees"]]
        )
    if "remark" in data:
        record.remark = _normalize_optional_str(data["remark"])

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: SocialInsuranceCostSummary) -> None:
    db.delete(record)
    db.commit()