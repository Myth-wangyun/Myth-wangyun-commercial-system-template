"""
集团人资基础 - 培训申请表 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

TRAINING_APPLICATION_APPROVAL_STAGES = [
    "department_head",
    "principal",
    "group_department",
    "hr",
    "chairman",
]

TRAINING_APPLICATION_STAGE_LABELS = {
    "department_head": "申请部门意见",
    "principal": "校长意见",
    "group_department": "集团主管部门意见",
    "hr": "人事部意见",
    "chairman": "董事长意见",
}

TRAINING_APPLICATION_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

TRAINING_APPLICATION_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}


class TrainingApplicationCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class TrainingApplicationApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[TrainingApplicationCurrentApproverOut] = Field(default_factory=list)


class TrainingApplicationApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    category: Literal["思想", "业务", "管理"]
    is_internal_training: bool = False
    is_key_staff_training: bool = False
    include_chairman_approval: bool = False
    total_amount: float = Field(0, ge=0)


class TrainingApplicationActionPayload(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000)


class TrainingApplicationApprovalActionOut(BaseModel):
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


class TrainingApplicationApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[TrainingApplicationCurrentApproverOut] = Field(default_factory=list)
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class TrainingApplicationNotificationOut(BaseModel):
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


class TrainingApplicationBase(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    category: Literal["思想", "业务", "管理"]
    objective: str = Field(..., min_length=1, max_length=5000)
    trainees: str = Field(..., min_length=1, max_length=5000)
    content: str = Field(..., min_length=1, max_length=5000)
    start_date: date
    end_date: date
    total_hours: float = Field(..., ge=0)
    training_format: Literal["线上", "线下", "线上+线下"]
    exam_method: Literal["理论", "实操", "理论+实操"]
    trainer: Optional[str] = Field(None, max_length=100)
    expected_pass_rate: Optional[float] = Field(None, ge=0, le=100)
    cost_per_person: float = Field(0, ge=0)
    cost_count: int = Field(0, ge=0)
    cost_total: float = Field(0, ge=0)
    cost_other: float = Field(0, ge=0)
    is_internal_training: bool = False
    is_key_staff_training: bool = False
    include_chairman_approval: bool = False
    remark: Optional[str] = Field(None, max_length=2000)
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class TrainingApplicationCreate(TrainingApplicationBase):
    pass


class TrainingApplicationUpdate(BaseModel):
    campus: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    category: Optional[Literal["思想", "业务", "管理"]] = None
    objective: Optional[str] = Field(None, max_length=5000)
    trainees: Optional[str] = Field(None, max_length=5000)
    content: Optional[str] = Field(None, max_length=5000)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_hours: Optional[float] = Field(None, ge=0)
    training_format: Optional[Literal["线上", "线下", "线上+线下"]] = None
    exam_method: Optional[Literal["理论", "实操", "理论+实操"]] = None
    trainer: Optional[str] = Field(None, max_length=100)
    expected_pass_rate: Optional[float] = Field(None, ge=0, le=100)
    cost_per_person: Optional[float] = Field(None, ge=0)
    cost_count: Optional[int] = Field(None, ge=0)
    cost_total: Optional[float] = Field(None, ge=0)
    cost_other: Optional[float] = Field(None, ge=0)
    is_internal_training: Optional[bool] = None
    is_key_staff_training: Optional[bool] = None
    include_chairman_approval: Optional[bool] = None
    remark: Optional[str] = Field(None, max_length=2000)
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class TrainingApplicationOut(TrainingApplicationBase):
    id: int
    application_no: str
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    department_head_opinion: Optional[str] = None
    department_head_passed: Optional[bool] = None
    principal_opinion: Optional[str] = None
    principal_passed: Optional[bool] = None
    group_department_opinion: Optional[str] = None
    group_department_passed: Optional[bool] = None
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
    current_approvers: List[TrainingApplicationCurrentApproverOut] = Field(
        default_factory=list
    )
    approval_flow: List[TrainingApplicationApprovalFlowStepOut] = Field(
        default_factory=list
    )
    approval_actions: List[TrainingApplicationApprovalActionOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
