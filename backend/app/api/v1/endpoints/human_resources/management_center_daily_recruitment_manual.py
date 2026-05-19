from datetime import date
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.human_resources import management_center_daily_recruitment_manual as crud
from .....models.user import User
from .....schemas.human_resources import (
    ManagementCenterDailyRecruitmentManualOut,
    ManagementCenterDailyRecruitmentManualUpsert,
)

from ._dashboard_refresh import schedule_scope_dashboard_chain_refresh

router = APIRouter()


def _resolve_month_range(month: str) -> tuple[date, date]:
    start_date = date.fromisoformat(f"{month}-01")
    if start_date.month == 12:
        end_date = date(start_date.year + 1, 1, 1)
    else:
        end_date = date(start_date.year, start_date.month + 1, 1)
    return start_date, end_date


@router.get(
    "/management-center-daily-recruitment-manuals",
    response_model=List[ManagementCenterDailyRecruitmentManualOut],
    summary="获取最高议事厅日度招聘及入职手填数据",
)
def list_management_center_daily_recruitment_manuals(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$", description="月份，格式 YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    start_date, end_date = _resolve_month_range(month)
    return crud.list_records(db, start_date=start_date, end_date=end_date)


@router.put(
    "/management-center-daily-recruitment-manuals",
    response_model=ManagementCenterDailyRecruitmentManualOut,
    summary="新增或更新最高议事厅日度招聘及入职手填数据",
)
def upsert_management_center_daily_recruitment_manual(
    background_tasks: BackgroundTasks,
    payload: ManagementCenterDailyRecruitmentManualUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = crud.upsert_record(db, payload, current_user)
    schedule_scope_dashboard_chain_refresh(
        background_tasks,
        scope="hq",
        anchor_date=payload.stat_date,
        source="management_center_daily_recruitment_manual",
    )
    return record
