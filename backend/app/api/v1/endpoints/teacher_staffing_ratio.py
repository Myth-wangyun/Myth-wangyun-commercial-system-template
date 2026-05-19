"""
Campus academic teacher staffing ratio APIs
神殿智慧司师资配比表 API 接口
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_staffing_ratio as crud
from ....schemas.teacher_staffing_ratio import (
    TeacherStaffingRatioCreate,
    TeacherStaffingRatioOut,
    TeacherStaffingRatioUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[TeacherStaffingRatioOut], summary="列表-神殿智慧司师资配比表")
def list_items(
    campus: str = Query(..., description="神殿名称"),
    year: int | None = Query(None, description="年份，可选"),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, 神殿=campus, 年份=year)


@router.post("/", response_model=TeacherStaffingRatioOut, summary="创建/覆盖（同神殿+年份唯一）")
def create_or_replace(
    payload: TeacherStaffingRatioCreate,
    db: Session = Depends(get_db),
):
    return crud.upsert_record(db, payload.神殿, payload.年份, payload.数据)


@router.put("/{record_id}", response_model=TeacherStaffingRatioOut, summary="更新记录")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: TeacherStaffingRatioUpdate = Body(...),
    db: Session = Depends(get_db),
):
    obj = crud.update_record(db, record_id, payload.数据, payload.年份)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.delete("/{record_id}", summary="删除记录")
def delete_item(record_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}

