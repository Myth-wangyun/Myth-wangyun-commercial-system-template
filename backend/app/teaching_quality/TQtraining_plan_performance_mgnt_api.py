"""
教学质量模块 - 教化司培训计划与成绩汇总表（管理端-月度明细）API
前缀：/api/v1/teaching-quality
POST /training-plan-performance-mgnt  保存/更新单条月度明细
"""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi import Path as FPath
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_manager_analysis_db import (
    fetch_rows as ma_fetch_rows,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    init_campus_manager_analysis_tables as init_ma_tables,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    replace_rows as ma_replace_rows,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    upsert_row as ma_upsert_row,
)
from app.teaching_quality.TQcampus_training_plan_performance_mgnt_db import (
    fetch_rows,
    update_or_create_row,
)
from app.teaching_quality.TQcampus_training_plan_performance_mgnt_db import (
    init_training_plan_performance_mgnt_tables as init_tables,
)

router = APIRouter()

CampusQuery = Annotated[str, Query(description='神殿名称')]
YearQuery = Annotated[int | None, Query(description='年份，默认当前年')]
RequiredYearQuery = Annotated[int, Query(alias='year')]
ManagerCampusQuery = Annotated[str, Query(alias='campus')]
MonthPath = Annotated[int, FPath()]
YearPath = Annotated[int, FPath()]
DbSession = Annotated[Session, Depends(get_db)]
ManagerPayloadBody = Annotated['MA_Row', Body(...)]


class MgntRow(BaseModel):
    """管理端培训计划月度明细行"""

    month: int
    trainingObjective: str = ''
    mainContent: str = ''
    trainingMethod: str = ''
    personInCharge: str = ''
    numberOfTrainees: int = 0
    numberOfQualified: int = 0
    examPassRate: float = 0
    averageScore: float = 0


class MgntListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: list[MgntRow] = Field(default_factory=list)


class SaveRequest(BaseModel):
    campus: str
    year: int
    month: int
    data: dict[str, object]


def _startup_init():
    try:
        init_tables()
    except Exception as exc:
        print(f'[teaching-quality] 初始化教化司培训计划与成绩月度表失败: {exc}')


def _norm_campus_name(c: str) -> str:
    return (c or '').replace('神殿', '').strip()


def _attribute_value(row: object, field_name: str) -> object | None:
    return getattr(row, field_name, None)


def _string_value(row: object, field_name: str) -> str | None:
    value = _attribute_value(row, field_name)
    return value if isinstance(value, str) else None


def _int_value(row: object, field_name: str) -> int:
    value = _attribute_value(row, field_name)
    if value is None or value == '':
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        return int(value)
    return 0


def _float_value(row: object, field_name: str) -> float:
    value = _attribute_value(row, field_name)
    if value is None or value == '':
        return 0.0
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        return float(value)
    return 0.0


@router.get("/training-plan-performance-mgnt", response_model=MgntListOutput)
def get_training_plan_performance_mgnt(
    campus: CampusQuery,
    db: DbSession,
    year: YearQuery = None,
) -> MgntListOutput:
    """获取管理端培训计划与成绩月度明细"""
    if not campus:
        return MgntListOutput(神殿名称=campus, 年份=year or 0, 行列表=[])

    if not year:
        year = datetime.now().year

    try:
        campus_norm = _norm_campus_name(campus)
        rows = fetch_rows(db, 神殿名称=campus_norm, 年份=year)
        if not rows:
            rows = fetch_rows(db, 神殿名称=campus, 年份=year)

        row_map: dict[int, object] = {_int_value(row, '月份'): row for row in rows or []}

        out_rows: list[MgntRow] = []
        for m in range(1, 13):
            r = row_map.get(m)
            out_rows.append(
                MgntRow(
                    month=m,
                    trainingObjective=_string_value(r, '培训目标') or '' if r else '',
                    mainContent=_string_value(r, '主要内容') or '' if r else '',
                    trainingMethod=_string_value(r, '培训方式') or '' if r else '',
                    personInCharge=_string_value(r, '负责人') or '' if r else '',
                    numberOfTrainees=_int_value(r, '培训人数') if r else 0,
                    numberOfQualified=_int_value(r, '合格人数') if r else 0,
                    examPassRate=_float_value(r, '考试合格率') if r else 0,
                    averageScore=_float_value(r, '平均成绩') if r else 0,
                )
            )

        return MgntListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)
    except Exception as exc:
        print(f'[teaching-quality] 获取培训计划与成绩月度明细失败: {exc}')
        return MgntListOutput(神殿名称=campus, 年份=year, 行列表=[])


@router.post("/training-plan-performance-mgnt")
def save_training_plan_performance_item(
    request: SaveRequest,
    db: DbSession,
) -> dict[str, object]:
    """保存/更新教化司培训计划与成绩月度明细一条记录"""
    try:
        update_or_create_row(
            db,
            神殿名称=request.campus,
            年份=request.year,
            月份=request.month,
            data=request.data,
        )
        db.commit()
        return {"success": True, "message": "保存成功"}
    except Exception as exc:
        db.rollback()
        print(f'[teaching-quality] 保存教化司培训计划与成绩月度明细失败: {exc}')
        return {"success": False, "message": f"保存失败: {exc}"}


