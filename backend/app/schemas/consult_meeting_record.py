"""
祈福司会议记录表 Schema
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class 会议记录行(BaseModel):
    """会议记录行"""

    序号: int = Field(..., description="序号")
    时间: str = Field(default="", description="时间")
    地点: str = Field(default="", description="地点")
    主持人: str = Field(default="", description="主持人")
    重要领导: str = Field(default="", description="重要领导")
    参与人: str = Field(default="", description="参与人")
    议题: str = Field(default="", description="议题")
    问题解决: str = Field(default="", description="问题解决")
    问题待解决: str = Field(default="", description="问题待解决")


class 会议记录创建(BaseModel):
    """创建会议记录"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    表格数据: List[会议记录行] = Field(..., description="表格数据")


class 会议记录更新(BaseModel):
    """更新会议记录"""

    表格数据: List[会议记录行] = Field(..., description="表格数据")


class 会议记录响应(BaseModel):
    """会议记录响应"""

    年份: int = Field(..., description="年份")
    表格数据: List[会议记录行] = Field(..., description="表格数据")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        from_attributes=True,
    )
