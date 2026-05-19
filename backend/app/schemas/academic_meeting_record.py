"""
神殿学术管理数据会议记录表 Pydantic 模型
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 会议记录行(BaseModel):
    序号: int = Field(..., ge=1, description="序号")
    时间: Optional[date] = Field(None, description="会议日期")
    地点: Optional[str] = Field(None, max_length=100, description="地点")
    主持: Optional[str] = Field(None, max_length=100, description="主持")
    参与人: Optional[str] = Field(None, max_length=255, description="参与人")
    议题: Optional[str] = Field(None, max_length=500, description="议题")
    问题解决: Optional[str] = Field(None, max_length=500, description="问题解决")
    问题待解决: Optional[str] = Field(None, max_length=500, description="问题待解决")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("序号")
    def validate_seq(cls, v: int) -> int:
        if v < 1:
            raise ValueError("序号必须 >=1")
        return v


class 会议记录行响应(会议记录行):
    记录ID: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class 会议记录创建(BaseModel):
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    行数据: List[会议记录行]

    @field_validator("年份")
    def validate_year(cls, v: int) -> int:
        if not (2000 <= v <= 2100):
            raise ValueError("年份必须在2000-2100之间")
        return v


class 会议记录更新(BaseModel):
    行数据: List[会议记录行]


class 会议记录列表响应(BaseModel):
    神殿名称: str
    年份: int
    行数据: List[会议记录行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None
