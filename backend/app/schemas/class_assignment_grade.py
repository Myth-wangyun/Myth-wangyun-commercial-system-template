from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class ClassAssignmentGradeBase(BaseModel):
    campus_name: str
    major_name: str
    class_name: str
    course_name: str
    teacher_name: str
    class_size: int = 0
    assignment_count: int = 0
    expected_submit: int = 0
    actual_submit: int = 0
    unsubmitted_count: int = 0
    pass_count: int = 0
    submit_rate: float = 0
    pass_rate: float = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    records: Union[Dict[str, Any], List[Any]] = Field(
        default_factory=dict, description="作业成绩主记录，JSONB，可以是字典或列表格式"
    )


class ClassAssignmentGradeCreate(ClassAssignmentGradeBase):
    pass


class ClassAssignmentGradeUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    major_name: Optional[str] = None
    class_name: Optional[str] = None
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None
    class_size: Optional[int] = None
    assignment_count: Optional[int] = None
    expected_submit: Optional[int] = None
    actual_submit: Optional[int] = None
    unsubmitted_count: Optional[int] = None
    pass_count: Optional[int] = None
    submit_rate: Optional[float] = None
    pass_rate: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    records: Optional[Union[Dict[str, Any], List[Any]]] = None


class ClassAssignmentGradeOut(ClassAssignmentGradeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
