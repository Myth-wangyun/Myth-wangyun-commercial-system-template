from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class KuaishouDailyDataRowIn(BaseModel):
    """快手日度数据输入模型"""
    date: date

    # 汇总数据
    actual_income: Decimal = Field(default=Decimal(0), description='快手实际收入')
    refund_count: int = Field(default=0, description='退费数')
    net_signup: int = Field(default=0, description='净报名')
    gross_total: int = Field(default=0, description='毛报总数')
    order_count: int = Field(default=0, description='订座数')
    visit_count: int = Field(default=0, description='上门人数')
    consult_count: int = Field(default=0, description='快手咨询量')
    consumption: Decimal = Field(default=Decimal(0), description='快手花费')

    # 基础数据
    seal_cover_count: int = Field(default=0, description='封面曝光数')
    seal_click_count: int = Field(default=0, description='封面点击数')
    material_display_count: int = Field(default=0, description='素材曝光数')
    action_count: int = Field(default=0, description='行为数')
    material_action_rate: Decimal = Field(default=Decimal(0), description='素材点击率')

    # 转化数据
    conversion_count: int = Field(default=0, description='转化数')
    table_count: int = Field(default=0, description='表单')
    effective_consult_count: int = Field(default=0, description='有效咨询量')


class KuaishouDailyDataRowOut(KuaishouDailyDataRowIn):
    """快手日度数据输出模型"""
    id: int
    campus: str


class KuaishouDailyDataListResponse(BaseModel):
    """快手日度数据列表响应"""
    items: List[KuaishouDailyDataRowOut]


class KuaishouDailyDataBulkSaveRequest(BaseModel):
    """快手日度数据批量保存请求"""
    campus: str = Field(..., description='神殿名称')
    month: str = Field(..., description='月份，格式 YYYY-MM')
    rows: List[KuaishouDailyDataRowIn]


class KuaishouDailyDataBulkSaveResponse(BaseModel):
    """快手日度数据批量保存响应"""
    saved_count: int
    items: List[KuaishouDailyDataRowOut]

