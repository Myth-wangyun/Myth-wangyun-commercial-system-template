"""
CRUD helper for campus project plans
"""

from datetime import date
from typing import Any, List, Optional, TypedDict

from sqlalchemy.orm import Session

from app.models.project_plan import CampusProjectPlan


class ProjectPlanPayload(TypedDict, total=False):
    number: str
    name: str
    start_date: str | date | None
    end_date: str | date | None
    tasks: list[Any]


class SerializedProjectPlan(TypedDict):
    number: str
    name: str
    start_date: str | None
    end_date: str | None
    tasks: list[Any]


def list_project_plans(
    db: Session, campus: str, class_id: str
) -> List[CampusProjectPlan]:
    return (
        db.query(CampusProjectPlan)
        .filter(
            CampusProjectPlan.campus_name == campus,
            CampusProjectPlan.class_id == class_id,
        )
        .order_by(CampusProjectPlan.project_number)
        .all()
    )


def _parse_iso_date(value: str | date | None) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def save_project_plans(
    db: Session,
    campus: str,
    class_id: str,
    class_name: str,
    class_advisor: Optional[str],
    reinforcement_instructor: Optional[str],
    projects: List[ProjectPlanPayload],
) -> None:
    # remove existing records
    db.query(CampusProjectPlan).filter(
        CampusProjectPlan.campus_name == campus,
        CampusProjectPlan.class_id == class_id,
    ).delete()

    for project in projects:
        entry = CampusProjectPlan(
            campus_name=campus,
            class_id=class_id,
            class_name=class_name,
            class_advisor=class_advisor,
            reinforcement_instructor=reinforcement_instructor,
            project_number=project.get("number") or "",
            project_name=project.get("name") or "",
            start_date=_parse_iso_date(project.get("start_date")),
            end_date=_parse_iso_date(project.get("end_date")),
            tasks=project.get("tasks") or [],
        )
        db.add(entry)
    db.commit()


def serialize_project_plan(records: List[CampusProjectPlan]) -> dict[str, Any]:
    if not records:
        return {}
    base = records[0]
    projects: list[SerializedProjectPlan] = [
        {
            "number": r.project_number,
            "name": r.project_name,
            "start_date": r.start_date.isoformat() if r.start_date else None,
            "end_date": r.end_date.isoformat() if r.end_date else None,
            "tasks": r.tasks or [],
        }
        for r in records
    ]
    return {
        "campus": base.campus_name,
        "class_id": base.class_id,
        "class_name": base.class_name,
        "class_advisor": base.class_advisor,
        "reinforcement_instructor": base.reinforcement_instructor,
        "projects": projects,
    }
