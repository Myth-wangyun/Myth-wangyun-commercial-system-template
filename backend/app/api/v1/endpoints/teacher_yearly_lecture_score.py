from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_yearly_lecture_score as crud
from ....schemas.teacher_yearly_lecture_score import (
    TeacherYearlyLectureScoreCreate,
    TeacherYearlyLectureScoreOut,
    TeacherYearlyLectureScoreUpdate,
)

router = APIRouter()


@router.get("/teacher-yearly-lecture-scores/", response_model=List[TeacherYearlyLectureScoreOut], summary="教员年度听课打分表列表")
def list_records(
    teacher_name: Optional[str] = Query(None, description="教员姓名"),
    class_name: Optional[str] = Query(None, description="班级名称"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, teacher_name=teacher_name, class_name=class_name, start_date=start_date, end_date=end_date)


@router.get("/teacher-yearly-lecture-scores/{record_id}", response_model=TeacherYearlyLectureScoreOut, summary="获取教员年度听课打分表详情")
def get_record(record_id: int, db: Session = Depends(get_db)):
    obj = crud.get_record(db, record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.post("/teacher-yearly-lecture-scores/", response_model=TeacherYearlyLectureScoreOut, summary="新增教员年度听课打分表")
def create_record(data: TeacherYearlyLectureScoreCreate, db: Session = Depends(get_db)):
    return crud.create_record(db, data)


@router.put("/teacher-yearly-lecture-scores/", response_model=TeacherYearlyLectureScoreOut, summary="更新教员年度听课打分表")
def update_record(data: TeacherYearlyLectureScoreUpdate = Body(...), db: Session = Depends(get_db)):
    obj = crud.update_record(db, data.id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.delete("/teacher-yearly-lecture-scores/{record_id}", summary="删除教员年度听课打分表")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    if not crud.delete_record(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}

