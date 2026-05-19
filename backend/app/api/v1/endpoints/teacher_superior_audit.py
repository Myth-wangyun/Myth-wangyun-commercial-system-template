"""
教员功能分析上级听课表 API
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_superior_audit as crud
from ....schemas.teacher_superior_audit import (
    上级听课列表响应,
    上级听课创建,
    上级听课更新,
    上级听课行响应,
)

router = APIRouter()


@router.get("/", summary="上级听课根路径")
async def root():
    return {"message": "教员功能分析上级听课表 API"}


@router.get(
    "/{campus}/{year}",
    response_model=上级听课列表响应,
    summary="获取上级听课数据",
)
async def get_audit(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取听课数据(db, campus, year)
        行数据 = [上级听课行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 上级听课列表响应(
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
    response_model=上级听课列表响应,
    summary="创建上级听课数据",
)
async def create_audit(
    数据: 上级听课创建 = Body(..., description="上级听课数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.创建听课数据(db, 数据)
        行数据 = [上级听课行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 上级听课列表响应(
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
    response_model=上级听课列表响应,
    summary="更新上级听课数据",
)
async def update_audit(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: 上级听课更新 = Body(..., description="上级听课行数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.更新听课数据(db, campus, year, 数据)
        行数据 = [上级听课行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 上级听课列表响应(
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
    summary="删除上级听课数据",
)
async def delete_audit(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除听课数据(db, campus, year)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
