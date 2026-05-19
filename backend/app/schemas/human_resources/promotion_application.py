"""
集团人资基础 - 晋升申请 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

PROMOTION_APPROVAL_STAGES = [
    "department_manager",
    "principal",
    "biz_director",
    "hr_director",
    "chairman",
]

PROMOTION_STAGE_LABELS = {
    "department_manager": "部门主管",
    "principal": "校长",
    "biz_director": "业务条线总监",
    "hr_director": "人资总监",
    "chairman": "董事长",
}

PROMOTION_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

PROMOTION_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class PromotionApprovalConfigApproverOut(BaseModel):
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


class PromotionApprovalConfigUpsert(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    apply_department: Optional[str] = Field(None, max_length=100)
    apply_position: Optional[str] = Field(None, max_length=100)
    stage: str = Field(..., max_length=50)
    approver_user_ids: List[int] = Field(default_factory=list)
    is_active: bool = True


class PromotionApprovalConfigOut(BaseModel):
    id: int
    campus: str
    apply_department: Optional[str] = None
    apply_position: Optional[str] = None
    stage: str
    stage_label: str
    is_active: bool
    approvers: List[PromotionApprovalConfigApproverOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class PromotionCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class PromotionApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)


class PromotionApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[PromotionCurrentApproverOut] = Field(default_factory=list)


class PromotionApplicationActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)
    original_level: Optional[str] = Field(None, max_length=100)
    original_salary: Optional[float] = None
    promoted_level: Optional[str] = Field(None, max_length=100)
    promoted_base_salary: Optional[float] = None
    promoted_performance_salary: Optional[float] = None
    promoted_salary: Optional[float] = None


class PromotionApprovalActionOut(BaseModel):
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


class PromotionApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[PromotionCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class PromotionNotificationOut(BaseModel):
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


class PromotionApplicationBase(BaseModel):
    fill_date: date
    campus: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    native_place: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=100)
    entry_date: date
    department: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    work_overview: str = Field(..., min_length=1)
    promotion_reason: str = Field(..., min_length=1)
    confidence_and_expectation: str = Field(..., min_length=1)
    original_level: Optional[str] = Field(None, max_length=100)
    original_salary: Optional[float] = None
    promoted_level: Optional[str] = Field(None, max_length=100)
    promoted_base_salary: Optional[float] = None
    promoted_performance_salary: Optional[float] = None
    promoted_salary: Optional[float] = None
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class PromotionApplicationCreate(PromotionApplicationBase):
    pass


class PromotionApplicationUpdate(BaseModel):
    fill_date: Optional[date] = None
    campus: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=100)
    native_place: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=100)
    entry_date: Optional[date] = None
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    work_overview: Optional[str] = None
    promotion_reason: Optional[str] = None
    confidence_and_expectation: Optional[str] = None
    original_level: Optional[str] = Field(None, max_length=100)
    original_salary: Optional[float] = None
    promoted_level: Optional[str] = Field(None, max_length=100)
    promoted_base_salary: Optional[float] = None
    promoted_performance_salary: Optional[float] = None
    promoted_salary: Optional[float] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class PromotionApplicationOut(PromotionApplicationBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    department_manager_opinion: Optional[str] = None
    department_manager_passed: Optional[bool] = None
    principal_opinion: Optional[str] = None
    principal_passed: Optional[bool] = None
    biz_director_opinion: Optional[str] = None
    biz_director_passed: Optional[bool] = None
    hr_director_opinion: Optional[str] = None
    hr_director_passed: Optional[bool] = None
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
    current_approvers: List[PromotionCurrentApproverOut] = Field(default_factory=list)
    approval_flow: List[PromotionApprovalFlowStepOut] = Field(default_factory=list)
    approval_actions: List[PromotionApprovalActionOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
