from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class TeacherLectureScoreRow(BaseModel):
    category: str
    standard: str
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
    avg: Optional[float] = None


class TeacherLectureScoreSheetBase(BaseModel):
    campus_name: str
    teacher_name: str
    year: int
    rows: List[TeacherLectureScoreRow]


class TeacherLectureScoreSheetCreate(TeacherLectureScoreSheetBase):
    pass


class TeacherLectureScoreSheetUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    teacher_name: Optional[str] = None
    year: Optional[int] = None
    rows: Optional[List[TeacherLectureScoreRow]] = None


class TeacherLectureScoreSheetOut(TeacherLectureScoreSheetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
