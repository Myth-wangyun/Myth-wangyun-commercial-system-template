"""
集团人资基础 - 工作交接表 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

WORK_HANDOVER_APPROVAL_STAGES = [
    "department_head",
    "operations_reviewer",
    "academic_reviewer",
    "teaching_quality_reviewer",
    "chairman",
]

WORK_HANDOVER_STAGE_LABELS = {
    "department_head": "部门负责人",
    "operations_reviewer": "最高议事厅运营部总监审批",
    "academic_reviewer": "最高议事厅智慧司总监审批",
    "teaching_quality_reviewer": "最高议事厅教化司总监审批",
    "chairman": "董事长",
}

WORK_HANDOVER_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

WORK_HANDOVER_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class WorkHandoverDepartmentSection(BaseModel):
    work_handover: str = ""
    materials_handover: str = ""
    pending_items: str = ""
    work_completed: bool = False
    no_issues: bool = False
    manager_sign: str = ""
    manager_date: Optional[date] = None
    last_month: str = ""
    last_day: str = ""
    salary_sign: str = ""
    salary_date: Optional[date] = None
    receiver: str = ""
    handle_date: Optional[date] = None


class WorkHandoverFinanceSection(BaseModel):
    has_debt: bool = False
    debt_amount: Optional[float] = None
    receipt_submitted: bool = False
    receipt_count: Optional[int] = None
    finance_items: str = ""
    cashier_sign: str = ""
    cashier_date: Optional[date] = None
    account_cleared: bool = False
    items_completed: bool = False
    manager_sign: str = ""
    manager_date: Optional[date] = None


class WorkHandoverHrSection(BaseModel):
    fixed_assets: str = ""
    office_supplies: str = ""
    fingerprint: str = ""
    insurance: str = ""
    receiver: str = ""
    handle_date: Optional[date] = None
    completed: bool = False
    salary_normal: bool = False
    salary_end_year: str = ""
    salary_end_month: str = ""
    salary_end_day: str = ""
    manager_sign: str = ""
    manager_date: Optional[date] = None


class WorkHandoverCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class WorkHandoverApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[WorkHandoverCurrentApproverOut] = Field(default_factory=list)


class WorkHandoverAssigneeSuggestionOut(BaseModel):
    recommended_name: Optional[str] = None
    candidates: List[WorkHandoverCurrentApproverOut] = Field(default_factory=list)


class WorkHandoverFormAssigneePreviewOut(BaseModel):
    department_receiver: WorkHandoverAssigneeSuggestionOut = Field(
        default_factory=WorkHandoverAssigneeSuggestionOut
    )
    finance_cashier: WorkHandoverAssigneeSuggestionOut = Field(
        default_factory=WorkHandoverAssigneeSuggestionOut
    )
    finance_manager: WorkHandoverAssigneeSuggestionOut = Field(
        default_factory=WorkHandoverAssigneeSuggestionOut
    )
    hr_receiver: WorkHandoverAssigneeSuggestionOut = Field(
        default_factory=WorkHandoverAssigneeSuggestionOut
    )
    principal_sign_required: bool = True


class WorkHandoverApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class WorkHandoverActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class WorkHandoverApprovalActionOut(BaseModel):
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


class WorkHandoverApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[WorkHandoverCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class WorkHandoverNotificationOut(BaseModel):
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


class WorkHandoverBase(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    entry_date: Optional[date] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    leave_date: date
    leave_type: Optional[str] = Field(None, max_length=50)
    leave_type_other: Optional[str] = Field(None, max_length=255)
    leave_reason: List[str] = Field(default_factory=list)
    leave_reason_other: Optional[str] = Field(None, max_length=1000)
    address: Optional[str] = None
    dept_handover: WorkHandoverDepartmentSection = Field(
        default_factory=WorkHandoverDepartmentSection
    )
    finance_handover: WorkHandoverFinanceSection = Field(
        default_factory=WorkHandoverFinanceSection
    )
    hr_handover: WorkHandoverHrSection = Field(default_factory=WorkHandoverHrSection)
    all_completed: bool = False
    principal_sign: Optional[str] = Field(None, max_length=100)
    principal_date: Optional[date] = None
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class WorkHandoverCreate(WorkHandoverBase):
    pass


class WorkHandoverUpdate(BaseModel):
    campus: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    entry_date: Optional[date] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    leave_date: Optional[date] = None
    leave_type: Optional[str] = Field(None, max_length=50)
    leave_type_other: Optional[str] = Field(None, max_length=255)
    leave_reason: Optional[List[str]] = None
    leave_reason_other: Optional[str] = Field(None, max_length=1000)
    address: Optional[str] = None
    dept_handover: Optional[WorkHandoverDepartmentSection] = None
    finance_handover: Optional[WorkHandoverFinanceSection] = None
    hr_handover: Optional[WorkHandoverHrSection] = None
    all_completed: Optional[bool] = None
    principal_sign: Optional[str] = Field(None, max_length=100)
    principal_date: Optional[date] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class WorkHandoverOut(WorkHandoverBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    department_head_opinion: Optional[str] = None
    department_head_passed: Optional[bool] = None
    operations_review_opinion: Optional[str] = None
    operations_review_passed: Optional[bool] = None
    academic_review_opinion: Optional[str] = None
    academic_review_passed: Optional[bool] = None
    teaching_quality_review_opinion: Optional[str] = None
    teaching_quality_review_passed: Optional[bool] = None
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
    principal_sign_required: bool = True
    can_edit: bool = False
    can_delete: bool = False
    can_submit: bool = False
    can_approve: bool = False
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)
    current_approvers: List[WorkHandoverCurrentApproverOut] = Field(
        default_factory=list
    )
    approval_flow: List[WorkHandoverApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[WorkHandoverApprovalActionOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
