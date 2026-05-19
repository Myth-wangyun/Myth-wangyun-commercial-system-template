"""
集团人资基础 - 培训目标 CRUD
"""

from __future__ import annotations

import json
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.human_resources import TrainingGoal
from app.models.user import User
from app.schemas.human_resources.training_goal import TrainingGoalCreate, TrainingGoalUpdate

PARENT_CATEGORY_ORDER = [
    "价值观正",
    "责任心强",
    "执行力高",
    "业务能力",
    "职业化充分",
    "梯队建设",
]

LEVEL_ORDER = [
    "新员工岗前培训",
    "基层员工脱产培训",
    "中层脱产培训",
    "高层脱产培训",
]

CATEGORY_MAP: dict[str, list[str]] = {
    "价值观正": ["遵守纪律", "服从管理", "学习态度认真", "工作态度端正"],
    "责任心强": [""],
    "执行力高": [""],
    "业务能力": [""],
    "职业化充分": [""],
    "梯队建设": [""],
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


def _normalize_objectives(objectives: list[str]) -> list[str]:
    return [item.strip() for item in objectives if item and item.strip()]


def _parse_objectives_json(value: Optional[str]) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item).strip() for item in parsed if str(item).strip()]


def _year_sort_key(value: Optional[str]) -> int:
    if value and value.isdigit():
        return -int(value)
    return 0


def _parent_sort_key(value: Optional[str]) -> int:
    try:
        return PARENT_CATEGORY_ORDER.index(value or "")
    except ValueError:
        return len(PARENT_CATEGORY_ORDER)


def _sub_sort_key(parent_category: Optional[str], sub_category: Optional[str]) -> int:
    options = CATEGORY_MAP.get(parent_category or "", [])
    try:
        return options.index(sub_category or "")
    except ValueError:
        return len(options)


def _level_sort_key(value: Optional[str]) -> int:
    try:
        return LEVEL_ORDER.index(value or "")
    except ValueError:
        return len(LEVEL_ORDER)


def _serialize_objectives(objectives: list[str]) -> str:
    return json.dumps(objectives, ensure_ascii=False)


def _validate_unique_combination(
    db: Session,
    *,
    year: str,
    parent_category: str,
    sub_category: str,
    level: str,
    exclude_id: Optional[int] = None,
) -> None:
    query = db.query(TrainingGoal).filter(
        TrainingGoal.year == year,
        TrainingGoal.parent_category == parent_category,
        TrainingGoal.sub_category == sub_category,
        TrainingGoal.level == level,
    )
    if exclude_id is not None:
        query = query.filter(TrainingGoal.id != exclude_id)
    if query.first():
        raise ValueError("同一年度、一级分类、二级分类和培训级别的培训目标已存在")


def serialize_record(record: TrainingGoal) -> dict:
    return {
        "id": record.id,
        "parent_category": record.parent_category,
        "sub_category": record.sub_category,
        "level": record.level,
        "objectives": _parse_objectives_json(record.objectives_json),
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
    parent_category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
) -> list[TrainingGoal]:
    query = db.query(TrainingGoal)

    if year:
        query = query.filter(TrainingGoal.year == year.strip())

    if parent_category:
        query = query.filter(TrainingGoal.parent_category == parent_category.strip())

    if level:
        query = query.filter(TrainingGoal.level == level.strip())

    if search:
        keyword = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TrainingGoal.parent_category.ilike(keyword),
                TrainingGoal.sub_category.ilike(keyword),
                TrainingGoal.level.ilike(keyword),
                TrainingGoal.year.ilike(keyword),
                TrainingGoal.objectives_json.ilike(keyword),
                TrainingGoal.remark.ilike(keyword),
            )
        )

    records = query.all()
    return sorted(
        records,
        key=lambda item: (
            _year_sort_key(item.year),
            _parent_sort_key(item.parent_category),
            _sub_sort_key(item.parent_category, item.sub_category),
            _level_sort_key(item.level),
            item.id,
        ),
    )


def get_record(db: Session, record_id: int) -> Optional[TrainingGoal]:
    return db.query(TrainingGoal).filter(TrainingGoal.id == record_id).first()


def create_record(db: Session, payload: TrainingGoalCreate, current_user: User) -> TrainingGoal:
    parent_category = _normalize_required_str(payload.parent_category, "一级分类")
    sub_category = _normalize_optional_str(payload.sub_category) or ""
    level = _normalize_required_str(payload.level, "培训级别")
    year = _normalize_required_str(payload.year, "年度")
    objectives = _normalize_objectives(payload.objectives)
    remark = _normalize_optional_str(payload.remark)

    _validate_unique_combination(
        db,
        year=year,
        parent_category=parent_category,
        sub_category=sub_category,
        level=level,
    )

    record = TrainingGoal(
        parent_category=parent_category,
        sub_category=sub_category,
        level=level,
        objectives_json=_serialize_objectives(objectives),
        year=year,
        remark=remark,
        created_by_user_id=current_user.user_id,
        created_by_name=current_user.real_name,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(db: Session, record: TrainingGoal, payload: TrainingGoalUpdate) -> TrainingGoal:
    data = payload.model_dump(exclude_unset=True)

    if "parent_category" in data:
        record.parent_category = _normalize_required_str(data["parent_category"], "一级分类")
    if "sub_category" in data:
        record.sub_category = _normalize_optional_str(data["sub_category"]) or ""
    if "level" in data:
        record.level = _normalize_required_str(data["level"], "培训级别")
    if "year" in data:
        record.year = _normalize_required_str(data["year"], "年度")
    if "objectives" in data:
        record.objectives_json = _serialize_objectives(_normalize_objectives(data["objectives"]))
    if "remark" in data:
        record.remark = _normalize_optional_str(data["remark"])

    _validate_unique_combination(
        db,
        year=record.year,
        parent_category=record.parent_category,
        sub_category=record.sub_category,
        level=record.level,
        exclude_id=record.id,
    )

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: TrainingGoal) -> None:
    db.delete(record)
    db.commit()
