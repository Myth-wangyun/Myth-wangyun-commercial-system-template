"""
Pydantic schemas for student satisfaction detail table
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class StudentSatisfactionDetailBase(BaseModel):
    campus_name: str = Field(..., max_length=100)
    year: int = Field(..., ge=2000, le=2100)
    teacher_name: str = Field(..., max_length=100)
    class_name: str = Field("", max_length=100, description="班级名称")
    rows: List[dict] = Field(default_factory=list, description="满意度条目及分数")


class StudentSatisfactionDetailCreate(StudentSatisfactionDetailBase):
    pass


class StudentSatisfactionDetailUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    year: Optional[int] = Field(None, ge=2000, le=2100)
    teacher_name: Optional[str] = None
    class_name: Optional[str] = None
    rows: Optional[List[dict]] = None


class StudentSatisfactionDetailOut(StudentSatisfactionDetailBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class StudentSatisfactionAvgOut(BaseModel):
    campus_name: str
    year: int
    teacher_name: str
    class_name: Optional[str] = None
    m1: Optional[float] = None
    m2: Optional[float] = None
    m3: Optional[float] = None
    m4: Optional[float] = None
    m5: Optional[float] = None
    m6: Optional[float] = None
    m7: Optional[float] = None
    m8: Optional[float] = None
    m9: Optional[float] = None
    m10: Optional[float] = None
    m11: Optional[float] = None
    m12: Optional[float] = None

    model_config = ConfigDict(
        from_attributes=True,
    )
