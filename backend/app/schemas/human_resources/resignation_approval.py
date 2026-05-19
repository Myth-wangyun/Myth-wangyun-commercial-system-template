"""
集团人资基础 - 离职审批单 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

RESIGNATION_APPROVAL_STAGES = [
    "department_head",
    "hr",
    "principal",
    "operations_reviewer",
    "chairman",
]

RESIGNATION_APPROVAL_STAGE_LABELS = {
    "department_head": "部门意见",
    "hr": "人力资源意见",
    "principal": "校长意见",
    "operations_reviewer": "最高议事厅运营部总监意见",
    "chairman": "董事长",
}

RESIGNATION_APPROVAL_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

RESIGNATION_APPROVAL_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class ResignationApprovalCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class ResignationApprovalApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[ResignationApprovalCurrentApproverOut] = Field(default_factory=list)


class ResignationApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class ResignationApprovalActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)
    salary_end_date: Optional[date] = None


class ResignationApprovalActionOut(BaseModel):
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


class ResignationApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[ResignationApprovalCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class ResignationApprovalNotificationOut(BaseModel):
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


class ResignationApprovalBase(BaseModel):
    fill_date: date
    campus: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    entry_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    leave_date: date
    leave_type: str = Field(..., min_length=1, max_length=50)
    leave_type_other: Optional[str] = Field(None, max_length=255)
    reason: str = Field(..., min_length=1, max_length=4000)
    employee_sign: Optional[str] = Field(None, max_length=100)
    employee_sign_date: Optional[date] = None
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class ResignationApprovalCreate(ResignationApprovalBase):
    pass


class ResignationApprovalUpdate(BaseModel):
    fill_date: Optional[date] = None
    campus: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    entry_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    leave_date: Optional[date] = None
    leave_type: Optional[str] = Field(None, max_length=50)
    leave_type_other: Optional[str] = Field(None, max_length=255)
    reason: Optional[str] = Field(None, max_length=4000)
    employee_sign: Optional[str] = Field(None, max_length=100)
    employee_sign_date: Optional[date] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class ResignationApprovalOut(ResignationApprovalBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    department_head_opinion: Optional[str] = None
    department_head_passed: Optional[bool] = None
    department_head_salary_end_date: Optional[date] = None
    hr_opinion: Optional[str] = None
    hr_passed: Optional[bool] = None
    hr_salary_end_date: Optional[date] = None
    principal_opinion: Optional[str] = None
    principal_passed: Optional[bool] = None
    operations_review_opinion: Optional[str] = None
    operations_review_passed: Optional[bool] = None
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
    current_approvers: List[ResignationApprovalCurrentApproverOut] = Field(
        default_factory=list
    )
    approval_flow: List[ResignationApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[ResignationApprovalActionOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
