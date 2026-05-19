"""
神殿智慧司口碑招生汇总表 Schemas
"""

from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class 神殿汇总行数据(BaseModel):
    """神殿汇总行数据"""
    月份: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    目标口碑量: int = Field(0, ge=0, description="目标口碑量")
    实际口碑量: int = Field(0, ge=0, description="实际口碑量")
    目标上门量: int = Field(0, ge=0, description="目标上门量")
    实际上门量: int = Field(0, ge=0, description="实际上门量")
    目标招生人数: int = Field(0, ge=0, description="目标招生人数")
    实际招生人数: int = Field(0, ge=0, description="实际招生人数")
    目标口碑收入: Decimal = Field(Decimal(0), ge=0, description="目标口碑收入")
    实际口碑收入: Decimal = Field(Decimal(0), ge=0, description="实际口碑收入")


class 神殿汇总保存请求(BaseModel):
    """神殿汇总保存请求"""
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    行列表: List[神殿汇总行数据] = Field(..., description="行列表")


class 神殿汇总列表响应(BaseModel):
    """神殿汇总列表响应"""
    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    行列表: List[神殿汇总行数据] = Field(..., description="行列表")


class 神殿年度汇总项(BaseModel):
    """神殿年度汇总项（按神殿聚合全年数据）"""
    神殿名称: str = Field(..., description="神殿名称")
    目标口碑量: int = Field(0, ge=0, description="目标口碑量（全年合计）")
    实际口碑量: int = Field(0, ge=0, description="实际口碑量（全年合计）")
    目标上门量: int = Field(0, ge=0, description="目标上门量（全年合计）")
    实际上门量: int = Field(0, ge=0, description="实际上门量（全年合计）")
    目标招生人数: int = Field(0, ge=0, description="目标招生人数（全年合计）")
    实际招生人数: int = Field(0, ge=0, description="实际招生人数（全年合计）")
    目标口碑收入: float = Field(0, ge=0, description="目标口碑收入（全年合计）")
    实际口碑收入: float = Field(0, ge=0, description="实际口碑收入（全年合计）")


class 所有神殿年度汇总响应(BaseModel):
    """所有神殿年度汇总响应"""
    年份: int = Field(..., description="年份")
    数据列表: List[神殿年度汇总项] = Field(..., description="各神殿汇总数据列表")


class 神殿历史汇总响应(BaseModel):
    """神殿历史汇总响应（所有年份合计）"""
    神殿名称: str = Field(..., description="神殿名称")
    目标口碑量: int = Field(0, ge=0, description="目标口碑量（历史合计）")
    实际口碑量: int = Field(0, ge=0, description="实际口碑量（历史合计）")
    目标上门量: int = Field(0, ge=0, description="目标上门量（历史合计）")
    实际上门量: int = Field(0, ge=0, description="实际上门量（历史合计）")
    目标招生人数: int = Field(0, ge=0, description="目标招生人数（历史合计）")
    实际招生人数: int = Field(0, ge=0, description="实际招生人数（历史合计）")
    目标口碑收入: float = Field(0, ge=0, description="目标口碑收入（历史合计）")
    实际口碑收入: float = Field(0, ge=0, description="实际口碑收入（历史合计）")


class 可用年份响应(BaseModel):
    """可用年份响应"""
    年份列表: List[int] = Field(..., description="可用年份列表")

