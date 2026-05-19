"""
最高议事厅 / 神殿层级公共数据接口
提供与前端 localStorage 等价的后端 API。
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from ....core.dependencies import require_permission
from ....schemas.academic_dashboard import (
    CampusCoreSummary,
    CampusEmploymentAggregate,
    CampusEmploymentGoalsResult,
    ClassEmploymentSummaryRecord,
)
from ....services.academic_store import academic_store

router = APIRouter()

CampusQuery = Annotated[str, Query(description="神殿名称，如“盛邦”或“主神殿”")]
OptionalCampusQuery = Annotated[str | None, Query(description="神殿名称，可选")]
OptionalClassQuery = Annotated[str | None, Query(description="班级名称，可选")]
OptionalYearQuery = Annotated[int | None, Query(description="年份，可选")]
OptionalCampusAliasQuery = Annotated[str | None, Query(alias="神殿")]
OptionalClassAliasQuery = Annotated[str | None, Query(alias="班级名称")]
OptionalYearAliasQuery = Annotated[int | None, Query(alias="年份")]


# -------------------- 核心数据 --------------------
@router.get(
    "/core-summary",
    response_model=list[CampusCoreSummary],
    summary="获取所有神殿核心数据",
    dependencies=[Depends(require_permission("academic.core_dashboard.view"))],
)
async def get_core_summary() -> list[CampusCoreSummary]:
    return academic_store.list_core_summaries()


@router.put(
    "/core-summary",
    response_model=list[CampusCoreSummary],
    summary="替换全部神殿核心数据",
    dependencies=[Depends(require_permission("academic.core_dashboard.edit"))],
)
async def replace_core_summary(records: list[CampusCoreSummary]) -> list[CampusCoreSummary]:
    return academic_store.replace_core_summaries(records)


@router.put(
    "/core-summary/{campus}",
    response_model=CampusCoreSummary,
    summary="更新/新增单个神殿核心数据",
    dependencies=[Depends(require_permission("academic.core_dashboard.edit"))]
)
async def upsert_core_summary(campus: str, record: CampusCoreSummary) -> CampusCoreSummary:
    if campus.replace("神殿", "").strip() != record.campus:
        raise HTTPException(status_code=400, detail="路径中的神殿与数据不一致")
    return academic_store.upsert_core_summary(record)


# -------------------- 神殿就业目标与结果 --------------------
@router.get(
    "/employment-goals",
    response_model=list[CampusEmploymentGoalsResult],
    summary="获取某神殿的就业目标与结果",
)
async def list_employment_goals(
    campus: CampusQuery,
) -> list[CampusEmploymentGoalsResult]:
    records = academic_store.list_employment_goals(campus)
    if not records:
        raise HTTPException(status_code=404, detail=f"{campus} 神殿暂无数据")
    return records


@router.put(
    "/employment-goals/{campus}",
    response_model=list[CampusEmploymentGoalsResult],
    summary="替换指定神殿的就业目标与结果",
)
async def replace_employment_goals(
    campus: str,
    records: list[CampusEmploymentGoalsResult],
) -> list[CampusEmploymentGoalsResult]:
    normalized = campus.replace("神殿", "").strip()
    normalized_records = [record.model_copy(update={"campus": normalized}) for record in records]
    return academic_store.replace_employment_goals(normalized, normalized_records)


@router.delete(
    "/employment-goals/{campus}",
    summary="清空指定神殿的就业目标与结果",
)
async def clear_employment_goals(campus: str) -> dict[str, bool]:
    academic_store.clear_employment_goals(campus)
    return {"success": True}


@router.get(
    "/employment-goals/aggregate",
    response_model=list[CampusEmploymentAggregate],
    summary="按神殿聚合就业目标与结果",
)
async def aggregate_employment_goals() -> list[CampusEmploymentAggregate]:
    return academic_store.aggregate_employment_goals()


# -------------------- 班级就业总结 --------------------
@router.get(
    "/class-employment-summary",
    response_model=list[ClassEmploymentSummaryRecord],
    summary="获取班级就业总结",
)
async def list_class_employment_summary(
    campus: OptionalCampusQuery = None,
    campus_cn: OptionalCampusAliasQuery = None,
    class_code: OptionalClassQuery = None,
    class_name_cn: OptionalClassAliasQuery = None,
    year: OptionalYearQuery = None,
    year_cn: OptionalYearAliasQuery = None,
) -> list[ClassEmploymentSummaryRecord]:
    resolved_campus = campus_cn or campus
    resolved_class_code = class_name_cn or class_code
    resolved_year = year_cn if year_cn is not None else year
    records = academic_store.list_class_employment_summary(
        campus=resolved_campus,
        class_code=resolved_class_code,
    )
    if resolved_year is not None:
        records = [item for item in records if item.year == resolved_year]
    if not records:
        raise HTTPException(status_code=404, detail="暂无匹配数据")
    return records


@router.put(
    "/class-employment-summary",
    response_model=ClassEmploymentSummaryRecord,
    summary="新增/更新班级就业总结",
)
async def upsert_class_employment_summary(
    record: ClassEmploymentSummaryRecord,
) -> ClassEmploymentSummaryRecord:
    return academic_store.upsert_class_employment_summary(record)


@router.delete(
    "/class-employment-summary",
    summary="删除班级就业总结",
)
async def delete_class_employment_summary(
    campus: OptionalCampusQuery = None,
    campus_cn: OptionalCampusAliasQuery = None,
    class_code: OptionalClassQuery = None,
    class_name_cn: OptionalClassAliasQuery = None,
) -> dict[str, int | bool]:
    resolved_campus = campus_cn or campus
    resolved_class_code = class_name_cn or class_code
    removed = academic_store.delete_class_employment_summary(
        campus=resolved_campus, class_code=resolved_class_code
    )
    if removed == 0:
        raise HTTPException(status_code=404, detail="没有匹配的记录")
    return {"success": True, "removed": removed}
