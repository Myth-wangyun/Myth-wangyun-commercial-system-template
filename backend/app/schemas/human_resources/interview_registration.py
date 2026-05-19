"""
集团人资基础 - 面试登记表 schemas
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class InterviewRegistrationBase(BaseModel):
    region: Optional[str] = Field(None, max_length=100)
    campus_name: Optional[str] = Field(None, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    source: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)
    invite_date: Optional[date] = None
    inviter: Optional[str] = Field(None, max_length=100)
    scheduled_time: Optional[str] = Field(None, max_length=100)

    attended_first: Optional[str] = Field(None, max_length=10)
    first_interviewer: Optional[str] = Field(None, max_length=100)
    first_evaluation: Optional[str] = None
    first_hire_decision: Optional[str] = Field(None, max_length=10)

    attended_second: Optional[str] = Field(None, max_length=10)
    second_time: Optional[str] = Field(None, max_length=100)
    second_evaluation: Optional[str] = None
    final_hire_decision: Optional[str] = Field(None, max_length=10)

    reported: Optional[str] = Field(None, max_length=10)
    onboard_date: Optional[date] = None
    not_onboard_reason: Optional[str] = None


class InterviewRegistrationCreate(InterviewRegistrationBase):
    pass


class InterviewRegistrationUpdate(BaseModel):
    region: Optional[str] = Field(None, max_length=100)
    campus_name: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    source: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)
    invite_date: Optional[date] = None
    inviter: Optional[str] = Field(None, max_length=100)
    scheduled_time: Optional[str] = Field(None, max_length=100)

    attended_first: Optional[str] = Field(None, max_length=10)
    first_interviewer: Optional[str] = Field(None, max_length=100)
    first_evaluation: Optional[str] = None
    first_hire_decision: Optional[str] = Field(None, max_length=10)

    attended_second: Optional[str] = Field(None, max_length=10)
    second_time: Optional[str] = Field(None, max_length=100)
    second_evaluation: Optional[str] = None
    final_hire_decision: Optional[str] = Field(None, max_length=10)

    reported: Optional[str] = Field(None, max_length=10)
    onboard_date: Optional[date] = None
    not_onboard_reason: Optional[str] = None


class InterviewRegistrationOut(InterviewRegistrationBase):
    id: int
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
