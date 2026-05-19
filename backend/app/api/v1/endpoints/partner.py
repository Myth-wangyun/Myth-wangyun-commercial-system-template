"""
合作方联系方式模块API端点
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_market_db
from ....crud import partner as partner_crud
from ....schemas.partner import 合作方联系方式创建, 合作方联系方式响应, 合作方联系方式更新

router = APIRouter()


@router.get("/", summary="合作方联系方式模块根路径")
async def partner_root():
    """合作方联系方式模块根路径"""
    return {
        "message": "合作方联系方式模块API",
        "endpoints": {
            "合作方列表": "/list",
            "合作方详情": "/{合作方ID}",
            "创建合作方": "/",
            "更新合作方": "/{合作方ID}",
            "删除合作方": "/{合作方ID}",
            "统计信息": "/statistics"
        }
    }


@router.get("/list", summary="获取合作方列表")
async def get_partners_list(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    公司名称: Optional[str] = Query(None, description="筛选公司名称"),
    合作方类型: Optional[str] = Query(None, description="筛选合作方类型"),
    搜索关键词: Optional[str] = Query(None, description="搜索关键词（名称、联系人、电话）"),
    db: Session = Depends(get_market_db)
):
    """
    获取合作方列表
    
    - **skip**: 跳过的记录数（分页）
    - **limit**: 返回的记录数（分页）
    - **公司名称**: 可选，筛选公司名称
    - **合作方类型**: 可选，筛选合作方类型
    - **搜索关键词**: 可选，搜索关键词
    """
    result = partner_crud.获取合作方列表(
        db,
        skip=skip,
        limit=limit,
        公司名称=公司名称,
        合作方类型=合作方类型,
        搜索关键词=搜索关键词
    )
    return {"success": True, **result}


@router.get("/statistics", summary="获取合作方统计信息")
async def get_partners_statistics(db: Session = Depends(get_market_db)):
    """获取合作方统计信息"""
    统计数据 = partner_crud.获取合作方统计(db)
    return {
        "success": True,
        "data": 统计数据
    }




@router.get("/{partner_id}", response_model=合作方联系方式响应, summary="获取单个合作方详情")
async def get_partner(partner_id: int, db: Session = Depends(get_market_db)):
    """获取单个合作方的详细信息"""
    合作方 = partner_crud.获取合作方(db, partner_id)
    if not 合作方:
        raise HTTPException(status_code=404, detail="合作方不存在")
    return 合作方


@router.post("/", response_model=合作方联系方式响应, summary="创建合作方")
async def create_partner(
    data: 合作方联系方式创建,
    db: Session = Depends(get_market_db)
):
    """
    创建新的合作方记录
    
    必填字段：
    - 合作方名称
    - 合作方类型
    - 联系人姓名
    - 联系电话
    """
    try:
        return partner_crud.创建合作方(db, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'创建失败: {e}')


@router.put("/{partner_id}", response_model=合作方联系方式响应, summary="更新合作方")
async def update_partner(
    partner_id: int,
    data: 合作方联系方式更新,
    db: Session = Depends(get_market_db)
):
    """更新合作方信息"""
    try:
        合作方 = partner_crud.更新合作方(db, partner_id, data)
        if not 合作方:
            raise HTTPException(status_code=404, detail="合作方不存在")
        return 合作方
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'更新失败: {e}')


@router.delete("/{partner_id}", summary="删除合作方")
async def delete_partner(
    partner_id: int,
    db: Session = Depends(get_market_db)
):
    """删除合作方记录"""
    成功 = partner_crud.删除合作方(db, partner_id)
    if not 成功:
        raise HTTPException(status_code=404, detail="合作方不存在")
    return {
        "success": True,
        "message": "合作方删除成功",
        "合作方ID": partner_id
    }

