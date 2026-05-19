"""
Endpoints for reputation key point details
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_key_point as crud
from ....schemas.reputation_key_point import (
    ReputationKeyPointDetailPayload,
    ReputationKeyPointDetailResponse,
    ReputationKeyPointListResponse,
)

router = APIRouter()


@router.get(
    "/", response_model=ReputationKeyPointListResponse, summary="获取口碑关键点明细"
)
def get_reputation_key_points(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    class_code: str | None = Query(None, description="班级编码"),
    db: Session = Depends(get_db),
):
    records = crud.list_details(db, campus=campus, year=year)
    interview_counts = crud.fetch_student_interview_counts(
        db, campus=campus, year=year, class_code=class_code
    )

    response_records = []
    for record in records:
        auto_count = interview_counts.get((record.month, record.teacher_name), 0)
        online_total = (
            record.wechat_moments_count
            + record.douyin_count
            + record.kuaishou_count
            + record.xiaohongshu_count
        )
        interview_total = auto_count + record.graduate_interview_count
        response_records.append(
            ReputationKeyPointDetailResponse(
                id=record.id,
                campus_name=record.campus_name,
                year=record.year,
                month=record.month,
                teacher_name=record.teacher_name,
                wechat_moments_count=record.wechat_moments_count,
                douyin_count=record.douyin_count,
                kuaishou_count=record.kuaishou_count,
                xiaohongshu_count=record.xiaohongshu_count,
                current_student_interview_count=auto_count,
                graduate_interview_count=record.graduate_interview_count,
                online_total=online_total,
                interview_total=interview_total,
            )
        )

    return ReputationKeyPointListResponse(
        campus_name=campus, year=year, records=response_records
    )


@router.post("/", summary="保存口碑关键点明细", response_model=ReputationKeyPointListResponse)
def save_reputation_key_points(
    payload: ReputationKeyPointDetailPayload, db: Session = Depends(get_db)
):
    try:
        crud.replace_details(
            db,
            campus=payload.campus_name,
            year=payload.year,
            records=[
                detail.model_dump(mode="python") for detail in payload.records
            ],
        )
        return get_reputation_key_points(
            campus=payload.campus_name,
            year=payload.year,
            class_code=payload.class_code,
            db=db,
        )
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}")
