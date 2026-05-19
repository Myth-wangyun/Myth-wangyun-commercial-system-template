"""
集团人资基础 - 转正申请 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

REGULARIZATION_APPROVAL_STAGES = [
    "department_head",
    "vice_principal",
    "principal",
    "hr",
    "chairman",
]

REGULARIZATION_STAGE_LABELS = {
    "department_head": "部门负责人",
    "vice_principal": "副校长",
    "hr": "集团人力资源部",
    "principal": "校长",
    "chairman": "董事长",
}

REGULARIZATION_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

REGULARIZATION_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class RegularizationApprovalConfigApproverOut(BaseModel):
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


class RegularizationApprovalConfigUpsert(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    apply_department: Optional[str] = Field(None, max_length=100)
    apply_position: Optional[str] = Field(None, max_length=100)
    stage: str = Field(..., max_length=50)
    approver_user_ids: List[int] = Field(default_factory=list)
    is_active: bool = True


class RegularizationApprovalConfigOut(BaseModel):
    id: int
    campus: str
    apply_department: Optional[str] = None
    apply_position: Optional[str] = None
    stage: str
    stage_label: str
    is_active: bool
    approvers: List[RegularizationApprovalConfigApproverOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class RegularizationCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class RegularizationApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class RegularizationApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[RegularizationCurrentApproverOut] = Field(default_factory=list)


class RegularizationApplicationActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class RegularizationApprovalActionOut(BaseModel):
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


class RegularizationApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[RegularizationCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class RegularizationNotificationOut(BaseModel):
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


class RegularizationApplicationBase(BaseModel):
    fill_date: date
    campus: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    entry_date: date
    regular_salary: Optional[float] = None
    probation_start: date
    probation_end: date
    probation_salary: Optional[float] = None
    main_work: str = Field(..., min_length=1)
    suggestion: Optional[str] = None
    self_evaluation: str = Field(..., min_length=1)
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class RegularizationApplicationCreate(RegularizationApplicationBase):
    pass


class RegularizationApplicationUpdate(BaseModel):
    fill_date: Optional[date] = None
    campus: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    entry_date: Optional[date] = None
    regular_salary: Optional[float] = None
    probation_start: Optional[date] = None
    probation_end: Optional[date] = None
    probation_salary: Optional[float] = None
    main_work: Optional[str] = None
    suggestion: Optional[str] = None
    self_evaluation: Optional[str] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class RegularizationApplicationOut(RegularizationApplicationBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    department_head_opinion: Optional[str] = None
    department_head_passed: Optional[bool] = None
    vice_principal_opinion: Optional[str] = None
    vice_principal_passed: Optional[bool] = None
    hr_opinion: Optional[str] = None
    hr_passed: Optional[bool] = None
    principal_opinion: Optional[str] = None
    principal_passed: Optional[bool] = None
    chairman_opinion: Optional[str] = None
    chairman_passed: Optional[bool] = None
    is_passed: Optional[bool] = None
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
    current_approvers: List[RegularizationCurrentApproverOut] = Field(
        default_factory=list
    )
    approval_flow: List[RegularizationApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[RegularizationApprovalActionOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
