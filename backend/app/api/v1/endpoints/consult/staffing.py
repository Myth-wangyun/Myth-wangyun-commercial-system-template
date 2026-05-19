"""
祈福司职数相关 API 路由
"""

from typing import List, Optional

from app.core.database import get_db
from app.crud.consult.staffing import 咨询师人员明细表CRUD, 祈福司职数汇总表CRUD, 渠道人员明细表CRUD
from app.schemas.consult.staffing import (
    咨询师人员明细表创建,
    咨询师人员明细表响应,
    祈福司职数汇总表响应,
    祈福司职数汇总表更新,
    神殿职数明细保存请求,
    神殿职数明细响应,
    渠道人员明细表创建,
    渠道人员明细表响应,
)
from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== 汇总数据接口 ====================

@router.get(
    "/staffing/summary/year/{year}",
    response_model=List[祈福司职数汇总表响应],
    summary="获取指定年份所有神殿的职数汇总"
)
def get_staffing_summary_by_year(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db)
):
    """获取指定年份所有神殿的职数汇总数据（用于TAB1汇总表）"""
    records = 祈福司职数汇总表CRUD.get_by_year(db, year)
    return records


@router.get(
    "/staffing/summary/{year}/{campus}",
    response_model=Optional[祈福司职数汇总表响应],
    summary="获取指定年份和神殿的职数汇总"
)
def get_staffing_summary(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    campus: str = Path(..., description="神殿名称"),
    db: Session = Depends(get_db)
):
    """获取指定年份和神殿的职数汇总数据"""
    record = 祈福司职数汇总表CRUD.get_by_year_campus(db, year, campus)
    return record


# ==================== 神殿明细数据接口 ====================

@router.get(
    "/staffing/detail/{year}/{campus}",
    response_model=神殿职数明细响应,
    summary="获取神殿职数明细（包括汇总和人员明细）"
)
def get_campus_staffing_detail(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    campus: str = Path(..., description="神殿名称"),
    db: Session = Depends(get_db)
):
    """
    获取指定神殿的完整职数明细数据（用于TAB2）
    包括：汇总数据、咨询师明细、渠道人员明细
    """
    # 获取汇总数据
    summary = 祈福司职数汇总表CRUD.get_by_year_campus(db, year, campus)
    
    # 如果没有汇总数据，返回空的默认结构
    if not summary:
        from app.schemas.consult.staffing import 祈福司职数汇总表创建
        create_data = 祈福司职数汇总表创建(年份=year, 神殿=campus)
        summary = 祈福司职数汇总表CRUD.create(db, create_data)
    
    # 获取咨询师明细
    consultants = 咨询师人员明细表CRUD.get_by_year_campus(db, year, campus)
    
    # 获取渠道人员明细
    channels = 渠道人员明细表CRUD.get_by_year_campus(db, year, campus)
    
    return {
        "汇总数据": summary,
        "咨询师明细": consultants,
        "渠道人员明细": channels,
    }


@router.post(
    "/staffing/detail/{year}/{campus}",
    response_model=神殿职数明细响应,
    summary="保存神殿职数明细"
)
def save_campus_staffing_detail(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    campus: str = Path(..., description="神殿名称"),
    request: 神殿职数明细保存请求 = Body(...),
    db: Session = Depends(get_db)
):
    """
    保存指定神殿的完整职数明细数据
    包括：汇总数据、咨询师明细、渠道人员明细
    """
    try:
        # 更新或创建汇总数据
        summary = 祈福司职数汇总表CRUD.upsert(db, year, campus, request.汇总数据)
        
        # 批量更新咨询师明细
        consultants = 咨询师人员明细表CRUD.batch_upsert(db, request.咨询师明细)
        
        # 批量更新渠道人员明细
        channels = 渠道人员明细表CRUD.batch_upsert(db, request.渠道人员明细)
        
        return {
            "汇总数据": summary,
            "咨询师明细": consultants,
            "渠道人员明细": channels,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


# ==================== 单独更新接口 ====================

@router.put(
    "/staffing/summary/{year}/{campus}",
    response_model=祈福司职数汇总表响应,
    summary="更新神殿职数汇总"
)
def update_staffing_summary(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    campus: str = Path(..., description="神殿名称"),
    data: 祈福司职数汇总表更新 = Body(...),
    db: Session = Depends(get_db)
):
    """更新或创建指定神殿的职数汇总数据"""
    result = 祈福司职数汇总表CRUD.upsert(db, year, campus, data)
    return result


@router.put(
    "/staffing/consultants/{year}/{campus}",
    response_model=List[咨询师人员明细表响应],
    summary="批量更新咨询师明细"
)
def update_consultants(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    campus: str = Path(..., description="神殿名称"),
    data: List[咨询师人员明细表创建] = Body(...),
    db: Session = Depends(get_db)
):
    """批量更新指定神殿的咨询师明细"""
    results = 咨询师人员明细表CRUD.batch_upsert(db, data)
    return results


@router.put(
    "/staffing/channels/{year}/{campus}",
    response_model=List[渠道人员明细表响应],
    summary="批量更新渠道人员明细"
)
def update_channels(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    campus: str = Path(..., description="神殿名称"),
    data: List[渠道人员明细表创建] = Body(...),
    db: Session = Depends(get_db)
):
    """批量更新指定神殿的渠道人员明细"""
    results = 渠道人员明细表CRUD.batch_upsert(db, data)
    return results
