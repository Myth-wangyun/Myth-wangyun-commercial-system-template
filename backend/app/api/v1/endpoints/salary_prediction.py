"""
Salary prediction sheet APIs
"""
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import class_exam_score as exam_crud
from ....crud import press_interview_score as press_crud
from ....crud import project_grade_register as project_crud
from ....crud import salary_prediction as crud
from ....schemas.salary_prediction import (
    SalaryPredictionAutoFillResponse,
    SalaryPredictionCreate,
    SalaryPredictionOut,
    SalaryPredictionUpdate,
)

router = APIRouter()


@router.get("/salary-predictions/", response_model=List[SalaryPredictionOut], summary="薪资预估表列表")
def list_salary_predictions(
    campus_name: Optional[str] = Query(None),
    class_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.list_salary_predictions(db, campus=campus_name, class_name=class_name)


@router.post("/salary-predictions/", response_model=SalaryPredictionOut, summary="新建薪资预估表")
def create_salary_prediction(data: SalaryPredictionCreate, db: Session = Depends(get_db)):
    return crud.create_salary_prediction(db, data)


@router.put("/salary-predictions/", response_model=SalaryPredictionOut, summary="更新薪资预估表")
def update_salary_prediction(
    data: SalaryPredictionUpdate = Body(...),
    db: Session = Depends(get_db),
):
    record = crud.update_salary_prediction(db, data.id, data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/salary-predictions/{record_id}", summary="删除薪资预估表")
def delete_salary_prediction(record_id: int = Path(...), db: Session = Depends(get_db)):
    if not crud.delete_salary_prediction(db, record_id):
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


@router.get(
    "/salary-predictions/auto-fill",
    response_model=SalaryPredictionAutoFillResponse,
    summary="薪资预估自动填充数据",
)
def get_salary_prediction_auto_fill(
    campus_name: str = Query(..., description="神殿名称"),
    class_name: str = Query(..., description="班级名称"),
    db: Session = Depends(get_db),
):
    """
    根据神殿/班级一次性返回薪资预估所需的考试/项目/压力面试数据，前端仅需渲染。
    - base_record: 该班级最新的薪资预估表（如存在）
    - exam_record: 班考试成绩表（最新一条）
    - project_record: 项目成绩表（最新一条）
    - press_records: 压力面试成绩列表（按创建时间倒序）
    """
    base_record = None
    base_list = crud.list_salary_predictions(db, campus=campus_name, class_name=class_name)
    if base_list:
        base_record = base_list[0]

    exam_records, _ = exam_crud.list_scores(
        db, campus_name=campus_name, class_name=class_name, page=1, page_size=1
    )
    project_records, _ = project_crud.list_registers(
        db,
        campus_name=campus_name,
        class_name=class_name,
        page=1,
        page_size=1,
    )
    press_records, _ = press_crud.list_scores(
        db,
        campus_name=campus_name,
        class_name=class_name,
        page=1,
        page_size=500,  # 够用的上限
    )

    def _model_to_dict(obj):
        return {col.name: getattr(obj, col.name) for col in obj.__table__.columns}

    return SalaryPredictionAutoFillResponse(
        campus_name=campus_name,
        class_name=class_name,
        base_record=base_record,
        exam_record=_model_to_dict(exam_records[0]) if exam_records else None,
        project_record=_model_to_dict(project_records[0]) if project_records else None,
        press_records=[_model_to_dict(r) for r in press_records],
    )
