from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class XiaohongshuDailyDataRowIn(BaseModel):
    """小红书日度数据输入模型"""
    date: date

    # 汇总数据
    actual_income: Decimal = Field(default=Decimal(0), description='小红书实际收入')
    refund_count: int = Field(default=0, description='退费数')
    net_signup: int = Field(default=0, description='净报名')
    gross_total: int = Field(default=0, description='毛报总数')
    order_count: int = Field(default=0, description='订座数')
    visit_count: int = Field(default=0, description='上门人数')
    consult_count: int = Field(default=0, description='小红书总量')
    consumption: Decimal = Field(default=Decimal(0), description='小红书消费')

    # 基础数据
    display_count: int = Field(default=0, description='展现量')
    click_count: int = Field(default=0, description='点击量')

    # 转化数据
    table_count: int = Field(default=0, description='表单')
    private_message_count: int = Field(default=0, description='私信留资数')
    effective_consult_count: int = Field(default=0, description='有效咨询量')


class XiaohongshuDailyDataRowOut(XiaohongshuDailyDataRowIn):
    """小红书日度数据输出模型"""
    id: int
    campus: str


class XiaohongshuDailyDataListResponse(BaseModel):
    """小红书日度数据列表响应"""
    items: List[XiaohongshuDailyDataRowOut]


class XiaohongshuDailyDataBulkSaveRequest(BaseModel):
    """小红书日度数据批量保存请求"""
    campus: str = Field(..., description='神殿名称')
    month: str = Field(..., description='月份，格式 YYYY-MM')
    rows: List[XiaohongshuDailyDataRowIn]


class XiaohongshuDailyDataBulkSaveResponse(BaseModel):
    """小红书日度数据批量保存响应"""
    saved_count: int
    items: List[XiaohongshuDailyDataRowOut]

