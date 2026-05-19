"""
合作方联系方式模块数据验证模式 (Pydantic schemas)
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 合作方联系方式创建(BaseModel):
    """创建合作方联系方式的数据模型"""
    
    公司名称: str = Field(..., max_length=100, description="公司名称")
    合作方类型: str = Field(..., max_length=30, description="合作方类型")
    电话: Optional[str] = Field(None, max_length=20, description="电话")
    网站: Optional[str] = Field(None, max_length=200, description="网站")
    地址: Optional[str] = Field(None, max_length=200, description="地址")
    联系人: str = Field(..., max_length=50, description="联系人")
    联系人手机: Optional[str] = Field(None, max_length=20, description="联系人手机")
    QQ: Optional[str] = Field(None, max_length=20, description="QQ")
    微信: Optional[str] = Field(None, max_length=50, description="微信")
    
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True
    )
    
    @field_validator('公司名称', '联系人')
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('该字段不能为空')
        return v.strip()
    
    @field_validator('合作方类型')
    def validate_partner_type(cls, v: str) -> str:
        allowed_types = ["广告代理", "网络", "平媒", "招生合作伙伴", "网络服务", "人才服务", "通话服务", "物业服务"]
        if v not in allowed_types:
            raise ValueError(f'合作方类型必须是以下之一: {", ".join(allowed_types)}')
        return v


class 合作方联系方式更新(BaseModel):
    """更新合作方联系方式的数据模型"""
    
    公司名称: Optional[str] = Field(None, max_length=100, description="公司名称")
    合作方类型: Optional[str] = Field(None, max_length=30, description="合作方类型")
    电话: Optional[str] = Field(None, max_length=20, description="电话")
    网站: Optional[str] = Field(None, max_length=200, description="网站")
    地址: Optional[str] = Field(None, max_length=200, description="地址")
    联系人: Optional[str] = Field(None, max_length=50, description="联系人")
    联系人手机: Optional[str] = Field(None, max_length=20, description="联系人手机")
    QQ: Optional[str] = Field(None, max_length=20, description="QQ")
    微信: Optional[str] = Field(None, max_length=50, description="微信")
    
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True
    )


class 合作方联系方式响应(BaseModel):
    """返回合作方联系方式的数据模型"""
    
    合作方ID: int = Field(..., description="合作方ID")
    公司名称: str = Field(..., description="公司名称")
    合作方类型: str = Field(..., description="合作方类型")
    电话: Optional[str] = Field(None, description="电话")
    网站: Optional[str] = Field(None, description="网站")
    地址: Optional[str] = Field(None, description="地址")
    联系人: str = Field(..., description="联系人")
    联系人手机: Optional[str] = Field(None, description="联系人手机")
    QQ: Optional[str] = Field(None, description="QQ")
    微信: Optional[str] = Field(None, description="微信")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        },
        from_attributes=True
    )
