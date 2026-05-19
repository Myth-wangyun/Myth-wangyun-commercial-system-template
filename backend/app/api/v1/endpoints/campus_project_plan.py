"""
Campus project plan endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import project_plan as crud
from ....schemas.project_plan import ProjectPlanPayload, ProjectPlanResponse

router = APIRouter()


@router.get("/", response_model=ProjectPlanResponse, summary="获取项目计划表")
def get_project_plan(
    campus: str = Query(..., description="神殿名称"),
    class_id: str = Query(..., description="班级ID"),
    class_name: str | None = Query(None, description="班级名称（用于无记录时返回）"),
    db: Session = Depends(get_db),
):
    records = crud.list_project_plans(db, campus, class_id)
    if not records:
        if not class_name:
            class_name = ""
        return ProjectPlanResponse(
            campus=campus,
            class_id=class_id,
            class_name=class_name,
            class_advisor=None,
            reinforcement_instructor=None,
            projects=[],
        )
    payload = crud.serialize_project_plan(records)
    return ProjectPlanResponse(**payload)


@router.post("/", response_model=ProjectPlanResponse, summary="保存项目计划表")
def save_project_plan(payload: ProjectPlanPayload, db: Session = Depends(get_db)):
    try:
        crud.save_project_plans(
            db,
            campus=payload.campus,
            class_id=payload.class_id,
            class_name=payload.class_name,
            class_advisor=payload.class_advisor,
            reinforcement_instructor=payload.reinforcement_instructor,
            projects=[
                {
                    "number": project.number,
                    "name": project.name,
                    "start_date": project.start_date.isoformat() if project.start_date else None,
                    "end_date": project.end_date.isoformat() if project.end_date else None,
                    "tasks": [task.model_dump() for task in project.tasks],
                }
                for project in payload.projects
            ],
        )
        return payload
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}")
