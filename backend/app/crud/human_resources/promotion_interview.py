"""
集团人资基础 - 晋升面试评价表 CRUD
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.human_resources import PromotionInterview
from app.models.user import User
from app.schemas.human_resources.promotion_interview import (
    PromotionInterviewCreate,
    PromotionInterviewUpdate,
)

if TYPE_CHECKING:
    from app.models.human_resources.promotion_application import PromotionApplication

SCORE_LIMITS = {
    "v1": 10,
    "v2": 10,
    "v3": 5,
    "v4": 10,
    "p1": 20,
    "p2": 20,
    "p3": 20,
    "k1": 10,
    "k2": 10,
    "k3": 5,
    "m1": 10,
    "m2": 5,
    "m3": 5,
}
COMMON_REQUIRED_SCORE_KEYS = ("v1", "v2", "v3", "v4", "k1", "k2", "k3", "m1", "m2", "m3")
DEFAULT_PERFORMANCE_TYPE = "p1"


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


def _normalize_scores(scores: Optional[dict], performance_type: str) -> dict[str, int]:
    if not isinstance(scores, dict):
        raise ValueError("评分明细格式不正确")

    required_keys = set(COMMON_REQUIRED_SCORE_KEYS)
    required_keys.add(performance_type)

    normalized_scores: dict[str, int] = {}
    for key, raw_value in scores.items():
        if key not in SCORE_LIMITS:
            raise ValueError(f"存在不支持的评分项: {key}")
        if raw_value is None:
            raise ValueError(f"评分项 {key} 不能为空")
        try:
            value = int(raw_value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"评分项 {key} 必须是整数") from exc
        max_score = SCORE_LIMITS[key]
        if value < 0 or value > max_score:
            raise ValueError(f"评分项 {key} 必须在 0-{max_score} 分之间")
        normalized_scores[key] = value

    missing_keys = [key for key in sorted(required_keys) if key not in normalized_scores]
    if missing_keys:
        raise ValueError(f"缺少评分项: {', '.join(missing_keys)}")

    return normalized_scores


def _calculate_total_score(scores: dict[str, int], performance_type: str) -> int:
    total = sum(scores.get(key, 0) for key in COMMON_REQUIRED_SCORE_KEYS)
    total += scores.get(performance_type, 0)
    return total


def _build_default_scores(
    performance_type: str = DEFAULT_PERFORMANCE_TYPE,
) -> dict[str, int]:
    required_keys = set(COMMON_REQUIRED_SCORE_KEYS)
    required_keys.add(performance_type)
    return {key: 0 for key in sorted(required_keys)}


def get_record_by_source_application_id(
    db: Session,
    source_application_id: int,
) -> Optional[PromotionInterview]:
    return (
        db.query(PromotionInterview)
        .filter(PromotionInterview.source_application_id == source_application_id)
        .first()
    )


def sync_record_from_application(
    db: Session,
    application: "PromotionApplication",
) -> PromotionInterview:
    record = get_record_by_source_application_id(db, application.id)
    if record is None:
        scores = _build_default_scores()
        record = PromotionInterview(
            source_application_id=application.id,
            name=_normalize_required_str(application.name, "姓名"),
            department=_normalize_required_str(application.department, "部门"),
            position=_normalize_required_str(application.position, "岗位"),
            campus=_normalize_required_str(application.campus, "所属神殿"),
            interview_date=application.fill_date,
            interviewer=None,
            performance_type=DEFAULT_PERFORMANCE_TYPE,
            scores=scores,
            total_score=_calculate_total_score(scores, DEFAULT_PERFORMANCE_TYPE),
            is_qualified=False,
            status="draft",
            created_by_user_id=application.created_by_user_id,
            created_by_name=application.created_by_name,
        )
        db.add(record)
        db.flush()
        return record

    record.name = _normalize_required_str(application.name, "姓名")
    record.department = _normalize_required_str(application.department, "部门")
    record.position = _normalize_required_str(application.position, "岗位")
    record.campus = _normalize_required_str(application.campus, "所属神殿")
    record.source_application_id = application.id
    if record.created_by_user_id is None:
        record.created_by_user_id = application.created_by_user_id
    if not record.created_by_name and application.created_by_name:
        record.created_by_name = application.created_by_name
    return record


def _ensure_linked_appointment_record(
    db: Session,
    record: PromotionInterview,
) -> None:
    from app.crud.human_resources import (
        appointment_interview_record as appointment_interview_record_crud,
    )

    appointment_interview_record_crud.ensure_record_for_qualified_interview(db, record)


def list_records(
    db: Session,
    *,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> list[PromotionInterview]:
    query = db.query(PromotionInterview)

    if campus:
        query = query.filter(PromotionInterview.campus == campus.strip())
    if department:
        query = query.filter(PromotionInterview.department == department.strip())
    if status:
        query = query.filter(PromotionInterview.status == status.strip())
    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PromotionInterview.name.ilike(keyword),
                PromotionInterview.department.ilike(keyword),
                PromotionInterview.position.ilike(keyword),
                PromotionInterview.campus.ilike(keyword),
                PromotionInterview.interviewer.ilike(keyword),
                PromotionInterview.created_by_name.ilike(keyword),
            )
        )

    return query.order_by(
        PromotionInterview.interview_date.desc(),
        PromotionInterview.created_at.desc(),
    ).all()


def get_record(db: Session, record_id: int) -> Optional[PromotionInterview]:
    return db.query(PromotionInterview).filter(PromotionInterview.id == record_id).first()


def create_record(
    db: Session,
    payload: PromotionInterviewCreate,
    current_user: User,
) -> PromotionInterview:
    performance_type = payload.performance_type
    scores = _normalize_scores(payload.scores, performance_type)
    total_score = _calculate_total_score(scores, performance_type)

    record = PromotionInterview(
        name=_normalize_required_str(payload.name, "姓名"),
        department=_normalize_required_str(payload.department, "部门"),
        position=_normalize_required_str(payload.position, "岗位"),
        campus=_normalize_required_str(payload.campus, "所属神殿"),
        interview_date=payload.interview_date,
        interviewer=_normalize_optional_str(payload.interviewer),
        performance_type=performance_type,
        scores=scores,
        total_score=total_score,
        is_qualified=total_score >= 80,
        status=payload.status,
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    db.add(record)
    db.flush()
    _ensure_linked_appointment_record(db, record)
    db.commit()
    db.refresh(record)
    return record


def update_record(
    db: Session,
    record: PromotionInterview,
    payload: PromotionInterviewUpdate,
) -> PromotionInterview:
    update_data = payload.model_dump(exclude_unset=True)

    if "name" in update_data:
        record.name = _normalize_required_str(update_data["name"], "姓名")
    if "department" in update_data:
        record.department = _normalize_required_str(update_data["department"], "部门")
    if "position" in update_data:
        record.position = _normalize_required_str(update_data["position"], "岗位")
    if "campus" in update_data:
        record.campus = _normalize_required_str(update_data["campus"], "所属神殿")
    if "interview_date" in update_data:
        record.interview_date = update_data["interview_date"]
    if "interviewer" in update_data:
        record.interviewer = _normalize_optional_str(update_data["interviewer"])
    if "status" in update_data and update_data["status"] is not None:
        record.status = update_data["status"]

    merged_performance_type = update_data.get("performance_type", record.performance_type)
    merged_scores = update_data.get("scores", record.scores or {})
    normalized_scores = _normalize_scores(merged_scores, merged_performance_type)
    total_score = _calculate_total_score(normalized_scores, merged_performance_type)

    record.performance_type = merged_performance_type
    record.scores = normalized_scores
    record.total_score = total_score
    record.is_qualified = total_score >= 80

    _ensure_linked_appointment_record(db, record)
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: PromotionInterview) -> None:
    db.delete(record)
    db.commit()
