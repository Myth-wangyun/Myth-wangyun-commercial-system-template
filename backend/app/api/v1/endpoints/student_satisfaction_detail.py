"""
学员满意度个人详细表接口
"""
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import student_satisfaction_detail as crud
from ....schemas.student_satisfaction_detail import (
    StudentSatisfactionAvgOut,
    StudentSatisfactionDetailCreate,
    StudentSatisfactionDetailOut,
    StudentSatisfactionDetailUpdate,
)

router = APIRouter()


@router.get("/student-satisfaction-details/", response_model=List[StudentSatisfactionDetailOut], summary="满意度详情列表")
def list_details(
    campus_name: Optional[str] = Query(None),
    teacher_name: Optional[str] = Query(None),
    class_name: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.list_details(db, campus=campus_name, teacher=teacher_name, class_name=class_name, year=year)


@router.get(
    "/student-satisfaction-details/avg",
    response_model=List[StudentSatisfactionAvgOut],
    summary="满意度平均视图（自动计算）",
)
def list_avg(
    campus_name: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.list_avg(db, campus=campus_name, year=year)


@router.get(
    "/student-satisfaction-details/avg-computed",
    response_model=List[StudentSatisfactionAvgOut],
    summary="满意度平均（从明细动态聚合）",
)
def list_avg_computed(
    campus_name: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        return crud.compute_avg_from_details(db, campus=campus_name, year=year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聚合失败: {str(e)}")


@router.post("/student-satisfaction-details/", response_model=StudentSatisfactionDetailOut, summary="新增满意度详情")
def create_detail(data: StudentSatisfactionDetailCreate, db: Session = Depends(get_db)):
    return crud.create_detail(db, data)


@router.put("/student-satisfaction-details/", response_model=StudentSatisfactionDetailOut, summary="更新满意度详情")
def update_detail(
    data: StudentSatisfactionDetailUpdate = Body(...),
    db: Session = Depends(get_db),
):
    record = crud.update_detail(db, data.id, data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/student-satisfaction-details/{record_id}", summary="删除满意度详情")
def delete_detail(record_id: int, db: Session = Depends(get_db)):
    if not crud.delete_detail(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
