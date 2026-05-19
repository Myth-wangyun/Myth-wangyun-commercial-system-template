"""
市场部月度计划数据API
用于处理以下5个页面的计划数据：
1. 新媒体月度计划
2. SEM月度计划
3. 网络合作伙伴分解
4. 市场口碑
5. 免费推广
"""
from typing import List, Optional

from app.core.database import get_db
from app.models.market.monthly_plan_data import (
    市场部SEM月度计划表,
    市场部免费推广月度计划表,
    市场部口碑月度计划表,
    市场部新媒体月度计划表,
    市场部网络合作伙伴月度计划表,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/monthly-plan", tags=["月度计划数据"])


class MonthlyPlanData(BaseModel):
    """月度计划数据请求模型"""
    month: int  # 1-12
    plan_income: Optional[float] = 0
    plan_enrollment: Optional[int] = 0
    plan_consult_volume: Optional[int] = 0
    plan_cost: Optional[float] = 0
    actual_expense: Optional[float] = None  # 实际消费，None表示不更新此字段


class PartnerMonthlyPlanData(BaseModel):
    """合作伙伴月度计划数据请求模型（用于02明细页面）"""
    month: int  # 1-12
    partner: str  # 合作伙伴名称
    plan_income: Optional[float] = 0
    plan_enrollment: Optional[int] = 0
    plan_consult_volume: Optional[int] = 0
    plan_cost: Optional[float] = 0


class NewmediaMonthlyPlanData(BaseModel):
    """新媒体月度计划数据请求模型"""
    month: int  # 1-12
    platform: str  # 平台名称
    plan_income: Optional[float] = 0
    plan_enrollment: Optional[int] = 0
    plan_consult_volume: Optional[int] = 0
    plan_cost: Optional[float] = 0


class SemMonthlyPlanData(BaseModel):
    """SEM月度计划数据请求模型"""
    month: int  # 1-12
    channel: str  # 渠道名称
    plan_income: Optional[float] = 0
    plan_enrollment: Optional[int] = 0
    plan_consult_volume: Optional[int] = 0
    plan_cost: Optional[float] = 0


class BatchSavePlanData(BaseModel):
    """批量保存计划数据请求模型"""
    campus: str
    year: str
    data: List[MonthlyPlanData]


class BatchSavePartnerPlanData(BaseModel):
    """批量保存合作伙伴计划数据请求模型"""
    campus: str
    year: str
    data: List[PartnerMonthlyPlanData]


class BatchSaveNewmediaPlanData(BaseModel):
    """批量保存新媒体计划数据请求模型"""
    campus: str
    year: str
    data: List[NewmediaMonthlyPlanData]


class BatchSaveSemPlanData(BaseModel):
    """批量保存SEM计划数据请求模型"""
    campus: str
    year: str
    data: List[SemMonthlyPlanData]


# ==================== 新媒体月度计划数据 ====================

@router.get('/newmedia/list')
async def get_newmedia_plan_list(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    month: Optional[int] = Query(None, description='月份，1-12'),
    db: Session = Depends(get_db)
):
    """获取新媒体月度计划数据列表"""
    try:
        query = db.query(市场部新媒体月度计划表).filter(
            and_(
                市场部新媒体月度计划表.campus == campus,
                市场部新媒体月度计划表.year == year
            )
        )
        if month:
            query = query.filter(市场部新媒体月度计划表.month == month)
        
        items = query.order_by(市场部新媒体月度计划表.month, 市场部新媒体月度计划表.platform).all()
        
        # 转换为按月份和平台索引的嵌套字典
        result: dict[int, dict[str, dict[str, float | int | str]]] = {}
        for item in items:
            if item.month not in result:
                result[item.month] = {}
            result[item.month][item.platform] = item.to_dict()
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/newmedia/save')
async def save_newmedia_plan(
    request: BatchSaveNewmediaPlanData,
    db: Session = Depends(get_db)
):
    """保存新媒体月度计划数据"""
    try:
        for item in request.data:
            existing = db.query(市场部新媒体月度计划表).filter(
                and_(
                    市场部新媒体月度计划表.campus == request.campus,
                    市场部新媒体月度计划表.year == request.year,
                    市场部新媒体月度计划表.month == item.month,
                    市场部新媒体月度计划表.platform == item.platform
                )
            ).first()
            
            if existing:
                existing.plan_income = item.plan_income or 0
                existing.plan_enrollment = item.plan_enrollment or 0
                existing.plan_consult_volume = item.plan_consult_volume or 0
                existing.plan_cost = item.plan_cost or 0
            else:
                new_record = 市场部新媒体月度计划表(
                    campus=request.campus,
                    year=request.year,
                    month=item.month,
                    platform=item.platform,
                    plan_income=item.plan_income or 0,
                    plan_enrollment=item.plan_enrollment or 0,
                    plan_consult_volume=item.plan_consult_volume or 0,
                    plan_cost=item.plan_cost or 0
                )
                db.add(new_record)
        
        db.commit()
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get('/newmedia/platform-plan')
async def get_newmedia_platform_plan(
    platform: str = Query(..., description='平台名称，如: 抖音、快手、小红书、微信视频号、B站'),
    year: str = Query(..., description='年份，格式YYYY'),
    month: int = Query(..., description='月份，1-12'),
    db: Session = Depends(get_db)
):
    """获取指定平台和月份的所有神殿计划消费和计划收入数据
    
    用于平台数据分析页面获取计划数据
    """
    try:
        items = db.query(市场部新媒体月度计划表).filter(
            and_(
                市场部新媒体月度计划表.platform == platform,
                市场部新媒体月度计划表.year == year,
                市场部新媒体月度计划表.month == month
            )
        ).all()
        
        result = []
        for item in items:
            # 从神殿名称中提取简称，例如 "河北主神殿" -> "盛邦"
            campus_short = item.campus
            prefixes = ['河北', '山西', '广西', '贵州', '山东', '河南', '四川', '湖北', '湖南', '江苏', '浙江', '福建', '广东']
            for prefix in prefixes:
                if campus_short.startswith(prefix):
                    campus_short = campus_short[len(prefix):]
                    break
            if campus_short.endswith('神殿'):
                campus_short = campus_short[:-2]
            
            result.append({
                'campus': item.campus,
                'campus_short': campus_short,
                'plan_cost': float(item.plan_cost) if item.plan_cost else 0,
                'plan_income': float(item.plan_income) if item.plan_income else 0,
                'plan_enrollment': item.plan_enrollment or 0,
                'plan_consult_volume': item.plan_consult_volume or 0,
            })
        
        return {
            'success': True,
            'code': 0,
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== SEM月度计划数据 ====================

@router.get('/sem/list')
async def get_sem_plan_list(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    month: Optional[int] = Query(None, description='月份，1-12'),
    db: Session = Depends(get_db)
):
    """获取SEM月度计划数据列表"""
    try:
        query = db.query(市场部SEM月度计划表).filter(
            and_(
                市场部SEM月度计划表.campus == campus,
                市场部SEM月度计划表.year == year
            )
        )
        if month:
            query = query.filter(市场部SEM月度计划表.month == month)
        
        items = query.order_by(市场部SEM月度计划表.month, 市场部SEM月度计划表.channel).all()
        
        # 转换为按月份和渠道索引的嵌套字典
        result: dict[int, dict[str, dict[str, float | int | str]]] = {}
        for item in items:
            if item.month not in result:
                result[item.month] = {}
            result[item.month][item.channel] = item.to_dict()
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/sem/save')
async def save_sem_plan(
    request: BatchSaveSemPlanData,
    db: Session = Depends(get_db)
):
    """保存SEM月度计划数据"""
    try:
        for item in request.data:
            existing = db.query(市场部SEM月度计划表).filter(
                and_(
                    市场部SEM月度计划表.campus == request.campus,
                    市场部SEM月度计划表.year == request.year,
                    市场部SEM月度计划表.month == item.month,
                    市场部SEM月度计划表.channel == item.channel
                )
            ).first()
            
            if existing:
                existing.plan_income = item.plan_income or 0
                existing.plan_enrollment = item.plan_enrollment or 0
                existing.plan_consult_volume = item.plan_consult_volume or 0
                existing.plan_cost = item.plan_cost or 0
            else:
                new_record = 市场部SEM月度计划表(
                    campus=request.campus,
                    year=request.year,
                    month=item.month,
                    channel=item.channel,
                    plan_income=item.plan_income or 0,
                    plan_enrollment=item.plan_enrollment or 0,
                    plan_consult_volume=item.plan_consult_volume or 0,
                    plan_cost=item.plan_cost or 0
                )
                db.add(new_record)
        
        db.commit()
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 网络合作伙伴计划数据（02明细页面） ====================

@router.get('/network-partner/detail/list')
async def get_network_partner_plan_detail_list(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db)
):
    """获取网络合作伙伴月度计划明细数据列表（02明细页面使用）"""
    try:
        items = db.query(市场部网络合作伙伴月度计划表).filter(
            and_(
                市场部网络合作伙伴月度计划表.campus == campus,
                市场部网络合作伙伴月度计划表.year == year
            )
        ).order_by(市场部网络合作伙伴月度计划表.month, 市场部网络合作伙伴月度计划表.partner).all()
        
        # 转换为按月份和合作伙伴索引的嵌套字典
        result: dict[int, dict[str, dict[str, float | int | str]]] = {}
        for item in items:
            if item.month not in result:
                result[item.month] = {}
            result[item.month][item.partner] = item.to_dict()
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/network-partner/detail/save')
async def save_network_partner_plan_detail(
    request: BatchSavePartnerPlanData,
    db: Session = Depends(get_db)
):
    """保存网络合作伙伴月度计划明细数据（02明细页面使用）"""
    try:
        for item in request.data:
            existing = db.query(市场部网络合作伙伴月度计划表).filter(
                and_(
                    市场部网络合作伙伴月度计划表.campus == request.campus,
                    市场部网络合作伙伴月度计划表.year == request.year,
                    市场部网络合作伙伴月度计划表.month == item.month,
                    市场部网络合作伙伴月度计划表.partner == item.partner
                )
            ).first()
            
            if existing:
                existing.plan_income = item.plan_income or 0
                existing.plan_enrollment = item.plan_enrollment or 0
                existing.plan_consult_volume = item.plan_consult_volume or 0
                existing.plan_cost = item.plan_cost or 0
            else:
                new_record = 市场部网络合作伙伴月度计划表(
                    campus=request.campus,
                    year=request.year,
                    month=item.month,
                    partner=item.partner,
                    plan_income=item.plan_income or 0,
                    plan_enrollment=item.plan_enrollment or 0,
                    plan_consult_volume=item.plan_consult_volume or 0,
                    plan_cost=item.plan_cost or 0
                )
                db.add(new_record)
        
        db.commit()
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get('/network-partner/list')
async def get_network_partner_plan_list(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db)
):
    """获取网络合作伙伴月度计划汇总数据（01汇总页面使用）
    
    从02明细数据按月份汇总各合作伙伴的计划数据
    """
    try:
        # 按月份汇总各合作伙伴的计划数据
        items = db.query(
            市场部网络合作伙伴月度计划表.month,
            sql_func.sum(市场部网络合作伙伴月度计划表.plan_income).label('plan_income'),
            sql_func.sum(市场部网络合作伙伴月度计划表.plan_enrollment).label('plan_enrollment'),
            sql_func.sum(市场部网络合作伙伴月度计划表.plan_consult_volume).label('plan_consult_volume'),
            sql_func.sum(市场部网络合作伙伴月度计划表.plan_cost).label('plan_cost'),
        ).filter(
            and_(
                市场部网络合作伙伴月度计划表.campus == campus,
                市场部网络合作伙伴月度计划表.year == year
            )
        ).group_by(市场部网络合作伙伴月度计划表.month).order_by(市场部网络合作伙伴月度计划表.month).all()
        
        # 转换为按月份索引的字典
        result = {}
        for item in items:
            result[item.month] = {
                'month': item.month,
                'plan_income': float(item.plan_income) if item.plan_income else 0,
                'plan_enrollment': int(item.plan_enrollment) if item.plan_enrollment else 0,
                'plan_consult_volume': int(item.plan_consult_volume) if item.plan_consult_volume else 0,
                'plan_cost': float(item.plan_cost) if item.plan_cost else 0,
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 市场口碑计划数据 ====================

@router.get('/reputation/list')
async def get_reputation_plan_list(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db)
):
    """获取市场口碑月度计划数据列表"""
    try:
        items = db.query(市场部口碑月度计划表).filter(
            and_(
                市场部口碑月度计划表.campus == campus,
                市场部口碑月度计划表.year == year
            )
        ).order_by(市场部口碑月度计划表.month).all()
        
        result = {}
        for item in items:
            result[item.month] = item.to_dict()
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/reputation/save')
async def save_reputation_plan(
    request: BatchSavePlanData,
    db: Session = Depends(get_db)
):
    """保存市场口碑月度计划数据"""
    try:
        for item in request.data:
            existing = db.query(市场部口碑月度计划表).filter(
                and_(
                    市场部口碑月度计划表.campus == request.campus,
                    市场部口碑月度计划表.year == request.year,
                    市场部口碑月度计划表.month == item.month
                )
            ).first()
            
            if existing:
                existing.plan_income = item.plan_income or 0
                existing.plan_enrollment = item.plan_enrollment or 0
                existing.plan_consult_volume = item.plan_consult_volume or 0
                existing.plan_cost = item.plan_cost or 0
                # 只有当传递了 actual_expense 时才更新（不为 None）
                if item.actual_expense is not None:
                    existing.actual_expense = item.actual_expense
            else:
                new_record = 市场部口碑月度计划表(
                    campus=request.campus,
                    year=request.year,
                    month=item.month,
                    plan_income=item.plan_income or 0,
                    plan_enrollment=item.plan_enrollment or 0,
                    plan_consult_volume=item.plan_consult_volume or 0,
                    plan_cost=item.plan_cost or 0,
                    actual_expense=item.actual_expense or 0  # 新记录：传了用传的值，没传默认0
                )
                db.add(new_record)
        
        db.commit()
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e


