"""
Schemas for class exam scores
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class StudentScore(BaseModel):
    student_id: str
    student_name: str
    vocabulary_score: float | None = None
    written_score: float | None = None
    lab_score: float | None = None
    daily_score: float | None = None
    total_score: float | None = None
    passed: bool | None = None


class ClassExamScoreBase(BaseModel):
    campus_name: str
    major_name: str
    class_name: str
    course_name: str
    instructor_name: str
    first_exam_date: Optional[date] = None
    makeup_exam_date: Optional[date] = None
    scores_first: Dict[str, Any] = Field(default_factory=dict)
    scores_makeup: Dict[str, Any] = Field(default_factory=dict)


class ClassExamScoreCreate(ClassExamScoreBase):
    pass


class ClassExamScoreUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    major_name: Optional[str] = None
    class_name: Optional[str] = None
    course_name: Optional[str] = None
    instructor_name: Optional[str] = None
    first_exam_date: Optional[date] = None
    makeup_exam_date: Optional[date] = None
    scores_first: Optional[Dict[str, Any]] = None
    scores_makeup: Optional[Dict[str, Any]] = None


class ClassExamScoreResponse(ClassExamScoreBase):
    id: int
    class_size: int
    pass_count: int
    scores_final: Dict[str, Any]
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ClassExamScoreListResponse(BaseModel):
    records: List[ClassExamScoreResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
