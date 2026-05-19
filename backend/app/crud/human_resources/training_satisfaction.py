"""
集团人资基础 - 培训满意度调查 CRUD
"""

from __future__ import annotations

import json
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.human_resources import TrainingSatisfactionSurvey
from app.models.user import User
from app.schemas.human_resources.training_satisfaction import (
    TrainingSatisfactionCreate,
    TrainingSatisfactionUpdate,
)

COURSE_CONTENT_KEYS = ["q1", "q2", "q3", "q4", "q5"]
TRAINER_KEYS = ["q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13"]
TRAINING_METHOD_KEYS = ["q14"]
ALL_SCORE_KEYS = COURSE_CONTENT_KEYS + TRAINER_KEYS + TRAINING_METHOD_KEYS

COURSE_CONTENT_LEVEL_POINTS = {5: 8, 4: 6, 3: 4, 2: 2, 1: 0, 0: 0}
TRAINER_LEVEL_POINTS = {5: 7, 4: 5, 3: 3, 2: 1, 1: 0, 0: 0}
TRAINING_METHOD_LEVEL_POINTS = {5: 4, 4: 3, 3: 2, 2: 1, 1: 0, 0: 0}
LEVEL_POINTS_BY_KEY = {
    **{key: COURSE_CONTENT_LEVEL_POINTS for key in COURSE_CONTENT_KEYS},
    **{key: TRAINER_LEVEL_POINTS for key in TRAINER_KEYS},
    **{key: TRAINING_METHOD_LEVEL_POINTS for key in TRAINING_METHOD_KEYS},
}


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


def _normalize_scores(scores: dict[str, int]) -> dict[str, int]:
    normalized: dict[str, int] = {}
    for key in ALL_SCORE_KEYS:
        if key not in scores:
            raise ValueError(f"缺少评分项：{key}")
        try:
            score = int(scores[key])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"评分项 {key} 的分值无效") from exc
        if score not in {1, 2, 3, 4, 5}:
            raise ValueError(f"评分项 {key} 只能是1到5分")
        normalized[key] = score
    return normalized


def _serialize_scores(scores: dict[str, int]) -> str:
    return json.dumps(scores, ensure_ascii=False, sort_keys=True)


def _parse_scores_json(value: Optional[str]) -> dict[str, int]:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return {}
    if not isinstance(parsed, dict):
        return {}
    result: dict[str, int] = {}
    for key in ALL_SCORE_KEYS:
        try:
            result[key] = int(parsed.get(key, 0))
        except (TypeError, ValueError):
            result[key] = 0
    return result


def _calc_total(scores: dict[str, int], keys: list[str]) -> int:
    total = 0
    for key in keys:
        level = int(scores.get(key, 0) or 0)
        total += LEVEL_POINTS_BY_KEY.get(key, {}).get(level, 0)
    return total


def _build_totals(scores: dict[str, int]) -> tuple[int, int, int, int]:
    course_content_total = _calc_total(scores, COURSE_CONTENT_KEYS)
    trainer_total = _calc_total(scores, TRAINER_KEYS)
    training_method_total = _calc_total(scores, TRAINING_METHOD_KEYS)
    total_score = course_content_total + trainer_total + training_method_total
    return course_content_total, trainer_total, training_method_total, total_score


def get_record_totals(record: TrainingSatisfactionSurvey) -> tuple[int, int, int, int]:
    return _build_totals(_parse_scores_json(record.scores_json))


