"""
集团人资基础 - 晋升面试评价表 schemas
"""

from datetime import date, datetime
from typing import Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

PromotionInterviewPerformanceType = Literal["p1", "p2", "p3"]
PromotionInterviewStatus = Literal["draft", "submitted", "approved", "rejected"]


class PromotionInterviewBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    campus: str = Field(..., min_length=1, max_length=100)
    interview_date: date
    interviewer: Optional[str] = Field(None, max_length=100)
    performance_type: PromotionInterviewPerformanceType
    scores: Dict[str, int] = Field(default_factory=dict)
    status: PromotionInterviewStatus = "draft"


class PromotionInterviewCreate(PromotionInterviewBase):
    pass


class PromotionInterviewUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    campus: Optional[str] = Field(None, min_length=1, max_length=100)
    interview_date: Optional[date] = None
    interviewer: Optional[str] = Field(None, max_length=100)
    performance_type: Optional[PromotionInterviewPerformanceType] = None
    scores: Optional[Dict[str, int]] = None
    status: Optional[PromotionInterviewStatus] = None


class PromotionInterviewOut(PromotionInterviewBase):
    id: int
    total_score: int
    is_qualified: bool
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
