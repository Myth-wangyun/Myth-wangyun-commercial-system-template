"""
教员功能分析总表 API
"""


from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_function_analysis as crud
from ....schemas.teacher_function_analysis import (
    教员功能分析列表响应,
    教员功能分析创建,
    教员功能分析更新,
    教员功能行响应,
)

router = APIRouter()


@router.get("/", summary="教员功能分析总表根路径")
async def root():
    return {"message": "教员功能分析总表 API"}


@router.get(
    "/{campus}/{year}/{month}",
    response_model=教员功能分析列表响应,
    summary="获取教员功能分析数据",
)
async def get_analysis(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    month: int = Path(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取功能分析(db, campus, year, month)
        行数据 = [教员功能行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 教员功能分析列表响应(
            神殿名称=campus, 年份=year, 月份=month, 行数据=行数据, 创建时间=创建时间, 更新时间=更新时间
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.post(
    "/",
    response_model=教员功能分析列表响应,
    summary="创建教员功能分析数据",
)
async def create_analysis(
    数据: 教员功能分析创建 = Body(..., description="教员功能分析数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.创建功能分析(db, 数据)
        行数据 = [教员功能行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 教员功能分析列表响应(
            神殿名称=数据.神殿名称, 年份=数据.年份, 月份=数据.月份, 行数据=行数据, 创建时间=创建时间, 更新时间=更新时间
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.put(
    "/{campus}/{year}/{month}",
    response_model=教员功能分析列表响应,
    summary="更新教员功能分析数据",
)
async def update_analysis(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    month: int = Path(..., ge=1, le=12, description="月份"),
    数据: 教员功能分析更新 = Body(..., description="教员功能分析行数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.更新功能分析(db, campus, year, month, 数据)
        行数据 = [教员功能行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 教员功能分析列表响应(
            神殿名称=campus, 年份=year, 月份=month, 行数据=行数据, 创建时间=创建时间, 更新时间=更新时间
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete(
    "/{campus}/{year}/{month}",
    summary="删除教员功能分析数据",
)
async def delete_analysis(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    month: int = Path(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除功能分析(db, campus, year, month)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e
