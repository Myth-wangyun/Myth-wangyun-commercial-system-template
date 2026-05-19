"""
教员功能分析总表数据验证模式
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 教员功能行创建(BaseModel):
    序号: int = Field(..., ge=1, description="序号")
    姓名: Optional[str] = Field(None, max_length=100, description="教师姓名")
    就业率: Optional[float] = Field(None, description="就业率")
    就业薪资: Optional[float] = Field(None, description="就业薪资")
    口碑人数: Optional[float] = Field(None, description="口碑人数")
    口碑收入: Optional[float] = Field(None, description="口碑收入")
    带新生人数: Optional[float] = Field(None, description="带新生人数")
    新生流失人数: Optional[float] = Field(None, description="新生流失人数")
    作业提交率: Optional[float] = Field(None, description="作业提交率")
    作业合格率: Optional[float] = Field(None, description="作业合格率")
    考试合格率: Optional[float] = Field(None, description="考试合格率")
    项目提交率: Optional[float] = Field(None, description="项目提交率")
    项目合格率: Optional[float] = Field(None, description="项目合格率")
    学员满意度: Optional[float] = Field(None, description="学员满意度")
    学员违纪: Optional[float] = Field(None, description="学员违纪")
    上级听课: Optional[float] = Field(None, description="上级听课")
    教员平均: Optional[float] = Field(None, description="教员平均")


class 教员功能行响应(教员功能行创建):
    记录ID: int = Field(..., description="记录ID")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class 教员功能分析创建(BaseModel):
    神殿名称: str = Field(..., max_length=50, description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="年份")
    月份: int = Field(..., ge=1, le=12, description="月份")
    行数据: List[教员功能行创建] = Field(..., description="行数据")

    @field_validator("月份")
    def check_month(cls, v: int) -> int:
        if not 1 <= v <= 12:
            raise ValueError("月份需在1-12之间")
        return v


class 教员功能分析更新(BaseModel):
    行数据: List[教员功能行创建] = Field(..., description="行数据")


class 教员功能分析列表响应(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行数据: List[教员功能行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

