"""
智慧司日工作总结表 Pydantic 模型
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class 日总结行(BaseModel):
    序号: int = Field(..., ge=1, description="任务序号")
    日期: Optional[date] = Field(None, description="任务日期（可按行指定）")
    执行人: Optional[str] = Field(None, max_length=50, description="执行人")
    班级: Optional[str] = Field(None, max_length=50, description="班级")
    任务名称: Optional[str] = Field(None, max_length=200)
    任务描述: Optional[str] = Field(None, max_length=500)
    任务目标: Optional[str] = Field(None, max_length=500)
    执行时间: Optional[str] = Field(None, max_length=100)
    最后完成期限: Optional[str] = Field(None, max_length=100)
    权重: Optional[str] = Field(None, max_length=50)
    结果: Optional[str] = Field(None, max_length=200)

    model_config = ConfigDict(from_attributes=True)

    @field_validator("序号")
    def validate_seq(cls, v: int) -> int:
        if v < 1:
            raise ValueError("序号必须 >=1")
        return v


class 日总结行响应(日总结行):
    记录ID: int
    神殿名称: str
    日期: date
    星期: Optional[str] = None
    执行人: Optional[str] = None
    班级: Optional[str] = None
    备注: Optional[str] = None
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class 日总结创建(BaseModel):
    神殿名称: str = Field(..., max_length=50)
    日期: Optional[date] = None
    星期: Optional[str] = Field(None, max_length=20)
    执行人: Optional[str] = Field(None, max_length=50)
    班级: Optional[str] = Field(None, max_length=50)
    备注: Optional[str] = Field(None, max_length=2000)
    行数据: List[日总结行]


class 日总结更新(BaseModel):
    星期: Optional[str] = Field(None, max_length=20)
    执行人: Optional[str] = Field(None, max_length=50)
    班级: Optional[str] = Field(None, max_length=50)
    备注: Optional[str] = Field(None, max_length=2000)
    行数据: List[日总结行]


class 日总结列表响应(BaseModel):
    神殿名称: str
    日期: date
    星期: Optional[str] = None
    执行人: Optional[str] = None
    班级: Optional[str] = None
    备注: Optional[str] = None
    行数据: List[日总结行响应]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None


class 日总结全部响应(BaseModel):
    神殿名称: str
    行数据: List[日总结行响应]
