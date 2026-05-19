"""
最高议事厅日度核心数据看板 - 招聘及入职手填数据 schemas
"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_names(names: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for raw in names:
        normalized = raw.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


class ManagementCenterDailyRecruitmentManualBase(BaseModel):
    stat_date: date
    department: str = Field(..., min_length=1, max_length=100)
    authorized_posts: int = Field(0, ge=0)
    current_posts: int = Field(0, ge=0)
    planned_optimize_count: int = Field(0, ge=0)
    actual_optimize_count: int = Field(0, ge=0)
    transfer_names: list[str] = Field(default_factory=list)
    optimize_names: list[str] = Field(default_factory=list)
    resign_names: list[str] = Field(default_factory=list)

    @field_validator("department")
    @classmethod
    def validate_department(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("department 不能为空")
        return normalized

    @field_validator("transfer_names", "optimize_names", "resign_names")
    @classmethod
    def validate_names(cls, value: list[str]) -> list[str]:
        return _normalize_names(value)


class ManagementCenterDailyRecruitmentManualUpsert(
    ManagementCenterDailyRecruitmentManualBase
):
    pass


class ManagementCenterDailyRecruitmentManualOut(
    ManagementCenterDailyRecruitmentManualBase
):
    id: int
    updated_by_user_id: int | None = None
    updated_by_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
