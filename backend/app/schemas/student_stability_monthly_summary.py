"""
神殿后端新生维稳月度汇总表 Schemas
"""

from typing import List

from pydantic import BaseModel, Field


class 月度汇总行数据(BaseModel):
    """月度汇总行数据"""
    月份: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    交接人数: int = Field(default=0, ge=0, description="交接人数")
    入学人数: int = Field(default=0, ge=0, description="入学人数")
    退费人数: int = Field(default=0, ge=0, description="退费人数")


class 月度汇总列表响应(BaseModel):
    """月度汇总列表响应"""
    神殿名称: str
    年份: int
    行列表: List[月度汇总行数据] = Field(default_factory=list)
    总数: int = Field(default=0, description="总记录数")


class 月度汇总保存请求(BaseModel):
    """月度汇总保存请求"""
    神殿名称: str
    年份: int
    行列表: List[月度汇总行数据] = Field(default_factory=list)
