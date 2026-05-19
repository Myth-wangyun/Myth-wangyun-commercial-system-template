"""
神殿口碑招生个人目标与结果汇总表 Schemas
"""

from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class 个人行数据(BaseModel):
    """个人行数据"""
    姓名: str = Field(..., description="姓名")
    目标口碑量: int = Field(0, ge=0, description="目标口碑量")
    实际口碑量: int = Field(0, ge=0, description="实际口碑量")
    目标上门量: int = Field(0, ge=0, description="目标上门量")
    实际上门量: int = Field(0, ge=0, description="实际上门量")
    目标招生人数: int = Field(0, ge=0, description="目标招生人数")
    实际招生人数: int = Field(0, ge=0, description="实际招生人数")
    目标口碑收入: Decimal = Field(Decimal(0), ge=0, description="目标口碑收入")
    实际口碑收入: Decimal = Field(Decimal(0), ge=0, description="实际口碑收入")


class 个人保存请求(BaseModel):
    """个人保存请求"""
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    行列表: List[个人行数据] = Field(..., description="行列表")


class 个人列表响应(BaseModel):
    """个人列表响应"""
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    行列表: List[个人行数据] = Field(..., description="行列表")

