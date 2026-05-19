"""
企业文化考试计划表数据验证模式 (Pydantic v2)
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 考试计划行创建(BaseModel):
    """创建考试计划行的数据模型"""
    序号: int = Field(..., ge=1, description="序号")
    考试时间: Optional[date] = Field(None, description="考试时间")
    考试地点: Optional[str] = Field(None, max_length=200, description="考试地点")
    考试方式: Optional[str] = Field(None, max_length=100, description="考试方式")
    考试主题: Optional[str] = Field(None, max_length=200, description="考试主题")
    考试内容概述: Optional[str] = Field(None, description="考试内容概述")
    考试对象: Optional[str] = Field(None, max_length=200, description="考试对象")
    监考人: Optional[str] = Field(None, max_length=100, description="监考人")
    考场布置: Optional[str] = Field(None, max_length=200, description="考场布置")
    需准备资料: Optional[str] = Field(None, description="需准备资料")
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 考试计划行更新(BaseModel):
    """更新考试计划行的数据模型"""
    考试时间: Optional[date] = Field(None, description="考试时间")
    考试地点: Optional[str] = Field(None, max_length=200, description="考试地点")
    考试方式: Optional[str] = Field(None, max_length=100, description="考试方式")
    考试主题: Optional[str] = Field(None, max_length=200, description="考试主题")
    考试内容概述: Optional[str] = Field(None, description="考试内容概述")
    考试对象: Optional[str] = Field(None, max_length=200, description="考试对象")
    监考人: Optional[str] = Field(None, max_length=100, description="监考人")
    考场布置: Optional[str] = Field(None, max_length=200, description="考场布置")
    需准备资料: Optional[str] = Field(None, description="需准备资料")
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 考试计划行响应(BaseModel):
    """考试计划行响应数据模型"""
    计划ID: int = Field(..., description="计划ID")
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    月份: int = Field(..., ge=1, le=12, description="月份")
    序号: int = Field(..., description="序号")
    考试时间: Optional[date] = Field(None, description="考试时间")
    考试地点: Optional[str] = Field(None, description="考试地点")
    考试方式: Optional[str] = Field(None, description="考试方式")
    考试主题: Optional[str] = Field(None, description="考试主题")
    考试内容概述: Optional[str] = Field(None, description="考试内容概述")
    考试对象: Optional[str] = Field(None, description="考试对象")
    监考人: Optional[str] = Field(None, description="监考人")
    考场布置: Optional[str] = Field(None, description="考场布置")
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


class 考试计划创建(BaseModel):
    """创建考试计划的数据模型（包含多行）"""
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    月份: int = Field(..., ge=1, le=12, description="月份")
    行数据: List[考试计划行创建] = Field(..., description="计划行数据列表")

    @field_validator('月份')
    def validate_month(cls, v: int) -> int:
        if not (1 <= v <= 12):
            raise ValueError('月份必须在1-12之间')
        return v

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 考试计划更新(BaseModel):
    """更新考试计划的数据模型（批量更新行数据）"""
    行数据: List[考试计划行创建] = Field(..., description="计划行数据列表")

    model_config = ConfigDict(
        json_encoders={date: lambda v: v.isoformat() if v else None}
    )


class 考试计划列表响应(BaseModel):
    """考试计划列表响应数据模型"""
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    月份: int = Field(..., description="月份")
    行数据: List[考试计划行响应] = Field(..., description="计划行数据列表")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }
    )

