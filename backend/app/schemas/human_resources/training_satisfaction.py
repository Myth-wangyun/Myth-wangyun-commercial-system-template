"""
集团人资基础 - 培训满意度调查 schemas
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _parse_training_date(value):
    if value is None or isinstance(value, date) and not isinstance(value, datetime):
        return value

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, str):
        candidate = value.strip()
        if not candidate:
            return value

        candidate = candidate.split("T", 1)[0].split(" ", 1)[0].replace("/", "-")
        parts = candidate.split("-")
        if len(parts) == 3:
            try:
                year, month, day = (int(part) for part in parts)
                return date(year, month, day)
            except ValueError:
                return value

    return value


class TrainingSatisfactionSectionTotals(BaseModel):
    course_content: int = Field(default=0)
    trainer: int = Field(default=0)
    training_method: int = Field(default=0)


class TrainingSatisfactionBase(BaseModel):
    department: str = Field(..., min_length=1, max_length=100)
    training_date: date
    training_location: str = Field(..., min_length=1, max_length=255)
    course_content: str = Field(..., min_length=1, max_length=255)
    trainer: str = Field(..., min_length=1, max_length=100)
    scores: dict[str, int]
    open_q4: Optional[str] = None
    open_q5: Optional[str] = None
    open_q6: Optional[str] = None
    remark: Optional[str] = None

    @field_validator("training_date", mode="before")
    @classmethod
    def validate_training_date(cls, value):
        return _parse_training_date(value)


class TrainingSatisfactionCreate(TrainingSatisfactionBase):
    pass


class TrainingSatisfactionUpdate(BaseModel):
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    training_date: Optional[date] = None
    training_location: Optional[str] = Field(None, min_length=1, max_length=255)
    course_content: Optional[str] = Field(None, min_length=1, max_length=255)
    trainer: Optional[str] = Field(None, min_length=1, max_length=100)
    scores: Optional[dict[str, int]] = None
    open_q4: Optional[str] = None
    open_q5: Optional[str] = None
    open_q6: Optional[str] = None
    remark: Optional[str] = None

    @field_validator("training_date", mode="before")
    @classmethod
    def validate_training_date(cls, value):
        return _parse_training_date(value)


class TrainingSatisfactionOut(TrainingSatisfactionBase):
    id: int
    section_totals: TrainingSatisfactionSectionTotals
    total_score: int
    year: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
