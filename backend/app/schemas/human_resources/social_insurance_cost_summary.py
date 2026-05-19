"""
集团人资基础 - 社保费用汇总表 schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SocialInsuranceCostSummaryEmployee(BaseModel):
    service_fee: float = Field(20, ge=0)
    id_number: str = Field(default="", max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    injury_base: float = Field(0, ge=0)
    pension_base: float = Field(0, ge=0)
    unemployment_base: float = Field(0, ge=0)
    medical_base: float = Field(0, ge=0)


class SocialInsuranceCostSummaryBase(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    unit_name: str = Field(..., min_length=1, max_length=200)
    period: str = Field(..., min_length=1, max_length=20)
    injury_enterprise_rate: float = Field(..., ge=0)
    employees: list[SocialInsuranceCostSummaryEmployee] = Field(min_length=1)
    remark: Optional[str] = None


class SocialInsuranceCostSummaryCreate(SocialInsuranceCostSummaryBase):
    pass


class SocialInsuranceCostSummaryUpdate(BaseModel):
    campus: Optional[str] = Field(None, min_length=1, max_length=100)
    unit_name: Optional[str] = Field(None, min_length=1, max_length=200)
    period: Optional[str] = Field(None, min_length=1, max_length=20)
    injury_enterprise_rate: Optional[float] = Field(None, ge=0)
    employees: Optional[list[SocialInsuranceCostSummaryEmployee]] = Field(None, min_length=1)
    remark: Optional[str] = None


class SocialInsuranceCostSummaryOut(SocialInsuranceCostSummaryBase):
    id: int
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)