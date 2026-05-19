from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GodBase(BaseModel):
    """神祇基础Schema"""
    name: str = Field(..., max_length=50, description="神祇名称")
    title: str = Field(..., max_length=100, description="神祇称号")
    role: str = Field(default="supreme", description="神祇角色")
    status: str = Field(default="active", description="神祇状态")
    description: Optional[str] = Field(None, description="神祇描述")
    power_level: int = Field(default=100, ge=1, le=100, description="神力等级")
    avatar: Optional[str] = Field(None, max_length=255, description="神祇头像URL")
    temple_name: Optional[str] = Field(None, max_length=100, description="神殿名称")
    blessing: Optional[str] = Field(None, description="神祇祝福语")
    is_eternal: bool = Field(default=True, description="是否永恒")
    reign_years: int = Field(default=0, ge=0, description="统治年数")


class GodCreate(GodBase):
    """创建神祇Schema"""
    pass


class GodUpdate(BaseModel):
    """更新神祇Schema"""
    title: Optional[str] = Field(None, max_length=100, description="神祇称号")
    status: Optional[str] = Field(None, description="神祇状态")
    description: Optional[str] = Field(None, description="神祇描述")
    power_level: Optional[int] = Field(None, ge=1, le=100, description="神力等级")
    avatar: Optional[str] = Field(None, max_length=255, description="神祇头像URL")
    temple_name: Optional[str] = Field(None, max_length=100, description="神殿名称")
    blessing: Optional[str] = Field(None, description="神祇祝福语")
    is_eternal: Optional[bool] = Field(None, description="是否永恒")
    reign_years: Optional[int] = Field(None, ge=0, description="统治年数")


class GodResponse(GodBase):
    """神祇响应Schema"""
    god_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GodListResponse(BaseModel):
    """神祇列表响应Schema"""
    total: int
    items: list[GodResponse]


class AdminLoginRequest(BaseModel):
    """管理员登录请求"""
    username: str = Field(..., max_length=50, description="管理员用户名")
    password: str = Field(..., min_length=6, description="管理员密码")


class AdminUserResponse(BaseModel):
    """管理员响应Schema"""
    admin_id: int
    username: str
    nickname: str
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminLoginResponse(BaseModel):
    """管理员登录响应"""
    access_token: str
    token_type: str = "bearer"
    admin: AdminUserResponse
