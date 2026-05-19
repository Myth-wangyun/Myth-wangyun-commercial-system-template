"""
智慧司日工作总结表 API
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session

from ....core.database import engine, get_db
from ....crud import academic_daily_work_summary as crud
from ....schemas.academic_daily_work_summary import (
    日总结全部响应,
    日总结列表响应,
    日总结创建,
    日总结更新,
    日总结行响应,
)

router = APIRouter()

CampusPath = Annotated[str, Path(description="神殿名称")]
DayPath = Annotated[date, Path(description="日期，格式YYYY-MM-DD")]
RangeStartQuery = Annotated[str, Query(description="开始日期，格式YYYY-MM-DD")]
RangeEndQuery = Annotated[str, Query(description="结束日期，格式YYYY-MM-DD")]
OptionalStartDateQuery = Annotated[date | None, Query(description="开始日期，格式YYYY-MM-DD")]
OptionalEndDateQuery = Annotated[date | None, Query(description="结束日期，格式YYYY-MM-DD")]
OptionalExecutorQuery = Annotated[str | None, Query(description="执行人")]
OptionalClassQuery = Annotated[str | None, Query(description="班级")]
DailySummaryCreateBody = Annotated[日总结创建, Body(description="日工作总结数据")]
DailySummaryUpdateBody = Annotated[日总结更新, Body(description="日工作总结数据")]
DbSession = Annotated[Session, Depends(get_db)]


def _get_attr(row: object, field_name: str) -> object | None:
    return getattr(row, field_name, None)


def _get_date_value(row: object, field_name: str) -> date | None:
    value = _get_attr(row, field_name)
    return value if isinstance(value, date) else None


def _get_datetime_value(row: object, field_name: str) -> datetime | None:
    value = _get_attr(row, field_name)
    return value if isinstance(value, datetime) else None


def _get_str_value(row: object, field_name: str) -> str | None:
    value = _get_attr(row, field_name)
    return value if isinstance(value, str) else None


def _resolve_summary_date(
    fallback_date: date | None,
    rows: list[object],
) -> date:
    if fallback_date is not None:
        return fallback_date

    if rows:
        row_date = _get_date_value(rows[0], '日期')
        if row_date is not None:
            return row_date

    raise HTTPException(status_code=500, detail='缺少日总结日期')


def _build_summary_response(
    campus: str,
    summary_date: date,
    rows: list[object],
    *,
    weekday: str | None = None,
    executor: str | None = None,
    class_name: str | None = None,
    note: str | None = None,
) -> 日总结列表响应:
    row_data = [日总结行响应.model_validate(row) for row in rows]
    first_row = rows[0] if rows else None
    created_at = _get_datetime_value(first_row, '创建时间') if first_row is not None else None
    updated_candidates = [
        updated_at
        for row in rows
        if (updated_at := _get_datetime_value(row, '更新时间')) is not None
    ]
    updated_at = max(updated_candidates, default=None)
    resolved_weekday = weekday
    if resolved_weekday is None and first_row is not None:
        resolved_weekday = _get_str_value(first_row, '星期')
    resolved_executor = executor
    if resolved_executor is None and first_row is not None:
        resolved_executor = _get_str_value(first_row, '执行人')
    resolved_class_name = class_name
    if resolved_class_name is None and first_row is not None:
        resolved_class_name = _get_str_value(first_row, '班级')
    resolved_note = note
    if resolved_note is None and first_row is not None:
        resolved_note = _get_str_value(first_row, '备注')
    return 日总结列表响应(
        神殿名称=campus,
        日期=summary_date,
        星期=resolved_weekday,
        执行人=resolved_executor,
        班级=resolved_class_name,
        备注=resolved_note,
        行数据=row_data,
        创建时间=created_at,
        更新时间=updated_at,
    )


def _ensure_daily_summary_schema() -> None:
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    'ALTER TABLE academic."智慧司日工作总结表" '
                    'ADD COLUMN IF NOT EXISTS "班级" VARCHAR(50)'
                )
            )
            conn.execute(
                text(
                    'UPDATE academic."智慧司日工作总结表" '
                    'SET "班级" = COALESCE("班级", \'\')'
                )
            )
            conn.execute(
                text(
                    'UPDATE academic."智慧司日工作总结表" '
                    'SET "执行人" = COALESCE("执行人", \'\')'
                )
            )
            conn.execute(text('DROP INDEX IF EXISTS academic."idx_日工作总结_神殿日期序号"'))
            conn.execute(
                text(
                    'CREATE UNIQUE INDEX IF NOT EXISTS "idx_日工作总结_神殿日期执行人班级序号" '
                    'ON academic."智慧司日工作总结表" '
                    '("神殿名称", "日期", "执行人", "班级", "序号")'
                )
            )
            conn.execute(
                text(
                    'CREATE INDEX IF NOT EXISTS "idx_日工作总结_神殿日期执行人班级" '
                    'ON academic."智慧司日工作总结表" ("神殿名称", "日期", "执行人", "班级")'
                )
            )
    except Exception as exc:
        print(f"[警告] 智慧司日工作总结表迁移失败: {exc}")

_ensure_daily_summary_schema()


@router.post(
    "/",
    response_model=日总结列表响应,
    summary="创建智慧司日工作总结（按执行人/班级覆盖）",
)
async def create_daily_summary(
    数据: DailySummaryCreateBody,
    db: DbSession,
) -> 日总结列表响应:
    try:
        if not 数据.执行人:
            raise HTTPException(status_code=400, detail="执行人不能为空")
        数据.班级 = 数据.班级 or ""
        行列表 = crud.创建(db, 数据)
        return _build_summary_response(
            数据.神殿名称,
            _resolve_summary_date(数据.日期, list(行列表)),
            list(行列表),
            weekday=数据.星期,
            executor=数据.执行人,
            class_name=数据.班级,
            note=数据.备注,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"创建失败: {exc}") from exc


# 重要：将更具体的路由放在通用路由之前，避免路由冲突
# /range 必须在 /{campus}/{day} 之前，否则 "range" 会被解析为日期参数
@router.get(
    "/{campus}/range",
    response_model=list[日总结列表响应],
    summary="获取智慧司日工作总结（日期范围，按执行人分组）",
)
async def get_daily_summary_range(
    campus: CampusPath,
    start_date: RangeStartQuery,
    end_date: RangeEndQuery,
    db: DbSession,
) -> list[日总结列表响应]:
    """
    获取指定日期范围内的智慧司日工作总结
    严格按照 academic.智慧司日工作总结表.日期 字段进行筛选
    返回所有符合条件的数据（日期 >= start_date AND 日期 <= end_date）
    """
    try:
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()

        if start_date_obj > end_date_obj:
            raise HTTPException(status_code=400, detail="开始日期不能大于结束日期")

        行列表 = crud.获取范围(db, campus, start_date_obj, end_date_obj)

        print(
            f"[日工作总结查询] 神殿={campus}, 日期范围={start_date} 至 {end_date}, "
            f"查询到 {len(行列表)} 条记录"
        )
        groups: dict[tuple[str, str, date], list[object]] = {}
        for 行 in 行列表:
            row_date = _get_date_value(行, '日期')
            if row_date is None:
                continue
            key = (
                _get_str_value(行, '执行人') or '',
                _get_str_value(行, '班级') or '',
                row_date,
            )
            groups.setdefault(key, []).append(行)
        results: list[日总结列表响应] = []
        for (执行人, 班级, summary_date), rows in sorted(
            groups.items(),
            key=lambda item: (item[0][2], item[0][0], item[0][1]),
        ):
            results.append(
                _build_summary_response(
                    campus,
                    summary_date,
                    rows,
                    executor=执行人,
                    class_name=班级,
                )
            )
        return results
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"获取失败: {exc}") from exc


@router.get(
    "/{campus}",
    response_model=日总结全部响应,
    summary="获取智慧司日工作总结（全部日期或日期范围）",
)
async def get_daily_summary_all(
    campus: CampusPath,
    db: DbSession,
    start_date: OptionalStartDateQuery = None,
    end_date: OptionalEndDateQuery = None,
) -> 日总结全部响应:
    try:
        if start_date and end_date:
            行列表 = crud.获取范围(db, campus, start_date, end_date)
        else:
            行列表 = crud.获取全部(db, campus)
        行数据 = [日总结行响应.model_validate(行) for 行 in 行列表]
        return 日总结全部响应(神殿名称=campus, 行数据=行数据)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"获取失败: {exc}") from exc


@router.get(
    "/{campus}/{day}/groups",
    response_model=list[日总结列表响应],
    summary="获取智慧司日工作总结（按执行人分组）",
)
async def get_daily_summary_groups(
    campus: CampusPath,
    day: DayPath,
    db: DbSession,
) -> list[日总结列表响应]:
    try:
        行列表 = crud.获取(db, campus, day)
        groups: dict[tuple[str, str], list[object]] = {}
        for 行 in 行列表:
            key = (
                _get_str_value(行, '执行人') or '',
                _get_str_value(行, '班级') or '',
            )
            groups.setdefault(key, []).append(行)
        results: list[日总结列表响应] = []
        for (执行人, 班级), rows in sorted(
            groups.items(),
            key=lambda item: (item[0][0], item[0][1]),
        ):
            results.append(
                _build_summary_response(
                    campus,
                    day,
                    rows,
                    executor=执行人,
                    class_name=班级,
                )
            )
        return results
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"获取失败: {exc}") from exc


@router.get(
    "/{campus}/{day}",
    response_model=日总结列表响应,
    summary="获取智慧司日工作总结",
)
async def get_daily_summary(
    campus: CampusPath,
    day: DayPath,
    db: DbSession,
    executor: OptionalExecutorQuery = None,
    class_name: OptionalClassQuery = None,
) -> 日总结列表响应:
    try:
        行列表 = crud.获取(db, campus, day, executor, class_name)
        if executor is None and class_name is None and 行列表:
            first_executor = _get_str_value(行列表[0], '执行人') or ''
            first_class = _get_str_value(行列表[0], '班级') or ''
            行列表 = crud.获取(db, campus, day, first_executor, first_class)
        return _build_summary_response(campus, day, list(行列表))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"获取失败: {exc}") from exc


@router.put(
    "/{campus}/{day}",
    response_model=日总结列表响应,
    summary="更新智慧司日工作总结（按执行人/班级替换）",
)
async def update_daily_summary(
    campus: CampusPath,
    day: DayPath,
    数据: DailySummaryUpdateBody,
    db: DbSession,
) -> 日总结列表响应:
    try:
        if not 数据.执行人:
            raise HTTPException(status_code=400, detail="执行人不能为空")
        数据.班级 = 数据.班级 or ""
        行列表 = crud.更新(db, campus, day, 数据)
        return _build_summary_response(
            campus,
            day,
            list(行列表),
            weekday=数据.星期,
            executor=数据.执行人,
            class_name=数据.班级,
            note=数据.备注,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"更新失败: {exc}") from exc


@router.delete(
    "/{campus}/{day}",
    summary="删除智慧司日工作总结（支持按执行人/班级）",
)
async def delete_daily_summary(
    campus: CampusPath,
    day: Annotated[date, Path(description="日期")],
    db: DbSession,
    executor: OptionalExecutorQuery = None,
    class_name: OptionalClassQuery = None,
) -> dict[str, int | bool]:
    try:
        deleted = crud.删除(db, campus, day, executor, class_name)
        return {"success": True, "deleted": deleted}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"删除失败: {exc}") from exc
