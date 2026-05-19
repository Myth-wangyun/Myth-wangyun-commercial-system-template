"""
集团人资基础 - 培训成绩汇总表 CRUD
"""

from __future__ import annotations

import json
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.human_resources import TrainingResult
from app.models.user import User
from app.schemas.human_resources.training_result import TrainingResultCreate, TrainingResultUpdate

PASS_SCORE = 60


def _normalize_optional_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _normalize_required_str(value: str, field_label: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_label}不能为空")
    return normalized


def _calc_composite(theory_score: int, practice_score: int) -> int:
    return round(theory_score * 0.5 + practice_score * 0.5)


def _round_float(value: float) -> float:
    return round(float(value), 2)


def _normalize_trainees(raw_trainees: list[dict]) -> list[dict]:
    trainees: list[dict] = []
    for item in raw_trainees:
        name = _normalize_required_str(item["name"], "参训人员姓名")
        theory_score = int(item["theory_score"])
        practice_score = int(item["practice_score"])
        if theory_score < 0 or theory_score > 100:
            raise ValueError(f"{name} 的理论成绩必须在0到100之间")
        if practice_score < 0 or practice_score > 100:
            raise ValueError(f"{name} 的实操成绩必须在0到100之间")
        trainees.append(
            {
                "name": name,
                "theory_score": theory_score,
                "practice_score": practice_score,
                "composite_score": _calc_composite(theory_score, practice_score),
                "rank": 0,
                "remark": _normalize_optional_str(item.get("remark")),
            }
        )

    trainees.sort(key=lambda trainee: (-trainee["composite_score"], trainee["name"]))
    for index, trainee in enumerate(trainees, start=1):
        trainee["rank"] = index
    return trainees


def _serialize_trainees(trainees: list[dict]) -> str:
    return json.dumps(trainees, ensure_ascii=False)


def _parse_trainees_json(value: Optional[str]) -> list[dict]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    result: list[dict] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        result.append(
            {
                "name": item.get("name", ""),
                "theory_score": int(item.get("theory_score", 0)),
                "practice_score": int(item.get("practice_score", 0)),
                "composite_score": int(item.get("composite_score", 0)),
                "rank": int(item.get("rank", 0)),
                "remark": item.get("remark"),
            }
        )
    return result


def _build_summary(trainees: list[dict], total_cost: float) -> dict:
    actual_count = len(trainees)
    pass_count = sum(1 for trainee in trainees if trainee["composite_score"] >= PASS_SCORE)
    fail_count = actual_count - pass_count
    total_score = sum(trainee["composite_score"] for trainee in trainees)
    average_score = _round_float(total_score / actual_count) if actual_count else 0
    average_cost = _round_float(total_cost / actual_count) if actual_count else 0
    pass_rate = _round_float(pass_count / actual_count * 100) if actual_count else 0
    return {
        "actual_count": actual_count,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "average_score": average_score,
        "average_cost": average_cost,
        "pass_rate": pass_rate,
    }


def serialize_record(record: TrainingResult) -> dict:
    trainees = _parse_trainees_json(record.trainees_json)
    return {
        "id": record.id,
        "campus": record.campus,
        "department": record.department,
        "training_date": record.training_date,
        "training_hours": record.training_hours,
        "expected_count": record.expected_count,
        "actual_count": record.actual_count,
        "pass_count": record.pass_count,
        "fail_count": record.fail_count,
        "average_score": record.average_score,
        "total_cost": record.total_cost,
        "average_cost": record.average_cost,
        "pass_rate": record.pass_rate,
        "trainees": trainees,
        "year": record.year,
        "remark": record.remark,
        "created_by_user_id": record.created_by_user_id,
        "created_by_name": record.created_by_name,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


def list_records(
    db: Session,
    *,
    year: Optional[str] = None,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    return_total: bool = False,
) -> list[TrainingResult] | tuple[list[TrainingResult], int]:
    query = db.query(TrainingResult)

    if year:
        query = query.filter(TrainingResult.year == year.strip())
    if campus:
        query = query.filter(TrainingResult.campus == campus.strip())
    if department:
        query = query.filter(TrainingResult.department == department.strip())
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TrainingResult.campus.ilike(keyword),
                TrainingResult.department.ilike(keyword),
                TrainingResult.trainees_json.ilike(keyword),
                TrainingResult.remark.ilike(keyword),
            )
        )

    total = query.count() if return_total else 0
    query = query.order_by(TrainingResult.training_date.desc(), TrainingResult.id.desc())
    if page and page_size:
        query = query.offset((page - 1) * page_size).limit(page_size)
    records = query.all()
    if return_total:
        return records, total
    return records


def get_record(db: Session, record_id: int) -> Optional[TrainingResult]:
    return db.query(TrainingResult).filter(TrainingResult.id == record_id).first()


def create_record(db: Session, payload: TrainingResultCreate, current_user: User) -> TrainingResult:
    campus = _normalize_required_str(payload.campus, "神殿")
    department = _normalize_required_str(payload.department, "部门")
    trainees = _normalize_trainees([item.model_dump() for item in payload.trainees])
    total_cost = _round_float(payload.total_cost)
    summary = _build_summary(trainees, total_cost)

    record = TrainingResult(
        campus=campus,
        department=department,
        training_date=payload.training_date,
        training_hours=_round_float(payload.training_hours),
        expected_count=payload.expected_count,
        actual_count=summary["actual_count"],
        pass_count=summary["pass_count"],
        fail_count=summary["fail_count"],
        average_score=summary["average_score"],
        total_cost=total_cost,
        average_cost=summary["average_cost"],
        pass_rate=summary["pass_rate"],
        trainees_json=_serialize_trainees(trainees),
        year=str(payload.training_date.year),
        remark=_normalize_optional_str(payload.remark),
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(db: Session, record: TrainingResult, payload: TrainingResultUpdate) -> TrainingResult:
    data = payload.model_dump(exclude_unset=True)

    if "campus" in data:
        record.campus = _normalize_required_str(data["campus"], "神殿")
    if "department" in data:
        record.department = _normalize_required_str(data["department"], "部门")
    if "training_date" in data:
        record.training_date = data["training_date"]
        record.year = str(data["training_date"].year)
    if "training_hours" in data:
        record.training_hours = _round_float(data["training_hours"])
    if "expected_count" in data:
        record.expected_count = int(data["expected_count"])
    if "remark" in data:
        record.remark = _normalize_optional_str(data["remark"])

    total_cost = _round_float(data["total_cost"]) if "total_cost" in data else record.total_cost
    trainees = (
        _normalize_trainees([item.model_dump() for item in data["trainees"]])
        if "trainees" in data
        else _parse_trainees_json(record.trainees_json)
    )
    summary = _build_summary(trainees, total_cost)

    record.total_cost = total_cost
    record.actual_count = summary["actual_count"]
    record.pass_count = summary["pass_count"]
    record.fail_count = summary["fail_count"]
    record.average_score = summary["average_score"]
    record.average_cost = summary["average_cost"]
    record.pass_rate = summary["pass_rate"]
    record.trainees_json = _serialize_trainees(trainees)

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: TrainingResult) -> None:
    db.delete(record)
    db.commit()