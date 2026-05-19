from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DashboardManualRecruitmentDailyBase(BaseModel):
    scope: str = Field(..., min_length=2, max_length=20)
    stat_date: date
    org_name: str = Field(..., min_length=1, max_length=100)
    authorized_posts: int = Field(0, ge=0)
    current_posts: int = Field(0, ge=0)
    boss_invite_count: int = Field(0, ge=0)
    zhilian_invite_count: int = Field(0, ge=0)
    other_platform_invite_count: int = Field(0, ge=0)
    planned_optimize_count: int = Field(0, ge=0)
    actual_optimize_count: int = Field(0, ge=0)
    transfer_names: list[str] = Field(default_factory=list)
    optimize_names: list[str] = Field(default_factory=list)
    resign_names: list[str] = Field(default_factory=list)

    @field_validator("scope", "org_name")
    @classmethod
    def validate_non_empty_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("字段不能为空")
        return normalized


class DashboardManualRecruitmentDailyUpsert(DashboardManualRecruitmentDailyBase):
    pass


class DashboardManualRecruitmentDailyOut(DashboardManualRecruitmentDailyBase):
    id: int
    updated_by_user_id: int | None = None
    updated_by_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class SalaryWelfareFactBase(BaseModel):
    scope: str = Field(..., min_length=2, max_length=20)
    org_kind: str = Field(default="org", min_length=1, max_length=20)
    org_name: str = Field(..., min_length=1, max_length=100)
    stat_date: date
    user_id: Optional[int] = None
    person_name: Optional[str] = Field(default=None, max_length=100)
    position: Optional[str] = Field(default=None, max_length=100)
    position_category: Optional[str] = Field(default=None, max_length=20)
    headcount: int = Field(0, ge=0)
    salary: Decimal = Field(default=Decimal("0"))
    annual_welfare_total: Decimal = Field(default=Decimal("0"))
    monthly_incentive_total: Decimal = Field(default=Decimal("0"))
    temporary_reward_total: Decimal = Field(default=Decimal("0"))
    deduction: Decimal = Field(default=Decimal("0"))
    cadre_salary_total: Decimal = Field(default=Decimal("0"))
    staff_salary_total: Decimal = Field(default=Decimal("0"))
    remark: Optional[str] = None

    @field_validator("scope", "org_kind", "org_name")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("字段不能为空")
        return normalized


class SalaryWelfareFactCreate(SalaryWelfareFactBase):
    pass


class SalaryWelfareFactUpdate(BaseModel):
    org_kind: Optional[str] = Field(default=None, min_length=1, max_length=20)
    org_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    stat_date: Optional[date] = None
    user_id: Optional[int] = None
    person_name: Optional[str] = Field(default=None, max_length=100)
    position: Optional[str] = Field(default=None, max_length=100)
    position_category: Optional[str] = Field(default=None, max_length=20)
    headcount: Optional[int] = Field(default=None, ge=0)
    salary: Optional[Decimal] = None
    annual_welfare_total: Optional[Decimal] = None
    monthly_incentive_total: Optional[Decimal] = None
    temporary_reward_total: Optional[Decimal] = None
    deduction: Optional[Decimal] = None
    cadre_salary_total: Optional[Decimal] = None
    staff_salary_total: Optional[Decimal] = None
    remark: Optional[str] = None


class SalaryWelfareFactOut(SalaryWelfareFactBase):
    id: int
    updated_by_user_id: int | None = None
    updated_by_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class PerformanceFactBase(BaseModel):
    scope: str = Field(..., min_length=2, max_length=20)
    org_kind: str = Field(default="org", min_length=1, max_length=20)
    org_name: str = Field(..., min_length=1, max_length=100)
    stat_month: date
    user_id: Optional[int] = None
    person_name: str = Field(default="", max_length=100)
    position_category: Optional[str] = Field(default=None, max_length=20)
    average_score: Decimal = Field(default=Decimal("0"))
    leader_average_score: Decimal = Field(default=Decimal("0"))
    staff_average_score: Decimal = Field(default=Decimal("0"))
    remark: Optional[str] = None

    @field_validator("scope", "org_kind", "org_name")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("字段不能为空")
        return normalized


class PerformanceFactCreate(PerformanceFactBase):
    pass


class PerformanceFactUpdate(BaseModel):
    org_kind: Optional[str] = Field(default=None, min_length=1, max_length=20)
    org_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    stat_month: Optional[date] = None
    user_id: Optional[int] = None
    person_name: Optional[str] = Field(default=None, max_length=100)
    position_category: Optional[str] = Field(default=None, max_length=20)
    average_score: Optional[Decimal] = None
    leader_average_score: Optional[Decimal] = None
    staff_average_score: Optional[Decimal] = None
    remark: Optional[str] = None


class PerformanceFactOut(PerformanceFactBase):
    id: int
    updated_by_user_id: int | None = None
    updated_by_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class DashboardAggregateRowOut(BaseModel):
    id: int
    scope: str
    domain: str
    period: str
    org_kind: str
    org_key: str
    org_name: Optional[str] = None
    metrics: dict[str, Any] = Field(default_factory=dict)
    lists: dict[str, Any] = Field(default_factory=dict)
    recalculated_at: datetime


class DashboardSectionOut(BaseModel):
    rows: list[dict[str, Any]] = Field(default_factory=list)
    warnings: dict[str, Any] = Field(default_factory=dict)


class DashboardDailyOut(BaseModel):
    scope: str
    month: str
    sections: dict[str, DashboardSectionOut] = Field(default_factory=dict)


class DashboardMonthlyOut(BaseModel):
    scope: str
    year: str
    sections: dict[str, DashboardSectionOut] = Field(default_factory=dict)


class DashboardYearlyOut(BaseModel):
    scope: str
    year: str
    sections: dict[str, DashboardSectionOut] = Field(default_factory=dict)
