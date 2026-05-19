"""市场部月度SEM推广分解表 - Schemas

市场部月度SEM推广分解表的请求/响应模型
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


def to_camel(string: str) -> str:
    """将 snake_case 转换为 camelCase"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class SEMBreakdownBase(BaseModel):
    """SEM推广分解基础信息"""
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel
    )
    
    key: str = Field(..., description='前端key')
    campus: str = Field(..., description='神殿名称')
    isTotal: bool = Field(default=False, description='是否为合计行')

    # 百度推广
    baiduPlanConsult: Optional[int] = Field(None, description='百度计划咨询量')
    baiduDeadlineConsult: Optional[int] = Field(None, description='百度截止30日应完成')
    baiduActualConsult: Optional[int] = Field(None, description='百度实际咨询量')
    baiduPlanCost: Optional[int] = Field(None, description='百度计划消费')
    baiduActualCost: Optional[int] = Field(None, description='百度实际消费')
    baiduConsultCost: Optional[int] = Field(None, description='百度咨询成本')

    # 360推广
    so360PlanConsult: Optional[int] = Field(None, description='360计划咨询量')
    so360DeadlineConsult: Optional[int] = Field(None, description='360截止30日应完成')
    so360ActualConsult: Optional[int] = Field(None, description='360实际咨询量')
    so360PlanCost: Optional[int] = Field(None, description='360计划消费')
    so360ActualCost: Optional[int] = Field(None, description='360实际消费')
    so360ConsultCost: Optional[int] = Field(None, description='360咨询成本')

    # 搜狗推广
    sogouPlanConsult: Optional[int] = Field(None, description='搜狗计划咨询量')
    sogouDeadlineConsult: Optional[int] = Field(None, description='搜狗截止30日应完成')
    sogouActualConsult: Optional[int] = Field(None, description='搜狗实际咨询量')
    sogouPlanCost: Optional[int] = Field(None, description='搜狗计划消费')
    sogouActualCost: Optional[int] = Field(None, description='搜狗实际消费')
    sogouConsultCost: Optional[int] = Field(None, description='搜狗咨询成本')

    # 神马推广
    shenmaPlanConsult: Optional[int] = Field(None, description='神马计划咨询量')
    shenmaDeadlineConsult: Optional[int] = Field(None, description='神马截止30日应完成')
    shenmaActualConsult: Optional[int] = Field(None, description='神马实际咨询量')
    shenmaPlanCost: Optional[int] = Field(None, description='神马计划消费')
    shenmaActualCost: Optional[int] = Field(None, description='神马实际消费')
    shenmaConsultCost: Optional[int] = Field(None, description='神马咨询成本')

    # 合计
    totalPlanConsult: Optional[int] = Field(None, description='合计计划咨询量')
    totalDeadlineConsult: Optional[int] = Field(None, description='合计截止30日应完成')
    totalActualConsult: Optional[int] = Field(None, description='合计实际咨询量')
    totalPlanCost: Optional[int] = Field(None, description='合计计划消费')
    totalActualCost: Optional[int] = Field(None, description='合计实际消费')
    totalConsultCost: Optional[int] = Field(None, description='合计咨询成本')


class SEMBreakdownListResponse(BaseModel):
    """列表响应"""
    model_config = ConfigDict(
        populate_by_name=True,
    )
    
    code: int = Field(200, description='状态码')
    message: str = Field('success', description='消息')
    data: List[SEMBreakdownBase] = Field(..., description='数据列表')


class SEMBreakdownSaveRequest(BaseModel):
    """保存请求"""
    year: int = Field(..., description='年份')
    month: int = Field(..., description='月份')
    data: List[SEMBreakdownBase] = Field(..., description='数据列表')
