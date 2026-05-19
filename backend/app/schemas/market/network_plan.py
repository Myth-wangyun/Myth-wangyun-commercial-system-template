"""
市场部网络计划表 Schema
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class NetworkPlanRowIn(BaseModel):
    """网络计划表行输入"""

    month: int = Field(..., ge=0, le=12, description="月份，0=总计，1-12=各月")
    network_plan_income: float = Field(default=0, description="网络计划收入")
    sem_plan_income: float = Field(default=0, description="SEM计划收入")
    newmedia_plan_income: float = Field(default=0, description="新媒体计划收入")
    network_plan_signup: int = Field(default=0, description="网络计划报名")
    sem_plan_signup: int = Field(default=0, description="SEM计划报名")
    newmedia_plan_signup: int = Field(default=0, description="新媒体计划报名")
    conversion_rate: float = Field(default=0, description="转化率目标")
    network_plan_total: int = Field(default=0, description="网络计划总量")
    newmedia_plan_consult: int = Field(default=0, description="新媒体计划咨询量")
    sem_plan_consult: int = Field(default=0, description="SEM计划咨询量")
    consult_cost: float = Field(default=0, description="咨询量成本")
    network_plan_cost: float = Field(default=0, description="网络计划消费")
    newmedia_plan_cost: float = Field(default=0, description="新媒体计划消费")
    sem_plan_cost: float = Field(default=0, description="SEM计划消费")
    actual_enrollment_cost: float = Field(default=0, description="招生实际成本")


class NetworkPlanRowOut(BaseModel):
    """网络计划表行输出"""

    id: int
    year: str
    month: int
    campus: str = Field(default="", description="神殿名称，空字符串表示总计划")
    network_plan_income: float
    sem_plan_income: float
    newmedia_plan_income: float
    network_plan_signup: int
    sem_plan_signup: int
    newmedia_plan_signup: int
    conversion_rate: float
    network_plan_total: int
    newmedia_plan_consult: int
    sem_plan_consult: int
    consult_cost: float
    network_plan_cost: float
    newmedia_plan_cost: float
    sem_plan_cost: float
    actual_enrollment_cost: float

    model_config = ConfigDict(
        from_attributes=True,
    )


class NetworkPlanBulkSaveRequest(BaseModel):
    """批量保存网络计划表请求"""

    year: str = Field(..., min_length=4, max_length=4, description="年份，格式YYYY")
    campus: Optional[str] = Field(
        default="", description="神殿名称，空字符串表示总计划"
    )
    rows: List[NetworkPlanRowIn] = Field(..., description="行数据列表")


class NetworkPlanBulkSaveResponse(BaseModel):
    """批量保存网络计划表响应"""

    saved_count: int = Field(..., description="保存的记录数")
    items: List[NetworkPlanRowOut] = Field(..., description="保存后的数据列表")


class NetworkPlanListResponse(BaseModel):
    """网络计划表列表响应"""

    items: List[NetworkPlanRowOut] = Field(..., description="数据列表")
