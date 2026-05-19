"""
Enterprise survey summary APIs
企业调研汇总表 API 接口 - 支持动态列
"""

from typing import List, Optional

from app.core.database import get_db
from app.crud import enterprise_survey_summary as crud
from app.schemas import enterprise_survey_summary as schemas
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=List[schemas.EnterpriseSurveySummaryOut], summary="列表-企业调研汇总表")
def list_items(
    year: Optional[int] = Query(None, description="年份，可选"),
    db: Session = Depends(get_db),
):
    """获取企业调研汇总记录列表"""
    records = crud.list_records(db, 年份=year)
    return [
        schemas.EnterpriseSurveySummaryOut(
            id=r.id,
            年份=r.年份,
            columns=r.columns,
            rows=r.rows,
            创建时间=r.创建时间,
            更新时间=r.更新时间,
        )
        for r in records
    ]


@router.get("/by-year/{year}", response_model=schemas.EnterpriseSurveySummaryOut, summary="根据年份获取企业调研汇总")
def get_by_year(
    year: int = Path(..., description="年份"),
    db: Session = Depends(get_db),
):
    """根据年份获取企业调研汇总，如果不存在则创建默认数据"""
    record = crud.get_or_create_default(db, year)
    return schemas.EnterpriseSurveySummaryOut(
        id=record.id,
        年份=record.年份,
        columns=record.columns,
        rows=record.rows,
        创建时间=record.创建时间,
        更新时间=record.更新时间,
    )


@router.post("/", response_model=schemas.EnterpriseSurveySummaryOut, summary="创建或更新企业调研汇总")
def upsert_item(
    payload: schemas.EnterpriseSurveySummaryCreate,
    db: Session = Depends(get_db),
):
    """创建或更新企业调研汇总（根据年份）"""
    columns = [col.model_dump() for col in payload.columns]
    rows = [row.model_dump() for row in payload.rows]
    
    record = crud.upsert_record(db, 年份=payload.年份, columns=columns, rows=rows)
    return schemas.EnterpriseSurveySummaryOut(
        id=record.id,
        年份=record.年份,
        columns=record.columns,
        rows=record.rows,
        创建时间=record.创建时间,
        更新时间=record.更新时间,
    )


@router.put("/{record_id}", response_model=schemas.EnterpriseSurveySummaryOut, summary="更新企业调研汇总")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: schemas.EnterpriseSurveySummaryUpdate = Body(...),
    db: Session = Depends(get_db),
):
    """更新记录"""
    columns = [col.model_dump() for col in payload.columns] if payload.columns else None
    rows = [row.model_dump() for row in payload.rows] if payload.rows else None
    
    record = crud.update_record(db, record_id, columns=columns, rows=rows)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return schemas.EnterpriseSurveySummaryOut(
        id=record.id,
        年份=record.年份,
        columns=record.columns,
        rows=record.rows,
        创建时间=record.创建时间,
        更新时间=record.更新时间,
    )


@router.delete("/{record_id}", summary="删除企业调研汇总记录")
def delete_item(record_id: int, db: Session = Depends(get_db)):
    """删除记录"""
    ok = crud.delete_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


@router.post("/{record_id}/columns", response_model=schemas.EnterpriseSurveySummaryOut, summary="添加列")
def add_column(
    record_id: int = Path(..., description="记录ID"),
    payload: schemas.AddColumnRequest = Body(...),
    db: Session = Depends(get_db),
):
    """为记录添加新列"""
    record = crud.add_column(db, record_id, payload.key, payload.label)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return schemas.EnterpriseSurveySummaryOut(
        id=record.id,
        年份=record.年份,
        columns=record.columns,
        rows=record.rows,
        创建时间=record.创建时间,
        更新时间=record.更新时间,
    )


@router.delete("/{record_id}/columns/{key}", response_model=schemas.EnterpriseSurveySummaryOut, summary="删除列")
def remove_column(
    record_id: int = Path(..., description="记录ID"),
    key: str = Path(..., description="列Key"),
    db: Session = Depends(get_db),
):
    """删除记录的某列"""
    record = crud.remove_column(db, record_id, key)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return schemas.EnterpriseSurveySummaryOut(
        id=record.id,
        年份=record.年份,
        columns=record.columns,
        rows=record.rows,
        创建时间=record.创建时间,
        更新时间=record.更新时间,
    )
