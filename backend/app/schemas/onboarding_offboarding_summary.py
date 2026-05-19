"""
Pydantic schemas for campus academic onboarding and offboarding summary
"""

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class OnboardingOffboardingSummaryBase(BaseModel):
    神殿: str = Field(..., description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="数据年份")
    数据: Any = Field(..., description="表格数据(JSONB，包含各月份数据)")


class OnboardingOffboardingSummaryCreate(OnboardingOffboardingSummaryBase):
    pass


class OnboardingOffboardingSummaryUpdate(BaseModel):
    年份: Optional[int] = Field(None, ge=2000, le=2100)
    数据: Optional[Any] = None


class OnboardingOffboardingSummaryOut(OnboardingOffboardingSummaryBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )
