"""
祈福司培训月度表数据模式
"""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 祈福司培训月度表模式 ====================

class 祈福司培训月度表创建(BaseModel):
    """创建祈福司培训月度表记录"""
    年份: int = Field(..., description="统计年份")
    岗位: str = Field(..., max_length=50, description="岗位名称（快手、竞价运营、策略策、线上流量）")
    月度数据: Dict[str, Any] = Field(default_factory=dict, description="12个月的培训数据JSON")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")


class 祈福司培训月度表更新(BaseModel):
    """更新祈福司培训月度表记录"""
    记录ID: int = Field(..., description="记录ID")
    年份: Optional[int] = Field(None, description="统计年份")
    岗位: Optional[str] = Field(None, max_length=50, description="岗位名称")
    月度数据: Optional[Dict[str, Any]] = Field(None, description="12个月的培训数据JSON")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")


class 祈福司培训月度表响应(BaseModel):
    """祈福司培训月度表响应"""
    记录ID: int = Field(..., description="记录ID")
    年份: int = Field(..., description="统计年份")
    岗位: str = Field(..., description="岗位名称")
    月度数据: Dict[str, Any] = Field(..., description="12个月的培训数据JSON")
    神殿: Optional[str] = Field(None, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class 祈福司培训月度表列表响应(BaseModel):
    """祈福司培训月度表列表响应"""
    total: int = Field(..., description="总记录数")
    items: list[祈福司培训月度表响应] = Field(..., description="记录列表")
