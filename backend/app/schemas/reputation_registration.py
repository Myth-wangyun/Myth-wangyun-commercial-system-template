"""
口碑报名明细表 Schemas
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class 报名明细行数据(BaseModel):
    """报名明细行数据"""
    月份: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    教员姓名: str = Field(..., description="教员姓名")
    报名者姓名: str = Field(..., description="报名者姓名")
    报名时间: date = Field(..., description="报名时间")
    报名专业: Optional[str] = Field(None, description="报名专业")
    报名学制: Optional[str] = Field(None, description="报名学制")
    应收学费: Decimal = Field(default=Decimal("0"), ge=0, description="应收学费")
    实交学费: Decimal = Field(default=Decimal("0"), ge=0, description="实交学费")
    是否过课时: str = Field(default="否", description="是否过课时")
    是否稳定: str = Field(default="稳定", description="是否稳定")
    咨询师: Optional[str] = Field(None, description="咨询师")
    介绍人姓名: Optional[str] = Field(None, description="介绍人姓名")
    口碑介绍关系: Optional[str] = Field(None, description="口碑介绍关系")
    口碑来源: Optional[str] = Field(None, description="口碑来源")


class 报名明细列表响应(BaseModel):
    """报名明细列表响应"""
    神殿名称: str
    年份: int
    月份: Optional[int] = None  # None 表示获取全年数据
    行列表: List[报名明细行数据] = Field(default_factory=list)
    总数: int = Field(default=0, description="总记录数")


class 报名明细保存请求(BaseModel):
    """报名明细保存请求"""
    神殿名称: str
    年份: int
    月份: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    行列表: List[报名明细行数据] = Field(default_factory=list)

