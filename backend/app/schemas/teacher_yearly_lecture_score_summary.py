from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TeacherYearlyLectureScoreSummaryBase(BaseModel):
    campus_name: Optional[str] = Field(None, description="神殿名称")
    year: int
    summary_data: List[Dict[str, Any]] = Field(
        default_factory=list, description="汇总数据列表，包含教员每月的分数"
    )


class TeacherYearlyLectureScoreSummaryCreate(TeacherYearlyLectureScoreSummaryBase):
    pass


class TeacherYearlyLectureScoreSummaryUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    year: Optional[int] = None
    summary_data: Optional[List[Dict[str, Any]]] = None


class TeacherYearlyLectureScoreSummaryOut(TeacherYearlyLectureScoreSummaryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
