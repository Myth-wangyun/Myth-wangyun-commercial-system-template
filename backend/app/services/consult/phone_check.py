"""
电话标准化检查表 API 服务层
"""

import math
from datetime import datetime
from typing import Any, Dict, Optional

from app.core.auth import get_current_user
from app.core.database import get_db
from app.crud.consult.phone_check import 电话标准化检查表CRUD, 电话标准化模板配置CRUD
from app.models.user import User
from app.schemas.consult.phone_check import (
    电话标准化检查表创建,
    电话标准化检查表响应,
    电话标准化检查表更新,
    电话标准化模板配置创建,
    电话标准化模板配置响应,
    电话标准化模板配置更新,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

# ==================== 电话标准化检查表相关接口 ====================


@router.post("/check-record/create", response_model=Dict[str, Any], summary="创建电话标准化检查表记录")
async def create_check(
    check_in: 电话标准化检查表创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建电话标准化检查表记录
    - 支持三层结构：步骤、子结构、次子结构
    - 次子结构允许用户配置和修改
    """
    try:
        # 设置创建人信息
        check_data = check_in.model_dump()
        if not check_data.get("创建人ID"):
            check_data["创建人ID"] = getattr(current_user, "user_id", None) or getattr(current_user, "用户ID", None)
        if not check_data.get("创建人姓名"):
            check_data["创建人姓名"] = getattr(current_user, "real_name", None) or getattr(current_user, "姓名", None)
        if not check_data.get("神殿"):
            check_data["神殿"] = getattr(current_user, "campus", None) or getattr(current_user, "神殿", None)

        # 创建记录
        db_check = 电话标准化检查表CRUD.create(db=db, obj_in=check_data)

        return {
            "code": 0,
            "message": "创建成功",
            "data": 电话标准化检查表响应.model_validate(db_check)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建失败: {str(e)}"
        ) from e


@router.get("/check-record/query-list", response_model=Dict[str, Any], summary="获取电话标准化检查表记录列表")
async def get_check_list(
    consultant: Optional[str] = None,
    campus: Optional[str] = None,
    auditor: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    creator_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取电话标准化检查表记录列表
    - 支持按咨询师、神殿、审核人、日期范围等筛选
    - 支持分页
    """
    try:
        # 转换日期格式
        start_datetime = datetime.fromisoformat(start_date) if start_date else None
        end_datetime = datetime.fromisoformat(end_date) if end_date else None

        # 查询数据
        skip = (page - 1) * page_size
        checks, total = 电话标准化检查表CRUD.get_multi(
            db=db,
            consultant=consultant,
            campus=campus,
            auditor=auditor,
            start_date=start_datetime,
            end_date=end_datetime,
            creator_id=creator_id,
            skip=skip,
            limit=page_size
        )

        # 转换为响应格式
        check_list = [电话标准化检查表响应.model_validate(check) for check in checks]

        return {
            "code": 0,
            "message": "查询成功",
            "data": {
                "总记录数": total,
                "总页数": math.ceil(total / page_size),
                "当前页": page,
                "每页数量": page_size,
                "数据列表": check_list
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询失败: {str(e)}"
        ) from e


@router.get("/check-record/detail/{record_id}", response_model=Dict[str, Any], summary="获取电话标准化检查表记录详情")
async def get_check(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取电话标准化检查表记录详情"""
    db_check = 电话标准化检查表CRUD.get_by_id(db=db, record_id=record_id)
    
    if not db_check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )

    return {
        "code": 0,
        "message": "获取成功",
        "data": 电话标准化检查表响应.model_validate(db_check)
    }


@router.put("/check-record/update/{record_id}", response_model=Dict[str, Any], summary="更新电话标准化检查表记录")
async def update_check(
    record_id: int,
    check_in: 电话标准化检查表更新,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新电话标准化检查表记录"""
    try:
        # 获取现有记录
        db_check = 电话标准化检查表CRUD.get_by_id(db=db, record_id=record_id)
        
        if not db_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="记录不存在"
            )

        # 更新记录
        update_data = check_in.model_dump(exclude_unset=True)
        updated_check = 电话标准化检查表CRUD.update(db=db, db_obj=db_check, obj_in=update_data)

        return {
            "code": 0,
            "message": "更新成功",
            "data": 电话标准化检查表响应.model_validate(updated_check)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新失败: {str(e)}"
        ) from e


@router.delete("/check-record/delete/{record_id}", response_model=Dict[str, Any], summary="删除电话标准化检查表记录")
async def delete_check(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除电话标准化检查表记录"""
    try:
        success = 电话标准化检查表CRUD.delete(db=db, record_id=record_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="记录不存在"
            )

        return {
            "code": 0,
            "message": "删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除失败: {str(e)}"
        ) from e


# ==================== 电话标准化模板配置相关接口 ====================


@router.post("/template-config/create", response_model=Dict[str, Any], summary="创建电话标准化模板配置")
async def create_template(
    template_in: 电话标准化模板配置创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建电话标准化模板配置
    - 允许配置步骤、子结构、次子结构
    - 次子结构可由用户自定义
    - 支持设置为默认模板
    """
    try:
        # 设置创建人信息
        template_data = template_in.model_dump()
        if not template_data.get("创建人ID"):
            template_data["创建人ID"] = getattr(current_user, "user_id", None) or getattr(current_user, "用户ID", None)
        if not template_data.get("创建人姓名"):
            template_data["创建人姓名"] = getattr(current_user, "real_name", None) or getattr(current_user, "姓名", None)
        if not template_data.get("神殿"):
            template_data["神殿"] = getattr(current_user, "campus", None) or getattr(current_user, "神殿", None)

        # 创建模板
        db_template = 电话标准化模板配置CRUD.create(db=db, obj_in=template_data)

        return {
            "code": 0,
            "message": "创建成功",
            "data": 电话标准化模板配置响应.model_validate(db_template)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建失败: {str(e)}"
        ) from e


@router.get("/template-config/detail/{template_id}", response_model=Dict[str, Any], summary="获取模板详情")
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取模板详情"""
    db_template = 电话标准化模板配置CRUD.get_by_id(db=db, template_id=template_id)
    
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="模板不存在"
        )

    return {
        "code": 0,
        "message": "获取成功",
        "data": 电话标准化模板配置响应.model_validate(db_template)
    }


@router.get("/template-config/query-list", response_model=Dict[str, Any], summary="获取模板列表")
async def get_template_list(
    is_enabled: Optional[int] = None,
    campus: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取模板列表
    - 支持按启用状态、神殿筛选
    - 支持分页
    """
    try:
        skip = (page - 1) * page_size
        templates, total = 电话标准化模板配置CRUD.get_multi(
            db=db,
            is_enabled=is_enabled,
            campus=campus,
            skip=skip,
            limit=page_size
        )

        # 转换为响应格式
        template_list = [电话标准化模板配置响应.model_validate(t) for t in templates]

        return {
            "code": 0,
            "message": "查询成功",
            "data": {
                "总记录数": total,
                "总页数": math.ceil(total / page_size),
                "当前页": page,
                "每页数量": page_size,
                "数据列表": template_list
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询失败: {str(e)}"
        ) from e


@router.get("/template-config/get-default", response_model=Dict[str, Any], summary="获取默认模板")
async def get_default_template(
    campus: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取默认模板
    - 可按神殿筛选
    """
    try:
        db_template = 电话标准化模板配置CRUD.get_default_template(
            db=db,
            campus=campus
        )
        
        if not db_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="未找到默认模板"
            )

        return {
            "code": 0,
            "message": "获取成功",
            "data": 电话标准化模板配置响应.model_validate(db_template)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询失败: {str(e)}"
        ) from e


@router.put("/template-config/update/{template_id}", response_model=Dict[str, Any], summary="更新模板")
async def update_template(
    template_id: int,
    template_in: 电话标准化模板配置更新,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新模板"""
    try:
        # 获取现有模板
        db_template = 电话标准化模板配置CRUD.get_by_id(db=db, template_id=template_id)
        
        if not db_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="模板不存在"
            )

        # 更新模板
        update_data = template_in.model_dump(exclude_unset=True)
        updated_template = 电话标准化模板配置CRUD.update(db=db, db_obj=db_template, obj_in=update_data)

        return {
            "code": 0,
            "message": "更新成功",
            "data": 电话标准化模板配置响应.model_validate(updated_template)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新失败: {str(e)}"
        ) from e


@router.delete("/template-config/delete/{template_id}", response_model=Dict[str, Any], summary="删除模板")
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除模板（默认模板不能删除）"""
    try:
        success = 电话标准化模板配置CRUD.delete(db=db, template_id=template_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="模板不存在"
            )

        return {
            "code": 0,
            "message": "删除成功"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除失败: {str(e)}"
        ) from e


@router.post("/template-config/set-default/{template_id}", response_model=Dict[str, Any], summary="设置为默认模板")
async def set_default_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """设置为默认模板"""
    try:
        db_template = 电话标准化模板配置CRUD.set_default(db=db, template_id=template_id)
        
        if not db_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="模板不存在"
            )

        return {
            "code": 0,
            "message": "设置成功",
            "data": 电话标准化模板配置响应.model_validate(db_template)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"设置失败: {str(e)}"
        ) from e
