"""
集团人资基础 - 招聘需求申请与审批配置 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

RECRUITMENT_APPROVAL_STAGES = [
    "department_head",
    "principal",
    "hr_director",
    "chairman",
]

RECRUITMENT_STAGE_LABELS = {
    "department_head": "部门负责人",
    "principal": "校长",
    "hr_director": "人资总监",
    "chairman": "董事长",
}

RECRUITMENT_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

RECRUITMENT_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


def _validate_required_text(value: Optional[str], field_label: str) -> str:
    if value is None or not value.strip():
        raise ValueError(f"{field_label}不能为空")
    return value.strip()


class RecruitmentApprovalConfigApproverOut(BaseModel):
    id: int
    approver_user_id: int
    approver_name: str
    approver_department: Optional[str] = None
    approver_position: Optional[str] = None
    approver_campus: Optional[str] = None
    sort_order: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class RecruitmentApprovalConfigUpsert(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    apply_department: Optional[str] = Field(None, max_length=100)
    apply_position: Optional[str] = Field(None, max_length=100)
    stage: str = Field(..., max_length=50)
    approver_user_ids: List[int] = Field(default_factory=list)
    is_active: bool = True


class RecruitmentApprovalConfigOut(BaseModel):
    id: int
    campus: str
    apply_department: Optional[str] = None
    apply_position: Optional[str] = None
    stage: str
    stage_label: str
    is_active: bool
    approvers: List[RecruitmentApprovalConfigApproverOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class RecruitmentCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class RecruitmentApprovalPreviewInput(BaseModel):
    campus: Optional[str] = Field(None, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class RecruitmentApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[RecruitmentCurrentApproverOut] = Field(default_factory=list)


class RecruitmentRequestActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class RecruitmentRequestApprovalActionOut(BaseModel):
    id: int
    stage: str
    stage_label: str
    action: str
    approver_user_id: Optional[int] = None
    approver_name: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class RecruitmentApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[RecruitmentCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class RecruitmentRequestNotificationOut(BaseModel):
    id: int
    request_id: int
    request_no: str
    notification_type: str
    title: str
    content: str
    stage: Optional[str] = None
    stage_label: Optional[str] = None
    is_read: bool
    action_by_user_id: Optional[int] = None
    action_by_name: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None


class RecruitmentRequestBase(BaseModel):
    campus: Optional[str] = Field(None, max_length=100)
    apply_date: date
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    headcount: int = Field(default=1, ge=1)
    reason: str = Field(..., min_length=1, max_length=50)
    expected_date: date
    gender: Optional[str] = Field(None, max_length=20)
    age: Optional[str] = Field(None, max_length=50)
    marital_status: Optional[str] = Field(None, max_length=20)
    education: Optional[str] = Field(None, max_length=50)
    major: Optional[str] = Field(None, max_length=100)
    skills_experience: Optional[str] = None
    suggested_salary: str = Field(..., min_length=1, max_length=100)
    job_responsibilities: str = Field(..., min_length=50)
    analysis_and_reason: str = Field(..., min_length=20)
    internal_candidate_has: bool = False
    internal_candidate_department: Optional[str] = Field(None, max_length=100)
    internal_candidate_name: Optional[str] = Field(None, max_length=100)
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)

    @field_validator("skills_experience")
    @classmethod
    def validate_skills_experience(cls, value: Optional[str]) -> str:
        return _validate_required_text(value, "具备技能及工作经验")

    @field_validator("suggested_salary")
    @classmethod
    def validate_suggested_salary(cls, value: str) -> str:
        return _validate_required_text(value, "建议薪金")

    @field_validator("job_responsibilities")
    @classmethod
    def validate_job_responsibilities(cls, value: str) -> str:
        normalized = _validate_required_text(value, "增加人员岗位职责")
        if len(normalized) < 50:
            raise ValueError("增加人员岗位职责不少于50字")
        return normalized

    @field_validator("analysis_and_reason")
    @classmethod
    def validate_analysis_and_reason(cls, value: str) -> str:
        normalized = _validate_required_text(value, "本职位工作分析及增员理由")
        if len(normalized) < 20:
            raise ValueError("本职位工作分析及增员理由不少于20字")
        return normalized


class RecruitmentRequestCreate(RecruitmentRequestBase):
    pass


class RecruitmentRequestUpdate(BaseModel):
    campus: Optional[str] = Field(None, max_length=100)
    apply_date: Optional[date] = None
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    headcount: Optional[int] = Field(default=None, ge=1)
    reason: Optional[str] = Field(None, max_length=50)
    expected_date: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    age: Optional[str] = Field(None, max_length=50)
    marital_status: Optional[str] = Field(None, max_length=20)
    education: Optional[str] = Field(None, max_length=50)
    major: Optional[str] = Field(None, max_length=100)
    skills_experience: Optional[str] = None
    suggested_salary: Optional[str] = Field(None, max_length=100)
    job_responsibilities: Optional[str] = None
    analysis_and_reason: Optional[str] = None
    internal_candidate_has: Optional[bool] = None
    internal_candidate_department: Optional[str] = Field(None, max_length=100)
    internal_candidate_name: Optional[str] = Field(None, max_length=100)
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None

    @field_validator("skills_experience")
    @classmethod
    def validate_skills_experience(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_required_text(value, "具备技能及工作经验")

    @field_validator("suggested_salary")
    @classmethod
    def validate_update_suggested_salary(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_required_text(value, "建议薪金")

    @field_validator("job_responsibilities")
    @classmethod
    def validate_update_job_responsibilities(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = _validate_required_text(value, "增加人员岗位职责")
        if len(normalized) < 50:
            raise ValueError("增加人员岗位职责不少于50字")
        return normalized

    @field_validator("analysis_and_reason")
    @classmethod
    def validate_update_analysis_and_reason(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = _validate_required_text(value, "本职位工作分析及增员理由")
        if len(normalized) < 20:
            raise ValueError("本职位工作分析及增员理由不少于20字")
        return normalized


class RecruitmentRequestOut(RecruitmentRequestBase):
    id: int
    request_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    dept_manager_opinion: Optional[str] = None
    principal_opinion: Optional[str] = None
    hr_director_opinion: Optional[str] = None
    chairman_approval: Optional[str] = None
    status: str
    status_label: str
    current_stage: Optional[str] = None
    current_stage_label: Optional[str] = None
    rejection_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    can_edit: bool = False
    can_delete: bool = False
    can_submit: bool = False
    can_approve: bool = False
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)
    current_approvers: List[RecruitmentCurrentApproverOut] = Field(default_factory=list)
    approval_flow: List[RecruitmentApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[RecruitmentRequestApprovalActionOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
