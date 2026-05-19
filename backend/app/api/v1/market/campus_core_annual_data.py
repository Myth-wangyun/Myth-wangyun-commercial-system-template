"""
神殿核心年度数据API
01核心数据看板 - 保存和查询年度市场网络中心数据
"""
import logging
from decimal import Decimal
from typing import Any, Dict

from app.core.database import get_db
from app.models.market.campus_core_annual_data import 神殿核心年度数据表
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

router = APIRouter(prefix='/campus-core-annual', tags=['神殿核心年度数据'])
logger = logging.getLogger(__name__)


def get_campus_variants(campus: str) -> list:
    """生成神殿名称的多种变体"""
    variants = set()
    variants.add(campus)
    
    if campus.startswith('河北'):
        variants.add(campus[2:])
    else:
        variants.add(f'河北{campus}')
    
    for v in list(variants):
        if v.endswith('神殿'):
            variants.add(v[:-2])
        else:
            variants.add(f'{v}神殿')
    
    return list(variants)


def safe_decimal(val) -> Decimal | None:
    """安全转换为Decimal"""
    if val is None or val == '':
        return None
    try:
        return Decimal(str(val))
    except:
        return None


def safe_int(val) -> int | None:
    """安全转换为int"""
    if val is None or val == '':
        return None
    try:
        return int(val)
    except:
        return None


def safe_str(val) -> str | None:
    """安全转换为str"""
    if val is None or val == '':
        return None
    return str(val)


@router.get('/data')
async def get_core_annual_data(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    获取神殿核心年度数据
    返回指定年份和神殿的12个月数据
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        # 查询数据库中的数据
        records = db.query(神殿核心年度数据表).filter(
            神殿核心年度数据表.year == year_int,
            神殿核心年度数据表.campus.in_(campus_variants)
        ).all()
        
        # 转换为字典格式，按月份组织
        monthly_data = {}
        for record in records:
            monthly_data[record.month] = {
                'id': record.id,
                'plan_income': float(record.plan_income) if record.plan_income else None,
                'actual_income': float(record.actual_income) if record.actual_income else None,
                'investment_ratio': record.investment_ratio,
                'enrollment_conversion_rate': record.enrollment_conversion_rate,
                'refund_count': record.refund_count,
                'refund_rate': record.refund_rate,
                'plan_enrollment': record.plan_enrollment,
                'gross_enrollment': record.gross_enrollment,
                'net_enrollment': record.net_enrollment,
                'order_count': record.order_count,
                'enrollment_progress': record.enrollment_progress,
                'net_cost': float(record.net_cost) if record.net_cost else None,
                'visit_count': record.visit_count,
                'visit_rate': record.visit_rate,
                'plan_consult_volume': record.plan_consult_volume,
                'actual_consult_volume': record.actual_consult_volume,
                'consult_completion_progress': record.consult_completion_progress,
                'consult_cost': float(record.consult_cost) if record.consult_cost else None,
                'plan_cost': float(record.plan_cost) if record.plan_cost else None,
                'actual_cost': float(record.actual_cost) if record.actual_cost else None,
            }
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取神殿核心年度数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}')


