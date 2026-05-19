"""
Market schemas package
包含市场相关的所有 schema 定义
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# 导入账号舆情相关的 schemas（从同目录下的 account_sentiment.py）
from .account_sentiment import (
    AccountSentimentBulkSaveRequest,
    AccountSentimentBulkSaveResponse,
    AccountSentimentListResponse,
    AccountSentimentRowBase,
    AccountSentimentRowCreate,
    AccountSentimentRowOut,
)
from .meeting_record import (
    MeetingRecordBulkSaveRequest,
    MeetingRecordBulkSaveResponse,
    MeetingRecordListResponse,
    MeetingRecordRowBase,
    MeetingRecordRowCreate,
    MeetingRecordRowOut,
)
from .partner_contacts import (
    PartnerContactBulkSaveRequest,
    PartnerContactBulkSaveResponse,
    PartnerContactListResponse,
    PartnerContactRowIn,
    PartnerContactRowOut,
)

# ============================================================
# 日投放数据相关 schemas
# ============================================================

class 日投放数据创建(BaseModel):
    日期: date = Field(..., description="投放日期", alias="date")
    媒体来源: str = Field(..., max_length=30, description="媒体来源", alias="media")
    消费金额: Decimal = Field(..., ge=0, description="消费金额(元)", alias="spend")
    展现量: int = Field(0, ge=0, description="展现量", alias="impressions")
    点击量: int = Field(0, ge=0, description="点击量", alias="clicks")
    IP: int = Field(0, ge=0, description="IP数量", alias="ip")
    PV: int = Field(0, ge=0, description="PV数量", alias="pv")
    对话量: int = Field(0, ge=0, description="对话量", alias="dialogues")
    有效对话: int = Field(0, ge=0, description="有效对话", alias="validDialogues")
    咨询量: int = Field(0, ge=0, description="咨询量", alias="leads")

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={date: lambda v: v.isoformat(), Decimal: lambda v: float(v)}
    )

    @field_validator('媒体来源')
    def normalize_media(cls, v: str) -> str:
        if not v:
            raise ValueError('媒体来源不能为空')
        mapping = {
            'Baidu': '百度', '360': '360', 'Sogou': '搜狗', 'Tencent': '腾讯', 'Toutiao': '今日头条',
            'Douyin': '抖音', 'Kuaishou': '快手', 'WeChat': '微信', 'Other': '其他'
        }
        v = v.strip()
        return mapping.get(v, v)[:30]

    @field_validator('消费金额', mode='before')
    def parse_decimal(cls, v):
        if isinstance(v, (int, float, Decimal)):
            return Decimal(str(v))
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError('消费金额不能为空')
            return Decimal(v)
        raise ValueError('消费金额格式不正确')


class 日投放数据更新(BaseModel):
    日期: Optional[date] = Field(None, description="投放日期")
    媒体来源: Optional[str] = Field(None, max_length=30, description="媒体来源", alias="media")
    消费金额: Optional[Decimal] = Field(None, ge=0, description="消费金额(元)")
    展现量: Optional[int] = Field(None, ge=0, description="展现量")
    点击量: Optional[int] = Field(None, ge=0, description="点击量")
    IP: Optional[int] = Field(None, ge=0, description="IP数量")
    PV: Optional[int] = Field(None, ge=0, description="PV数量")
    对话量: Optional[int] = Field(None, ge=0, description="对话量")
    有效对话: Optional[int] = Field(None, ge=0, description="有效对话")
    咨询量: Optional[int] = Field(None, ge=0, description="咨询量")

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={date: lambda v: v.isoformat(), Decimal: lambda v: float(v)}
    )


class 日投放数据响应(BaseModel):
    明细ID: int = Field(..., description="明细ID")
    日期: date = Field(..., description="投放日期")
    媒体来源: str = Field(..., description="媒体来源")
    消费金额: Decimal = Field(..., description="消费金额(元)")
    展现量: int = Field(..., description="展现量")
    点击量: int = Field(..., description="点击量")
    IP: int = Field(..., description="IP数量")
    PV: int = Field(..., description="PV数量")
    对话量: int = Field(..., description="对话量")
    有效对话: int = Field(..., description="有效对话")
    咨询量: int = Field(..., description="咨询量")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    @property
    def 点击率(self) -> float:
        return round((self.点击量 / self.展现量) * 100, 2) if self.展现量 else 0.0

    @property
    def 对话转化率(self) -> float:
        return round((self.对话量 / self.点击量) * 100, 2) if self.点击量 else 0.0

    @property
    def 有效对话率(self) -> float:
        return round((self.有效对话 / self.对话量) * 100, 2) if self.对话量 else 0.0

    @property
    def 留电率(self) -> float:
        return round((self.咨询量 / self.有效对话) * 100, 2) if self.有效对话 else 0.0

    @property
    def 平均点击价格(self) -> float:
        return round(float(self.消费金额) / self.点击量, 2) if self.点击量 else 0.0

    @property
    def 平均对话成本(self) -> float:
        return round(float(self.消费金额) / self.对话量, 2) if self.对话量 else 0.0

    @property
    def 平均留电成本(self) -> float:
        return round(float(self.消费金额) / self.咨询量, 2) if self.咨询量 else 0.0

    model_config = ConfigDict(
        json_encoders={
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        },
        from_attributes=True
    )


class 咨询量明细创建(BaseModel):
    咨询日期: date = Field(..., description="咨询日期")
    学员姓名: str = Field(..., max_length=50, description="学员姓名")
    联系电话: str = Field(..., max_length=20, description="联系电话")
    咨询方式: str = Field(..., description="咨询方式")
    意向等级: str = Field(..., description="意向等级")
    咨询状态: str = Field(..., description="咨询状态")

    model_config = ConfigDict(json_encoders={date: lambda v: v.isoformat()})


class 咨询量明细响应(BaseModel):
    咨询ID: int = Field(..., description="咨询ID")
    咨询日期: date = Field(..., description="咨询日期")
    学员姓名: str = Field(..., description="学员姓名")
    联系电话: str = Field(..., description="联系电话")
    咨询方式: str = Field(..., description="咨询方式")
    意向等级: str = Field(..., description="意向等级")
    咨询状态: str = Field(..., description="咨询状态")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat()
        },
        from_attributes=True
    )


__all__ = [
    # account_sentiment schemas
    "AccountSentimentRowBase",
    "AccountSentimentRowCreate",
    "AccountSentimentRowOut",
    "AccountSentimentListResponse",
    "AccountSentimentBulkSaveRequest",
    "AccountSentimentBulkSaveResponse",
    # meeting_record schemas
    "MeetingRecordRowBase",
    "MeetingRecordRowCreate",
    "MeetingRecordRowOut",
    "MeetingRecordListResponse",
    "MeetingRecordBulkSaveRequest",
    "MeetingRecordBulkSaveResponse",
    # partner_contacts schemas
    "PartnerContactRowIn",
    "PartnerContactRowOut",
    "PartnerContactListResponse",
    "PartnerContactBulkSaveRequest",
    "PartnerContactBulkSaveResponse",
    # 日投放数据 schemas
    "日投放数据创建",
    "日投放数据响应",
    "日投放数据更新",
    # 咨询量明细 schemas
    "咨询量明细创建",
    "咨询量明细响应",
]
