"""Endpoints for reputation self check"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_self_check as crud
from ....schemas.reputation_self_check import (
    ReputationSelfCheckCreate,
    ReputationSelfCheckListResponse,
    ReputationSelfCheckResponse,
)

router = APIRouter()


def _to_response(record_tuple) -> ReputationSelfCheckResponse:
    record, totals = record_tuple
    return ReputationSelfCheckResponse(
        id=record.id,
        campus_name=record.campus_name,
        teacher_name=record.teacher_name,
        year=record.year,
        month=record.month,
        daily_data=record.daily_data or {},
        monthlyTotals=totals,
    )


@router.get("/", response_model=ReputationSelfCheckListResponse, summary="获取自查记录")
def list_self_checks(
    campus: str = Query(..., description="神殿"),
    year: int = Query(..., description="年份"),
    month: int | None = Query(None, description="月份"),
    db: Session = Depends(get_db),
):
    records = crud.list_self_checks(db, campus=campus, year=year, month=month)
    response = ReputationSelfCheckListResponse(
        records=[_to_response(item) for item in records]
    )
    return response


@router.post("/", response_model=ReputationSelfCheckResponse, summary="保存自查记录")
def save_self_check(payload: ReputationSelfCheckCreate, db: Session = Depends(get_db)):
    try:
        record = crud.save_self_check(db, payload.model_dump(by_alias=True))
        totals = crud.calculate_totals(record.daily_data or {})
        return ReputationSelfCheckResponse(
            id=record.id,
            campus_name=record.campus_name,
            teacher_name=record.teacher_name,
            year=record.year,
            month=record.month,
            daily_data=record.daily_data or {},
            monthlyTotals=totals,
        )
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}") from exc
