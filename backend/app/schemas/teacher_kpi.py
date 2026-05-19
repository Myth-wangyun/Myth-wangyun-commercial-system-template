"""
Pydantic schemas for KPI templates and results
"""

from typing import Annotated, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class KPITemplateItem(BaseModel):
    id: int
    role: str
    indicator: str
    formula: Optional[str] = None
    data_source: Optional[str] = None
    default_weight: Optional[float] = None
    order_index: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class KPITemplateList(BaseModel):
    templates: List[KPITemplateItem]


class KPIResultRow(BaseModel):
    template_id: Optional[int] = None
    indicator: str
    formula: Optional[str] = None
    data_source: Optional[str] = None
    weight: Optional[float] = None
    score: Optional[float] = None
    kpi_value: Optional[float] = Field(default=None, alias="kpiValue")
    order_index: Optional[int] = Field(default=None, alias="orderIndex")

    model_config = ConfigDict(
        populate_by_name=True,
    )


class KPIResultEntry(BaseModel):
    teacher_id: Optional[int] = None
    teacher_name: str
    role: Optional[str] = None
    rows: List[KPIResultRow]

    model_config = ConfigDict(
        populate_by_name=True,
    )


class KPIResultList(BaseModel):
    campus: str
    year: Annotated[int, Field(ge=2000, le=2100)]
    month: Annotated[int, Field(ge=1, le=12)]
    entries: List[KPIResultEntry]


class KPIResultSavePayload(BaseModel):
    campus_name: str = Field(..., alias="campus")
    year: Annotated[int, Field(ge=2000, le=2100)]
    month: Annotated[int, Field(ge=1, le=12)]
    entries: List[KPIResultEntry]

    model_config = ConfigDict(
        populate_by_name=True,
    )


class KPIAssessmentRecord(BaseModel):
    name: str
    department_performance: Optional[float] = Field(None, alias="departmentPerformance")
    assignment_submit_rate: Optional[float] = Field(None, alias="assignmentSubmitRate")
    assignment_pass_rate: Optional[float] = Field(None, alias="assignmentPassRate")
    exam_pass_rate: Optional[float] = Field(None, alias="examPassRate")
    employment_count: Optional[int] = Field(None, alias="employmentCount")
    employment_salary: Optional[float] = Field(None, alias="employmentSalary")
    attendance_rate: Optional[float] = Field(None, alias="attendanceRate")
    old_student_loss: Optional[float] = Field(None, alias="oldStudentLoss")
    new_student_loss: Optional[float] = Field(None, alias="newStudentLoss")
    satisfaction: Optional[float] = None
    recruitment_completion: Optional[float] = Field(None, alias="recruitmentCompletion")
    wechat_moments: Optional[int] = Field(None, alias="wechatMoments")
    kuaishou_shares: Optional[int] = Field(None, alias="kuaishouShares")
    douyin_shares: Optional[int] = Field(None, alias="douyinShares")
    new_media_total: Optional[int] = Field(None, alias="newMediaTotal")
    leader_review: Optional[float] = Field(None, alias="leaderReview")

    model_config = ConfigDict(
        populate_by_name=True,
    )


class KPIAssessmentSavePayload(BaseModel):
    campus: str
    year: Annotated[int, Field(ge=2000, le=2100)]
    month: Annotated[int, Field(ge=1, le=12)]
    records: List[KPIAssessmentRecord]


class KPIAssessmentList(BaseModel):
    campus: str
    year: Annotated[int, Field(ge=2000, le=2100)]
    month: Annotated[int, Field(ge=1, le=12)]
    records: List[KPIAssessmentRecord]
