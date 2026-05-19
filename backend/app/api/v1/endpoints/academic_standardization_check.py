"""
智慧司标准化检查表 API
"""

from datetime import date

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import academic_standardization_check as crud
from ....schemas.academic_standardization_check import (
    标准化检查列表响应,
    标准化检查创建,
    标准化检查日期响应,
    标准化检查更新,
    标准化检查行响应,
)

router = APIRouter()


@router.get(
    "/{campus}",
    response_model=标准化检查日期响应,
    summary="获取标准化检查表可用日期",
)
async def list_standardization_dates(
    campus: str = Path(..., description="神殿名称"),
    db: Session = Depends(get_db),
):
    try:
        dates = crud.获取日期列表(db, campus)
        return 标准化检查日期响应(神殿名称=campus, 日期列表=[d[0] for d in dates])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取日期列表失败: {str(e)}") from e


@router.get(
    "/{campus}/{day}",
    response_model=标准化检查列表响应,
    summary="获取标准化检查表",
)
async def get_standardization(
    campus: str = Path(..., description="神殿名称"),
    day: date = Path(..., description="日期"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取(db, campus, day)
        行数据 = [标准化检查行响应.model_validate(行) for 行 in 行列表]
        return 标准化检查列表响应(神殿名称=campus, 行数据=行数据)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.post(
    "/",
    response_model=标准化检查列表响应,
    summary="创建标准化检查表",
)
async def create_standardization(
    数据: 标准化检查创建 = Body(..., description="标准化检查数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.创建(db, 数据)
        行数据 = [标准化检查行响应.model_validate(行) for 行 in 行列表]
        return 标准化检查列表响应(神殿名称=数据.神殿名称, 行数据=行数据)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.put(
    "/{campus}/{day}",
    response_model=标准化检查列表响应,
    summary="更新标准化检查表",
)
async def update_standardization(
    campus: str = Path(..., description="神殿名称"),
    day: date = Path(..., description="日期"),
    数据: 标准化检查更新 = Body(..., description="标准化检查行数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.更新(db, campus, day, 数据)
        行数据 = [标准化检查行响应.model_validate(行) for 行 in 行列表]
        return 标准化检查列表响应(神殿名称=campus, 行数据=行数据)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete(
    "/{campus}/{day}",
    summary="删除标准化检查表",
)
async def delete_standardization(
    campus: str = Path(..., description="神殿名称"),
    day: date = Path(..., description="日期"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除(db, campus, day)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e
