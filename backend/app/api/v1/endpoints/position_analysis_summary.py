"""
Academic position analysis report summary APIs
智慧司岗位分析报告汇总表 API 接口 - 支持动态列
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import position_analysis_summary as crud
from ....schemas.position_analysis_summary import (
    AddColumnRequest,
    PositionAnalysisSummaryCreate,
    PositionAnalysisSummaryOut,
    PositionAnalysisSummaryUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[PositionAnalysisSummaryOut], summary="列表-智慧司岗位分析报告汇总表")
def list_items(
    year: int | None = Query(None, description="年份，可选"),
    db: Session = Depends(get_db),
):
    """获取岗位分析报告汇总数据列表"""
    return crud.list_records(db, 年份=year)


@router.get("/by-year/{year}", response_model=PositionAnalysisSummaryOut, summary="按年份获取数据")
def get_by_year(
    year: int = Path(..., description="年份"),
    create_if_not_exists: bool = Query(True, description="如果不存在是否创建默认数据"),
    db: Session = Depends(get_db),
):
    """按年份获取岗位分析报告汇总数据，如果不存在可以选择创建默认数据"""
    obj = None
    if create_if_not_exists:
        obj = crud.get_or_create_default(db, year)
    else:
        obj = crud.get_record_by_year(db, year)
        if not obj:
            raise HTTPException(status_code=404, detail=f"年份 {year} 的数据不存在")
    return obj


@router.post("/", response_model=PositionAnalysisSummaryOut, summary="创建/覆盖（同年份唯一）")
def create_or_replace(
    payload: PositionAnalysisSummaryCreate,
    db: Session = Depends(get_db),
):
    """创建或更新岗位分析报告汇总数据（同年份唯一）"""
    # 将 Pydantic 模型转换为 dict
    columns = [col.model_dump() for col in payload.columns]
    rows = [row.model_dump() for row in payload.rows]
    return crud.upsert_record(db, payload.年份, columns, rows)


@router.put("/{record_id}", response_model=PositionAnalysisSummaryOut, summary="更新记录")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: PositionAnalysisSummaryUpdate = Body(...),
    db: Session = Depends(get_db),
):
    """更新岗位分析报告汇总记录"""
    columns = [col.model_dump() for col in payload.columns] if payload.columns else None
    rows = [row.model_dump() for row in payload.rows] if payload.rows else None
    obj = crud.update_record(db, record_id, columns, rows, payload.年份)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.delete("/{record_id}", summary="删除记录")
def delete_item(record_id: int, db: Session = Depends(get_db)):
    """删除岗位分析报告汇总记录"""
    ok = crud.delete_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


@router.post("/{record_id}/columns", response_model=PositionAnalysisSummaryOut, summary="添加列")
def add_column(
    record_id: int = Path(..., description="记录ID"),
    payload: AddColumnRequest = Body(...),
    db: Session = Depends(get_db),
):
    """添加新列到岗位分析报告汇总表"""
    obj = crud.add_column(db, record_id, payload.key, payload.label)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.delete("/{record_id}/columns/{column_key}", response_model=PositionAnalysisSummaryOut, summary="删除列")
def remove_column(
    record_id: int = Path(..., description="记录ID"),
    column_key: str = Path(..., description="列的唯一标识符"),
    db: Session = Depends(get_db),
):
    """从岗位分析报告汇总表删除列"""
    obj = crud.remove_column(db, record_id, column_key)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj
