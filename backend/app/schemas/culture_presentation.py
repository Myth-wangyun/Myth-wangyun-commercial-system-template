"""
企业文化宣讲计划表数据验证模式 (Pydantic v2)
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 宣讲计划行创建(BaseModel):
    """创建宣讲计划行的数据模型"""
    序号: int = Field(..., ge=1, description="序号")
    宣讲时间: Optional[date] = Field(None, description="宣讲时间")
    宣讲地点: Optional[str] = Field(None, max_length=200, description="宣讲地点")
    宣讲方式: Optional[str] = Field(None, max_length=100, description="宣讲方式")
    宣讲主题: Optional[str] = Field(None, max_length=200, description="宣讲主题")
    宣讲内容概述: Optional[str] = Field(None, description="宣讲内容概述")
    宣讲对象: Optional[str] = Field(None, max_length=200, description="宣讲对象")
    主讲人: Optional[str] = Field(None, max_length=100, description="主讲人")
    需准备资料: Optional[str] = Field(None, description="需准备资料")
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 宣讲计划行更新(BaseModel):
    """更新宣讲计划行的数据模型"""
    宣讲时间: Optional[date] = Field(None, description="宣讲时间")
    宣讲地点: Optional[str] = Field(None, max_length=200, description="宣讲地点")
    宣讲方式: Optional[str] = Field(None, max_length=100, description="宣讲方式")
    宣讲主题: Optional[str] = Field(None, max_length=200, description="宣讲主题")
    宣讲内容概述: Optional[str] = Field(None, description="宣讲内容概述")
    宣讲对象: Optional[str] = Field(None, max_length=200, description="宣讲对象")
    主讲人: Optional[str] = Field(None, max_length=100, description="主讲人")
    需准备资料: Optional[str] = Field(None, description="需准备资料")
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 宣讲计划行响应(BaseModel):
    """宣讲计划行响应数据模型"""
    计划ID: int = Field(..., description="计划ID")
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    月份: int = Field(..., ge=1, le=12, description="月份")
    序号: int = Field(..., description="序号")
    宣讲时间: Optional[date] = Field(None, description="宣讲时间")
    宣讲地点: Optional[str] = Field(None, description="宣讲地点")
    宣讲方式: Optional[str] = Field(None, description="宣讲方式")
    宣讲主题: Optional[str] = Field(None, description="宣讲主题")
    宣讲内容概述: Optional[str] = Field(None, description="宣讲内容概述")
    宣讲对象: Optional[str] = Field(None, description="宣讲对象")
    主讲人: Optional[str] = Field(None, description="主讲人")
    需准备资料: Optional[str] = Field(None, description="需准备资料")
    备注: Optional[str] = Field(None, description="备注")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        },
        from_attributes=True
    )


class 宣讲计划创建(BaseModel):
    """创建宣讲计划的数据模型（包含多行）"""
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    月份: int = Field(..., ge=1, le=12, description="月份")
    行数据: List[宣讲计划行创建] = Field(..., description="计划行数据列表")

    @field_validator('月份')
    def validate_month(cls, v: int) -> int:
        if not (1 <= v <= 12):
            raise ValueError('月份必须在1-12之间')
        return v

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 宣讲计划更新(BaseModel):
    """更新宣讲计划的数据模型（批量更新行数据）"""
    行数据: List[宣讲计划行创建] = Field(..., description="计划行数据列表")

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 宣讲计划列表响应(BaseModel):
    """宣讲计划列表响应数据模型"""
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    月份: int = Field(..., description="月份")
    行数据: List[宣讲计划行响应] = Field(..., description="计划行数据列表")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }
    )

