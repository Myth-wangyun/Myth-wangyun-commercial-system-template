"""
Campus academic onboarding and offboarding summary APIs
神殿智慧司入职离职汇总表 API 接口
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import onboarding_offboarding_summary as crud
from ....schemas.onboarding_offboarding_summary import (
    OnboardingOffboardingSummaryCreate,
    OnboardingOffboardingSummaryOut,
    OnboardingOffboardingSummaryUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[OnboardingOffboardingSummaryOut], summary="列表-神殿智慧司入职离职汇总表")
def list_items(
    campus: str = Query(..., description="神殿名称"),
    year: int | None = Query(None, description="年份，可选"),
    db: Session = Depends(get_db),
):
    return crud.list_records(db, 神殿=campus, 年份=year)


@router.post("/", response_model=OnboardingOffboardingSummaryOut, summary="创建/覆盖（同神殿+年份唯一）")
def create_or_replace(
    payload: OnboardingOffboardingSummaryCreate,
    db: Session = Depends(get_db),
):
    return crud.upsert_record(db, payload.神殿, payload.年份, payload.数据)


@router.put("/{record_id}", response_model=OnboardingOffboardingSummaryOut, summary="更新记录")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: OnboardingOffboardingSummaryUpdate = Body(...),
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


@router.get("/by-year/{year}", response_model=list[OnboardingOffboardingSummaryOut], summary="获取某年份所有神殿数据")
def get_all_by_year(
    year: int = Path(..., description="年份"),
    db: Session = Depends(get_db),
):
    """获取某年份所有神殿的入职离职汇总数据，用于最高议事厅汇总视图"""
    return crud.list_all_by_year(db, 年份=year)

