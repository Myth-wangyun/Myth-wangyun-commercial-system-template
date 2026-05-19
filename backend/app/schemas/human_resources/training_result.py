"""
集团人资基础 - 培训成绩汇总表 schemas
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


class TrainingResultTraineeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    theory_score: int = Field(..., ge=0, le=100)
    practice_score: int = Field(..., ge=0, le=100)
    remark: Optional[str] = None


class TrainingResultTraineeCreate(TrainingResultTraineeBase):
    pass


class TrainingResultTraineeOut(TrainingResultTraineeBase):
    composite_score: int
    rank: int


class TrainingResultBase(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    training_date: date
    training_hours: float = Field(..., ge=0)
    expected_count: int = Field(..., ge=0)
    total_cost: float = Field(default=0, ge=0)
    trainees: list[TrainingResultTraineeCreate] = Field(default_factory=list)
    remark: Optional[str] = None

    @field_validator("training_date", mode="before")
    @classmethod
    def validate_training_date(cls, value):
        return _parse_training_date(value)


class TrainingResultCreate(TrainingResultBase):
    pass


class TrainingResultUpdate(BaseModel):
    campus: Optional[str] = Field(None, min_length=1, max_length=100)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    training_date: Optional[date] = None
    training_hours: Optional[float] = Field(None, ge=0)
    expected_count: Optional[int] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    trainees: Optional[list[TrainingResultTraineeCreate]] = None
    remark: Optional[str] = None

    @field_validator("training_date", mode="before")
    @classmethod
    def validate_training_date(cls, value):
        return _parse_training_date(value)


class TrainingResultOut(TrainingResultBase):
    id: int
    actual_count: int
    pass_count: int
    fail_count: int
    average_score: float
    average_cost: float
    pass_rate: float
    trainees: list[TrainingResultTraineeOut]
    year: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
