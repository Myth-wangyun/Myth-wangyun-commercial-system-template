"""
渠道代理数据Schema
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChannelAgentDataItem(BaseModel):
    """渠道代理数据项"""

    月份: int = Field(..., description="月份")
    渠道代理: str = Field(..., description="渠道代理姓名")
    区域数: str = Field(default="0", description="区域数")
    咨询量: Optional[int] = Field(None, description="咨询量")
    上门量: Optional[int] = Field(None, description="上门量")
    订座: Optional[int] = Field(None, description="订座")
    实际招生: Optional[int] = Field(None, description="实际招生")
    退费人数: Optional[int] = Field(None, description="退费人数")
    渠道总职数: Optional[int] = Field(None, description="渠道总职数")
    县办: Optional[int] = Field(None, description="县办")
    乡办: Optional[int] = Field(None, description="乡办")
    信息员: Optional[int] = Field(None, description="信息员")


class ChannelAgentDataSave(BaseModel):
    """保存渠道代理数据请求"""

    year: int = Field(..., description="年度")
    data: List[ChannelAgentDataItem] = Field(..., description="数据列表")


class ChannelAgentDataResponse(BaseModel):
    """渠道代理数据响应"""

    月份: int
    渠道代理: str
    区域数: str
    咨询量: Optional[int]
    上门量: Optional[int]
    订座: Optional[int]
    实际招生: Optional[int]
    退费人数: Optional[int]
    渠道总职数: Optional[int]
    县办: Optional[int]
    乡办: Optional[int]
    信息员: Optional[int]

    model_config = ConfigDict(
        from_attributes=True,
    )
