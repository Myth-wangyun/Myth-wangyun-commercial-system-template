import logging

from app.core.database import get_db
from app.models.market import 市场部网络合作伙伴日度数据表
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

router = APIRouter()
logger = logging.getLogger(__name__)


def get_campus_variants(campus: str) -> list:
    """
    生成神殿名称的多种变体，以匹配数据库中可能的格式
    例如：河北主神殿 -> [河北主神殿, 主神殿, 河北盛邦, 盛邦]
    """
    variants = set()
    variants.add(campus)
    
    # 去除"河北"前缀的版本
    if campus.startswith('河北'):
        variants.add(campus[2:])
    else:
        # 添加"河北"前缀的版本
        variants.add(f'河北{campus}')
    
    # 处理"神殿"后缀
    for v in list(variants):
        if v.endswith('神殿'):
            variants.add(v[:-2])  # 去除"神殿"
        else:
            variants.add(f'{v}神殿')  # 添加"神殿"
    
    return list(variants)


@router.get(
    '/network-partner-annual/dashboard',
    summary='获取网络合作伙伴年度数据看板数据',
)
def get_network_partner_annual_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    获取01市场部网络合作伙伴年度数据看板
    按月聚合所有合作伙伴的数据（不包括汇总行）
    """
    try:
        year_int = int(year)
        
        # 获取神殿名称的多种变体
        campus_variants = get_campus_variants(campus)
        logger.info(f"[网络合作伙伴年度看板] 神殿: {campus}, 变体: {campus_variants}, 年份: {year_int}")
        
        # 先查询数据库中存在的神殿列表用于调试
        existing_campuses = db.query(市场部网络合作伙伴日度数据表.神殿).distinct().all()
        logger.info(f"[网络合作伙伴年度看板] 数据库中存在的神殿: {[c[0] for c in existing_campuses]}")
        
        # 查询数据，按月聚合，排除合作伙伴='summary'的汇总行
        query = db.query(
            extract('month', 市场部网络合作伙伴日度数据表.日期).label('month'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴实际收入).label('actual_income'),
            func.sum(市场部网络合作伙伴日度数据表.退费数).label('refund_count'),
            func.sum(市场部网络合作伙伴日度数据表.净报名).label('net_enrollment'),
            func.sum(市场部网络合作伙伴日度数据表.毛报总数).label('gross_enrollment'),
            func.sum(市场部网络合作伙伴日度数据表.订单数).label('order_count'),
            func.sum(市场部网络合作伙伴日度数据表.上门人数).label('visit_count'),
            func.sum(市场部网络合作伙伴日度数据表.实际总咨询量).label('actual_consult_volume'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴消费).label('actual_cost'),
        ).filter(
            市场部网络合作伙伴日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部网络合作伙伴日度数据表.日期) == year_int,
            市场部网络合作伙伴日度数据表.合作伙伴 != 'summary'
        ).group_by(
            extract('month', 市场部网络合作伙伴日度数据表.日期)
        ).order_by(
            extract('month', 市场部网络合作伙伴日度数据表.日期)
        )
        
        results = query.all()
        
        # 转换为字典格式
        monthly_data = {}
        for row in results:
            month = int(row.month)
            monthly_data[month] = {
                'actual_income': float(row.actual_income) if row.actual_income else 0,
                'refund_count': row.refund_count or 0,
                'net_enrollment': row.net_enrollment or 0,
                'gross_enrollment': row.gross_enrollment or 0,
                'order_count': row.order_count or 0,
                'visit_count': row.visit_count or 0,
                'actual_consult_volume': row.actual_consult_volume or 0,
                'actual_cost': float(row.actual_cost) if row.actual_cost else 0,
            }
        
        return {
            'success': True,
            'data': monthly_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}')


@router.get(
    '/network-partner-annual/dashboard-detail',
    summary='获取网络合作伙伴年度数据看板明细',
)
def get_network_partner_annual_dashboard_detail(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    获取02市场部网络合作伙伴年度数据看板明细
    按月和合作伙伴聚合数据
    """
    try:
        year_int = int(year)
        
        # 获取神殿名称的多种变体
        campus_variants = get_campus_variants(campus)
        
        # 合作伙伴映射（英文key到中文名称）
        partner_map = {
            'zhiliao': '知了好学',
            'tantu': '坦途网',
            'baijiao': '百教网',
            'houxue': '厚学网',
            'jiuyisouke': '91搜客',
        }
        
        # 查询数据，按月和合作伙伴聚合，排除合作伙伴='summary'的汇总行
        query = db.query(
            extract('month', 市场部网络合作伙伴日度数据表.日期).label('month'),
            市场部网络合作伙伴日度数据表.合作伙伴,
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴实际收入).label('partner_actual_income'),
            func.sum(市场部网络合作伙伴日度数据表.退费数).label('refund_count'),
            func.sum(市场部网络合作伙伴日度数据表.净报名).label('net_enrollment'),
            func.sum(市场部网络合作伙伴日度数据表.毛报总数).label('gross_enrollment'),
            func.sum(市场部网络合作伙伴日度数据表.订单数).label('order_count'),
            func.sum(市场部网络合作伙伴日度数据表.上门人数).label('visit_count'),
            func.sum(市场部网络合作伙伴日度数据表.实际总咨询量).label('actual_consult_volume'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴消费).label('actual_cost'),
        ).filter(
            市场部网络合作伙伴日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部网络合作伙伴日度数据表.日期) == year_int,
            市场部网络合作伙伴日度数据表.合作伙伴 != 'summary'
        ).group_by(
            extract('month', 市场部网络合作伙伴日度数据表.日期),
            市场部网络合作伙伴日度数据表.合作伙伴
        ).order_by(
            extract('month', 市场部网络合作伙伴日度数据表.日期),
            市场部网络合作伙伴日度数据表.合作伙伴
        )
        
        results = query.all()
        
        # 转换为嵌套字典格式 {month: {partner: data}}
        data: dict[int, dict[str, dict[str, float | int]]] = {}
        for row in results:
            month = int(row.month)
            partner = row.合作伙伴
            
            # 将英文key转换为中文名称
            partner_name = partner_map.get(partner, partner)
            
            if month not in data:
                data[month] = {}
            
            data[month][partner_name] = {
                'partner_actual_income': float(row.partner_actual_income) if row.partner_actual_income else 0,
                'refund_count': row.refund_count or 0,
                'net_enrollment': row.net_enrollment or 0,
                'gross_enrollment': row.gross_enrollment or 0,
                'order_count': row.order_count or 0,
                'visit_count': row.visit_count or 0,
                'actual_consult_volume': row.actual_consult_volume or 0,
                'actual_cost': float(row.actual_cost) if row.actual_cost else 0,
            }
        
        return {
            'success': True,
            'data': data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}')
