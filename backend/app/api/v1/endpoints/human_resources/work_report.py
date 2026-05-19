"""
集团人资基础 - 转正述职报告 API
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.crud.human_resources import work_report as crud
from app.models.user import User
from app.schemas.human_resources.work_report import (
    WorkReportCreate,
    WorkReportOut,
    WorkReportStatusOut,
    WorkReportUpdate,
)

router = APIRouter()


@router.get(
    "/work-reports",
    response_model=list[WorkReportOut],
    summary="获取述职报告列表",
)
def list_work_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    records = crud.list_records(db, current_user)
    return [crud.serialize_record(record, current_user, db) for record in records]


@router.get(
    "/work-reports/my-status",
    response_model=WorkReportStatusOut,
    summary="获取当前用户述职报告状态",
)
def get_my_work_report_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.get_current_user_report_status(db, current_user)


@router.get(
    "/work-reports/{record_id}",
    response_model=WorkReportOut,
    summary="获取述职报告详情",
)
def get_work_report(
    record_id: int = Path(..., description="述职报告ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="述职报告不存在")
    if not crud.can_view_record(db, record, current_user):
        raise HTTPException(status_code=403, detail="无权查看该述职报告")
    return crud.serialize_record(record, current_user, db)


@router.post(
    "/work-reports",
    response_model=WorkReportOut,
    summary="创建述职报告",
)
def create_work_report(
    payload: WorkReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_record(db, payload, current_user)
        return crud.serialize_record(record, current_user, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put(
    "/work-reports/{record_id}",
    response_model=WorkReportOut,
    summary="更新述职报告",
)
def update_work_report(
    record_id: int = Path(..., description="述职报告ID"),
    payload: WorkReportUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="述职报告不存在")
    try:
        updated = crud.update_record(db, record, payload, current_user)
        return crud.serialize_record(updated, current_user, db)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.delete(
    "/work-reports/{record_id}",
    summary="删除述职报告",
)
def delete_work_report(
    record_id: int = Path(..., description="述职报告ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="述职报告不存在")
    try:
        crud.delete_record(db, record, current_user)
        return {"success": True}
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
