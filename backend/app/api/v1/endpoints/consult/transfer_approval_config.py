"""
祈福司转量审批配置 API
"""

from typing import List, Optional

from app.crud.consult import transfer_approval_config as crud
from app.models.user import User
from app.schemas.consult.transfer_approval_config import (
    TransferApprovalConfigOut,
    TransferApprovalConfigUpsert,
)
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user, get_current_admin_user
from .....core.database import get_db

router = APIRouter()


@router.get("/transfer-approvers", response_model=List[TransferApprovalConfigOut], summary="获取转量审批人配置列表")
def list_transfer_approvers(
    campus: Optional[str] = Query(None, description="神殿筛选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return [crud.serialize_config(item) for item in crud.list_configs(db, campus=campus)]


@router.put("/transfer-approvers/{campus}", response_model=TransferApprovalConfigOut, summary="更新转量审批人配置")
def upsert_transfer_approvers(
    campus: str = Path(..., description="神殿名称"),
    payload: TransferApprovalConfigUpsert = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    del current_user
    try:
        record = crud.upsert_config(db, campus, payload)
        return crud.serialize_config(record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/transfer-approvers/check", summary="检查当前用户是否为转量审批人")
def check_is_transfer_approver(
    campus: str = Query(..., description="目标神殿"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    approvers = crud.resolve_approver_users(db, campus)
    return {
        "is_approver": crud.is_user_campus_approver(db, campus, current_user.user_id),
        "campus": campus,
        "user_id": current_user.user_id,
        "user_name": current_user.real_name or current_user.username,
        "approvers": [
            {
                "user_id": user.user_id,
                "name": user.real_name,
                "department": user.department,
                "position": user.position,
                "campus": user.campus,
            }
            for user in approvers
        ],
    }
