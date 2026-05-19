"""
祈福司培训周度表数据模式
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 祈福司培训周度表模式 ====================

class 祈福司培训周度表创建(BaseModel):
    """创建祈福司培训周度表记录"""
    年份: int = Field(..., description="统计年份")
    岗位: Optional[str] = Field(None, max_length=50, description="岗位名称")
    培训时间: Optional[date] = Field(None, description="培训时间（年-月-日）")
    培训项目: Optional[str] = Field(None, max_length=200, description="培训项目")
    主要内容: Optional[str] = Field(None, max_length=500, description="主要内容")
    培训方式: Optional[str] = Field(None, max_length=50, description="培训方式（演讲、互动、授课）")
    组织负责人: Optional[str] = Field(None, max_length=50, description="组织负责人")
    培训人次: Optional[int] = Field(0, description="培训人次")
    合格人数: Optional[int] = Field(0, description="合格人数")
    考试合格率: Optional[Decimal] = Field(None, description="考试合格率（百分比）")
    平均成绩: Optional[Decimal] = Field(None, description="平均成绩")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")


class 祈福司培训周度表更新(BaseModel):
    """更新祈福司培训周度表记录"""
    记录ID: int = Field(..., description="记录ID")
    年份: Optional[int] = Field(None, description="统计年份")
    岗位: Optional[str] = Field(None, max_length=50, description="岗位名称")
    培训时间: Optional[date] = Field(None, description="培训时间（年-月-日）")
    培训项目: Optional[str] = Field(None, max_length=200, description="培训项目")
    主要内容: Optional[str] = Field(None, max_length=500, description="主要内容")
    培训方式: Optional[str] = Field(None, max_length=50, description="培训方式")
    组织负责人: Optional[str] = Field(None, max_length=50, description="组织负责人")
    培训人次: Optional[int] = Field(None, description="培训人次")
    合格人数: Optional[int] = Field(None, description="合格人数")
    考试合格率: Optional[Decimal] = Field(None, description="考试合格率（百分比）")
    平均成绩: Optional[Decimal] = Field(None, description="平均成绩")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")


class 祈福司培训周度表响应(BaseModel):
    """祈福司培训周度表响应"""
    记录ID: int = Field(..., description="记录ID")
    年份: int = Field(..., description="统计年份")
    岗位: Optional[str] = Field(None, description="岗位名称")
    培训时间: Optional[date] = Field(None, description="培训时间（年-月-日）")
    培训项目: Optional[str] = Field(None, description="培训项目")
    主要内容: Optional[str] = Field(None, description="主要内容")
    培训方式: Optional[str] = Field(None, description="培训方式")
    组织负责人: Optional[str] = Field(None, description="组织负责人")
    培训人次: Optional[int] = Field(None, description="培训人次")
    合格人数: Optional[int] = Field(None, description="合格人数")
    考试合格率: Optional[float] = Field(None, description="考试合格率（百分比）")
    平均成绩: Optional[float] = Field(None, description="平均成绩")
    神殿: Optional[str] = Field(None, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class 祈福司培训周度表列表响应(BaseModel):
    """祈福司培训周度表列表响应"""
    total: int = Field(..., description="总记录数")
    items: list[祈福司培训周度表响应] = Field(..., description="记录列表")
