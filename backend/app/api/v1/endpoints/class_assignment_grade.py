from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import class_assignment_grade as crud
from ....schemas.class_assignment_grade import (
    ClassAssignmentGradeCreate,
    ClassAssignmentGradeOut,
    ClassAssignmentGradeUpdate,
)

router = APIRouter()


@router.get("/class-assignment-grades/", response_model=List[ClassAssignmentGradeOut], summary="班作业成绩表列表")
def list_records(
    campus_name: Optional[str] = Query(None),
    major_name: Optional[str] = Query(None),
    class_name: Optional[str] = Query(None),
    course_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, campus=campus_name, major=major_name, class_name=class_name, course=course_name)


@router.post("/class-assignment-grades/", response_model=ClassAssignmentGradeOut, summary="新增班作业成绩表")
def create_record(data: ClassAssignmentGradeCreate, db: Session = Depends(get_db)):
    return crud.create_record(db, data)


@router.post("/class-assignment-grades/save-or-update", response_model=ClassAssignmentGradeOut, summary="保存或更新班作业成绩表")
def save_or_update_record(data: ClassAssignmentGradeCreate, db: Session = Depends(get_db)):
    """
    保存或更新作业成绩表
    - 如果已存在相同神殿、专业、班级、课程的记录，则更新最新的一条
    - 如果不存在，则新增
    """
    # 查询是否存在相同的记录
    existing = crud.list_records(
        db, 
        campus=data.campus_name, 
        major=data.major_name, 
        class_name=data.class_name, 
        course=data.course_name
    )
    
    if existing:
        # 更新最新的一条记录
        latest = existing[0]  # list_records 已经按 id desc 排序
        update_data = ClassAssignmentGradeUpdate(id=latest.id, **data.model_dump())
        obj = crud.update_record(db, latest.id, update_data)
        if not obj:
            raise HTTPException(status_code=404, detail="更新失败")
        return obj
    else:
        # 新增记录
        return crud.create_record(db, data)


@router.put("/class-assignment-grades/", response_model=ClassAssignmentGradeOut, summary="更新班作业成绩表")
def update_record(data: ClassAssignmentGradeUpdate = Body(...), db: Session = Depends(get_db)):
    obj = crud.update_record(db, data.id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.delete("/class-assignment-grades/{record_id}", summary="删除班作业成绩表")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    if not crud.delete_record(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
