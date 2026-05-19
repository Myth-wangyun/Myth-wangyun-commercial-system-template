"""
集团人资基础 - 任命访谈记录表 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import appointment_interview_record as crud
from .....models.user import User
from .....schemas.human_resources import (
    AppointmentInterviewApprovalActionPayload,
    AppointmentInterviewApprovalPreviewInput,
    AppointmentInterviewApproverCandidateOut,
    AppointmentInterviewRecordCreate,
    AppointmentInterviewRecordOut,
    AppointmentInterviewRecordUpdate,
)
from .....services.approvals import approval_stream_broker

router = APIRouter()


@router.get(
    "/appointment-interview-records",
    response_model=List[AppointmentInterviewRecordOut],
    summary="获取任命访谈记录列表",
)
def list_appointment_interview_records(
    status: Optional[str] = Query(None, description="按状态过滤"),
    search: Optional[str] = Query(None, description="按神殿/访谈人员/被访谈人员/地点搜索"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items = crud.list_records(db, current_user=current_user, status=status, search=search)
    return [crud.serialize_record(item, current_user, db) for item in items]


@router.post(
    "/appointment-interview-records",
    response_model=AppointmentInterviewRecordOut,
    summary="创建任命访谈记录",
)
def create_appointment_interview_record(
    payload: AppointmentInterviewRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_record(db, payload, current_user)
        return crud.serialize_record(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/appointment-interview-records/approver-preview",
    response_model=List[AppointmentInterviewApproverCandidateOut],
    summary="预览任命访谈记录审批人候选",
)
def preview_appointment_interview_record_approvers(
    payload: AppointmentInterviewApprovalPreviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.build_approver_candidate_preview(
            db,
            campus=payload.campus,
            created_by_user_id=current_user.user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/appointment-interview-records/{record_id}",
    response_model=AppointmentInterviewRecordOut,
    summary="获取任命访谈记录详情",
)
def get_appointment_interview_record(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="任命访谈记录不存在")
    if not crud.can_view_record(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该记录")
    return crud.serialize_record(record, current_user, db)


@router.put(
    "/appointment-interview-records/{record_id}",
    response_model=AppointmentInterviewRecordOut,
    summary="更新任命访谈记录",
)
def update_appointment_interview_record(
    record_id: int = Path(..., description="记录ID"),
    payload: AppointmentInterviewRecordUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="任命访谈记录不存在")
    try:
        updated = crud.update_record(db, record, payload, current_user)
        return crud.serialize_record(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/appointment-interview-records/{record_id}",
    summary="删除任命访谈记录",
)
def delete_appointment_interview_record(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="任命访谈记录不存在")
    try:
        crud.delete_record(db, record, current_user)
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/appointment-interview-records/{record_id}/submit",
    response_model=AppointmentInterviewRecordOut,
    summary="提交任命访谈记录审批",
)
def submit_appointment_interview_record(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="任命访谈记录不存在")
    try:
        updated = crud.submit_record(db, record, current_user)
        approval_stream_broker.touch()
        return crud.serialize_record(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/appointment-interview-records/{record_id}/approve",
    response_model=AppointmentInterviewRecordOut,
    summary="审批通过任命访谈记录",
)
def approve_appointment_interview_record(
    record_id: int = Path(..., description="记录ID"),
    payload: AppointmentInterviewApprovalActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="任命访谈记录不存在")
    try:
        updated = crud.approve_record(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_record(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/appointment-interview-records/{record_id}/reject",
    response_model=AppointmentInterviewRecordOut,
    summary="驳回任命访谈记录",
)
def reject_appointment_interview_record(
    record_id: int = Path(..., description="记录ID"),
    payload: AppointmentInterviewApprovalActionPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="任命访谈记录不存在")
    try:
        updated = crud.reject_record(db, record, current_user, comment=payload.comment)
        approval_stream_broker.touch()
        return crud.serialize_record(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
