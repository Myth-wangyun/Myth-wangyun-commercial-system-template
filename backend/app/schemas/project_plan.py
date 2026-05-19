"""
Pydantic schemas for campus project plans
"""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class ProjectTaskSchema(BaseModel):
    date: str = Field(..., description="任务日期（YYYY-MM-DD）")
    content: Optional[str] = None
    standard: Optional[str] = None
    responsiblePerson: Optional[str] = None
    resultDescription: Optional[str] = None
    supervisor: Optional[str] = None


class ProjectPlanEntrySchema(BaseModel):
  number: str
  name: str
  start_date: Optional[date] = None
  end_date: Optional[date] = None
  tasks: List[ProjectTaskSchema] = Field(default_factory=list)


class ProjectPlanPayload(BaseModel):
  campus: str
  class_id: str
  class_name: str
  class_advisor: Optional[str] = None
  reinforcement_instructor: Optional[str] = None
  projects: List[ProjectPlanEntrySchema] = Field(default_factory=list)


class ProjectPlanResponse(ProjectPlanPayload):
  pass
