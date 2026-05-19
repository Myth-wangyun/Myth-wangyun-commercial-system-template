"""
教员功能分析 - 考试合格率（班级/教员） Pydantic 模型
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 考试率行(BaseModel):
    序号: int = Field(..., ge=1, description="序号")
    名称: Optional[str] = Field(None, max_length=100, description="班级名称或教员姓名")
    m1: Optional[float] = Field(None, description="1月")
    m2: Optional[float] = Field(None, description="2月")
    m3: Optional[float] = Field(None, description="3月")
    m4: Optional[float] = Field(None, description="4月")
    m5: Optional[float] = Field(None, description="5月")
    m6: Optional[float] = Field(None, description="6月")
    m7: Optional[float] = Field(None, description="7月")
    m8: Optional[float] = Field(None, description="8月")
    m9: Optional[float] = Field(None, description="9月")
    m10: Optional[float] = Field(None, description="10月")
    m11: Optional[float] = Field(None, description="11月")
    m12: Optional[float] = Field(None, description="12月")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("序号")
    def validate_seq(cls, v: int) -> int:
        if v < 1:
            raise ValueError("序号必须 >=1")
        return v


class 考试率行响应(考试率行):
    记录ID: int
    名称: Optional[str] = Field(None, validation_alias="班级名称", description="班级名称或教员姓名")
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class 考试率创建(BaseModel):
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    行数据: List[考试率行]

    @field_validator("年份")
    def validate_year(cls, v: int) -> int:
        if not (2000 <= v <= 2100):
            raise ValueError("年份必须在2000-2100之间")
        return v


class 考试率更新(BaseModel):
    行数据: List[考试率行]


class 考试率列表响应(BaseModel):
    神殿名称: str
    年份: int
    行数据: List[考试率行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None