def serialize_record(record: TrainingSatisfactionSurvey) -> dict:
    scores = _parse_scores_json(record.scores_json)
    course_content_total, trainer_total, training_method_total, total_score = _build_totals(scores)
    return {
        "id": record.id,
        "department": record.department,
        "training_date": record.training_date,
        "training_location": record.training_location,
        "course_content": record.course_content,
        "trainer": record.trainer,
        "scores": scores,
        "section_totals": {
            "course_content": course_content_total,
            "trainer": trainer_total,
            "training_method": training_method_total,
        },
        "total_score": total_score,
        "open_q4": record.open_q4,
        "open_q5": record.open_q5,
        "open_q6": record.open_q6,
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
    department: Optional[str] = None,
    search: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    return_total: bool = False,
) -> list[TrainingSatisfactionSurvey] | tuple[list[TrainingSatisfactionSurvey], int]:
    query = db.query(TrainingSatisfactionSurvey)

    if year:
        query = query.filter(TrainingSatisfactionSurvey.year == year.strip())

    if department:
        query = query.filter(TrainingSatisfactionSurvey.department == department.strip())

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TrainingSatisfactionSurvey.department.ilike(keyword),
                TrainingSatisfactionSurvey.training_location.ilike(keyword),
                TrainingSatisfactionSurvey.course_content.ilike(keyword),
                TrainingSatisfactionSurvey.trainer.ilike(keyword),
                TrainingSatisfactionSurvey.open_q4.ilike(keyword),
                TrainingSatisfactionSurvey.open_q5.ilike(keyword),
                TrainingSatisfactionSurvey.open_q6.ilike(keyword),
                TrainingSatisfactionSurvey.remark.ilike(keyword),
            )
        )

    total = query.count() if return_total else 0
    query = query.order_by(
        TrainingSatisfactionSurvey.training_date.desc(),
        TrainingSatisfactionSurvey.id.desc(),
    )
    if page and page_size:
        query = query.offset((page - 1) * page_size).limit(page_size)
    records = query.all()
    if return_total:
        return records, total
    return records


def get_record(db: Session, record_id: int) -> Optional[TrainingSatisfactionSurvey]:
    return db.query(TrainingSatisfactionSurvey).filter(TrainingSatisfactionSurvey.id == record_id).first()


def create_record(
    db: Session,
    payload: TrainingSatisfactionCreate,
    current_user: User,
) -> TrainingSatisfactionSurvey:
    department = _normalize_required_str(payload.department, "部门")
    training_location = _normalize_required_str(payload.training_location, "培训地点")
    course_content = _normalize_required_str(payload.course_content, "课程内容")
    trainer = _normalize_required_str(payload.trainer, "培训讲师")
    scores = _normalize_scores(payload.scores)
    course_content_total, trainer_total, training_method_total, total_score = _build_totals(scores)

    record = TrainingSatisfactionSurvey(
        department=department,
        training_date=payload.training_date,
        training_location=training_location,
        course_content=course_content,
        trainer=trainer,
        scores_json=_serialize_scores(scores),
        course_content_total=course_content_total,
        trainer_total=trainer_total,
        training_method_total=training_method_total,
        total_score=total_score,
        open_q4=_normalize_optional_str(payload.open_q4),
        open_q5=_normalize_optional_str(payload.open_q5),
        open_q6=_normalize_optional_str(payload.open_q6),
        year=str(payload.training_date.year),
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
    record: TrainingSatisfactionSurvey,
    payload: TrainingSatisfactionUpdate,
) -> TrainingSatisfactionSurvey:
    data = payload.model_dump(exclude_unset=True)

    if "department" in data:
        record.department = _normalize_required_str(data["department"], "部门")
    if "training_date" in data:
        record.training_date = data["training_date"]
        record.year = str(data["training_date"].year)
    if "training_location" in data:
        record.training_location = _normalize_required_str(data["training_location"], "培训地点")
    if "course_content" in data:
        record.course_content = _normalize_required_str(data["course_content"], "课程内容")
    if "trainer" in data:
        record.trainer = _normalize_required_str(data["trainer"], "培训讲师")
    if "open_q4" in data:
        record.open_q4 = _normalize_optional_str(data["open_q4"])
    if "open_q5" in data:
        record.open_q5 = _normalize_optional_str(data["open_q5"])
    if "open_q6" in data:
        record.open_q6 = _normalize_optional_str(data["open_q6"])
    if "remark" in data:
        record.remark = _normalize_optional_str(data["remark"])
    if "scores" in data:
        scores = _normalize_scores(data["scores"])
        course_content_total, trainer_total, training_method_total, total_score = _build_totals(scores)
        record.scores_json = _serialize_scores(scores)
        record.course_content_total = course_content_total
        record.trainer_total = trainer_total
        record.training_method_total = training_method_total
        record.total_score = total_score

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: TrainingSatisfactionSurvey) -> None:
    db.delete(record)
    db.commit()
