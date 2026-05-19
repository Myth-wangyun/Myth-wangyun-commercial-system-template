"""
企业文化宣讲计划表API端点
"""


from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.dependencies import require_permission
from ....crud import culture_presentation as culture_crud
from ....schemas.culture_presentation import (
    宣讲计划列表响应,
    宣讲计划创建,
    宣讲计划更新,
    宣讲计划行响应,
    宣讲计划行更新,
)

router = APIRouter()


@router.get("/", summary="企业文化宣讲计划表根路径")
async def culture_presentation_root():
    """企业文化宣讲计划表API根路径"""
    return {
        "message": "企业文化宣讲计划表API",
        "endpoints": {
            "获取计划": "GET /{campus}/{year}/{month}",
            "创建计划": "POST /",
            "更新计划": "PUT /{campus}/{year}/{month}",
            "删除计划": "DELETE /{campus}/{year}/{month}"
        }
    }


@router.get(
    "/{campus}/{year}/{month}",
    response_model=宣讲计划列表响应,
    summary="获取宣讲计划",
    dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.view"))]
)
async def get_presentation_plan(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    month: int = Path(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db)
):
    """
    获取指定神殿、年份、月份的宣讲计划
    
    权限要求：academic.enterprise_culture.presentation.view
    （仅董事长和学术总监可访问）
    
    - **campus**: 神殿名称
    - **year**: 年份（2000-2100）
    - **month**: 月份（1-12）
    """
    try:
        计划列表 = culture_crud.获取宣讲计划(db, campus, year, month)
        
        # 转换为响应格式
        行数据 = [宣讲计划行响应.model_validate(行) for 行 in 计划列表]
        
        # 获取创建时间和更新时间（从第一条记录获取，如果存在）
        创建时间 = 计划列表[0].创建时间 if 计划列表 else None
        更新时间 = max((行.更新时间 for 行 in 计划列表), default=None) if 计划列表 else None
        
        return 宣讲计划列表响应(
            神殿名称=campus,
            年份=year,
            月份=month,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取宣讲计划失败: {str(e)}") from e


@router.post(
    "/",
    response_model=宣讲计划列表响应,
    summary="创建宣讲计划",
    dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.edit"))]
)
async def create_presentation_plan(
    计划数据: 宣讲计划创建 = Body(..., description="宣讲计划数据"),
    db: Session = Depends(get_db)
):
    """
    创建宣讲计划（批量创建多行）
    
    权限要求：academic.enterprise_culture.presentation.edit
    （仅董事长和学术总监可访问）
    
    请求体包含：
    - **神殿名称**: 神殿名称
    - **年份**: 年份
    - **月份**: 月份
    - **行数据**: 计划行数据列表
    """
    try:
        # 创建计划
        创建的行列表 = culture_crud.创建宣讲计划(db, 计划数据)
        
        # 转换为响应格式
        行数据 = [宣讲计划行响应.model_validate(行) for 行 in 创建的行列表]
        
        # 获取创建时间和更新时间
        创建时间 = 创建的行列表[0].创建时间 if 创建的行列表 else None
        更新时间 = max((行.更新时间 for 行 in 创建的行列表), default=None) if 创建的行列表 else None
        
        return 宣讲计划列表响应(
            神殿名称=计划数据.神殿名称,
            年份=计划数据.年份,
            月份=计划数据.月份,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建宣讲计划失败: {str(e)}") from e


@router.put(
    "/{campus}/{year}/{month}",
    response_model=宣讲计划列表响应,
    summary="更新宣讲计划",
    dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.edit"))]
)
async def update_presentation_plan(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    month: int = Path(..., ge=1, le=12, description="月份"),
    计划数据: 宣讲计划更新 = Body(..., description="宣讲计划更新数据"),
    db: Session = Depends(get_db)
):
    """
    更新宣讲计划（批量更新多行）
    
    权限要求：academic.enterprise_culture.presentation.edit
    
    - **campus**: 神殿名称
    - **year**: 年份
    - **month**: 月份
    - **计划数据**: 包含行数据的更新数据
    """
    try:
        # 更新计划
        更新的行列表 = culture_crud.更新宣讲计划(db, campus, year, month, 计划数据)
        
        # 转换为响应格式
        行数据 = [宣讲计划行响应.model_validate(行) for 行 in 更新的行列表]
        
        # 获取创建时间和更新时间
        创建时间 = 更新的行列表[0].创建时间 if 更新的行列表 else None
        更新时间 = max((行.更新时间 for 行 in 更新的行列表), default=None) if 更新的行列表 else None
        
        return 宣讲计划列表响应(
            神殿名称=campus,
            年份=year,
            月份=month,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新宣讲计划失败: {str(e)}") from e


@router.delete(
    "/{campus}/{year}/{month}",
    summary="删除宣讲计划",
    dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.delete"))]
)
async def delete_presentation_plan(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    month: int = Path(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db)
):
    """
    删除指定神殿、年份、月份的宣讲计划
    
    权限要求：academic.enterprise_culture.presentation.delete
    
    - **campus**: 神殿名称
    - **year**: 年份
    - **month**: 月份
    """
    try:
        deleted_count = culture_crud.删除宣讲计划(db, campus, year, month)
        return {
            "success": True,
            "message": f"成功删除 {deleted_count} 条记录",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除宣讲计划失败: {str(e)}") from e


@router.get(
    "/row/{plan_id}",
    response_model=宣讲计划行响应,
    summary="获取单行宣讲计划"
)
async def get_presentation_plan_row(
    plan_id: int = Path(..., description="计划ID"),
    db: Session = Depends(get_db)
):
    """
    根据计划ID获取单行宣讲计划
    
    - **plan_id**: 计划ID
    """
    try:
        行 = culture_crud.获取宣讲计划行(db, plan_id)
        if not 行:
            raise HTTPException(status_code=404, detail="宣讲计划行不存在")
        return 宣讲计划行响应.model_validate(行)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取宣讲计划行失败: {str(e)}") from e


@router.put(
    "/row/{plan_id}",
    response_model=宣讲计划行响应,
    summary="更新单行宣讲计划"
)
async def update_presentation_plan_row(
    plan_id: int = Path(..., description="计划ID"),
    行数据: 宣讲计划行更新 = Body(..., description="宣讲计划行更新数据"),
    db: Session = Depends(get_db)
):
    """
    更新单行宣讲计划
    
    - **plan_id**: 计划ID
    - **行数据**: 更新数据
    """
    try:
        更新的行 = culture_crud.更新宣讲计划行(db, plan_id, 行数据)
        if not 更新的行:
            raise HTTPException(status_code=404, detail="宣讲计划行不存在")
        return 宣讲计划行响应.model_validate(更新的行)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新宣讲计划行失败: {str(e)}") from e


@router.delete(
    "/row/{plan_id}",
    summary="删除单行宣讲计划"
)
async def delete_presentation_plan_row(
    plan_id: int = Path(..., description="计划ID"),
    db: Session = Depends(get_db)
):
    """
    删除单行宣讲计划
    
    - **plan_id**: 计划ID
    """
    try:
        success = culture_crud.删除宣讲计划行(db, plan_id)
        if not success:
            raise HTTPException(status_code=404, detail="宣讲计划行不存在")
        return {
            "success": True,
            "message": "删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除宣讲计划行失败: {str(e)}") from e

