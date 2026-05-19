from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class WechatVideoDailyDataRowIn(BaseModel):
    """微信视频号日度数据输入模型"""
    date: date

    # 汇总数据
    actual_income: Decimal = Field(default=Decimal(0), description='微信视频号实际收入')
    refund_count: int = Field(default=0, description='退费数')
    net_signup: int = Field(default=0, description='净报名')
    gross_total: int = Field(default=0, description='毛报总数')
    order_count: int = Field(default=0, description='订座数')
    visit_count: int = Field(default=0, description='上门人数')
    consult_count: int = Field(default=0, description='微信视频号总量')
    consumption: Decimal = Field(default=Decimal(0), description='微信视频号消费')

    # 基础数据
    display_count: int = Field(default=0, description='曝光次数')
    thousand_display_price: Decimal = Field(default=Decimal(0), description='千次展现均价')
    click_count: int = Field(default=0, description='点击次数')

    # 转化数据
    target_conversion_count: int = Field(default=0, description='目标转化量')
    table_count: int = Field(default=0, description='表单')
    effective_consult_count: int = Field(default=0, description='有效咨询量')


class WechatVideoDailyDataRowOut(WechatVideoDailyDataRowIn):
    """微信视频号日度数据输出模型"""
    id: int
    campus: str


class WechatVideoDailyDataListResponse(BaseModel):
    """微信视频号日度数据列表响应"""
    items: List[WechatVideoDailyDataRowOut]


class WechatVideoDailyDataBulkSaveRequest(BaseModel):
    """微信视频号日度数据批量保存请求"""
    campus: str = Field(..., description='神殿名称')
    month: str = Field(..., description='月份，格式 YYYY-MM')
    rows: List[WechatVideoDailyDataRowIn]


class WechatVideoDailyDataBulkSaveResponse(BaseModel):
    """微信视频号日度数据批量保存响应"""
    saved_count: int
    items: List[WechatVideoDailyDataRowOut]

