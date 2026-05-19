"""
规则化审批流程相关 schemas。
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

APPROVAL_FLOW_TYPE_LABELS = {
    "recruitment_request": "招聘申请",
    "regularization_application": "转正申请",
    "social_insurance_application": "社保申请",
    "promotion_application": "晋升申请",
    "appointment_interview_record": "任命访谈记录",
}

APPROVER_SOURCE_TYPE_LABELS = {
    "responsibility_code": "职责绑定",
    "user_ids": "指定人员",
    "position": "岗位匹配",
}

RESPONSIBILITY_CODE_LABELS = {
    "department_head": "部门负责人",
    "department_manager": "部门主管",
    "vice_principal": "副校长",
    "principal": "校长",
    "hr": "集团人力资源部",
    "hr_director": "人资总监",
    "biz_director": "业务条线总监",
    "chairman": "董事长",
}


class ApprovalWorkflowUserOut(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None


class OrgResponsibilityBindingBase(BaseModel):
    responsibility_code: str = Field(..., min_length=1, max_length=50)
    responsibility_name: str = Field(..., min_length=1, max_length=100)
    campus_scope: Optional[str] = Field(None, max_length=100)
    department_scope: Optional[str] = Field(None, max_length=100)
    position_scope: Optional[str] = Field(None, max_length=100)
    user_id: int = Field(..., gt=0)
    sort_order: int = Field(0, ge=0)
    is_primary: bool = True
    is_active: bool = True
    notes: Optional[str] = None


class OrgResponsibilityBindingCreate(OrgResponsibilityBindingBase):
    pass


class OrgResponsibilityBindingUpdate(BaseModel):
    responsibility_code: Optional[str] = Field(None, min_length=1, max_length=50)
    responsibility_name: Optional[str] = Field(None, min_length=1, max_length=100)
    campus_scope: Optional[str] = Field(None, max_length=100)
    department_scope: Optional[str] = Field(None, max_length=100)
    position_scope: Optional[str] = Field(None, max_length=100)
    user_id: Optional[int] = Field(None, gt=0)
    sort_order: Optional[int] = Field(None, ge=0)
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class OrgResponsibilityBindingOut(BaseModel):
    id: int
    responsibility_code: str
    responsibility_name: str
    campus_scope: Optional[str] = None
    department_scope: Optional[str] = None
    position_scope: Optional[str] = None
    user_id: int
    user_name: str
    user_department: Optional[str] = None
    user_position: Optional[str] = None
    user_campus: Optional[str] = None
    sort_order: int
    is_primary: bool
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ApprovalFlowTemplateNodeBase(BaseModel):
    stage: str = Field(..., min_length=1, max_length=50)
    stage_label: Optional[str] = Field(None, max_length=100)
    node_order: int = Field(..., ge=1)
    approver_source_type: str = Field(..., min_length=1, max_length=50)
    approver_source_value: Optional[str] = Field(None, max_length=255)
    is_required: bool = True
    allow_multi_approver: bool = False
    applicant_selectable: bool = True


class ApprovalFlowTemplateNodeCreate(ApprovalFlowTemplateNodeBase):
    pass


class ApprovalFlowTemplateNodeOut(ApprovalFlowTemplateNodeBase):
    id: int
    created_at: datetime
    updated_at: datetime


class ApprovalFlowTemplateBase(BaseModel):
    flow_type: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)
    apply_department: Optional[str] = Field(None, max_length=100)
    apply_position: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    priority: int = Field(100, ge=0)
    is_active: bool = True
    nodes: List[ApprovalFlowTemplateNodeCreate] = Field(default_factory=list)


class ApprovalFlowTemplateCreate(ApprovalFlowTemplateBase):
    pass


class ApprovalFlowTemplateUpdate(BaseModel):
    flow_type: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    campus: Optional[str] = Field(None, max_length=100)
    apply_department: Optional[str] = Field(None, max_length=100)
    apply_position: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    priority: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    nodes: Optional[List[ApprovalFlowTemplateNodeCreate]] = None


class ApprovalFlowTemplateOut(BaseModel):
    id: int
    flow_type: str
    name: str
    campus: Optional[str] = None
    apply_department: Optional[str] = None
    apply_position: Optional[str] = None
    description: Optional[str] = None
    priority: int
    is_active: bool
    nodes: List[ApprovalFlowTemplateNodeOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ApprovalFlowPreviewInput(BaseModel):
    flow_type: str = Field(..., min_length=1, max_length=50)
    campus: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)


class ApprovalFlowPreviewStageOut(BaseModel):
    stage: str
    stage_label: str
    node_order: int
    approver_source_type: str
    approver_source_value: Optional[str] = None
    recommended_user_ids: List[int] = Field(default_factory=list)
    approvers: List[ApprovalWorkflowUserOut] = Field(default_factory=list)
    is_required: bool
    allow_multi_approver: bool
    applicant_selectable: bool


class ApprovalFlowPreviewOut(BaseModel):
    flow_type: str
    flow_type_label: str
    template_id: Optional[int] = None
    template_name: Optional[str] = None
    resolved_by: str
    stages: List[ApprovalFlowPreviewStageOut] = Field(default_factory=list)
