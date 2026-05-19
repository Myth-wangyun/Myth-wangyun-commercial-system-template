from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.crud.human_resources import dashboard as crud
from app.models.user import User
from app.schemas.human_resources.dashboard import (
    DashboardDailyOut,
    DashboardManualRecruitmentDailyOut,
    DashboardManualRecruitmentDailyUpsert,
    DashboardMonthlyOut,
    DashboardYearlyOut,
    PerformanceFactCreate,
    PerformanceFactOut,
    PerformanceFactUpdate,
    SalaryWelfareFactCreate,
    SalaryWelfareFactOut,
    SalaryWelfareFactUpdate,
)
from app.schemas.human_resources.employee_archive import (
    EmployeeArchiveChangeLogOut,
    EmployeeArchiveOptionsOut,
    EmployeeArchiveOut,
    EmployeeArchiveUpsert,
)

from ._dashboard_refresh import schedule_scope_dashboard_chain_refresh

router = APIRouter()


def _month_anchor(month: str) -> date:
    return datetime.strptime(f"{month}-01", "%Y-%m-%d").date()


def _year_anchor(year: str) -> date:
    return date(int(year), 1, 1)


@router.get(
    "/dashboard/employee-archive",
    response_model=list[EmployeeArchiveOut],
    summary="获取指定业务线员工档案完整字段",
)
def list_dashboard_employee_archives(
    scope: str = Query(..., description="hq/offline/online"),
    keyword: Optional[str] = Query(None),
    include_inactive: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return crud.list_employee_archives(
        db,
        scope=scope,
        keyword=keyword,
        include_inactive=include_inactive,
        current_user=current_user,
    )


@router.get(
    "/dashboard/employee-archive/options",
    response_model=EmployeeArchiveOptionsOut,
    summary="获取指定业务线员工档案候选项",
)
def get_dashboard_employee_archive_options(
    scope: str = Query(..., description="hq/offline/online"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return crud.get_employee_archive_options(db, scope=scope)


@router.get(
    "/dashboard/employee-archive/{user_id}/change-logs",
    response_model=list[EmployeeArchiveChangeLogOut],
    summary="获取指定业务线员工档案关键字段变更记录",
)
def list_dashboard_employee_archive_change_logs(
    user_id: int = Path(...),
    scope: str = Query(..., description="hq/offline/online"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return crud.list_employee_archive_change_logs(
            db,
            scope=scope,
            user_id=user_id,
            current_user=current_user,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put(
    "/dashboard/employee-archive/{user_id}",
    response_model=EmployeeArchiveOut,
    summary="更新指定业务线员工档案完整字段",
)
def update_dashboard_employee_archive(
    background_tasks: BackgroundTasks,
    user_id: int = Path(...),
    scope: str = Query(..., description="hq/offline/online"),
    payload: EmployeeArchiveUpsert = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        result = crud.update_employee_archive(
            db,
            scope=scope,
            user_id=user_id,
            payload=payload,
            current_user=current_user,
        )
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            scope=scope,
            anchor_date=date.today(),
            source="dashboard_employee_archive",
        )
        return result
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/dashboard/daily", response_model=DashboardDailyOut, summary="获取业务线日度看板数据")
def get_dashboard_daily(
    background_tasks: BackgroundTasks,
    scope: str = Query(..., description="hq/offline/online"),
    month: str = Query(..., description="YYYY-MM"),
    rebuild: bool = Query(False, description="强制重建缓存"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    try:
        if rebuild:
            return crud.rebuild_daily_dashboard(
                db,
                scope=scope,
                month=month,
                source="dashboard_daily_rebuild",
            )
        cached = crud.read_daily_dashboard(db, scope=scope, month=month)
        if cached is not None:
            if crud.is_dashboard_dirty(
                db,
                scope=scope,
                granularity="daily",
                period=month,
            ):
                schedule_scope_dashboard_chain_refresh(
                    background_tasks,
                    scope=scope,
                    anchor_date=_month_anchor(month),
                    source="dashboard_daily_stale",
                )
            return cached
        return crud.rebuild_daily_dashboard(
            db,
            scope=scope,
            month=month,
            source="dashboard_daily_miss",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/dashboard/monthly", response_model=DashboardMonthlyOut, summary="获取业务线月度看板数据")
def get_dashboard_monthly(
    background_tasks: BackgroundTasks,
    scope: str = Query(..., description="hq/offline/online"),
    year: str = Query(..., description="YYYY"),
    rebuild: bool = Query(False, description="强制重建缓存"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    try:
        if rebuild:
            return crud.rebuild_monthly_dashboard(
                db,
                scope=scope,
                year=year,
                source="dashboard_monthly_rebuild",
            )
        cached = crud.read_monthly_dashboard(db, scope=scope, year=year)
        if cached is not None:
            if crud.is_dashboard_dirty(
                db,
                scope=scope,
                granularity="monthly",
                period=year,
            ):
                schedule_scope_dashboard_chain_refresh(
                    background_tasks,
                    scope=scope,
                    anchor_date=_year_anchor(year),
                    source="dashboard_monthly_stale",
                )
            return cached
        return crud.rebuild_monthly_dashboard(
            db,
            scope=scope,
            year=year,
            source="dashboard_monthly_miss",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/dashboard/annual", response_model=DashboardYearlyOut, summary="获取业务线年度看板数据")
def get_dashboard_annual(
    background_tasks: BackgroundTasks,
    scope: str = Query(..., description="hq/offline/online"),
    year: str = Query(..., description="YYYY"),
    rebuild: bool = Query(False, description="强制重建缓存"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    try:
        if rebuild:
            return crud.rebuild_yearly_dashboard(
                db,
                scope=scope,
                year=year,
                source="dashboard_yearly_rebuild",
            )
        cached = crud.read_yearly_dashboard(db, scope=scope, year=year)
        if cached is not None:
            if crud.is_dashboard_dirty(
                db,
                scope=scope,
                granularity="yearly",
                period=year,
            ):
                schedule_scope_dashboard_chain_refresh(
                    background_tasks,
                    scope=scope,
                    anchor_date=_year_anchor(year),
                    source="dashboard_yearly_stale",
                )
            return cached
        return crud.rebuild_yearly_dashboard(
            db,
            scope=scope,
            year=year,
            source="dashboard_yearly_miss",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/dashboard/manual/recruitment-daily",
    response_model=list[DashboardManualRecruitmentDailyOut],
    summary="获取招聘手填日事实",
)
def list_dashboard_manual_recruitment_daily(
    scope: str = Query(..., description="hq/offline/online"),
    month: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    start_date = _month_anchor(month)
    if start_date.month == 12:
        end_date = date(start_date.year + 1, 1, 1) - date.resolution
    else:
        end_date = date(start_date.year, start_date.month + 1, 1) - date.resolution
    rows = crud.list_manual_recruitment_entries(
        db,
        scope=scope,
        start_date=start_date,
        end_date=end_date,
    )
    return [crud.serialize_manual_recruitment_entry(item) for item in rows]


@router.post(
    "/dashboard/manual/recruitment-daily",
    response_model=DashboardManualRecruitmentDailyOut,
    summary="保存招聘手填日事实",
)
def upsert_dashboard_manual_recruitment_daily(
    background_tasks: BackgroundTasks,
    payload: DashboardManualRecruitmentDailyUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.upsert_manual_recruitment_entry(
        db,
        payload=payload,
        current_user=current_user,
    )
    schedule_scope_dashboard_chain_refresh(
        background_tasks,
        scope=payload.scope,
        anchor_date=payload.stat_date,
        source="dashboard_manual_recruitment",
    )
    return crud.serialize_manual_recruitment_entry(record)


@router.get("/salary-welfare-facts", response_model=list[SalaryWelfareFactOut], summary="获取薪酬福利事实")
def list_salary_welfare_facts(
    scope: str = Query(..., description="hq/offline/online"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    org_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    rows = crud.list_salary_welfare_facts(
        db,
        scope=scope,
        start_date=start_date,
        end_date=end_date,
        org_name=org_name,
    )
    return [crud.serialize_salary_welfare_fact(item) for item in rows]


@router.post("/salary-welfare-facts", response_model=SalaryWelfareFactOut, summary="创建薪酬福利事实")
def create_salary_welfare_fact(
    background_tasks: BackgroundTasks,
    payload: SalaryWelfareFactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.create_salary_welfare_fact(db, payload=payload, current_user=current_user)
    schedule_scope_dashboard_chain_refresh(
        background_tasks,
        scope=payload.scope,
        anchor_date=payload.stat_date,
        source="salary_welfare_create",
    )
    return crud.serialize_salary_welfare_fact(record)


@router.put("/salary-welfare-facts/{record_id}", response_model=SalaryWelfareFactOut, summary="更新薪酬福利事实")
def update_salary_welfare_fact(
    background_tasks: BackgroundTasks,
    record_id: int = Path(...),
    payload: SalaryWelfareFactUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_salary_welfare_fact(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="薪酬福利事实不存在")
    updated = crud.update_salary_welfare_fact(
        db,
        record=record,
        payload=payload,
        current_user=current_user,
    )
    schedule_scope_dashboard_chain_refresh(
        background_tasks,
        scope=updated.scope,
        anchor_date=updated.stat_date,
        source="salary_welfare_update",
    )
    return crud.serialize_salary_welfare_fact(updated)


@router.get("/performance-facts", response_model=list[PerformanceFactOut], summary="获取绩效事实")
def list_performance_facts(
    scope: str = Query(..., description="hq/offline/online"),
    start_month: Optional[date] = Query(None),
    end_month: Optional[date] = Query(None),
    org_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    rows = crud.list_performance_facts(
        db,
        scope=scope,
        start_month=start_month,
        end_month=end_month,
        org_name=org_name,
    )
    return [crud.serialize_performance_fact(item) for item in rows]


@router.post("/performance-facts", response_model=PerformanceFactOut, summary="创建绩效事实")
def create_performance_fact(
    background_tasks: BackgroundTasks,
    payload: PerformanceFactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.create_performance_fact(db, payload=payload, current_user=current_user)
    schedule_scope_dashboard_chain_refresh(
        background_tasks,
        scope=payload.scope,
        anchor_date=payload.stat_month,
        source="performance_create",
    )
    return crud.serialize_performance_fact(record)


@router.put("/performance-facts/{record_id}", response_model=PerformanceFactOut, summary="更新绩效事实")
def update_performance_fact(
    background_tasks: BackgroundTasks,
    record_id: int = Path(...),
    payload: PerformanceFactUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.get_performance_fact(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="绩效事实不存在")
    updated = crud.update_performance_fact(
        db,
        record=record,
        payload=payload,
        current_user=current_user,
    )
    schedule_scope_dashboard_chain_refresh(
        background_tasks,
        scope=updated.scope,
        anchor_date=updated.stat_month,
        source="performance_update",
    )
    return crud.serialize_performance_fact(updated)
