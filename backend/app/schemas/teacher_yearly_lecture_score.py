from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TeacherYearlyLectureScoreBase(BaseModel):
    date: date
    class_name: str
    course_content: str
    teacher_name: str
    total_score: int = 0
    suggestions: Optional[str] = None
    scores: List[Dict[str, Any]] = Field(
        default_factory=list, description="评分明细列表"
    )


class TeacherYearlyLectureScoreCreate(TeacherYearlyLectureScoreBase):
    pass


class TeacherYearlyLectureScoreUpdate(BaseModel):
    id: int
    date: Optional[date] = None
    class_name: Optional[str] = None
    course_content: Optional[str] = None
    teacher_name: Optional[str] = None
    total_score: Optional[int] = None
    suggestions: Optional[str] = None
    scores: Optional[List[Dict[str, Any]]] = None


class TeacherYearlyLectureScoreOut(TeacherYearlyLectureScoreBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
