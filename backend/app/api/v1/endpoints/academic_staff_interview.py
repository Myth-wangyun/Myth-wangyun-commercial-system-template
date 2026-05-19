"""
智慧司教员访谈记录表 API
"""

from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import academic_staff_interview as crud
from ....schemas.academic_staff_interview import (
    访谈月份列表响应,
    访谈行,
    访谈记录创建,
    访谈记录响应,
    访谈记录更新,
)

router = APIRouter()


def _get_str_value(record: object, field_name: str) -> str | None:
    value = getattr(record, field_name, None)
    return value if isinstance(value, str) else None


def _get_int_value(record: object, field_name: str) -> int | None:
    value = getattr(record, field_name, None)
    return value if isinstance(value, int) else None


def _get_datetime_value(record: object, field_name: str) -> datetime | None:
    value = getattr(record, field_name, None)
    return value if isinstance(value, datetime) else None


def _get_table_rows(record: object | None) -> list[访谈行]:
    if record is None:
        return [访谈行(序号=index + 1, 访谈对象='', 月份内容={}) for index in range(24)]

    raw_rows = getattr(record, '表格数据', [])
    if not isinstance(raw_rows, list):
        return []
    return [访谈行.model_validate(row) for row in raw_rows]


def _build_interview_response(
    campus: str,
    year: int,
    month: int,
    record: object | None = None,
) -> 访谈记录响应:
    payload: dict[str, object] = {
        '神殿名称': campus,
        '年份': year,
        '月份': month,
        '表格数据': _get_table_rows(record),
    }
    if record is not None:
        payload['更新时间'] = _get_datetime_value(record, '更新时间')
    return 访谈记录响应.model_validate(payload)


@router.get(
    "/{campus}/{year}/months",
    response_model=访谈月份列表响应,
    summary="获取访谈记录已有月份",
)
async def list_interview_months(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        months = crud.获取月份列表(db, campus, year)
        return 访谈月份列表响应(神殿名称=campus, 年份=year, 月份列表=months)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取月份失败: {str(e)}") from e


@router.get(
    "/{campus}/{year}/{month}",
    response_model=访谈记录响应,
    summary="获取访谈记录表",
)
async def get_interview_record(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100),
    month: int = Path(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    record = crud.获取(db, campus, year, month)
    return _build_interview_response(campus, year, month, record)


@router.post(
    "/",
    response_model=访谈记录响应,
    summary="创建访谈记录表",
)
async def create_interview_record(
    数据: 访谈记录创建 = Body(..., description="访谈记录数据"),
    db: Session = Depends(get_db),
):
    try:
        record = crud.创建(db, 数据)
        return _build_interview_response(
            _get_str_value(record, '神殿名称') or 数据.神殿名称,
            _get_int_value(record, '年份') or 数据.年份,
            _get_int_value(record, '月份') or 数据.月份,
            record,
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.put(
    "/{campus}/{year}/{month}",
    response_model=访谈记录响应,
    summary="更新访谈记录表",
)
async def update_interview_record(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100),
    month: int = Path(..., ge=1, le=12),
    数据: 访谈记录更新 = Body(..., description="访谈记录表数据"),
    db: Session = Depends(get_db),
):
    try:
        record = crud.更新(db, campus, year, month, 数据)
        return _build_interview_response(
            _get_str_value(record, '神殿名称') or campus,
            _get_int_value(record, '年份') or year,
            _get_int_value(record, '月份') or month,
            record,
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete(
    "/{campus}/{year}/{month}",
    summary="删除访谈记录表",
)
async def delete_interview_record(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100),
    month: int = Path(..., ge=1, le=12),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除(db, campus, year, month)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e