# ==================== 免费推广计划数据 ====================

@router.get('/free-promotion/list')
async def get_free_promotion_plan_list(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db)
):
    """获取免费推广月度计划数据列表"""
    try:
        items = db.query(市场部免费推广月度计划表).filter(
            and_(
                市场部免费推广月度计划表.campus == campus,
                市场部免费推广月度计划表.year == year
            )
        ).order_by(市场部免费推广月度计划表.month).all()
        
        result = {}
        for item in items:
            result[item.month] = item.to_dict()
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post('/free-promotion/save')
async def save_free_promotion_plan(
    request: BatchSavePlanData,
    db: Session = Depends(get_db)
):
    """保存免费推广月度计划数据"""
    try:
        for item in request.data:
            existing = db.query(市场部免费推广月度计划表).filter(
                and_(
                    市场部免费推广月度计划表.campus == request.campus,
                    市场部免费推广月度计划表.year == request.year,
                    市场部免费推广月度计划表.month == item.month
                )
            ).first()
            
            if existing:
                existing.plan_income = item.plan_income or 0
                existing.plan_enrollment = item.plan_enrollment or 0
                existing.plan_consult_volume = item.plan_consult_volume or 0
                existing.plan_cost = item.plan_cost or 0
            else:
                new_record = 市场部免费推广月度计划表(
                    campus=request.campus,
                    year=request.year,
                    month=item.month,
                    plan_income=item.plan_income or 0,
                    plan_enrollment=item.plan_enrollment or 0,
                    plan_consult_volume=item.plan_consult_volume or 0,
                    plan_cost=item.plan_cost or 0
                )
                db.add(new_record)
        
        db.commit()
        return {'code': 0, 'message': '保存成功'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) from e