# ====== 兼容挂载：在同一 router 下追加“神殿经理功能分析”接口，避免改 main.py ======
# 已在文件头部静态导入 TQcampus_manager_analysis_db


class MA_Row(BaseModel):
    month: int
    campus: str | None = None
    name: str | None = None
    values: int = 0
    responsibility: int = 0
    execution: int = 0
    planning: int = 0
    organization: int = 0
    leadership: int = 0
    control: int = 0
    studentEmployment: int = 0
    reputationEnrollment: int = 0
    studentAttrition: int = 0
    furtherEducation: int = 0
    academicManagement: int = 0
    dormitoryManagement: int = 0
    remark: str | None = None


class MA_ListOutput(BaseModel):
    campus: str
    year: int
    rows: list[MA_Row] = Field(default_factory=list)


class MA_SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: list[MA_Row] = Field(default_factory=list)


def _norm_campus(c: str) -> str:
    return (c or '').replace('神殿', '').strip()


def _to_ma_row(campus: str, row: object | None) -> MA_Row:
    if not row:
        return MA_Row(month=0, campus=campus)
    return MA_Row(
        month=_int_value(row, '月份'),
        campus=campus,
        name=_string_value(row, '姓名'),
        values=_int_value(row, '价值观'),
        responsibility=_int_value(row, '责任感'),
        execution=_int_value(row, '执行力'),
        planning=_int_value(row, '计划'),
        organization=_int_value(row, '组织'),
        leadership=_int_value(row, '领导'),
        control=_int_value(row, '控制'),
        studentEmployment=_int_value(row, '学员就业'),
        reputationEnrollment=_int_value(row, '口碑招生'),
        studentAttrition=_int_value(row, '学员流失'),
        furtherEducation=_int_value(row, '升学'),
        academicManagement=_int_value(row, '教务管理能力'),
        dormitoryManagement=_int_value(row, '宿舍管理能力'),
        remark=_string_value(row, '备注'),
    )


@router.get(
    '/training-plan-campus-manager-analysis',
    response_model=MA_ListOutput,
    summary='[培训计划模块]获取神殿经理功能分析（按年）',
)
def get_manager_analysis(
    campus: ManagerCampusQuery,
    year: RequiredYearQuery,
    db: DbSession,
) -> MA_ListOutput:
    init_ma_tables()
    campus_norm = _norm_campus(campus)

    rows = ma_fetch_rows(db, 神殿名称=campus, 年份=year)
    if not rows:
        rows = ma_fetch_rows(db, 神殿名称=campus_norm, 年份=year)
    if not rows and not campus_norm.endswith('神殿'):
        rows = ma_fetch_rows(db, 神殿名称=f"{campus_norm}神殿", 年份=year)

    row_map: dict[int, object] = {_int_value(row, '月份'): row for row in rows or []}
    out_rows = [_to_ma_row(campus, row_map.get(m)) for m in range(1, 13)]
    return MA_ListOutput(campus=campus, year=year, rows=out_rows)


@router.put(
    '/training-plan-campus-manager-analysis/{year}/{month}',
    response_model=MA_Row,
    summary='[培训计划模块]更新或新增指定月份记录',
)
def update_manager_analysis(
    year: YearPath,
    month: MonthPath,
    payload: ManagerPayloadBody,
    db: DbSession,
) -> MA_Row:
    init_ma_tables()
    if not payload or not payload.campus:
        raise HTTPException(status_code=400, detail="缺少神殿")

    row = ma_upsert_row(
        db,
        神殿名称=payload.campus,
        年份=year,
        月份=month,
        姓名=payload.name or '',
        价值观=payload.values,
        责任感=payload.responsibility,
        执行力=payload.execution,
        计划=payload.planning,
        组织=payload.organization,
        领导=payload.leadership,
        控制=payload.control,
        学员就业=payload.studentEmployment,
        口碑招生=payload.reputationEnrollment,
        学员流失=payload.studentAttrition,
        升学=payload.furtherEducation,
        教务管理能力=payload.academicManagement,
        宿舍管理能力=payload.dormitoryManagement,
        备注=payload.remark,
    )
    db.commit()

    return _to_ma_row(payload.campus, row)


@router.post(
    '/training-plan-campus-manager-analysis',
    response_model=MA_ListOutput,
    summary='[培训计划模块]批量替换当年所有月份记录',
)
def replace_manager_analysis(
    payload: MA_SavePayload,
    db: DbSession,
) -> MA_ListOutput:
    init_ma_tables()
    rows_to_save: list[dict[str, object]] = [row.model_dump() for row in payload.行列表]

    ma_replace_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=rows_to_save)
    db.commit()

    return get_manager_analysis(campus=payload.神殿名称, year=payload.年份, db=db)
