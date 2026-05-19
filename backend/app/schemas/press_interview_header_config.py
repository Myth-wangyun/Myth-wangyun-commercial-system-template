"""
Schemas for press interview header configuration
"""
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class HeaderConfigBase(BaseModel):
    campus_name: str = Field(..., description="神殿名称")
    class_name: str = Field(..., description="班级名称")
    project_number: int = Field(..., ge=1, description="项目编号")
    header_config: Dict[str, str] = Field(
        default_factory=dict,
        description="表头配置，格式：{instructor1: '教员1评分', instructor2: '教员2评分', ...}"
    )


class HeaderConfigCreate(HeaderConfigBase):
    pass


class HeaderConfigUpdate(BaseModel):
    header_config: Dict[str, str] = Field(
        ...,
        description="表头配置，格式：{instructor1: '教员1评分', instructor2: '教员2评分', ...}"
    )


class HeaderConfigResponse(HeaderConfigBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class HeaderConfigListResponse(BaseModel):
    configs: Dict[str, Dict[int, Dict[str, str]]] = Field(
        default_factory=dict,
        description="配置字典，格式：{scope_key: {project_number: {instructor1: '...', ...}}}"
    )
