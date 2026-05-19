"""
咨询量计算时段配置 API
======================
管理咨询量统计的作息时间截止规则。
提供 CRUD + 年份初始化 + 当前日期截止查询。
"""

from datetime import date
from typing import List, Optional

from app.core.auth import get_current_active_user, get_current_admin_user
from app.core.database import get_db
from app.models.consultation_schedule_config import ConsultationScheduleConfig
from app.models.user import User
from app.utils.consultation_date_utils import (
    get_business_day_range,
    get_cutoff_time_for_date,
    get_default_schedule_configs,
    invalidate_schedule_cache,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/consultation-schedule-config",
    tags=["咨询量计算时段配置"],
)


# ==================== Pydantic 模型 ====================


class ScheduleConfigCreate(BaseModel):
    period_name: str = Field(..., description="时段名称，如：冬季、夏季")
    period_start: date = Field(..., description="时段开始日期")
    period_end: date = Field(..., description="时段结束日期")
    cutoff_hour: int = Field(..., ge=0, le=23, description="截止小时（24小时制）")
    cutoff_minute: int = Field(0, ge=0, le=59, description="截止分钟")
    description: Optional[str] = None
    is_active: bool = True


class ScheduleConfigUpdate(BaseModel):
    period_name: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    cutoff_hour: Optional[int] = Field(None, ge=0, le=23)
    cutoff_minute: Optional[int] = Field(None, ge=0, le=59)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleConfigResponse(BaseModel):
    id: int
    period_name: str
    period_start: date
    period_end: date
    cutoff_hour: int
    cutoff_minute: int
    cutoff_display: str  # 格式化的截止时间，如 "17:30"
    description: Optional[str]
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class CutoffInfoResponse(BaseModel):
    """当前日期的截止时间信息"""

    target_date: date
    cutoff_time: Optional[str]  # "17:30" 或 None
    period_name: Optional[str]
    query_start: str  # ISO datetime
    query_end: str  # ISO datetime
    has_config: bool


class InitYearRequest(BaseModel):
    year: int = Field(..., ge=2020, le=2100, description="要初始化的年份")


# ==================== 工具函数 ====================


def _to_response(cfg: ConsultationScheduleConfig) -> dict:
    return {
        "id": cfg.id,
        "period_name": cfg.period_name,
        "period_start": cfg.period_start,
        "period_end": cfg.period_end,
        "cutoff_hour": cfg.cutoff_hour,
        "cutoff_minute": cfg.cutoff_minute,
        "cutoff_display": f"{cfg.cutoff_hour}:{cfg.cutoff_minute:02d}",
        "description": cfg.description,
        "is_active": cfg.is_active,
    }


# ==================== API 端点 ====================


@router.get("/list", response_model=List[ScheduleConfigResponse])
async def list_schedule_configs(
    year: Optional[int] = Query(None, description="按年份筛选"),
    is_active: Optional[bool] = Query(None, description="按启用状态筛选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取咨询量计算时段配置列表"""
    query = db.query(ConsultationScheduleConfig)

    if year is not None:
        # 筛选该年份内的所有时段
        from sqlalchemy import extract

        query = query.filter(
            extract("year", ConsultationScheduleConfig.period_start) <= year,
            extract("year", ConsultationScheduleConfig.period_end) >= year,
        )

    if is_active is not None:
        query = query.filter(ConsultationScheduleConfig.is_active == is_active)

    configs = query.order_by(ConsultationScheduleConfig.period_start).all()

    return [_to_response(c) for c in configs]


@router.post("/create", response_model=ScheduleConfigResponse)
async def create_schedule_config(
    data: ScheduleConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """创建咨询量计算时段配置"""
    if data.period_start > data.period_end:
        raise HTTPException(status_code=400, detail="开始日期不能晚于结束日期")

    # 检查是否与现有启用的时段重叠
    overlapping = (
        db.query(ConsultationScheduleConfig)
        .filter(
            ConsultationScheduleConfig.is_active == True,
            ConsultationScheduleConfig.period_start <= data.period_end,
            ConsultationScheduleConfig.period_end >= data.period_start,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(
            status_code=400,
            detail=f"与现有时段「{overlapping.period_name}」"
            f"（{overlapping.period_start} ~ {overlapping.period_end}）重叠",
        )

    config = ConsultationScheduleConfig(
        period_name=data.period_name,
        period_start=data.period_start,
        period_end=data.period_end,
        cutoff_hour=data.cutoff_hour,
        cutoff_minute=data.cutoff_minute,
        description=data.description,
        is_active=data.is_active,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    invalidate_schedule_cache()

    return _to_response(config)


@router.put("/update/{config_id}", response_model=ScheduleConfigResponse)
async def update_schedule_config(
    config_id: int,
    data: ScheduleConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """更新咨询量计算时段配置"""
    config = (
        db.query(ConsultationScheduleConfig)
        .filter(ConsultationScheduleConfig.id == config_id)
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    update_data = data.dict(exclude_unset=True)

    # 如果更新了日期范围，检查重叠
    new_start = update_data.get("period_start", config.period_start)
    new_end = update_data.get("period_end", config.period_end)
    new_active = update_data.get("is_active", config.is_active)

    if new_active and ("period_start" in update_data or "period_end" in update_data):
        if new_start > new_end:
            raise HTTPException(status_code=400, detail="开始日期不能晚于结束日期")

        overlapping = (
            db.query(ConsultationScheduleConfig)
            .filter(
                ConsultationScheduleConfig.id != config_id,
                ConsultationScheduleConfig.is_active == True,
                ConsultationScheduleConfig.period_start <= new_end,
                ConsultationScheduleConfig.period_end >= new_start,
            )
            .first()
        )
        if overlapping:
            raise HTTPException(
                status_code=400,
                detail=f"与现有时段「{overlapping.period_name}」"
                f"（{overlapping.period_start} ~ {overlapping.period_end}）重叠",
            )

    for key, value in update_data.items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)
    invalidate_schedule_cache()

    return _to_response(config)


@router.delete("/delete/{config_id}")
async def delete_schedule_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """删除咨询量计算时段配置"""
    config = (
        db.query(ConsultationScheduleConfig)
        .filter(ConsultationScheduleConfig.id == config_id)
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    db.delete(config)
    db.commit()
    invalidate_schedule_cache()

    return {"success": True, "message": "删除成功"}


@router.post("/init-year")
async def init_year_configs(
    data: InitYearRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    一键初始化某年份的默认时段配置。

    默认规则：
    - 1月1日~4月30日：冬季 17:30
    - 5月1日~9月30日：夏季 18:00
    - 10月1日~12月31日：冬季 17:30
    """
    # 检查该年份是否已有配置
    from sqlalchemy import extract

    existing = (
        db.query(ConsultationScheduleConfig)
        .filter(extract("year", ConsultationScheduleConfig.period_start) == data.year)
        .count()
    )
    if existing > 0:
        raise HTTPException(
            status_code=400,
            detail=f"{data.year}年已有 {existing} 条配置记录，请先删除后再初始化",
        )

    defaults = get_default_schedule_configs(data.year)
    created = []
    for cfg_data in defaults:
        config = ConsultationScheduleConfig(
            **cfg_data,
            is_active=True,
        )
        db.add(config)
        created.append(config)

    db.commit()
    for c in created:
        db.refresh(c)

    invalidate_schedule_cache()

    return {
        "success": True,
        "message": f"已为 {data.year} 年初始化 {len(created)} 条时段配置",
        "data": [_to_response(c) for c in created],
    }


@router.get("/cutoff-info", response_model=CutoffInfoResponse)
async def get_cutoff_info(
    target_date: Optional[str] = Query(
        None, description="查询日期 YYYY-MM-DD，默认今天"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    查询指定日期的截止时间信息。
    返回该日期对应的截止时间和实际查询区间。
    """
    if target_date:
        from datetime import datetime as dt

        try:
            query_date = dt.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400, detail="日期格式错误，请使用 YYYY-MM-DD"
            )
    else:
        query_date = date.today()

    cutoff = get_cutoff_time_for_date(query_date, db)
    start_dt, end_dt = get_business_day_range(query_date, db)

    # 获取时段名称
    period_name = None
    if cutoff:
        configs = (
            db.query(ConsultationScheduleConfig)
            .filter(
                ConsultationScheduleConfig.is_active == True,
                ConsultationScheduleConfig.period_start <= query_date,
                ConsultationScheduleConfig.period_end >= query_date,
            )
            .first()
        )
        if configs:
            period_name = configs.period_name

    return CutoffInfoResponse(
        target_date=query_date,
        cutoff_time=f"{cutoff.hour}:{cutoff.minute:02d}" if cutoff else None,
        period_name=period_name,
        query_start=start_dt.isoformat(),
        query_end=end_dt.isoformat(),
        has_config=cutoff is not None,
    )
