"""
网络调查汇总表 API
"""

from typing import List

from app.core.database import get_db
from app.crud import network_survey_summary as crud
from app.schemas.network_survey_summary import (
    CityConfig,
    NetworkSurveySummaryCreate,
    NetworkSurveySummaryOut,
    NetworkSurveySummaryUpdate,
    PlatformConfig,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=List[NetworkSurveySummaryOut], summary="获取所有网络调查汇总记录")
def get_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有网络调查汇总记录"""
    return crud.get_all(db, skip=skip, limit=limit)


@router.get("/by-year/{year}", response_model=NetworkSurveySummaryOut, summary="根据年份获取网络调查汇总记录")
def get_by_year(year: int, create_if_not_exists: bool = False, db: Session = Depends(get_db)):
    """根据年份获取网络调查汇总记录，可选自动创建"""
    record = crud.get_by_year(db, year)
    if not record:
        if create_if_not_exists:
            record = crud.create_default_for_year(db, year)
        else:
            raise HTTPException(status_code=404, detail=f"未找到{year}年的网络调查汇总记录")
    return record


@router.get("/{record_id}", response_model=NetworkSurveySummaryOut, summary="根据ID获取网络调查汇总记录")
def get_by_id(record_id: int, db: Session = Depends(get_db)):
    """根据ID获取网络调查汇总记录"""
    record = crud.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.post("/", response_model=NetworkSurveySummaryOut, summary="创建或更新网络调查汇总记录")
def create_or_update(data: NetworkSurveySummaryCreate, db: Session = Depends(get_db)):
    """创建或更新网络调查汇总记录（按年份upsert）"""
    return crud.upsert_by_year(db, data)


@router.put("/{record_id}", response_model=NetworkSurveySummaryOut, summary="更新网络调查汇总记录")
def update(record_id: int, data: NetworkSurveySummaryUpdate, db: Session = Depends(get_db)):
    """更新网络调查汇总记录"""
    record = crud.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return crud.update(db, record, data)


@router.delete("/{record_id}", summary="删除网络调查汇总记录")
def delete(record_id: int, db: Session = Depends(get_db)):
    """删除网络调查汇总记录"""
    success = crud.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"message": "删除成功"}


@router.post("/{record_id}/platforms", response_model=NetworkSurveySummaryOut, summary="添加平台")
def add_platform(record_id: int, platform: PlatformConfig, db: Session = Depends(get_db)):
    """添加平台"""
    record = crud.add_platform(db, record_id, platform.key, platform.label)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/{record_id}/platforms/{platform_key}", response_model=NetworkSurveySummaryOut, summary="删除平台")
def remove_platform(record_id: int, platform_key: str, db: Session = Depends(get_db)):
    """删除平台"""
    record = crud.remove_platform(db, record_id, platform_key)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.post("/{record_id}/cities", response_model=NetworkSurveySummaryOut, summary="添加城市")
def add_city(record_id: int, city: CityConfig, db: Session = Depends(get_db)):
    """添加城市"""
    record = crud.add_city(db, record_id, city.key, city.label)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/{record_id}/cities/{city_key}", response_model=NetworkSurveySummaryOut, summary="删除城市")
def remove_city(record_id: int, city_key: str, db: Session = Depends(get_db)):
    """删除城市"""
    record = crud.remove_city(db, record_id, city_key)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record
