"""
神殿学术管理数据会议记录表 API
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import academic_meeting_record as crud
from ....schemas.academic_meeting_record import (
    会议记录列表响应,
    会议记录创建,
    会议记录更新,
    会议记录行响应,
)

router = APIRouter()

CampusPath = Annotated[str, Path(description="神殿名称")]
YearPath = Annotated[int, Path(ge=2000, le=2100, description="年份")]
MeetingCreateBody = Annotated[会议记录创建, Body(description="会议记录数据")]
MeetingUpdateBody = Annotated[会议记录更新, Body(description="会议记录行数据")]
DbSession = Annotated[Session, Depends(get_db)]


def _get_datetime_value(row: object, field_name: str) -> datetime | None:
    value = getattr(row, field_name, None)
    return value if isinstance(value, datetime) else None


def _build_meeting_response(
    campus: str,
    year: int,
    rows: list[object],
) -> 会议记录列表响应:
    row_data = [会议记录行响应.model_validate(row) for row in rows]
    created_at = _get_datetime_value(rows[0], '创建时间') if rows else None
    updated_candidates = [
        updated_at
        for row in rows
        if (updated_at := _get_datetime_value(row, '更新时间')) is not None
    ]
    updated_at = max(updated_candidates, default=None)
    return 会议记录列表响应(
        神殿名称=campus,
        年份=year,
        行数据=row_data,
        创建时间=created_at,
        更新时间=updated_at,
    )


@router.get(
    "/{campus}/{year}",
    response_model=会议记录列表响应,
    summary="获取会议记录表",
)
async def get_meeting_records(
    campus: CampusPath,
    year: YearPath,
    db: DbSession,
) -> 会议记录列表响应:
    try:
        行列表 = crud.获取(db, campus, year)
        return _build_meeting_response(campus, year, list(行列表))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"获取失败: {exc}") from exc


@router.post(
    "/",
    response_model=会议记录列表响应,
    summary="创建会议记录表（全量覆盖指定年份）",
)
async def create_meeting_records(
    数据: MeetingCreateBody,
    db: DbSession,
) -> 会议记录列表响应:
    try:
        行列表 = crud.创建(db, 数据)
        return _build_meeting_response(数据.神殿名称, 数据.年份, list(行列表))
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"创建失败: {exc}") from exc


@router.put(
    "/{campus}/{year}",
    response_model=会议记录列表响应,
    summary="更新会议记录表（全量替换）",
)
async def update_meeting_records(
    campus: CampusPath,
    year: YearPath,
    数据: MeetingUpdateBody,
    db: DbSession,
) -> 会议记录列表响应:
    try:
        行列表 = crud.更新(db, campus, year, 数据)
        return _build_meeting_response(campus, year, list(行列表))
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"更新失败: {exc}") from exc


@router.delete(
    "/{campus}/{year}",
    summary="删除会议记录表",
)
async def delete_meeting_records(
    campus: CampusPath,
    year: YearPath,
    db: DbSession,
) -> dict[str, int | bool]:
    try:
        deleted = crud.删除(db, campus, year)
        return {"success": True, "deleted": deleted}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"删除失败: {exc}") from exc
