"""
教员功能分析 - 教员考试合格率 API
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_teacher_exam_pass as crud
from ....schemas.teacher_exam_pass import 考试率列表响应, 考试率创建, 考试率更新, 考试率行响应

router = APIRouter()


@router.get(
    "/{campus}/{year}",
    response_model=考试率列表响应,
    summary="获取教员考试合格率表",
)
async def get_teacher_exam_pass(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取(db, campus, year)
        行数据 = [考试率行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 考试率列表响应(
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.post(
    "/",
    response_model=考试率列表响应,
    summary="创建教员考试合格率表（全量覆盖指定年份）",
)
async def create_teacher_exam_pass(
    数据: 考试率创建 = Body(..., description="教员考试合格率数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.创建(db, 数据)
        行数据 = [考试率行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 考试率列表响应(
            神殿名称=数据.神殿名称,
            年份=数据.年份,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.put(
    "/{campus}/{year}",
    response_model=考试率列表响应,
    summary="更新教员考试合格率表（全量替换）",
)
async def update_teacher_exam_pass(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: 考试率更新 = Body(..., description="教员考试合格率行数据"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.更新(db, campus, year, 数据)
        行数据 = [考试率行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 考试率列表响应(
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete(
    "/{campus}/{year}",
    summary="删除教员考试合格率表",
)
async def delete_teacher_exam_pass(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除(db, campus, year)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e
