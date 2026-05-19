"""
Endpoints for class exam scores
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import class_exam_score as crud
from ....schemas.class_exam_score import (
    ClassExamScoreCreate,
    ClassExamScoreListResponse,
    ClassExamScoreResponse,
    ClassExamScoreUpdate,
)

router = APIRouter()


@router.get("/", response_model=ClassExamScoreListResponse, summary="获取班考试成绩列表")
def list_scores(
    campus_name: str | None = Query(None, description="神殿名称"),
    class_name: str | None = Query(None, description="班级名称"),
    search: str | None = Query(None, description="搜索课程/教员"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    records, total = crud.list_scores(
        db,
        campus_name=campus_name,
        class_name=class_name,
        search=search,
        page=page,
        page_size=page_size,
    )
    return ClassExamScoreListResponse(
        records=[
            ClassExamScoreResponse.model_validate(r, from_attributes=True)
            for r in records
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=ClassExamScoreResponse, summary="创建班考试成绩")
def create_score(payload: ClassExamScoreCreate, db: Session = Depends(get_db)):
    record = crud.create_score(db, payload.model_dump())
    return ClassExamScoreResponse.model_validate(record, from_attributes=True)


@router.put("/", response_model=ClassExamScoreResponse, summary="更新班考试成绩")
def update_score(payload: ClassExamScoreUpdate, db: Session = Depends(get_db)):
    record = crud.update_score(db, payload.id, payload.model_dump(exclude={"id"}))
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return ClassExamScoreResponse.model_validate(record, from_attributes=True)


@router.delete("/", summary="删除班考试成绩")
def delete_score(id: int, db: Session = Depends(get_db)):
    ok = crud.delete_score(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
