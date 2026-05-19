"""
集团人资基础 - 培训目标 schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TrainingGoalBase(BaseModel):
    parent_category: str = Field(..., min_length=1, max_length=50)
    sub_category: str = Field(default="", max_length=100)
    level: str = Field(..., min_length=1, max_length=50)
    objectives: list[str] = Field(default_factory=list)
    year: str = Field(..., min_length=1, max_length=10)
    remark: Optional[str] = None


class TrainingGoalCreate(TrainingGoalBase):
    pass


class TrainingGoalUpdate(BaseModel):
    parent_category: Optional[str] = Field(None, min_length=1, max_length=50)
    sub_category: Optional[str] = Field(None, max_length=100)
    level: Optional[str] = Field(None, min_length=1, max_length=50)
    objectives: Optional[list[str]] = None
    year: Optional[str] = Field(None, min_length=1, max_length=10)
    remark: Optional[str] = None


class TrainingGoalOut(TrainingGoalBase):
    id: int
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
