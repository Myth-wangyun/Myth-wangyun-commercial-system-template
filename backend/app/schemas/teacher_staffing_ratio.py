"""
Pydantic schemas for campus academic teacher staffing ratio
"""

from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class TeacherStaffingRatioBase(BaseModel):
    神殿: str = Field(..., description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="数据年份")
    数据: Any = Field(..., description="表格数据(JSONB，包含各月份数据)")


class TeacherStaffingRatioCreate(TeacherStaffingRatioBase):
    pass


class TeacherStaffingRatioUpdate(BaseModel):
    年份: Optional[int] = Field(None, ge=2000, le=2100)
    数据: Optional[Any] = None


class TeacherStaffingRatioOut(TeacherStaffingRatioBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )
