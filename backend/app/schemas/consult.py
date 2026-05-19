"""
咨询模块数据模式
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class 咨询量明细创建(BaseModel):
    咨询日期: datetime = Field(..., description="咨询日期")
    学员姓名: str = Field(..., max_length=50, description="学员姓名")
    联系电话: str = Field(..., max_length=20, description="联系电话")
    咨询方式: str = Field(..., max_length=20, description="咨询方式（在线/电话/到访）")
    意向等级: str = Field(..., max_length=10, description="意向等级（高/中/低）")
    咨询状态: str = Field(..., max_length=20, description="咨询状态（待跟进/跟进中/已报名/已放弃）")
    转化状态: Optional[str] = Field("未转化", max_length=20, description="转化状态（未转化/已转化/流失）")
    备注: Optional[str] = Field(None, description="备注信息")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量明细更新(BaseModel):
    咨询日期: Optional[datetime] = Field(None, description="咨询日期")
    学员姓名: Optional[str] = Field(None, max_length=50, description="学员姓名")
    联系电话: Optional[str] = Field(None, max_length=20, description="联系电话")
    咨询方式: Optional[str] = Field(None, max_length=20, description="咨询方式")
    意向等级: Optional[str] = Field(None, max_length=10, description="意向等级")
    咨询状态: Optional[str] = Field(None, max_length=20, description="咨询状态")
    转化状态: Optional[str] = Field(None, max_length=20, description="转化状态")
    备注: Optional[str] = Field(None, description="备注信息")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 咨询量明细响应(BaseModel):
    咨询ID: int = Field(..., description="咨询ID")
    咨询日期: Optional[datetime] = Field(None, description="咨询日期")
    学员姓名: str = Field(..., description="学员姓名")
    联系电话: str = Field(..., description="联系电话")
    咨询方式: str = Field(..., description="咨询方式")
    意向等级: str = Field(..., description="意向等级")
    咨询状态: str = Field(..., description="咨询状态")
    转化状态: Optional[str] = Field(None, description="转化状态")
    备注: Optional[str] = Field(None, description="备注信息")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        },
        from_attributes=True
    )
