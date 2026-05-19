"""
Schemas for class press interview scores
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjectScore(BaseModel):
    instructor1_score: int = 0
    instructor2_score: int = 0
    instructor3_score: int = 0
    homeroom_teacher1_score: int = 0
    homeroom_teacher2_score: int = 0
    average_score: int = 0


class PressInterviewScoreBase(BaseModel):
    campus_name: str = Field(..., description="神殿名称")
    major_name: str = Field(..., description="专业名称")
    class_name: str = Field(..., description="班级名称")
    course_name: str = Field(..., description="课程名称")
    instructor_name: str = Field(..., description="教员姓名")
    student_id: str = Field(..., description="学号")
    student_name: str = Field(..., description="学员姓名")
    project_scores: Dict[str, Any] = Field(default_factory=dict, description="项目成绩(JSONB)")
    header_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="表头配置(JSONB): {project_number: {instructor1: '...', ...}}")
    year: int = Field(..., ge=2000)
    month: int = Field(..., ge=1, le=12)


class PressInterviewScoreCreate(PressInterviewScoreBase):
    pass


class PressInterviewScoreUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    major_name: Optional[str] = None
    class_name: Optional[str] = None
    course_name: Optional[str] = None
    instructor_name: Optional[str] = None
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    project_scores: Optional[Dict[str, Any]] = None
    header_config: Optional[Dict[str, Any]] = None
    year: Optional[int] = None
    month: Optional[int] = None


class PressInterviewScoreResponse(PressInterviewScoreBase):
  id: int
  created_at: Optional[datetime] = None
  updated_at: Optional[datetime] = None

  model_config = ConfigDict(from_attributes=True)


class PressInterviewScoreListResponse(BaseModel):
    records: List[PressInterviewScoreResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
