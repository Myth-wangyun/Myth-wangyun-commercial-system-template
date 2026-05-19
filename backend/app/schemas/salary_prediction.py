"""
Pydantic schemas for salary prediction sheet
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SalaryPredictionBase(BaseModel):
    campus_name: str = Field(..., max_length=100)
    major_name: str = Field(..., max_length=100)
    class_name: str = Field(..., max_length=100)
    class_teacher_name: Optional[str] = Field(None, max_length=100)
    reinforcement_teacher_name: Optional[str] = Field(None, max_length=100)
    records: List[dict] = Field(default_factory=list, description="薪资预估记录列表")
    exam_headers: List[dict] = Field(default_factory=list)
    project_pairs: List[dict] = Field(default_factory=list)


class SalaryPredictionCreate(SalaryPredictionBase):
    pass


class SalaryPredictionUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    major_name: Optional[str] = None
    class_name: Optional[str] = None
    class_teacher_name: Optional[str] = None
    reinforcement_teacher_name: Optional[str] = None
    records: Optional[List[dict]] = None
    exam_headers: Optional[List[dict]] = None
    project_pairs: Optional[List[dict]] = None


class SalaryPredictionOut(SalaryPredictionBase):
    id: int
    created_at: datetime
    updated_at: datetime


class SalaryPredictionAutoFillResponse(BaseModel):
    campus_name: str
    class_name: str
    base_record: Optional[SalaryPredictionOut] = None
    exam_record: Optional[dict] = None
    project_record: Optional[dict] = None
    press_records: List[dict] = Field(default_factory=list)
