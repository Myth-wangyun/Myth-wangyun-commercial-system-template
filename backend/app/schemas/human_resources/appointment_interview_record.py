"""
集团人资基础 - 任命访谈记录表 schemas
"""

from datetime import date, datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

APPOINTMENT_INTERVIEW_APPROVAL_STAGES = [
    "principal",
    "hr_director",
]

APPOINTMENT_INTERVIEW_STAGE_LABELS = {
    "principal": "校长意见",
    "hr_director": "人资意见",
    "chairman": "董事长意见",
}

APPOINTMENT_INTERVIEW_STATUS_LABELS = {
    "draft": "草稿",
    "pending": "审批中",
    "approved": "已通过",
    "rejected": "已驳回",
}

APPOINTMENT_INTERVIEW_FLOW_STATUS_LABELS = {
    "completed": "已通过",
    "current": "审批中",
    "rejected": "已驳回",
    "waiting": "待审批",
}

AppointmentInterviewRecordStatus = Literal["draft", "pending", "approved", "rejected"]


class AppointmentInterviewApprovalInfo(BaseModel):
    opinion: Optional[str] = None
    signer: Optional[str] = Field(None, max_length=100)
    sign_date: Optional[date] = None


class AppointmentInterviewCurrentApproverOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class AppointmentInterviewApprovalPreviewInput(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)


class AppointmentInterviewApproverCandidateOut(BaseModel):
    stage: str
    stage_label: str
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[AppointmentInterviewCurrentApproverOut] = Field(
        default_factory=list
    )
    allow_multi_approver: bool = False
    applicant_selectable: bool = True


class AppointmentInterviewApprovalActionPayload(BaseModel):
    comment: str = Field(..., min_length=1, max_length=2000)


class AppointmentInterviewApprovalActionOut(BaseModel):
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


class AppointmentInterviewApprovalFlowStepOut(BaseModel):
    stage: str
    stage_label: str
    status: str
    status_label: str
    approvers: List[AppointmentInterviewCurrentApproverOut] = Field(
        default_factory=list
    )
    action: Optional[str] = None
    action_label: Optional[str] = None
    acted_by_user_id: Optional[int] = None
    acted_by_name: Optional[str] = None
    comment: Optional[str] = None
    acted_at: Optional[datetime] = None


class AppointmentInterviewNotificationOut(BaseModel):
    id: int
    record_id: int
    record_no: str
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


class AppointmentInterviewRecordBase(BaseModel):
    campus: str = Field(..., min_length=1, max_length=100)
    interviewer: str = Field(..., min_length=1, max_length=100)
    interviewee: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    interview_date: date
    answers: List[str] = Field(default_factory=list)
    suggestions: Optional[str] = None
    self_sign: AppointmentInterviewApprovalInfo = Field(
        default_factory=AppointmentInterviewApprovalInfo
    )
    selected_approver_user_ids: Dict[str, List[int]] = Field(default_factory=dict)


class AppointmentInterviewRecordCreate(AppointmentInterviewRecordBase):
    pass


class AppointmentInterviewRecordUpdate(BaseModel):
    campus: Optional[str] = Field(None, min_length=1, max_length=100)
    interviewer: Optional[str] = Field(None, min_length=1, max_length=100)
    interviewee: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    interview_date: Optional[date] = None
    answers: Optional[List[str]] = None
    suggestions: Optional[str] = None
    self_sign: Optional[AppointmentInterviewApprovalInfo] = None
    selected_approver_user_ids: Optional[Dict[str, List[int]]] = None


class AppointmentInterviewRecordOut(AppointmentInterviewRecordBase):
    id: int
    principal_approval: AppointmentInterviewApprovalInfo = Field(
        default_factory=AppointmentInterviewApprovalInfo
    )
    principal_passed: Optional[bool] = None
    hr_approval: AppointmentInterviewApprovalInfo = Field(
        default_factory=AppointmentInterviewApprovalInfo
    )
    hr_passed: Optional[bool] = None
    chairman_approval: AppointmentInterviewApprovalInfo = Field(
        default_factory=AppointmentInterviewApprovalInfo
    )
    chairman_passed: Optional[bool] = None
    status: AppointmentInterviewRecordStatus
    status_label: str
    current_stage: Optional[str] = None
    current_stage_label: Optional[str] = None
    rejection_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    can_edit: bool = False
    can_delete: bool = False
    can_submit: bool = False
    can_approve: bool = False
    current_approvers: List[AppointmentInterviewCurrentApproverOut] = Field(
        default_factory=list
    )
    approval_flow: List[AppointmentInterviewApprovalFlowStepOut] = Field(
        default_factory=list
    )
    approval_actions: List[AppointmentInterviewApprovalActionOut] = Field(
        default_factory=list
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
