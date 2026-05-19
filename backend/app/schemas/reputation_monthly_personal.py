"""
口碑招生月度个人目标与结果汇总表 Schemas
"""

from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class 月度个人行数据(BaseModel):
    """月度个人行数据"""
    月份: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    姓名: str = Field(..., description="姓名")
    目标口碑量: int = Field(0, ge=0, description="目标口碑量")
    实际口碑量: int = Field(0, ge=0, description="实际口碑量")
    目标上门量: int = Field(0, ge=0, description="目标上门量")
    实际上门量: int = Field(0, ge=0, description="实际上门量")
    目标招生人数: int = Field(0, ge=0, description="目标招生人数")
    实际招生人数: int = Field(0, ge=0, description="实际招生人数")
    目标口碑收入: Decimal = Field(default=Decimal("0"), ge=0, description="目标口碑收入")
    实际口碑收入: Decimal = Field(default=Decimal("0"), ge=0, description="实际口碑收入")


class 月度个人列表响应(BaseModel):
    """月度个人列表响应"""
    神殿名称: str
    年份: int
    月份: Optional[int] = None  # None 表示获取全年数据
    行列表: List[月度个人行数据] = Field(default_factory=list)


class 月度个人保存请求(BaseModel):
    """月度个人保存请求"""
    神殿名称: str
    年份: int
    月份: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    行列表: List[月度个人行数据] = Field(default_factory=list)

