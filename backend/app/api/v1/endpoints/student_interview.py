"""
Student interview record endpoints
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import student_interview as crud
from ....schemas.student_interview import (
    StudentInterviewListResponse,
    StudentInterviewPayload,
)

router = APIRouter()


@router.get("/class-codes", summary="获取神殿所有班级编码列表")
def get_class_codes(
    campus: str = Query(..., description="神殿"),
    db: Session = Depends(get_db),
) -> List[str]:
    """获取指定神殿在访谈记录中的所有班级编码（去重）"""
    return crud.list_distinct_class_codes(db, campus)


@router.get("/class-names", summary="获取神殿所有班级名称列表")
def get_class_names(
    campus: str = Query(..., description="神殿"),
    db: Session = Depends(get_db),
) -> List[str]:
    """获取指定神殿在访谈记录中的所有班级名称（去重）"""
    return crud.list_distinct_class_names(db, campus)


@router.get("/", response_model=StudentInterviewListResponse, summary="获取学员访谈记录")
def get_interview_records(
    campus: str = Query(..., description="神殿"),
    class_code: str = Query("", description="班级编码，为空则获取所有班级"),
    class_name: str | None = Query(None, description="班级名称"),
    db: Session = Depends(get_db),
):
    records = crud.list_interview_records(db, campus, class_code)
    if not records:
        return StudentInterviewListResponse(
            campus=campus,
            class_code=class_code,
            class_name=class_name,
            records=[],
        )
    payload = crud.serialize_records(records)
    return StudentInterviewListResponse(**payload)


@router.post("/", response_model=StudentInterviewListResponse, summary="保存学员访谈记录")
def save_interview_records(
    payload: StudentInterviewPayload, db: Session = Depends(get_db)
):
    try:
        crud.replace_interview_records(
            db,
            campus=payload.campus,
            class_code=payload.class_code,
            class_name=payload.class_name or payload.class_code,
            records=[
                {
                    **record.model_dump(mode="python"),
                    "interview_date": record.interview_date,
                }
                for record in payload.records
            ],
        )
        return payload
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}")
