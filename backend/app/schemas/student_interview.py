"""
Pydantic schemas for student interview records
"""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class StudentInterviewRecordSchema(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=100)
    student_id: Optional[str] = None
    interviewer: str = Field(default="", max_length=100)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    content: str = Field(default="")
    interview_date: date
    class_code: str
    class_name: Optional[str] = None
    campus: str
    major_name: Optional[str] = None


class StudentInterviewPayload(BaseModel):
    campus: str
    class_code: str
    class_name: Optional[str] = None
    records: List[StudentInterviewRecordSchema] = Field(default_factory=list)


class StudentInterviewListResponse(BaseModel):
    campus: str
    class_code: str
    class_name: Optional[str] = None
    records: List[StudentInterviewRecordSchema] = Field(default_factory=list)
