"""
Pydantic schemas for teacher hour monthly stats
"""

from typing import Annotated, Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class TeacherHourStatsBase(BaseModel):
    campus: str
    year: Annotated[int, Field(ge=2000, le=2100)]
    month: Annotated[int, Field(ge=1, le=12)]


class TeacherHourStatsPayload(TeacherHourStatsBase):
    schedule: Dict[str, Any] = Field(default_factory=dict)
    teacher: str


class TeacherHourStatsResponse(TeacherHourStatsBase):
    schedule: Optional[Dict[str, Any]] = None
    teacher: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )
