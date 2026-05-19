"""
教员功能分析上级听课表数据验证模式
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 上级听课行创建(BaseModel):
    序号: int = Field(..., ge=1, le=12, description="序号（1-12，对应月份）")
    姓名: Optional[str] = Field(None, max_length=100, description="姓名/预留")
    m1: Optional[float] = Field(None, description="教员1")
    m2: Optional[float] = Field(None, description="教员2")
    m3: Optional[float] = Field(None, description="教员3")
    m4: Optional[float] = Field(None, description="教员4")
    m5: Optional[float] = Field(None, description="教员5")
    m6: Optional[float] = Field(None, description="教员6")
    m7: Optional[float] = Field(None, description="教员7")
    m8: Optional[float] = Field(None, description="教员8")
    m9: Optional[float] = Field(None, description="教员9")
    m10: Optional[float] = Field(None, description="教员10")
    m11: Optional[float] = Field(None, description="教员11")
    m12: Optional[float] = Field(None, description="教员12")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("序号")
    def validate_month(cls, v: int) -> int:
        if not (1 <= v <= 12):
            raise ValueError("序号需在1-12之间（对应月份）")
        return v


class 上级听课行响应(上级听课行创建):
    记录ID: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class 上级听课创建(BaseModel):
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    行数据: List[上级听课行创建]


class 上级听课更新(BaseModel):
    行数据: List[上级听课行创建]


class 上级听课列表响应(BaseModel):
    神殿名称: str
    年份: int
    行数据: List[上级听课行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None
