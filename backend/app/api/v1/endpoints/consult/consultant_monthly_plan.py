"""
咨询师月度计划数据 API
003神殿各咨询师数据汇总 - 咨询师月度计划收入和计划招生
按 咨询师 × 量来源 两个维度组合
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....crud.consult.consultant_monthly_plan import consultant_monthly_plan_crud
from .....models.user import User
from .....schemas.consult.consultant_monthly_plan import (
    DATA_TYPES,
    CampusPlanSummaryResponse,
    ConsultantMonthlyPlanBatchCreate,
    ConsultantMonthlyPlanCreate,
    ConsultantMonthlyPlanListResponse,
    ConsultantMonthlyPlanResponse,
    ConsultantMonthlyPlanUpdate,
)

router = APIRouter()


@router.get("/data-types", response_model=List[str])
async def get_data_types():
    """获取支持的数据类型列表（量来源）"""
    return DATA_TYPES


@router.get("/list", response_model=ConsultantMonthlyPlanListResponse)
async def get_consultant_plan_list(
    year: int,
    campus: Optional[str] = None,
    month: Optional[int] = None,
    consultant: Optional[str] = None,
    data_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取咨询师月度计划数据列表
    
    - **year**: 年份（必填）
    - **campus**: 神殿名称（可选）
    - **month**: 月份1-12（可选）
    - **consultant**: 咨询师姓名（可选）
    - **data_type**: 数据类型/量来源（可选）：SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总
    """
    try:
        records = consultant_monthly_plan_crud.get_list(
            db=db,
            year=year,
            campus=campus,
            month=month,
            consultant=consultant,
            data_type=data_type
        )

        return ConsultantMonthlyPlanListResponse(
            数据列表=[ConsultantMonthlyPlanResponse.model_validate(r) for r in records],
            总数=len(records)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取咨询师计划数据失败: {str(e)}")


@router.get("/campus-summary", response_model=CampusPlanSummaryResponse)
async def get_campus_plan_summary(
    year: int,
    campus: str,
    data_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取神殿年度计划数据汇总（按咨询师和数据类型分组）
    
    - **year**: 年份
    - **campus**: 神殿名称
    - **data_type**: 数据类型/量来源（可选，不传则返回所有数据类型）
    """
    summary = consultant_monthly_plan_crud.get_campus_summary(db, year, campus, data_type)
    return CampusPlanSummaryResponse(**summary)


@router.get("/campus-monthly-totals")
async def get_campus_monthly_plan_totals(
    year: int,
    campus: Optional[str] = None,
    data_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取神殿级月度计划汇总（从咨询师维度聚合SUM）
    
    将 consult.咨询师月度计划数据 按 神殿+月份+数据类型 聚合，
    作为统一的神殿级计划数据源，替代 consult.神殿月度财务数据 的计划部分。
    
    返回: [{神殿, 月份, 数据类型, 计划收入, 计划招生, 费用投入}, ...]
    """
    results = consultant_monthly_plan_crud.get_campus_monthly_plan_totals(
        db, year, campus, data_type
    )
    return {"data": results, "total": len(results)}


@router.get("/all-campus-yearly-summary")
async def get_all_campus_yearly_plan_summary(
    year: int,
    data_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取所有神殿的年度计划汇总（从咨询师维度聚合全年SUM）
    
    按 神殿+数据类型 聚合，用于001最高议事厅和007 TAB1的计划数据绑定。
    
    返回: [{神殿, 数据类型, 计划收入, 计划招生, 费用投入}, ...]
    """
    results = consultant_monthly_plan_crud.get_all_campus_yearly_plan_summary(
        db, year, data_type
    )
    return {"data": results, "total": len(results)}


@router.get("/{record_id}", response_model=ConsultantMonthlyPlanResponse)
async def get_consultant_plan(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """根据ID获取咨询师月度计划数据"""
    record = consultant_monthly_plan_crud.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return ConsultantMonthlyPlanResponse.model_validate(record)


@router.post("", response_model=ConsultantMonthlyPlanResponse)
async def create_consultant_plan(
    data: ConsultantMonthlyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    创建咨询师月度计划数据
    
    如果已存在相同年份、月份、神殿、咨询师、数据类型的记录，则更新
    """
    record = consultant_monthly_plan_crud.upsert(
        db=db,
        data=data,
        user_id=current_user.user_id,
        user_name=current_user.real_name or current_user.username
    )
    return ConsultantMonthlyPlanResponse.model_validate(record)


@router.post("/batch", response_model=ConsultantMonthlyPlanListResponse)
async def batch_create_consultant_plan(
    batch_data: ConsultantMonthlyPlanBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    批量创建/更新咨询师月度计划数据
    
    对于已存在的记录会自动更新
    支持按 咨询师 × 数据类型 两个维度的组合
    """
    records = consultant_monthly_plan_crud.batch_upsert(
        db=db,
        data_list=batch_data.数据列表,
        user_id=current_user.user_id,
        user_name=current_user.real_name or current_user.username
    )
    
    return ConsultantMonthlyPlanListResponse(
        数据列表=[ConsultantMonthlyPlanResponse.model_validate(r) for r in records],
        总数=len(records)
    )


@router.put("/{record_id}", response_model=ConsultantMonthlyPlanResponse)
async def update_consultant_plan(
    record_id: int,
    data: ConsultantMonthlyPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """更新咨询师月度计划数据"""
    record = consultant_monthly_plan_crud.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    updated = consultant_monthly_plan_crud.update(
        db=db,
        db_obj=record,
        data=data,
        user_id=current_user.user_id,
        user_name=current_user.real_name or current_user.username
    )
    return ConsultantMonthlyPlanResponse.model_validate(updated)


@router.delete("/{record_id}")
async def delete_consultant_plan(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """删除咨询师月度计划数据"""
    success = consultant_monthly_plan_crud.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True, "message": "删除成功"}
