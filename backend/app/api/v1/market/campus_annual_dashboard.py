"""
神殿年度数据看板API
为1-campus下的7个表格提供年度汇总数据
"""

import logging
from decimal import Decimal
from typing import TypedDict

from app.core.database import get_db
from app.models.market import (
    市场部B站日度数据表,
    市场部SEM其他平台日度数据表,
    市场部SEM百度推广日度数据表,
    市场部口碑日度数据表,
    市场部小红书日度数据表,
    市场部微信视频号日度数据表,
    市场部快手日度数据表,
    市场部抖音日度数据表,
    市场部网络合作伙伴日度数据表,
)
from app.models.market.free_promotion_daily import (
    市场部免费推广分类信息日度数据表,
    市场部免费推广地图日度数据表,
    市场部免费推广微信平台日度数据表,
    市场部免费推广社交新媒体日度数据表,
    市场部免费推广视频日度数据表,
    市场部免费推广问答日度数据表,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

router = APIRouter(prefix='/campus-annual', tags=['神殿年度数据看板'])
logger = logging.getLogger(__name__)


class 月度看板数据(TypedDict):
    actual_income: float
    refund_count: int
    net_enrollment: int
    gross_enrollment: int
    order_count: int
    visit_count: int
    actual_consult_volume: int
    actual_cost: float


def _new_monthly_data() -> dict[int, 月度看板数据]:
    return {
        i: {
            'actual_income': 0.0,
            'refund_count': 0,
            'net_enrollment': 0,
            'gross_enrollment': 0,
            'order_count': 0,
            'visit_count': 0,
            'actual_consult_volume': 0,
            'actual_cost': 0.0,
        }
        for i in range(1, 13)
    }


def get_campus_variants(campus: str) -> list[str]:
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


def safe_float(val: Decimal | float | int | str | None) -> float:
    """安全转换为float"""
    if val is None or val == '':
        return 0.0
    return float(val)


def safe_int(val):
    """安全转换为int"""
    return int(val) if val else 0


@router.get('/core-dashboard')
async def get_core_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    01核心数据综合看板 - 汇总所有渠道数据
    数据来源：新媒体(5个平台) + SEM(百度+其他) + 网络合作伙伴 + 口碑 + 免费推广
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        monthly_data = _new_monthly_data()
        
        # 1. 新媒体数据 - 抖音
        douyin_data = db.query(
            extract('month', 市场部抖音日度数据表.日期).label('month'),
            func.sum(市场部抖音日度数据表.抖音实际收入).label('income'),
            func.sum(市场部抖音日度数据表.退费数).label('refund'),
            func.sum(市场部抖音日度数据表.净报名).label('net'),
            func.sum(市场部抖音日度数据表.毛报总数).label('gross'),
            func.sum(市场部抖音日度数据表.订座数).label('order'),
            func.sum(市场部抖音日度数据表.上门人数).label('visit'),
            func.sum(市场部抖音日度数据表.抖音咨询量).label('consult'),
            func.sum(市场部抖音日度数据表.抖音花费).label('cost'),
        ).filter(
            市场部抖音日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部抖音日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部抖音日度数据表.日期)).all()
        
        for row in douyin_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 2. 快手
        kuaishou_data = db.query(
            extract('month', 市场部快手日度数据表.日期).label('month'),
            func.sum(市场部快手日度数据表.快手实际收入).label('income'),
            func.sum(市场部快手日度数据表.退费数).label('refund'),
            func.sum(市场部快手日度数据表.净报名).label('net'),
            func.sum(市场部快手日度数据表.毛报总数).label('gross'),
            func.sum(市场部快手日度数据表.订座数).label('order'),
            func.sum(市场部快手日度数据表.上门人数).label('visit'),
            func.sum(市场部快手日度数据表.快手咨询量).label('consult'),
            func.sum(市场部快手日度数据表.快手花费).label('cost'),
        ).filter(
            市场部快手日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部快手日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部快手日度数据表.日期)).all()
        
        for row in kuaishou_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 3. B站
        bilibili_data = db.query(
            extract('month', 市场部B站日度数据表.日期).label('month'),
            func.sum(市场部B站日度数据表.B站实际收入).label('income'),
            func.sum(市场部B站日度数据表.退费数).label('refund'),
            func.sum(市场部B站日度数据表.净报名).label('net'),
            func.sum(市场部B站日度数据表.毛报总数).label('gross'),
            func.sum(市场部B站日度数据表.订座数).label('order'),
            func.sum(市场部B站日度数据表.上门人数).label('visit'),
            func.sum(市场部B站日度数据表.B站咨询量).label('consult'),
            func.sum(市场部B站日度数据表.B站花费).label('cost'),
        ).filter(
            市场部B站日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部B站日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部B站日度数据表.日期)).all()
        
        for row in bilibili_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 4. 小红书
        xiaohongshu_data = db.query(
            extract('month', 市场部小红书日度数据表.日期).label('month'),
            func.sum(市场部小红书日度数据表.小红书实际收入).label('income'),
            func.sum(市场部小红书日度数据表.退费数).label('refund'),
            func.sum(市场部小红书日度数据表.净报名).label('net'),
            func.sum(市场部小红书日度数据表.毛报总数).label('gross'),
            func.sum(市场部小红书日度数据表.订座数).label('order'),
            func.sum(市场部小红书日度数据表.上门人数).label('visit'),
            func.sum(市场部小红书日度数据表.小红书总量).label('consult'),
            func.sum(市场部小红书日度数据表.小红书消费).label('cost'),
        ).filter(
            市场部小红书日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部小红书日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部小红书日度数据表.日期)).all()
        
        for row in xiaohongshu_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 5. 微信视频号
        wechat_data = db.query(
            extract('month', 市场部微信视频号日度数据表.日期).label('month'),
            func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('income'),
            func.sum(市场部微信视频号日度数据表.退费数).label('refund'),
            func.sum(市场部微信视频号日度数据表.净报名).label('net'),
            func.sum(市场部微信视频号日度数据表.毛报总数).label('gross'),
            func.sum(市场部微信视频号日度数据表.订座数).label('order'),
            func.sum(市场部微信视频号日度数据表.上门人数).label('visit'),
            func.sum(市场部微信视频号日度数据表.微信视频号总量).label('consult'),
            func.sum(市场部微信视频号日度数据表.微信视频号消费).label('cost'),
        ).filter(
            市场部微信视频号日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部微信视频号日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部微信视频号日度数据表.日期)).all()
        
        for row in wechat_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 6. SEM百度
        baidu_data = db.query(
            extract('month', 市场部SEM百度推广日度数据表.日期).label('month'),
            func.sum(市场部SEM百度推广日度数据表.百度收入).label('income'),
            func.sum(市场部SEM百度推广日度数据表.退费数).label('refund'),
            func.sum(市场部SEM百度推广日度数据表.净报名).label('net'),
            func.sum(市场部SEM百度推广日度数据表.毛报数).label('gross'),
            func.sum(市场部SEM百度推广日度数据表.订座数).label('order'),
            func.sum(市场部SEM百度推广日度数据表.上门人数).label('visit'),
            func.sum(市场部SEM百度推广日度数据表.百度咨询量).label('consult'),
            func.sum(市场部SEM百度推广日度数据表.百度消费).label('cost'),
        ).filter(
            市场部SEM百度推广日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部SEM百度推广日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部SEM百度推广日度数据表.日期)).all()
        
        for row in baidu_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 7. SEM其他平台
        other_sem_data = db.query(
            extract('month', 市场部SEM其他平台日度数据表.日期).label('month'),
            func.sum(市场部SEM其他平台日度数据表.其他收入).label('income'),
            func.sum(市场部SEM其他平台日度数据表.退费数).label('refund'),
            func.sum(市场部SEM其他平台日度数据表.净报名).label('net'),
            func.sum(市场部SEM其他平台日度数据表.毛报数).label('gross'),
            func.sum(市场部SEM其他平台日度数据表.订座数).label('order'),
            func.sum(市场部SEM其他平台日度数据表.上门人数).label('visit'),
            func.sum(市场部SEM其他平台日度数据表.其他咨询量).label('consult'),
            func.sum(市场部SEM其他平台日度数据表.其他消费).label('cost'),
        ).filter(
            市场部SEM其他平台日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部SEM其他平台日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部SEM其他平台日度数据表.日期)).all()
        
        for row in other_sem_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 8. 网络合作伙伴
        partner_data = db.query(
            extract('month', 市场部网络合作伙伴日度数据表.日期).label('month'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴实际收入).label('income'),
            func.sum(市场部网络合作伙伴日度数据表.退费数).label('refund'),
            func.sum(市场部网络合作伙伴日度数据表.净报名).label('net'),
            func.sum(市场部网络合作伙伴日度数据表.毛报总数).label('gross'),
            func.sum(市场部网络合作伙伴日度数据表.订单数).label('order'),
            func.sum(市场部网络合作伙伴日度数据表.上门人数).label('visit'),
            func.sum(市场部网络合作伙伴日度数据表.实际总咨询量).label('consult'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴消费).label('cost'),
        ).filter(
            市场部网络合作伙伴日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部网络合作伙伴日度数据表.日期) == year_int,
            市场部网络合作伙伴日度数据表.合作伙伴 != 'summary'
        ).group_by(extract('month', 市场部网络合作伙伴日度数据表.日期)).all()
        
        for row in partner_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 9. 口碑
        reputation_data = db.query(
            extract('month', 市场部口碑日度数据表.日期).label('month'),
            func.sum(市场部口碑日度数据表.合作伙伴实际收入).label('income'),
            func.sum(市场部口碑日度数据表.退费数).label('refund'),
            func.sum(市场部口碑日度数据表.净报名).label('net'),
            func.sum(市场部口碑日度数据表.毛报总数).label('gross'),
            func.sum(市场部口碑日度数据表.订单数).label('order'),
            func.sum(市场部口碑日度数据表.上门人数).label('visit'),
            func.sum(市场部口碑日度数据表.实际口碑咨询量).label('consult'),
        ).filter(
            市场部口碑日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部口碑日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部口碑日度数据表.日期)).all()
        
        for row in reputation_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
        
        # 10. 口碑的实际消费（从月度计划表获取）
        from app.models.market.monthly_plan_data import 市场部口碑月度计划表
        
        reputation_cost_data = db.query(
            市场部口碑月度计划表.month,
            市场部口碑月度计划表.actual_expense
        ).filter(
            市场部口碑月度计划表.campus.in_(campus_variants),
            市场部口碑月度计划表.year == str(year_int)
        ).all()
        
        for row in reputation_cost_data:
            m = int(row.month)
            if 1 <= m <= 12:
                monthly_data[m]['actual_cost'] += safe_float(row.actual_expense)
        
        # 11. 免费推广 - 社交新媒体
        social_media_data = db.query(
            extract('month', 市场部免费推广社交新媒体日度数据表.日期).label('month'),
            func.sum(市场部免费推广社交新媒体日度数据表.社交新媒体实际收入).label('income'),
            func.sum(市场部免费推广社交新媒体日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广社交新媒体日度数据表.净报名).label('net'),
            func.sum(市场部免费推广社交新媒体日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广社交新媒体日度数据表.订座数).label('order'),
            func.sum(市场部免费推广社交新媒体日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广社交新媒体日度数据表.社交新媒体咨询量).label('consult'),
            func.sum(市场部免费推广社交新媒体日度数据表.社交新媒体消耗).label('cost'),
        ).filter(
            市场部免费推广社交新媒体日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广社交新媒体日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广社交新媒体日度数据表.日期)).all()
        
        for row in social_media_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 12. 免费推广 - 问答
        qa_data = db.query(
            extract('month', 市场部免费推广问答日度数据表.日期).label('month'),
            func.sum(市场部免费推广问答日度数据表.问答实际收入).label('income'),
            func.sum(市场部免费推广问答日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广问答日度数据表.净报名).label('net'),
            func.sum(市场部免费推广问答日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广问答日度数据表.订座数).label('order'),
            func.sum(市场部免费推广问答日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广问答日度数据表.问答咨询量).label('consult'),
            func.sum(市场部免费推广问答日度数据表.问答花费).label('cost'),
        ).filter(
            市场部免费推广问答日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广问答日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广问答日度数据表.日期)).all()
        
        for row in qa_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 13. 免费推广 - 分类信息
        classified_data = db.query(
            extract('month', 市场部免费推广分类信息日度数据表.日期).label('month'),
            func.sum(市场部免费推广分类信息日度数据表.分类信息实际收入).label('income'),
            func.sum(市场部免费推广分类信息日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广分类信息日度数据表.净报名).label('net'),
            func.sum(市场部免费推广分类信息日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广分类信息日度数据表.订座数).label('order'),
            func.sum(市场部免费推广分类信息日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广分类信息日度数据表.分类信息咨询量).label('consult'),
            func.sum(市场部免费推广分类信息日度数据表.分类信息花费).label('cost'),
        ).filter(
            市场部免费推广分类信息日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广分类信息日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广分类信息日度数据表.日期)).all()
        
        for row in classified_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 14. 免费推广 - 地图
        map_data = db.query(
            extract('month', 市场部免费推广地图日度数据表.日期).label('month'),
            func.sum(市场部免费推广地图日度数据表.地图实际收入).label('income'),
            func.sum(市场部免费推广地图日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广地图日度数据表.净报名).label('net'),
            func.sum(市场部免费推广地图日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广地图日度数据表.订座数).label('order'),
            func.sum(市场部免费推广地图日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广地图日度数据表.地图总量).label('consult'),
            func.sum(市场部免费推广地图日度数据表.地图消费).label('cost'),
        ).filter(
            市场部免费推广地图日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广地图日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广地图日度数据表.日期)).all()
        
        for row in map_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 15. 免费推广 - 微信平台
        wechat_platform_data = db.query(
            extract('month', 市场部免费推广微信平台日度数据表.日期).label('month'),
            func.sum(市场部免费推广微信平台日度数据表.微信平台实际收入).label('income'),
            func.sum(市场部免费推广微信平台日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广微信平台日度数据表.净报名).label('net'),
            func.sum(市场部免费推广微信平台日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广微信平台日度数据表.订座数).label('order'),
            func.sum(市场部免费推广微信平台日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广微信平台日度数据表.微信平台咨询量).label('consult'),
            func.sum(市场部免费推广微信平台日度数据表.微信平台花费).label('cost'),
        ).filter(
            市场部免费推广微信平台日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广微信平台日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广微信平台日度数据表.日期)).all()
        
        for row in wechat_platform_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 16. 免费推广 - 视频
        video_data = db.query(
            extract('month', 市场部免费推广视频日度数据表.日期).label('month'),
            func.sum(市场部免费推广视频日度数据表.视频实际收入).label('income'),
            func.sum(市场部免费推广视频日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广视频日度数据表.净报名).label('net'),
            func.sum(市场部免费推广视频日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广视频日度数据表.订座数).label('order'),
            func.sum(市场部免费推广视频日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广视频日度数据表.视频咨询量).label('consult'),
            func.sum(市场部免费推广视频日度数据表.视频花费).label('cost'),
        ).filter(
            市场部免费推广视频日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广视频日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广视频日度数据表.日期)).all()
        
        for row in video_data:
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取核心数据看板失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get('/newmedia-dashboard')
async def get_newmedia_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    02新媒体数据看板 - 汇总5个新媒体平台数据
    数据来源：抖音 + 快手 + B站 + 小红书 + 微信视频号
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        monthly_data = _new_monthly_data()
        
        # 抖音
        for row in db.query(
            extract('month', 市场部抖音日度数据表.日期).label('month'),
            func.sum(市场部抖音日度数据表.抖音实际收入).label('income'),
            func.sum(市场部抖音日度数据表.退费数).label('refund'),
            func.sum(市场部抖音日度数据表.净报名).label('net'),
            func.sum(市场部抖音日度数据表.毛报总数).label('gross'),
            func.sum(市场部抖音日度数据表.订座数).label('order'),
            func.sum(市场部抖音日度数据表.上门人数).label('visit'),
            func.sum(市场部抖音日度数据表.抖音咨询量).label('consult'),
            func.sum(市场部抖音日度数据表.抖音花费).label('cost'),
        ).filter(
            市场部抖音日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部抖音日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部抖音日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 快手
        for row in db.query(
            extract('month', 市场部快手日度数据表.日期).label('month'),
            func.sum(市场部快手日度数据表.快手实际收入).label('income'),
            func.sum(市场部快手日度数据表.退费数).label('refund'),
            func.sum(市场部快手日度数据表.净报名).label('net'),
            func.sum(市场部快手日度数据表.毛报总数).label('gross'),
            func.sum(市场部快手日度数据表.订座数).label('order'),
            func.sum(市场部快手日度数据表.上门人数).label('visit'),
            func.sum(市场部快手日度数据表.快手咨询量).label('consult'),
            func.sum(市场部快手日度数据表.快手花费).label('cost'),
        ).filter(
            市场部快手日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部快手日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部快手日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # B站
        for row in db.query(
            extract('month', 市场部B站日度数据表.日期).label('month'),
            func.sum(市场部B站日度数据表.B站实际收入).label('income'),
            func.sum(市场部B站日度数据表.退费数).label('refund'),
            func.sum(市场部B站日度数据表.净报名).label('net'),
            func.sum(市场部B站日度数据表.毛报总数).label('gross'),
            func.sum(市场部B站日度数据表.订座数).label('order'),
            func.sum(市场部B站日度数据表.上门人数).label('visit'),
            func.sum(市场部B站日度数据表.B站咨询量).label('consult'),
            func.sum(市场部B站日度数据表.B站花费).label('cost'),
        ).filter(
            市场部B站日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部B站日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部B站日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 小红书
        for row in db.query(
            extract('month', 市场部小红书日度数据表.日期).label('month'),
            func.sum(市场部小红书日度数据表.小红书实际收入).label('income'),
            func.sum(市场部小红书日度数据表.退费数).label('refund'),
            func.sum(市场部小红书日度数据表.净报名).label('net'),
            func.sum(市场部小红书日度数据表.毛报总数).label('gross'),
            func.sum(市场部小红书日度数据表.订座数).label('order'),
            func.sum(市场部小红书日度数据表.上门人数).label('visit'),
            func.sum(市场部小红书日度数据表.小红书总量).label('consult'),
            func.sum(市场部小红书日度数据表.小红书消费).label('cost'),
        ).filter(
            市场部小红书日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部小红书日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部小红书日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 微信视频号
        for row in db.query(
            extract('month', 市场部微信视频号日度数据表.日期).label('month'),
            func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('income'),
            func.sum(市场部微信视频号日度数据表.退费数).label('refund'),
            func.sum(市场部微信视频号日度数据表.净报名).label('net'),
            func.sum(市场部微信视频号日度数据表.毛报总数).label('gross'),
            func.sum(市场部微信视频号日度数据表.订座数).label('order'),
            func.sum(市场部微信视频号日度数据表.上门人数).label('visit'),
            func.sum(市场部微信视频号日度数据表.微信视频号总量).label('consult'),
            func.sum(市场部微信视频号日度数据表.微信视频号消费).label('cost'),
        ).filter(
            市场部微信视频号日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部微信视频号日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部微信视频号日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取新媒体数据看板失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get('/sem-dashboard')
async def get_sem_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    03SEM推广数据看板 - 汇总SEM百度+其他平台数据
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        monthly_data = _new_monthly_data()
        
        # 百度
        for row in db.query(
            extract('month', 市场部SEM百度推广日度数据表.日期).label('month'),
            func.sum(市场部SEM百度推广日度数据表.百度收入).label('income'),
            func.sum(市场部SEM百度推广日度数据表.退费数).label('refund'),
            func.sum(市场部SEM百度推广日度数据表.净报名).label('net'),
            func.sum(市场部SEM百度推广日度数据表.毛报数).label('gross'),
            func.sum(市场部SEM百度推广日度数据表.订座数).label('order'),
            func.sum(市场部SEM百度推广日度数据表.上门人数).label('visit'),
            func.sum(市场部SEM百度推广日度数据表.百度咨询量).label('consult'),
            func.sum(市场部SEM百度推广日度数据表.百度消费).label('cost'),
        ).filter(
            市场部SEM百度推广日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部SEM百度推广日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部SEM百度推广日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 其他平台
        for row in db.query(
            extract('month', 市场部SEM其他平台日度数据表.日期).label('month'),
            func.sum(市场部SEM其他平台日度数据表.其他收入).label('income'),
            func.sum(市场部SEM其他平台日度数据表.退费数).label('refund'),
            func.sum(市场部SEM其他平台日度数据表.净报名).label('net'),
            func.sum(市场部SEM其他平台日度数据表.毛报数).label('gross'),
            func.sum(市场部SEM其他平台日度数据表.订座数).label('order'),
            func.sum(市场部SEM其他平台日度数据表.上门人数).label('visit'),
            func.sum(市场部SEM其他平台日度数据表.其他咨询量).label('consult'),
            func.sum(市场部SEM其他平台日度数据表.其他消费).label('cost'),
        ).filter(
            市场部SEM其他平台日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部SEM其他平台日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部SEM其他平台日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取SEM数据看板失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get('/online-partner-dashboard')
async def get_online_partner_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    04网络合作伙伴数据看板
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        monthly_data = _new_monthly_data()
        
        for row in db.query(
            extract('month', 市场部网络合作伙伴日度数据表.日期).label('month'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴实际收入).label('income'),
            func.sum(市场部网络合作伙伴日度数据表.退费数).label('refund'),
            func.sum(市场部网络合作伙伴日度数据表.净报名).label('net'),
            func.sum(市场部网络合作伙伴日度数据表.毛报总数).label('gross'),
            func.sum(市场部网络合作伙伴日度数据表.订单数).label('order'),
            func.sum(市场部网络合作伙伴日度数据表.上门人数).label('visit'),
            func.sum(市场部网络合作伙伴日度数据表.实际总咨询量).label('consult'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴消费).label('cost'),
        ).filter(
            市场部网络合作伙伴日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部网络合作伙伴日度数据表.日期) == year_int,
            市场部网络合作伙伴日度数据表.合作伙伴 != 'summary'
        ).group_by(extract('month', 市场部网络合作伙伴日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] = safe_float(row.income)
            monthly_data[m]['refund_count'] = safe_int(row.refund)
            monthly_data[m]['net_enrollment'] = safe_int(row.net)
            monthly_data[m]['gross_enrollment'] = safe_int(row.gross)
            monthly_data[m]['order_count'] = safe_int(row.order)
            monthly_data[m]['visit_count'] = safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] = safe_int(row.consult)
            monthly_data[m]['actual_cost'] = safe_float(row.cost)
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取网络合作伙伴数据看板失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get('/reputation-dashboard')
async def get_reputation_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    05市场口碑数据看板
    注意：市场口碑的实际消费需要从月度计划表获取（手动录入）
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        monthly_data = _new_monthly_data()
        
        # 从日度数据表获取基础数据
        for row in db.query(
            extract('month', 市场部口碑日度数据表.日期).label('month'),
            func.sum(市场部口碑日度数据表.合作伙伴实际收入).label('income'),
            func.sum(市场部口碑日度数据表.退费数).label('refund'),
            func.sum(市场部口碑日度数据表.净报名).label('net'),
            func.sum(市场部口碑日度数据表.毛报总数).label('gross'),
            func.sum(市场部口碑日度数据表.订单数).label('order'),
            func.sum(市场部口碑日度数据表.上门人数).label('visit'),
            func.sum(市场部口碑日度数据表.实际口碑咨询量).label('consult'),
        ).filter(
            市场部口碑日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部口碑日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部口碑日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] = safe_float(row.income)
            monthly_data[m]['refund_count'] = safe_int(row.refund)
            monthly_data[m]['net_enrollment'] = safe_int(row.net)
            monthly_data[m]['gross_enrollment'] = safe_int(row.gross)
            monthly_data[m]['order_count'] = safe_int(row.order)
            monthly_data[m]['visit_count'] = safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] = safe_int(row.consult)
        
        # 从月度计划表获取实际消费数据
        from app.models.market.monthly_plan_data import 市场部口碑月度计划表
        
        for row in db.query(
            市场部口碑月度计划表.month,
            市场部口碑月度计划表.actual_expense
        ).filter(
            市场部口碑月度计划表.campus.in_(campus_variants),
            市场部口碑月度计划表.year == str(year_int)
        ).all():
            m = int(row.month)
            if 1 <= m <= 12:
                monthly_data[m]['actual_cost'] = safe_float(row.actual_expense)
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取市场口碑数据看板失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e


@router.get('/free-promotion-dashboard')
async def get_free_promotion_dashboard(
    campus: str = Query(..., description='神殿名称'),
    year: str = Query(..., description='年份'),
    db: Session = Depends(get_db),
):
    """
    07免费推广数据看板 - 汇总6个免费推广渠道数据
    """
    try:
        year_int = int(year)
        campus_variants = get_campus_variants(campus)
        
        monthly_data = _new_monthly_data()
        
        # 1. 社交新媒体
        for row in db.query(
            extract('month', 市场部免费推广社交新媒体日度数据表.日期).label('month'),
            func.sum(市场部免费推广社交新媒体日度数据表.社交新媒体实际收入).label('income'),
            func.sum(市场部免费推广社交新媒体日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广社交新媒体日度数据表.净报名).label('net'),
            func.sum(市场部免费推广社交新媒体日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广社交新媒体日度数据表.订座数).label('order'),
            func.sum(市场部免费推广社交新媒体日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广社交新媒体日度数据表.社交新媒体咨询量).label('consult'),
            func.sum(市场部免费推广社交新媒体日度数据表.社交新媒体消耗).label('cost'),
        ).filter(
            市场部免费推广社交新媒体日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广社交新媒体日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广社交新媒体日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 2. 问答
        for row in db.query(
            extract('month', 市场部免费推广问答日度数据表.日期).label('month'),
            func.sum(市场部免费推广问答日度数据表.问答实际收入).label('income'),
            func.sum(市场部免费推广问答日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广问答日度数据表.净报名).label('net'),
            func.sum(市场部免费推广问答日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广问答日度数据表.订座数).label('order'),
            func.sum(市场部免费推广问答日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广问答日度数据表.问答咨询量).label('consult'),
            func.sum(市场部免费推广问答日度数据表.问答花费).label('cost'),
        ).filter(
            市场部免费推广问答日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广问答日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广问答日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 3. 分类信息
        for row in db.query(
            extract('month', 市场部免费推广分类信息日度数据表.日期).label('month'),
            func.sum(市场部免费推广分类信息日度数据表.分类信息实际收入).label('income'),
            func.sum(市场部免费推广分类信息日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广分类信息日度数据表.净报名).label('net'),
            func.sum(市场部免费推广分类信息日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广分类信息日度数据表.订座数).label('order'),
            func.sum(市场部免费推广分类信息日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广分类信息日度数据表.分类信息咨询量).label('consult'),
            func.sum(市场部免费推广分类信息日度数据表.分类信息花费).label('cost'),
        ).filter(
            市场部免费推广分类信息日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广分类信息日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广分类信息日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 4. 地图
        for row in db.query(
            extract('month', 市场部免费推广地图日度数据表.日期).label('month'),
            func.sum(市场部免费推广地图日度数据表.地图实际收入).label('income'),
            func.sum(市场部免费推广地图日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广地图日度数据表.净报名).label('net'),
            func.sum(市场部免费推广地图日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广地图日度数据表.订座数).label('order'),
            func.sum(市场部免费推广地图日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广地图日度数据表.地图总量).label('consult'),
            func.sum(市场部免费推广地图日度数据表.地图消费).label('cost'),
        ).filter(
            市场部免费推广地图日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广地图日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广地图日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 5. 微信平台
        for row in db.query(
            extract('month', 市场部免费推广微信平台日度数据表.日期).label('month'),
            func.sum(市场部免费推广微信平台日度数据表.微信平台实际收入).label('income'),
            func.sum(市场部免费推广微信平台日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广微信平台日度数据表.净报名).label('net'),
            func.sum(市场部免费推广微信平台日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广微信平台日度数据表.订座数).label('order'),
            func.sum(市场部免费推广微信平台日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广微信平台日度数据表.微信平台咨询量).label('consult'),
            func.sum(市场部免费推广微信平台日度数据表.微信平台花费).label('cost'),
        ).filter(
            市场部免费推广微信平台日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广微信平台日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广微信平台日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        # 6. 视频
        for row in db.query(
            extract('month', 市场部免费推广视频日度数据表.日期).label('month'),
            func.sum(市场部免费推广视频日度数据表.视频实际收入).label('income'),
            func.sum(市场部免费推广视频日度数据表.退费数).label('refund'),
            func.sum(市场部免费推广视频日度数据表.净报名).label('net'),
            func.sum(市场部免费推广视频日度数据表.毛报总数).label('gross'),
            func.sum(市场部免费推广视频日度数据表.订座数).label('order'),
            func.sum(市场部免费推广视频日度数据表.上门人数).label('visit'),
            func.sum(市场部免费推广视频日度数据表.视频咨询量).label('consult'),
            func.sum(市场部免费推广视频日度数据表.视频花费).label('cost'),
        ).filter(
            市场部免费推广视频日度数据表.神殿.in_(campus_variants),
            extract('year', 市场部免费推广视频日度数据表.日期) == year_int
        ).group_by(extract('month', 市场部免费推广视频日度数据表.日期)).all():
            m = int(row.month)
            monthly_data[m]['actual_income'] += safe_float(row.income)
            monthly_data[m]['refund_count'] += safe_int(row.refund)
            monthly_data[m]['net_enrollment'] += safe_int(row.net)
            monthly_data[m]['gross_enrollment'] += safe_int(row.gross)
            monthly_data[m]['order_count'] += safe_int(row.order)
            monthly_data[m]['visit_count'] += safe_int(row.visit)
            monthly_data[m]['actual_consult_volume'] += safe_int(row.consult)
            monthly_data[m]['actual_cost'] += safe_float(row.cost)
        
        return {'success': True, 'data': monthly_data}
    except Exception as e:
        logger.error(f"获取免费推广数据看板失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f'查询失败: {str(e)}') from e
