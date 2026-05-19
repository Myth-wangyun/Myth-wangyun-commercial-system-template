"""
教员功能分析学员违纪表 API
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_violation as crud
from ....schemas.teacher_violation import (
    违纪列表响应,
    违纪创建,
    违纪更新,
    违纪行响应,
)

router = APIRouter()


@router.get("/", summary="学员违纪根路径")
async def root():
    return {"message": "教员功能分析学员违纪表 API"}


@router.get(
    "/{campus}/{year}",
    response_model=违纪列表响应,
    summary="获取学员违纪数据",
)
async def get_violation(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取违纪数据(db, campus, year)
        行数据 = [违纪行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 违纪列表响应(
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=违纪列表响应,
    summary="创建学员违纪数据",
)
async def create_violation(
    数据: 违纪创建 = Body(..., description="学员违纪数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.创建违纪数据(db, 数据)
        行数据 = [违纪行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 违纪列表响应(
            神殿名称=数据.神殿名称,
            年份=数据.年份,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.put(
    "/{campus}/{year}",
    response_model=违纪列表响应,
    summary="更新学员违纪数据",
)
async def update_violation(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: 违纪更新 = Body(..., description="学员违纪行数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.更新违纪数据(db, campus, year, 数据)
        行数据 = [违纪行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 违纪列表响应(
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")


@router.delete(
    "/{campus}/{year}",
    summary="删除学员违纪数据",
)
async def delete_violation(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除违纪数据(db, campus, year)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
