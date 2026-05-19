"""
祈福司转量审批配置 schemas
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TransferApprovalConfigApproverOut(BaseModel):
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


class TransferApprovalConfigUpsert(BaseModel):
    approver_user_ids: List[int] = Field(default_factory=list)
    is_active: bool = True


class TransferApprovalConfigOut(BaseModel):
    id: int
    campus: str
    is_active: bool
    approvers: List[TransferApprovalConfigApproverOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
