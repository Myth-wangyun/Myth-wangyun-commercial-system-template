"""
Schemas for new student arrangement
"""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class NewStudentArrangementBase(BaseModel):
  student_name: str = Field(..., min_length=1, max_length=100)
  age: int = Field(..., ge=0)
  gender: str = Field(..., description="性别")
  major: str = Field(..., description="专业")
  duration: str = Field(..., description="学制")
  concerns: Optional[str] = None
  receivable_amount: float = 0
  received_amount: float = 0
  owed_amount: float = 0
  expected_payment_date: Optional[date] = None
  teaching_content: Optional[str] = None
  teaching_location: Optional[str] = None
  enrollment_date: date
  class_days: int = 0
  planner: Optional[str] = None
  homeroom_teacher: Optional[str] = None
  instructor: Optional[str] = None
  notes: Optional[str] = None
  recorder: Optional[str] = None
  arrangement_date: date
  campus: str


class NewStudentArrangementCreate(NewStudentArrangementBase):
  pass


class NewStudentArrangementUpdate(BaseModel):
  id: int
  student_name: Optional[str] = None
  age: Optional[int] = Field(None, ge=0)
  gender: Optional[str] = None
  major: Optional[str] = None
  duration: Optional[str] = None
  concerns: Optional[str] = None
  receivable_amount: Optional[float] = None
  received_amount: Optional[float] = None
  owed_amount: Optional[float] = None
  expected_payment_date: Optional[date] = None
  teaching_content: Optional[str] = None
  teaching_location: Optional[str] = None
  enrollment_date: Optional[date] = None
  class_days: Optional[int] = None
  planner: Optional[str] = None
  homeroom_teacher: Optional[str] = None
  instructor: Optional[str] = None
  notes: Optional[str] = None
  recorder: Optional[str] = None
  arrangement_date: Optional[date] = None
  campus: Optional[str] = None


class NewStudentArrangementResponse(NewStudentArrangementBase):
  id: int
  model_config = ConfigDict(from_attributes=True)


class NewStudentArrangementListResponse(BaseModel):
  records: List[NewStudentArrangementResponse] = Field(default_factory=list)
  total: int = 0
  page: int = 1
  page_size: int = 20
