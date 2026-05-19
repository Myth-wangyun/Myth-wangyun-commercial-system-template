"""
Manager function evaluation APIs
最高议事厅智慧司学术经理功能评价表
"""

from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import manager_function_evaluation as crud
from ....schemas.manager_function_evaluation import (
    ManagerFunctionEvaluationCreate,
    ManagerFunctionEvaluationOut,
    ManagerFunctionEvaluationUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[ManagerFunctionEvaluationOut], summary="列表-最高议事厅学术经理功能评价表")
def list_items(
    campus: Optional[str] = Query(None, description="神殿名称，可选"),
    year: Optional[int] = Query(None, description="年份，可选"),
    month: Optional[str] = Query(None, description="月份 YYYY-MM，可选"),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, 神殿=campus, 年份=year, 月份=month)


@router.get("/all", response_model=list[ManagerFunctionEvaluationOut], summary="获取所有数据")
def get_all(
    year: Optional[int] = Query(None, description="年份，可选"),
    month: Optional[str] = Query(None, description="月份 YYYY-MM，可选"),
    db: Session = Depends(get_db),
):
    """获取所有神殿的数据（用于汇总页面），不过滤用户职位"""
    return crud.list_records(db, 年份=year, 月份=month, filter_by_position=False)


@router.get("/{record_id}", response_model=ManagerFunctionEvaluationOut, summary="根据ID获取")
def get_by_id(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
):
    obj = crud.get_by_id(db, record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.post("/", response_model=ManagerFunctionEvaluationOut, summary="创建/覆盖（同神殿+月份唯一）")
def create_or_replace(
    payload: ManagerFunctionEvaluationCreate,
    db: Session = Depends(get_db),
):
    return crud.upsert(db, payload)


@router.put("/{record_id}", response_model=ManagerFunctionEvaluationOut, summary="更新记录")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: ManagerFunctionEvaluationUpdate = Body(...),
    db: Session = Depends(get_db),
):
    obj = crud.update(db, record_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.delete("/{record_id}", summary="删除记录")
def delete_item(record_id: int, db: Session = Depends(get_db)):
    ok = crud.delete(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
