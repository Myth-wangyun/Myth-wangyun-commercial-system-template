from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class DouyinDailyDataRowIn(BaseModel):
    """抖音日度数据输入模型"""
    date: date

    # 汇总数据
    actual_income: Decimal = Field(default=Decimal(0), description='抖音实际收入')
    refund_count: int = Field(default=0, description='退费数')
    net_signup: int = Field(default=0, description='净报名')
    gross_total: int = Field(default=0, description='毛报总数')
    order_count: int = Field(default=0, description='订座数')
    visit_count: int = Field(default=0, description='上门人数')
    consult_count: int = Field(default=0, description='抖音咨询量')
    consumption: Decimal = Field(default=Decimal(0), description='抖音花费')

    # 基础数据
    display_count: int = Field(default=0, description='展示次数')
    click_count: int = Field(default=0, description='点击次数')
    avg_display_price: Decimal = Field(default=Decimal(0), description='平均千次展示费用')
    conversion_count: int = Field(default=0, description='转化数')

    # 转化数据
    form_submit_count: int = Field(default=0, description='表单提交数')
    private_message_count: int = Field(default=0, description='私信咨询数')
    phone_call_count: int = Field(default=0, description='电话拨打数')
    online_consult_count: int = Field(default=0, description='在线咨询数')
    coupon_receive_count: int = Field(default=0, description='卡券领取数')
    smart_phone_count: int = Field(default=0, description='智能电话数')
    effective_consult_count: int = Field(default=0, description='有效咨询量')


class DouyinDailyDataRowOut(DouyinDailyDataRowIn):
    """抖音日度数据输出模型"""
    id: int
    campus: str


class DouyinDailyDataListResponse(BaseModel):
    """抖音日度数据列表响应"""
    items: List[DouyinDailyDataRowOut]


class DouyinDailyDataBulkSaveRequest(BaseModel):
    """抖音日度数据批量保存请求"""
    campus: str = Field(..., description='神殿名称')
    month: str = Field(..., description='月份，格式 YYYY-MM')
    rows: List[DouyinDailyDataRowIn]


class DouyinDailyDataBulkSaveResponse(BaseModel):
    """抖音日度数据批量保存响应"""
    saved_count: int
    items: List[DouyinDailyDataRowOut]

