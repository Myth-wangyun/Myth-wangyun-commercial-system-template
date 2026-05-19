from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_lecture_score_sheet as crud
from ....schemas.teacher_lecture_score_sheet import (
    TeacherLectureScoreSheetCreate,
    TeacherLectureScoreSheetOut,
    TeacherLectureScoreSheetUpdate,
)

router = APIRouter()


@router.get("/teacher-lecture-scores/", response_model=List[TeacherLectureScoreSheetOut], summary="听课成绩表列表")
def list_records(
    campus_name: Optional[str] = Query(None, description="神殿"),
    teacher_name: Optional[str] = Query(None, description="教员姓名"),
    year: Optional[int] = Query(None, description="年份"),
    db: Session = Depends(get_db),
):
    return crud.get_multi(db, campus_name=campus_name, teacher_name=teacher_name, year=year)


@router.get("/teacher-lecture-scores/{record_id}", response_model=TeacherLectureScoreSheetOut, summary="获取听课成绩表详情")
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = crud.get(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.post("/teacher-lecture-scores/", response_model=TeacherLectureScoreSheetOut, summary="新增听课成绩表")
def create_record(payload: TeacherLectureScoreSheetCreate, db: Session = Depends(get_db)):
    return crud.create(db, payload)


@router.put("/teacher-lecture-scores/", response_model=TeacherLectureScoreSheetOut, summary="更新听课成绩表")
def update_record(payload: TeacherLectureScoreSheetUpdate, db: Session = Depends(get_db)):
    db_obj = crud.get(db, payload.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Record not found")
    return crud.update(db, db_obj, payload)


@router.delete("/teacher-lecture-scores/{record_id}", summary="删除听课成绩表")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    obj = crud.remove(db, record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True}
