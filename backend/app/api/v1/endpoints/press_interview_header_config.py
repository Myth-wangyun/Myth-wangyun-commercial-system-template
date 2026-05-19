"""
Endpoints for press interview header configuration
"""
from typing import Dict

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud.press_interview_header_config import (
    create_or_update_config,
    delete_config,
    get_all_configs,
    get_config,
)
from ....schemas.press_interview_header_config import (
    HeaderConfigCreate,
    HeaderConfigListResponse,
    HeaderConfigResponse,
    HeaderConfigUpdate,
)

router = APIRouter()


@router.get("/", response_model=HeaderConfigListResponse, summary="获取表头配置列表")
def list_header_configs(
    campus_name: str | None = Query(None, description="神殿名称"),
    class_name: str | None = Query(None, description="班级名称"),
    db: Session = Depends(get_db),
):
    """获取表头配置，返回格式化的字典"""
    records = get_all_configs(db, campus_name=campus_name, class_name=class_name)
    
    # 格式化为前端需要的格式：{scope_key: {project_number: {instructor1: '...', ...}}}
    configs: Dict[str, Dict[int, dict]] = {}
    for record in records:
        scope_key = f"{record.campus_name}__{record.class_name}"
        if scope_key not in configs:
            configs[scope_key] = {}
        configs[scope_key][record.project_number] = record.header_config
    
    return HeaderConfigListResponse(configs=configs)


@router.get("/single", response_model=HeaderConfigResponse, summary="获取单个表头配置")
def get_header_config(
    campus_name: str = Query(..., description="神殿名称"),
    class_name: str = Query(..., description="班级名称"),
    project_number: int = Query(..., ge=1, description="项目编号"),
    db: Session = Depends(get_db),
):
    """获取指定神殿、班级、项目的表头配置"""
    record = get_config(db, campus_name, class_name, project_number)
    if not record:
        raise HTTPException(status_code=404, detail="配置不存在")
    return HeaderConfigResponse.model_validate(record)


@router.post("/", response_model=HeaderConfigResponse, summary="创建或更新表头配置")
def create_or_update_header_config(
    payload: HeaderConfigCreate,
    db: Session = Depends(get_db),
):
    """创建或更新表头配置（如果已存在则更新）"""
    record = create_or_update_config(
        db,
        payload.campus_name,
        payload.class_name,
        payload.project_number,
        payload.header_config,
    )
    return HeaderConfigResponse.model_validate(record)


@router.put("/", response_model=HeaderConfigResponse, summary="更新表头配置")
def update_header_config(
    campus_name: str = Query(..., description="神殿名称"),
    class_name: str = Query(..., description="班级名称"),
    project_number: int = Query(..., ge=1, description="项目编号"),
    payload: HeaderConfigUpdate = Body(...),
    db: Session = Depends(get_db),
):
    """更新表头配置"""
    record = create_or_update_config(
        db,
        campus_name,
        class_name,
        project_number,
        payload.header_config,
    )
    return HeaderConfigResponse.model_validate(record)


@router.delete("/", summary="删除表头配置")
def delete_header_config(
    campus_name: str = Query(..., description="神殿名称"),
    class_name: str = Query(..., description="班级名称"),
    project_number: int = Query(..., ge=1, description="项目编号"),
    db: Session = Depends(get_db),
):
    """删除表头配置"""
    ok = delete_config(db, campus_name, class_name, project_number)
    if not ok:
        raise HTTPException(status_code=404, detail="配置不存在")
    return {"success": True}
