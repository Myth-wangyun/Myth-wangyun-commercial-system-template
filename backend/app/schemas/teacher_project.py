"""
教员功能分析 - 项目提交率/项目合格率 通用 Pydantic 模型
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 项目率行(BaseModel):
    序号: int = Field(..., ge=1, description="教员序号")
    姓名: Optional[str] = Field(None, max_length=100, description="教员姓名")
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


class 项目率行响应(项目率行):
    记录ID: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class 项目率创建(BaseModel):
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    行数据: List[项目率行]

    @field_validator("年份")
    def validate_year(cls, v: int) -> int:
        if not (2000 <= v <= 2100):
            raise ValueError("年份必须在2000-2100之间")
        return v


class 项目率更新(BaseModel):
    行数据: List[项目率行]


class 项目率列表响应(BaseModel):
    神殿名称: str
    年份: int
    行数据: List[项目率行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None
