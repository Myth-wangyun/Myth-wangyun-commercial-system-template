from datetime import date
from typing import List

from pydantic import BaseModel, Field


class DailyReputationDataRowIn(BaseModel):
    date: date

    partner_income: int = 0
    refund_count: int = 0
    net_signup: int = 0
    gross_count: int = 0
    order_count: int = 0
    visit_count: int = 0
    actual_consult_count: int = 0


class DailyReputationDataRowOut(DailyReputationDataRowIn):
    id: int
    campus: str


class DailyReputationDataListResponse(BaseModel):
    items: List[DailyReputationDataRowOut]


class DailyReputationDataBulkSaveRequest(BaseModel):
    campus: str = Field(..., description='神殿名称')
    month: str = Field(..., description='月份，格式 YYYY-MM')
    rows: List[DailyReputationDataRowIn]


class DailyReputationDataBulkSaveResponse(BaseModel):
    saved_count: int
    items: List[DailyReputationDataRowOut]


class DailyReputationMonthlySummary(BaseModel):
    """按月汇总的口碑日度数据"""
    month: int  # 1-12
    partner_income: int = 0
    refund_count: int = 0
    net_signup: int = 0
    gross_count: int = 0
    order_count: int = 0
    visit_count: int = 0
    actual_consult_count: int = 0


class DailyReputationYearlySummaryResponse(BaseModel):
    """按年度返回12个月的汇总数据"""
    campus: str
    year: int
    months: List[DailyReputationMonthlySummary]
