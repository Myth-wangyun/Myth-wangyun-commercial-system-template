"""市场部各校新媒体账号舆情登记表 - Schemas (整表保存 / B 方案)

注意：app.schemas.market 这个名字在本项目中原本是 market.py 文件（市场日投放相关）。
为避免冲突，本模块放在 app.schemas.market_account_sentiment.py 或 app.schemas.market 包中。
这里保留该文件用于新 market 路由。
"""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class AccountSentimentRowBase(BaseModel):
    inchargeInside: str = Field('', description='维护在编老师')
    inchargeOutside: str = Field('', description='维护编外老师')
    platform: str = Field('', description='新媒体平台')
    accountId: str = Field('', description='ID账号')
    nickname: str = Field('', description='新媒体昵称')
    avatar: str = Field('', description='新媒体头像（截图）URL')
    remark: str = Field('', description='备注')


class AccountSentimentRowCreate(AccountSentimentRowBase):
    pass


class AccountSentimentRowOut(AccountSentimentRowBase):
    id: int
    campus_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccountSentimentListResponse(BaseModel):
    campus_name: str
    items: List[AccountSentimentRowOut]


class AccountSentimentBulkSaveRequest(BaseModel):
    campus_name: str = Field(..., description='神殿名称（最高议事厅使用：最高议事厅）')
    rows: List[AccountSentimentRowCreate] = Field(default_factory=list)


class AccountSentimentBulkSaveResponse(BaseModel):
    campus_name: str
    saved_count: int
    items: List[AccountSentimentRowOut]
































