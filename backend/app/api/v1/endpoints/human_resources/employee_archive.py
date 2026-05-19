from datetime import date
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.crud.human_resources import employee_archive as crud
from app.models.user import User
from app.schemas.human_resources.employee_archive import (
    EmployeeArchiveChangeLogOut,
    EmployeeArchiveOptionsOut,
    EmployeeArchiveOut,
    EmployeeArchiveUpsert,
)

from app.api.v1.endpoints.human_resources._dashboard_refresh import (
    schedule_scope_dashboard_chain_refresh,
)

router = APIRouter()


@router.get(
    "/employee-archives/hq",
    response_model=list[EmployeeArchiveOut],
    summary="获取最高议事厅员工档案完整字段列表",
)
def list_hq_employee_archives(
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    include_inactive: bool = Query(True, description="是否包含离职/未激活员工"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rows = crud.list_employee_archives(
        db,
        keyword=keyword,
        include_inactive=include_inactive,
    )
    return [
        crud.serialize_employee_archive(db, user, profile, current_user)
        for user, profile in rows
    ]


@router.get(
    "/employee-archives/hq/options",
    response_model=EmployeeArchiveOptionsOut,
    summary="获取最高议事厅员工档案候选项",
)
def get_hq_employee_archive_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return crud.get_archive_options(db)


@router.get(
    "/employee-archives/hq/{user_id}/change-logs",
    response_model=list[EmployeeArchiveChangeLogOut],
    summary="获取最高议事厅员工档案关键字段变更记录",
)
def list_hq_employee_archive_change_logs(
    user_id: int = Path(..., description="用户ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.list_employee_archive_change_logs(
            db,
            user_id=user_id,
            current_user=current_user,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put(
    "/employee-archives/hq/{user_id}",
    response_model=EmployeeArchiveOut,
    summary="更新最高议事厅员工档案完整字段",
)
def update_hq_employee_archive(
    background_tasks: BackgroundTasks,
    user_id: int = Path(..., description="用户ID"),
    payload: EmployeeArchiveUpsert = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        user, profile = crud.upsert_employee_archive(db, user_id, payload, current_user)
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            scope="hq",
            anchor_date=user.entry_date.date() if user.entry_date else date.today(),
            source="hq_employee_archive",
        )
        return crud.serialize_employee_archive(db, user, profile, current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
