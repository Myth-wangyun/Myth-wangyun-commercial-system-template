"""
集团人资基础 - 员工社保办理申请与审批配置 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

SOCIAL_INSURANCE_APPROVAL_STAGES = [
    "department_head",
    "hr",
    "principal",
    "chairman",
]

SOCIAL_INSURANCE_STAGE_LABELS = {
    "department_head": "部门主管",
    "hr": "人事部",
    "principal": "校长",
    "chairman": "董事长",
}

SOCIAL_INSURANCE_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

SOCIAL_INSURANCE_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class SocialInsuranceApprovalConfigApproverOut(BaseModel):
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


class SocialInsuranceApprovalConfigUpsert(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    apply_department: Optional[str] = Field(None, max_length=100)
    apply_position: Optional[str] = Field(None, max_length=100)
    stage: str = Field(..., max_length=50)
    approver_user_ids: List[int] = Field(default_factory=list)
    is_active: bool = True


class SocialInsuranceApprovalConfigOut(BaseModel):
    id: int
    campus: str
    apply_department: Optional[str] = None
    apply_position: Optional[str] = None
    stage: str
    stage_label: str
    is_active: bool
    approvers: List[SocialInsuranceApprovalConfigApproverOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class SocialInsuranceCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class SocialInsuranceApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class SocialInsuranceApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[SocialInsuranceCurrentApproverOut] = Field(default_factory=list)


class SocialInsuranceApplicationActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)
    hr_payment_content: Optional[str] = None
    hr_payment_base: Optional[float] = Field(None, ge=0)
    hr_start_date: Optional[date] = None
    hr_insurance_place: Optional[str] = Field(None, max_length=100)


class SocialInsuranceApprovalActionOut(BaseModel):
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


class SocialInsuranceApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[SocialInsuranceCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class SocialInsuranceNotificationOut(BaseModel):
    id: int
    application_id: int
    application_no: str
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


class SocialInsuranceApplicationBase(BaseModel):
    fill_date: date
    campus: str = Field(..., min_length=1, max_length=100)
    account_no: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=50)
    id_number: str = Field(..., min_length=1, max_length=50)
    household_type: str = Field(..., min_length=1, max_length=50)
    id_expiry: str = Field(..., min_length=1, max_length=100)
    hire_date: date
    registered_address: str = Field(..., min_length=1)
    prev_payment_place: Optional[str] = Field(None, max_length=100)
    prev_payment_type: Optional[str] = Field(None, max_length=100)
    prev_payment_base: Optional[float] = Field(None, ge=0)
    insurance_type: str = Field(..., min_length=1, max_length=20)
    remark: Optional[str] = None
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class SocialInsuranceApplicationCreate(SocialInsuranceApplicationBase):
    pass


class SocialInsuranceApplicationUpdate(BaseModel):
    fill_date: Optional[date] = None
    campus: Optional[str] = Field(None, max_length=100)
    account_no: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    id_number: Optional[str] = Field(None, max_length=50)
    household_type: Optional[str] = Field(None, max_length=50)
    id_expiry: Optional[str] = Field(None, max_length=100)
    hire_date: Optional[date] = None
    registered_address: Optional[str] = None
    prev_payment_place: Optional[str] = Field(None, max_length=100)
    prev_payment_type: Optional[str] = Field(None, max_length=100)
    prev_payment_base: Optional[float] = Field(None, ge=0)
    insurance_type: Optional[str] = Field(None, max_length=20)
    remark: Optional[str] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class SocialInsuranceApplicationOut(SocialInsuranceApplicationBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    dept_manager_opinion: Optional[str] = None
    hr_payment_content: Optional[str] = None
    hr_payment_base: Optional[float] = None
    hr_start_date: Optional[date] = None
    hr_insurance_place: Optional[str] = None
    hr_opinion: Optional[str] = None
    principal_opinion: Optional[str] = None
    chairman_opinion: Optional[str] = None
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
    current_approvers: List[SocialInsuranceCurrentApproverOut] = Field(
        default_factory=list
    )
    approval_flow: List[SocialInsuranceApprovalFlowStepOut] = Field(
        default_factory=list
    )
    approval_actions: List[SocialInsuranceApprovalActionOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
