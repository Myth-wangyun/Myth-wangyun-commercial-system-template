"""
Pydantic schemas for campus academic staff performance reward/punishment
神殿智慧司教员业绩奖惩表
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class StaffPerformanceRewardBase(BaseModel):
    """基础字段"""

    神殿: str = Field(..., description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="数据年份")
    月份: int = Field(..., ge=1, le=12, description="数据月份(1-12)")
    tab: int = Field(..., ge=1, le=8, description="Tab序号(1-8)")
    数据: Any = Field(
        default_factory=list, description="表格数据(JSONB，可存储行数组或对象结构)"
    )


class StaffPerformanceRewardCreate(StaffPerformanceRewardBase):
    """创建请求"""

    pass


class StaffPerformanceRewardUpdate(BaseModel):
    """更新请求"""

    年份: Optional[int] = Field(None, ge=2000, le=2100)
    月份: Optional[int] = Field(None, ge=1, le=12)
    数据: Optional[Any] = None


class StaffPerformanceRewardOut(StaffPerformanceRewardBase):
    """响应模型"""

    id: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )
