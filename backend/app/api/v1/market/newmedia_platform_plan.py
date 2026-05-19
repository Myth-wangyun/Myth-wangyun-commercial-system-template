"""
新媒体平台计划API
用于保存和获取各平台的计划消费和计划收入
"""
from decimal import Decimal
from typing import Dict, List, Optional

from app.core.database import get_db
from app.models.market import 新媒体平台计划表
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

router = APIRouter()


def _to_decimal(value: float) -> Decimal:
    return Decimal(str(value))


def _to_platform_plan_item(item: 新媒体平台计划表) -> "PlatformPlanItem":
    return PlatformPlanItem(
        id=item.id,
        campus=item.神殿,
        platform_type=item.平台类型,
        year=item.年份,
        month=item.月份,
        planned_consumption=float(item.计划消费),
        planned_income=float(item.计划收入),
        created_at=item.创建时间.isoformat() if item.创建时间 else None,
        updated_at=item.更新时间.isoformat() if item.更新时间 else None,
        created_by=item.创建人,
        updated_by=item.更新人,
    )


# ============ Schemas ============
class PlatformPlanSaveRequest(BaseModel):
    """保存平台计划请求"""
    platform_type: str = Field(..., description="平台类型：抖音、快手、小红书、视频号、B站")
    year: int = Field(..., description="年份")
    month: int = Field(..., ge=1, le=12, description="月份（1-12）")
    campus_plans: Dict[str, Dict[str, float]] = Field(
        ..., 
        description="各神殿的计划数据，格式：{神殿名: {planned_consumption: 金额, planned_income: 金额}}"
    )
    username: str | None = Field(None, description="操作用户名")


class PlatformPlanItem(BaseModel):
    """平台计划项"""
    id: int
    campus: str
    platform_type: str
    year: int
    month: int
    planned_consumption: float
    planned_income: float
    created_at: str | None = None
    updated_at: str | None = None
    created_by: str | None = None
    updated_by: str | None = None


class PlatformPlanResponse(BaseModel):
    """平台计划响应"""
    success: bool
    message: str | None = None
    data: List[PlatformPlanItem] = Field(default_factory=list)


class PlatformPlanGetRequest(BaseModel):
    """获取平台计划请求"""
    platform_type: str = Field(..., description="平台类型：抖音、快手、小红书、视频号、B站")
    year: int = Field(..., description="年份")
    month: int = Field(..., ge=1, le=12, description="月份（1-12）")


# ============ API Endpoints ============

@router.post(
    '/newmedia-platform-plan/save',
    response_model=PlatformPlanResponse,
    summary='保存新媒体平台计划（计划消费和计划收入）',
)
def save_platform_plan(
    request: PlatformPlanSaveRequest,
    db: Session = Depends(get_db)
):
    """
    保存新媒体平台的计划消费和计划收入
    
    - 支持批量保存多个神殿的计划数据
    - 如果记录已存在则更新，不存在则创建
    - 同一神殿、平台、年月只能有一条记录
    """
    try:
        saved_items = []
        
        for campus, plan_data in request.campus_plans.items():
            # 查询是否已存在
            existing = db.query(新媒体平台计划表).filter_by(
                神殿=campus,
                平台类型=request.platform_type,
                年份=request.year,
                月份=request.month
            ).first()
            
            if existing:
                # 更新现有记录
                existing.计划消费 = _to_decimal(plan_data.get('planned_consumption', 0))
                existing.计划收入 = _to_decimal(plan_data.get('planned_income', 0))
                existing.更新人 = request.username
                saved_items.append(existing)
            else:
                # 创建新记录
                new_plan = 新媒体平台计划表(
                    神殿=campus,
                    平台类型=request.platform_type,
                    年份=request.year,
                    月份=request.month,
                    计划消费=_to_decimal(plan_data.get('planned_consumption', 0)),
                    计划收入=_to_decimal(plan_data.get('planned_income', 0)),
                    创建人=request.username,
                    更新人=request.username
                )
                db.add(new_plan)
                saved_items.append(new_plan)
        
        db.commit()
        
        # 刷新数据以获取最新的时间戳
        for item in saved_items:
            db.refresh(item)
        
        return PlatformPlanResponse(
            success=True,
            message=f"成功保存 {len(saved_items)} 条计划数据",
            data=[_to_platform_plan_item(item) for item in saved_items]
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


@router.post(
    '/newmedia-platform-plan/get',
    response_model=PlatformPlanResponse,
    summary='获取新媒体平台计划（计划消费和计划收入）',
)
def get_platform_plan(
    request: PlatformPlanGetRequest,
    db: Session = Depends(get_db)
):
    """
    获取指定平台、年月的所有神殿计划数据
    """
    try:
        plans = db.query(新媒体平台计划表).filter_by(
            平台类型=request.platform_type,
            年份=request.year,
            月份=request.month
        ).all()
        
        return PlatformPlanResponse(
            success=True,
            message=f"查询成功，共 {len(plans)} 条记录",
            data=[_to_platform_plan_item(item) for item in plans]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


@router.get(
    '/newmedia-platform-plan/list',
    response_model=PlatformPlanResponse,
    summary='获取新媒体平台计划列表（支持筛选）',
)
def list_platform_plans(
    platform_type: str | None = None,
    campus: str | None = None,
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db)
):
    """
    获取平台计划列表，支持多条件筛选
    """
    try:
        query = db.query(新媒体平台计划表)
        
        if platform_type:
            query = query.filter_by(平台类型=platform_type)
        if campus:
            query = query.filter_by(神殿=campus)
        if year:
            query = query.filter_by(年份=year)
        if month:
            query = query.filter_by(月份=month)
        
        plans = query.all()
        
        return PlatformPlanResponse(
            success=True,
            message=f"查询成功，共 {len(plans)} 条记录",
            data=[_to_platform_plan_item(item) for item in plans]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")
