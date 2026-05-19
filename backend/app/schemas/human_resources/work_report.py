"""
集团人资基础 - 转正述职报告 schemas
"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

WORK_REPORT_MIN_CONTENT_LENGTH = 150
WORK_REPORT_CONTENT_LABELS = {
    "work_description": "精彩工作评述",
    "difficulties": "工作中遇到的困难及解决情况",
    "achievements": "工作中成功的方面及经验总结",
    "improvements": "工作中需要改进的方面及改进措施",
    "future_plan": "转正后工作计划及计划达成成果",
}


def _validate_work_report_content(value: str, label: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{label}不能为空")

    meaningful_length = sum(1 for char in normalized if not char.isspace())
    if meaningful_length < WORK_REPORT_MIN_CONTENT_LENGTH:
        raise ValueError(f"{label}不少于{WORK_REPORT_MIN_CONTENT_LENGTH}字")

    return normalized


class WorkReportBase(BaseModel):
    report_date: date
    work_description: str = Field(..., min_length=1)
    difficulties: str = Field(..., min_length=1)
    achievements: str = Field(..., min_length=1)
    improvements: str = Field(..., min_length=1)
    future_plan: str = Field(..., min_length=1)

    @field_validator(
        "work_description",
        "difficulties",
        "achievements",
        "improvements",
        "future_plan",
    )
    @classmethod
    def validate_content_length(cls, value: str, info: ValidationInfo) -> str:
        return _validate_work_report_content(value, WORK_REPORT_CONTENT_LABELS[info.field_name])


class WorkReportCreate(WorkReportBase):
    pass


class WorkReportUpdate(BaseModel):
    report_date: date | None = None
    work_description: str | None = Field(None, min_length=1)
    difficulties: str | None = Field(None, min_length=1)
    achievements: str | None = Field(None, min_length=1)
    improvements: str | None = Field(None, min_length=1)
    future_plan: str | None = Field(None, min_length=1)

    @field_validator(
        "work_description",
        "difficulties",
        "achievements",
        "improvements",
        "future_plan",
    )
    @classmethod
    def validate_optional_content_length(
        cls,
        value: str | None,
        info: ValidationInfo,
    ) -> str | None:
        if value is None:
            return value
        return _validate_work_report_content(value, WORK_REPORT_CONTENT_LABELS[info.field_name])


class WorkReportOut(WorkReportBase):
    id: int
    reporter_user_id: int | None = None
    name: str
    department: str
    position: str
    campus: str | None = None
    can_edit: bool
    can_delete: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkReportStatusOut(BaseModel):
    has_completed_report: bool
    latest_report_id: int | None = None
    latest_report_date: date | None = None
