"""
教员功能分析子表（12个月）数据验证模式
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 子表行创建(BaseModel):
    序号: int = Field(..., ge=1, description="序号")
    姓名: Optional[str] = Field(None, max_length=100, description="姓名或班级")
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


class 子表行响应(子表行创建):
    记录ID: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class 子表创建(BaseModel):
    表类型: str = Field(..., max_length=100, description="表类型，如 homework_submission")
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    行数据: List[子表行创建]

    @field_validator("年份")
    def validate_year(cls, v: int) -> int:
        if not (2000 <= v <= 2100):
            raise ValueError("年份范围不正确")
        return v


class 子表更新(BaseModel):
    行数据: List[子表行创建]


class 子表响应(BaseModel):
    表类型: str
    神殿名称: str
    年份: int
    行数据: List[子表行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None
