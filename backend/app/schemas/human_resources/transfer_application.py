"""
集团人资基础 - 调岗申请 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

TRANSFER_APPROVAL_STAGES = [
    "out_department_manager",
    "hr_first_review",
    "in_department_manager",
    "biz_director",
    "hr_final_review",
    "chairman",
]

TRANSFER_STAGE_LABELS = {
    "out_department_manager": "调出部门主管",
    "hr_first_review": "人资部初审",
    "in_department_manager": "调入部门意见",
    "biz_director": "业务条线总监",
    "hr_final_review": "人资部终审",
    "chairman": "董事长",
}

TRANSFER_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

TRANSFER_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class TransferCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class TransferApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[TransferCurrentApproverOut] = Field(default_factory=list)


class TransferApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    target_department: str = Field(..., min_length=1, max_length=100)
    target_position: str = Field(..., min_length=1, max_length=100)


class TransferApplicationActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)
    new_base_salary: Optional[float] = None
    new_performance_salary: Optional[float] = None
    new_salary: Optional[float] = None


class TransferApprovalActionOut(BaseModel):
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


class TransferApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[TransferCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class TransferNotificationOut(BaseModel):
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


class TransferApplicationBase(BaseModel):
    apply_date: date
    campus: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    entry_date: date
    original_salary: Optional[float] = None
    target_department: str = Field(..., min_length=1, max_length=100)
    target_position: str = Field(..., min_length=1, max_length=100)
    new_base_salary: Optional[float] = None
    new_performance_salary: Optional[float] = None
    new_salary: Optional[float] = None
    reason: str = Field(..., min_length=1)
    applicant_name: Optional[str] = Field(None, max_length=100)
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class TransferApplicationCreate(TransferApplicationBase):
    pass


class TransferApplicationUpdate(BaseModel):
    apply_date: Optional[date] = None
    campus: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    entry_date: Optional[date] = None
    original_salary: Optional[float] = None
    target_department: Optional[str] = Field(None, max_length=100)
    target_position: Optional[str] = Field(None, max_length=100)
    new_base_salary: Optional[float] = None
    new_performance_salary: Optional[float] = None
    new_salary: Optional[float] = None
    reason: Optional[str] = None
    applicant_name: Optional[str] = Field(None, max_length=100)
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class TransferApplicationOut(TransferApplicationBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    out_department_manager_opinion: Optional[str] = None
    out_department_manager_passed: Optional[bool] = None
    hr_first_review_opinion: Optional[str] = None
    hr_first_review_passed: Optional[bool] = None
    in_department_manager_opinion: Optional[str] = None
    in_department_manager_passed: Optional[bool] = None
    biz_director_opinion: Optional[str] = None
    biz_director_passed: Optional[bool] = None
    hr_final_review_opinion: Optional[str] = None
    hr_final_review_passed: Optional[bool] = None
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
    current_approvers: List[TransferCurrentApproverOut] = Field(default_factory=list)
    approval_flow: List[TransferApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[TransferApprovalActionOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
