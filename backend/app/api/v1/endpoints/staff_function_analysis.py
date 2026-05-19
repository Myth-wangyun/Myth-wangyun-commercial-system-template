"""
Campus staff function analysis APIs
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import staff_function_analysis as crud
from ....schemas.staff_function_analysis import (
    StaffFunctionAnalysisCreate,
    StaffFunctionAnalysisOut,
    StaffFunctionAnalysisUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[StaffFunctionAnalysisOut], summary="列表-神殿智慧司员工功能分析表")
def list_items(
    campus: str = Query(..., description="神殿名称"),
    year: int | None = Query(None, description="年份，可选"),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, 神殿=campus, 年份=year)


@router.post("/", response_model=StaffFunctionAnalysisOut, summary="创建/覆盖（同神殿+年份唯一）")
def create_or_replace(
    payload: StaffFunctionAnalysisCreate,
    db: Session = Depends(get_db),
):
    return crud.upsert(db, payload)


@router.put("/{record_id}", response_model=StaffFunctionAnalysisOut, summary="更新记录")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: StaffFunctionAnalysisUpdate = Body(...),
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