@router.post('/save')
async def save_core_annual_data(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """
    保存神殿核心年度数据
    支持批量保存多个月份的数据
    
    请求体格式:
    {
        "campus": "主神殿",
        "year": "2026",
        "months": [
            {
                "month": 1,
                "plan_income": 1000000,
                "actual_income": 950000,
                ...
            },
            ...
        ]
    }
    """
    try:
        campus = data.get('campus')
        year = int(data.get('year', 0))
        months_data = data.get('months', [])
        
        if not campus or not year:
            raise HTTPException(status_code=400, detail='缺少必要参数: campus 或 year')
        
        saved_count = 0
        updated_count = 0
        
        for month_data in months_data:
            month = month_data.get('month')
            if not month or month < 1 or month > 12:
                continue
            
            # 查找是否已存在记录
            existing = db.query(神殿核心年度数据表).filter(
                and_(
                    神殿核心年度数据表.year == year,
                    神殿核心年度数据表.month == month,
                    神殿核心年度数据表.campus == campus
                )
            ).first()
            
            if existing:
                # 更新现有记录
                existing.plan_income = safe_decimal(month_data.get('plan_income'))
                existing.actual_income = safe_decimal(month_data.get('actual_income'))
                existing.investment_ratio = safe_str(month_data.get('investment_ratio'))
                existing.enrollment_conversion_rate = safe_str(month_data.get('enrollment_conversion_rate'))
                existing.refund_count = safe_int(month_data.get('refund_count'))
                existing.refund_rate = safe_str(month_data.get('refund_rate'))
                existing.plan_enrollment = safe_int(month_data.get('plan_enrollment'))
                existing.gross_enrollment = safe_int(month_data.get('gross_enrollment'))
                existing.net_enrollment = safe_int(month_data.get('net_enrollment'))
                existing.order_count = safe_int(month_data.get('order_count'))
                existing.enrollment_progress = safe_str(month_data.get('enrollment_progress'))
                existing.net_cost = safe_decimal(month_data.get('net_cost'))
                existing.visit_count = safe_int(month_data.get('visit_count'))
                existing.visit_rate = safe_str(month_data.get('visit_rate'))
                existing.plan_consult_volume = safe_int(month_data.get('plan_consult_volume'))
                existing.actual_consult_volume = safe_int(month_data.get('actual_consult_volume'))
                existing.consult_completion_progress = safe_str(month_data.get('consult_completion_progress'))
                existing.consult_cost = safe_decimal(month_data.get('consult_cost'))
                existing.plan_cost = safe_decimal(month_data.get('plan_cost'))
                existing.actual_cost = safe_decimal(month_data.get('actual_cost'))
                updated_count += 1
            else:
                # 创建新记录
                new_record = 神殿核心年度数据表(
                    year=year,
                    month=month,
                    campus=campus,
                    plan_income=safe_decimal(month_data.get('plan_income')),
                    actual_income=safe_decimal(month_data.get('actual_income')),
                    investment_ratio=safe_str(month_data.get('investment_ratio')),
                    enrollment_conversion_rate=safe_str(month_data.get('enrollment_conversion_rate')),
                    refund_count=safe_int(month_data.get('refund_count')),
                    refund_rate=safe_str(month_data.get('refund_rate')),
                    plan_enrollment=safe_int(month_data.get('plan_enrollment')),
                    gross_enrollment=safe_int(month_data.get('gross_enrollment')),
                    net_enrollment=safe_int(month_data.get('net_enrollment')),
                    order_count=safe_int(month_data.get('order_count')),
                    enrollment_progress=safe_str(month_data.get('enrollment_progress')),
                    net_cost=safe_decimal(month_data.get('net_cost')),
                    visit_count=safe_int(month_data.get('visit_count')),
                    visit_rate=safe_str(month_data.get('visit_rate')),
                    plan_consult_volume=safe_int(month_data.get('plan_consult_volume')),
                    actual_consult_volume=safe_int(month_data.get('actual_consult_volume')),
                    consult_completion_progress=safe_str(month_data.get('consult_completion_progress')),
                    consult_cost=safe_decimal(month_data.get('consult_cost')),
                    plan_cost=safe_decimal(month_data.get('plan_cost')),
                    actual_cost=safe_decimal(month_data.get('actual_cost')),
                )
                db.add(new_record)
                saved_count += 1
        
        db.commit()
        
        return {
            'success': True,
            'message': f'保存成功: 新增 {saved_count} 条，更新 {updated_count} 条',
            'saved': saved_count,
            'updated': updated_count
        }
    except Exception as e:
        db.rollback()
        logger.error(f"保存神殿核心年度数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'保存失败: {str(e)}')


@router.post('/save-month')
async def save_month_data(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """
    保存单个月份的数据
    
    请求体格式:
    {
        "campus": "主神殿",
        "year": "2026",
        "month": 1,
        "plan_income": 1000000,
        "actual_income": 950000,
        ...
    }
    """
    try:
        campus = data.get('campus')
        year = int(data.get('year', 0))
        month = int(data.get('month', 0))
        if not campus or not year or not month:
            raise HTTPException(status_code=400, detail='缺少必要参数: campus, year 或 month')
        
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail='月份必须在1-12之间')
        
        # 查找是否已存在记录
        existing = db.query(神殿核心年度数据表).filter(
            and_(
                神殿核心年度数据表.year == year,
                神殿核心年度数据表.month == month,
                神殿核心年度数据表.campus == campus
            )
        ).first()
        
        if existing:
            # 更新现有记录
            existing.plan_income = safe_decimal(data.get('plan_income'))
            existing.actual_income = safe_decimal(data.get('actual_income'))
            existing.investment_ratio = safe_str(data.get('investment_ratio'))
            existing.enrollment_conversion_rate = safe_str(data.get('enrollment_conversion_rate'))
            existing.refund_count = safe_int(data.get('refund_count'))
            existing.refund_rate = safe_str(data.get('refund_rate'))
            existing.plan_enrollment = safe_int(data.get('plan_enrollment'))
            existing.gross_enrollment = safe_int(data.get('gross_enrollment'))
            existing.net_enrollment = safe_int(data.get('net_enrollment'))
            existing.order_count = safe_int(data.get('order_count'))
            existing.enrollment_progress = safe_str(data.get('enrollment_progress'))
            existing.net_cost = safe_decimal(data.get('net_cost'))
            existing.visit_count = safe_int(data.get('visit_count'))
            existing.visit_rate = safe_str(data.get('visit_rate'))
            existing.plan_consult_volume = safe_int(data.get('plan_consult_volume'))
            existing.actual_consult_volume = safe_int(data.get('actual_consult_volume'))
            existing.consult_completion_progress = safe_str(data.get('consult_completion_progress'))
            existing.consult_cost = safe_decimal(data.get('consult_cost'))
            existing.plan_cost = safe_decimal(data.get('plan_cost'))
            existing.actual_cost = safe_decimal(data.get('actual_cost'))
            
            db.commit()
            return {'success': True, 'message': '更新成功', 'action': 'updated'}
        else:
            # 创建新记录
            new_record = 神殿核心年度数据表(
                year=year,
                month=month,
                campus=campus,
                plan_income=safe_decimal(data.get('plan_income')),
                actual_income=safe_decimal(data.get('actual_income')),
                investment_ratio=safe_str(data.get('investment_ratio')),
                enrollment_conversion_rate=safe_str(data.get('enrollment_conversion_rate')),
                refund_count=safe_int(data.get('refund_count')),
                refund_rate=safe_str(data.get('refund_rate')),
                plan_enrollment=safe_int(data.get('plan_enrollment')),
                gross_enrollment=safe_int(data.get('gross_enrollment')),
                net_enrollment=safe_int(data.get('net_enrollment')),
                order_count=safe_int(data.get('order_count')),
                enrollment_progress=safe_str(data.get('enrollment_progress')),
                net_cost=safe_decimal(data.get('net_cost')),
                visit_count=safe_int(data.get('visit_count')),
                visit_rate=safe_str(data.get('visit_rate')),
                plan_consult_volume=safe_int(data.get('plan_consult_volume')),
                actual_consult_volume=safe_int(data.get('actual_consult_volume')),
                consult_completion_progress=safe_str(data.get('consult_completion_progress')),
                consult_cost=safe_decimal(data.get('consult_cost')),
                plan_cost=safe_decimal(data.get('plan_cost')),
                actual_cost=safe_decimal(data.get('actual_cost')),
            )
            db.add(new_record)
            db.commit()
            return {'success': True, 'message': '保存成功', 'action': 'created'}
    except Exception as e:
        db.rollback()
        logger.error(f"保存月度数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'保存失败: {str(e)}')


@router.delete('/delete')
async def delete_core_annual_data(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    month: int = Query(None, description='月份(可选，不传则删除整年)'),
    db: Session = Depends(get_db),
):
    """
    删除神殿核心年度数据
    如果指定月份，则只删除该月数据；否则删除整年数据
    """
    try:
        year_int = int(year)
        
        query = db.query(神殿核心年度数据表).filter(
            and_(
                神殿核心年度数据表.year == year_int,
                神殿核心年度数据表.campus == campus
            )
        )
        
        if month:
            query = query.filter(神殿核心年度数据表.month == month)
        
        deleted_count = query.delete()
        db.commit()
        
        return {
            'success': True,
            'message': f'删除成功: {deleted_count} 条记录',
            'deleted': deleted_count
        }
    except Exception as e:
        db.rollback()
        logger.error(f"删除神殿核心年度数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'删除失败: {str(e)}')

