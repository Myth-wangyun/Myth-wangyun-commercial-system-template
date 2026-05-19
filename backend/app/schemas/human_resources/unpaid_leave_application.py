"""
集团人资基础 - 停薪留职申请 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

UNPAID_LEAVE_APPROVAL_STAGES = [
    "department_head",
    "biz_director",
    "hr",
    "chairman",
]

UNPAID_LEAVE_STAGE_LABELS = {
    "department_head": "部门主管",
    "biz_director": "业务条线总监",
    "hr": "人资部",
    "chairman": "董事长",
}

UNPAID_LEAVE_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

UNPAID_LEAVE_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class UnpaidLeaveCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class UnpaidLeaveApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[UnpaidLeaveCurrentApproverOut] = Field(default_factory=list)


class UnpaidLeaveApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class UnpaidLeaveApplicationActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class UnpaidLeaveApprovalActionOut(BaseModel):
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


class UnpaidLeaveApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[UnpaidLeaveCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class UnpaidLeaveNotificationOut(BaseModel):
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


class UnpaidLeaveApplicationBase(BaseModel):
    fill_date: date
    campus: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    entry_date: date
    birth_date: Optional[date] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    home_address: Optional[str] = None
    current_address: Optional[str] = None
    reason: str = Field(..., min_length=1)
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class UnpaidLeaveApplicationCreate(UnpaidLeaveApplicationBase):
    pass


class UnpaidLeaveApplicationUpdate(BaseModel):
    fill_date: Optional[date] = None
    campus: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    entry_date: Optional[date] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    home_address: Optional[str] = None
    current_address: Optional[str] = None
    reason: Optional[str] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class UnpaidLeaveApplicationOut(UnpaidLeaveApplicationBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    department_head_opinion: Optional[str] = None
    department_head_passed: Optional[bool] = None
    biz_director_opinion: Optional[str] = None
    biz_director_passed: Optional[bool] = None
    hr_opinion: Optional[str] = None
    hr_passed: Optional[bool] = None
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
    current_approvers: List[UnpaidLeaveCurrentApproverOut] = Field(default_factory=list)
    approval_flow: List[UnpaidLeaveApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[UnpaidLeaveApprovalActionOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
