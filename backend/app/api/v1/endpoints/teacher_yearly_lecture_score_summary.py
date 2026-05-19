from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_yearly_lecture_score_summary as crud
from ....schemas.teacher_yearly_lecture_score_summary import (
    TeacherYearlyLectureScoreSummaryCreate,
    TeacherYearlyLectureScoreSummaryOut,
    TeacherYearlyLectureScoreSummaryUpdate,
)

router = APIRouter()


@router.get("/teacher-yearly-lecture-score-summaries/", response_model=List[TeacherYearlyLectureScoreSummaryOut], summary="教员年度听课打分汇总表列表")
def list_records(
    year: Optional[int] = Query(None, description="年份"),
    campus_name: Optional[str] = Query(None, description="神殿名称"),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, year=year, campus_name=campus_name)


@router.get("/teacher-yearly-lecture-score-summaries/{record_id}", response_model=TeacherYearlyLectureScoreSummaryOut, summary="获取教员年度听课打分汇总表详情")
def get_record(record_id: int, db: Session = Depends(get_db)):
    obj = crud.get_record(db, record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.get("/teacher-yearly-lecture-score-summaries/year/{year}", response_model=TeacherYearlyLectureScoreSummaryOut, summary="根据年份获取汇总数据")
def get_by_year(
    year: int,
    campus_name: Optional[str] = Query(None, description="神殿名称"),
    db: Session = Depends(get_db),
):
    obj = crud.get_by_year(db, year, campus_name)
    if not obj:
        raise HTTPException(status_code=404, detail="该年份的汇总数据不存在")
    return obj


@router.post("/teacher-yearly-lecture-score-summaries/", response_model=TeacherYearlyLectureScoreSummaryOut, summary="新增教员年度听课打分汇总表")
def create_record(data: TeacherYearlyLectureScoreSummaryCreate, db: Session = Depends(get_db)):
    return crud.create_record(db, data)


@router.put("/teacher-yearly-lecture-score-summaries/", response_model=TeacherYearlyLectureScoreSummaryOut, summary="更新教员年度听课打分汇总表")
def update_record(data: TeacherYearlyLectureScoreSummaryUpdate = Body(...), db: Session = Depends(get_db)):
    obj = crud.update_record(db, data.id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.post("/teacher-yearly-lecture-score-summaries/upsert-by-year", response_model=TeacherYearlyLectureScoreSummaryOut, summary="根据年份创建或更新汇总数据")
def upsert_by_year(
    year: int = Body(..., description="年份"),
    summary_data: List[dict] = Body(..., description="汇总数据"),
    campus_name: Optional[str] = Body(None, description="神殿名称"),
    db: Session = Depends(get_db),
):
    return crud.upsert_by_year(db, year, summary_data, campus_name)


@router.delete("/teacher-yearly-lecture-score-summaries/{record_id}", summary="删除教员年度听课打分汇总表")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    if not crud.delete_record(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}

