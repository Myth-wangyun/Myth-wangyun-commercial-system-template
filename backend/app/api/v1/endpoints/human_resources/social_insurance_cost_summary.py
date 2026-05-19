"""
集团人资基础 - 社保费用汇总表 API
"""

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.crud.human_resources import social_insurance_cost_summary as crud
from app.crud.human_resources.dashboard_scope import HQ_SCOPE, OFFLINE_SCOPE, ONLINE_SCOPE
from app.models.user import User
from app.schemas.human_resources.social_insurance_cost_summary import (
    SocialInsuranceCostSummaryCreate,
    SocialInsuranceCostSummaryOut,
    SocialInsuranceCostSummaryUpdate,
)

from ._dashboard_refresh import schedule_scope_dashboard_chain_refresh

router = APIRouter()


def _parse_anchor_date(period: Optional[str]) -> Optional[date]:
    if not period:
        return None
    normalized = period.strip().replace("-", ".")
    try:
        return datetime.strptime(f"{normalized}.1", "%Y.%m.%d").date()
    except ValueError:
        return None
def _refresh_cost_summary_dashboards(
    background_tasks: BackgroundTasks,
    anchor_date: Optional[date],
) -> None:
    if not anchor_date:
        return
    for scope in (HQ_SCOPE, OFFLINE_SCOPE, ONLINE_SCOPE):
        schedule_scope_dashboard_chain_refresh(
            background_tasks,
            scope=scope,
            anchor_date=anchor_date,
        )


@router.get(
    "/social-insurance-cost-summaries",
    response_model=List[SocialInsuranceCostSummaryOut],
    summary="获取社保费用汇总表列表",
)
def list_social_insurance_cost_summaries(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    search: Optional[str] = Query(None, description="按关键词过滤"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    return [
        crud.serialize_record(item)
        for item in crud.list_records(db, campus=campus, search=search)
    ]


@router.get(
    "/social-insurance-cost-summaries/{record_id}",
    response_model=SocialInsuranceCostSummaryOut,
    summary="获取社保费用汇总表详情",
)
def get_social_insurance_cost_summary(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="社保费用汇总记录不存在")
    return crud.serialize_record(record)


@router.post(
    "/social-insurance-cost-summaries",
    response_model=SocialInsuranceCostSummaryOut,
    summary="创建社保费用汇总表",
)
def create_social_insurance_cost_summary(
    payload: SocialInsuranceCostSummaryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record = crud.create_record(db, payload, current_user)
        _refresh_cost_summary_dashboards(
            background_tasks,
            _parse_anchor_date(record.period),
        )
        return crud.serialize_record(record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put(
    "/social-insurance-cost-summaries/{record_id}",
    response_model=SocialInsuranceCostSummaryOut,
    summary="更新社保费用汇总表",
)
def update_social_insurance_cost_summary(
    background_tasks: BackgroundTasks,
    record_id: int = Path(..., description="记录ID"),
    payload: SocialInsuranceCostSummaryUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="社保费用汇总记录不存在")
    old_anchor_date = _parse_anchor_date(record.period)
    try:
        updated = crud.update_record(db, record, payload)
        new_anchor_date = _parse_anchor_date(updated.period)
        refresh_targets: list[date] = []
        if old_anchor_date:
            refresh_targets.append(old_anchor_date)
        if new_anchor_date:
            refresh_targets.append(new_anchor_date)
        seen: set[date] = set()
        for anchor_date in refresh_targets:
            if anchor_date in seen:
                continue
            seen.add(anchor_date)
            _refresh_cost_summary_dashboards(background_tasks, anchor_date)
        return crud.serialize_record(updated)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete(
    "/social-insurance-cost-summaries/{record_id}",
    summary="删除社保费用汇总表",
)
def delete_social_insurance_cost_summary(
    background_tasks: BackgroundTasks,
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    del current_user
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="社保费用汇总记录不存在")
    anchor_date = _parse_anchor_date(record.period)
    crud.delete_record(db, record)
    _refresh_cost_summary_dashboards(background_tasks, anchor_date)
    return {"success": True}