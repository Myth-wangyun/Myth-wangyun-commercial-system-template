"""
祈福司入职离职明细表 Schema
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class 入职离职明细行(BaseModel):
    """入职离职明细行"""

    记录ID: Optional[int] = Field(None, description="记录ID，新增时为None")
    板块: Optional[str] = Field("", description="板块")
    岗位: Optional[str] = Field("", description="岗位")
    类别: Optional[str] = Field("", description="类别")
    姓名: Optional[str] = Field("", description="姓名")
    入职时间: Optional[str] = Field("", description="入职时间 YYYY-MM-DD")
    离职时间: Optional[str] = Field("", description="离职时间 YYYY-MM-DD")
    备注: Optional[str] = Field("", description="备注")


class 入职离职明细创建(BaseModel):
    """创建入职离职明细"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    明细列表: List[入职离职明细行] = Field(..., description="明细列表")


class 入职离职明细响应(BaseModel):
    """入职离职明细响应"""

    记录ID: int = Field(..., description="记录ID")
    年份: int = Field(..., description="年份")
    板块: Optional[str] = Field(None, description="板块")
    岗位: Optional[str] = Field(None, description="岗位")
    类别: Optional[str] = Field(None, description="类别")
    姓名: Optional[str] = Field(None, description="姓名")
    入职时间: Optional[str] = Field(None, description="入职时间")
    离职时间: Optional[str] = Field(None, description="离职时间")
    备注: Optional[str] = Field(None, description="备注")
    创建时间: Optional[str] = Field(None, description="创建时间")
    更新时间: Optional[str] = Field(None, description="更新时间")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 入职离职明细列表响应(BaseModel):
    """入职离职明细列表响应"""

    年份: int = Field(..., description="年份")
    data: List[入职离职明细响应] = Field(..., description="明细列表")
