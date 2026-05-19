"""
教员功能分析子表 API（12个月数据）
"""


from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_function_subtable as crud
from ....schemas.teacher_function_subtable import (
    子表创建,
    子表响应,
    子表更新,
    子表行响应,
)

router = APIRouter()


@router.get("/", summary="教员功能分析子表根路径")
async def root():
    return {"message": "教员功能分析子表 API"}


@router.get(
    "/{table_type}/{campus}/{year}",
    response_model=子表响应,
    summary="获取子表数据",
)
async def get_subtable(
    table_type: str = Path(..., description="表类型，如 homework_submission"),
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取子表(db, table_type, campus, year)
        行数据 = [子表行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 子表响应(
            表类型=table_type,
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
    response_model=子表响应,
    summary="创建子表数据",
)
async def create_subtable(
    数据: 子表创建 = Body(..., description="子表数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.创建子表(db, 数据)
        行数据 = [子表行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 子表响应(
            表类型=数据.表类型,
            神殿名称=数据.神殿名称,
            年份=数据.年份,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.put(
    "/{table_type}/{campus}/{year}",
    response_model=子表响应,
    summary="更新子表数据",
)
async def update_subtable(
    table_type: str = Path(..., description="表类型"),
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: 子表更新 = Body(..., description="子表行数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.更新子表(db, table_type, campus, year, 数据)
        行数据 = [子表行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 子表响应(
            表类型=table_type,
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")


@router.delete(
    "/{table_type}/{campus}/{year}",
    summary="删除子表数据",
)
async def delete_subtable(
    table_type: str = Path(..., description="表类型"),
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除子表(db, table_type, campus, year)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
