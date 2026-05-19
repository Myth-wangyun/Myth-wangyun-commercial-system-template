"""
市场部月度业务推进汇总 API
"""

from datetime import datetime

from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

router = APIRouter()


def get_daily_data_campus_name(campus: str) -> str:
    """
    将012表中的神殿名称转换为日度数据表中的神殿名称
    注意：日度数据表中使用的是完整的神殿名称，不需要映射
    """
    return campus


def get_reputation_summary(db: Session, campus: str, start_date: str, end_date: str):
    """获取口碑渠道汇总数据"""
    from app.models.market.daily_reputation_data import 市场部口碑日度数据表
    from sqlalchemy import Date, cast
    
    result = db.query(
        func.sum(市场部口碑日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部口碑日度数据表.净报名).label('net_signup'),
        func.sum(市场部口碑日度数据表.订单数).label('order_count'),
        func.sum(市场部口碑日度数据表.上门人数).label('visit_count'),
        func.sum(市场部口碑日度数据表.实际口碑咨询量).label('actual_consult_count'),
        func.sum(市场部口碑日度数据表.合作伙伴实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部口碑日度数据表.神殿 == campus,
            市场部口碑日度数据表.日期 >= cast(start_date, Date),
            市场部口碑日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    return {
        'gross_total': int(result.gross_total or 0),
        'net_signup': int(result.net_signup or 0),
        'order_count': int(result.order_count or 0),
        'visit_count': int(result.visit_count or 0),
        'actual_consult_count': int(result.actual_consult_count or 0),
        'consumption': 0,
        'actual_income': float(result.actual_income or 0),
    }


def get_partner_summary(db: Session, campus: str, start_date: str, end_date: str):
    """获取网络合作伙伴汇总数据"""
    from app.models.market.online_partner_daily import 市场部网络合作伙伴日度数据表
    from sqlalchemy import Date, cast
    
    result = db.query(
        func.sum(市场部网络合作伙伴日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部网络合作伙伴日度数据表.净报名).label('net_signup'),
        func.sum(市场部网络合作伙伴日度数据表.订单数).label('order_count'),
        func.sum(市场部网络合作伙伴日度数据表.上门人数).label('visit_count'),
        func.sum(市场部网络合作伙伴日度数据表.实际总咨询量).label('actual_consult_count'),
        func.sum(市场部网络合作伙伴日度数据表.合作伙伴消费).label('consumption'),
        func.sum(市场部网络合作伙伴日度数据表.合作伙伴实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部网络合作伙伴日度数据表.神殿 == campus,
            市场部网络合作伙伴日度数据表.日期 >= cast(start_date, Date),
            市场部网络合作伙伴日度数据表.日期 <= cast(end_date, Date),
            市场部网络合作伙伴日度数据表.合作伙伴 != 'summary'
        )
    ).first()
    
    return {
        'gross_total': int(result.gross_total or 0),
        'net_signup': int(result.net_signup or 0),
        'order_count': int(result.order_count or 0),
        'visit_count': int(result.visit_count or 0),
        'actual_consult_count': int(result.actual_consult_count or 0),
        'consumption': float(result.consumption or 0),
        'actual_income': float(result.actual_income or 0),
    }


def get_sem_summary(db: Session, campus: str, start_date: str, end_date: str):
    """获取SEM汇总数据"""
    from app.models.market.sem_daily_data import (
        市场部SEM其他平台日度数据表,
        市场部SEM百度推广日度数据表,
    )
    from sqlalchemy import Date, cast
    
    # 百度数据
    baidu = db.query(
        func.sum(市场部SEM百度推广日度数据表.毛报数).label('gross_total'),
        func.sum(市场部SEM百度推广日度数据表.净报名).label('net_signup'),
        func.sum(市场部SEM百度推广日度数据表.订座数).label('order_count'),
        func.sum(市场部SEM百度推广日度数据表.上门人数).label('visit_count'),
        func.sum(市场部SEM百度推广日度数据表.百度咨询量).label('actual_consult_count'),
        func.sum(市场部SEM百度推广日度数据表.百度消费).label('consumption'),
        func.sum(市场部SEM百度推广日度数据表.百度收入).label('actual_income'),
    ).filter(
        and_(
            市场部SEM百度推广日度数据表.神殿 == campus,
            市场部SEM百度推广日度数据表.日期 >= cast(start_date, Date),
            市场部SEM百度推广日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    # 其他平台数据
    other = db.query(
        func.sum(市场部SEM其他平台日度数据表.毛报数).label('gross_total'),
        func.sum(市场部SEM其他平台日度数据表.净报名).label('net_signup'),
        func.sum(市场部SEM其他平台日度数据表.订座数).label('order_count'),
        func.sum(市场部SEM其他平台日度数据表.上门人数).label('visit_count'),
        func.sum(市场部SEM其他平台日度数据表.其他咨询量).label('actual_consult_count'),
        func.sum(市场部SEM其他平台日度数据表.其他消费).label('consumption'),
        func.sum(市场部SEM其他平台日度数据表.其他收入).label('actual_income'),
    ).filter(
        and_(
            市场部SEM其他平台日度数据表.神殿 == campus,
            市场部SEM其他平台日度数据表.日期 >= cast(start_date, Date),
            市场部SEM其他平台日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    return {
        'gross_total': int((baidu.gross_total or 0) + (other.gross_total or 0)),
        'net_signup': int((baidu.net_signup or 0) + (other.net_signup or 0)),
        'order_count': int((baidu.order_count or 0) + (other.order_count or 0)),
        'visit_count': int((baidu.visit_count or 0) + (other.visit_count or 0)),
        'actual_consult_count': int((baidu.actual_consult_count or 0) + (other.actual_consult_count or 0)),
        'consumption': float((baidu.consumption or 0) + (other.consumption or 0)),
        'actual_income': float((baidu.actual_income or 0) + (other.actual_income or 0)),
    }


def get_newmedia_summary(db: Session, campus: str, start_date: str, end_date: str):
    """获取新媒体汇总数据"""
    from app.models.market.bilibili_daily_data import 市场部B站日度数据表
    from app.models.market.douyin_daily_data import 市场部抖音日度数据表
    from app.models.market.kuaishou_daily_data import 市场部快手日度数据表
    from app.models.market.wechat_video_daily_data import 市场部微信视频号日度数据表
    from app.models.market.xiaohongshu_daily_data import 市场部小红书日度数据表
    from sqlalchemy import Date, cast
    
    total = {
        'gross_total': 0,
        'net_signup': 0,
        'order_count': 0,
        'visit_count': 0,
        'actual_consult_count': 0,
        'consumption': 0.0,
        'consult_total': 0,
        'actual_income': 0.0,
    }
    
    # 抖音数据
    douyin = db.query(
        func.sum(市场部抖音日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部抖音日度数据表.净报名).label('net_signup'),
        func.sum(市场部抖音日度数据表.订座数).label('order_count'),
        func.sum(市场部抖音日度数据表.上门人数).label('visit_count'),
        func.sum(市场部抖音日度数据表.抖音咨询量).label('actual_consult_count'),
        func.sum(市场部抖音日度数据表.抖音花费).label('consumption'),
        func.sum(市场部抖音日度数据表.抖音实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部抖音日度数据表.神殿 == campus,
            市场部抖音日度数据表.日期 >= cast(start_date, Date),
            市场部抖音日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    if douyin:
        total['gross_total'] += int(douyin.gross_total or 0)
        total['net_signup'] += int(douyin.net_signup or 0)
        total['order_count'] += int(douyin.order_count or 0)
        total['visit_count'] += int(douyin.visit_count or 0)
        total['actual_consult_count'] += int(douyin.actual_consult_count or 0)
        total['consumption'] += float(douyin.consumption or 0)
        total['consult_total'] += int(douyin.actual_consult_count or 0)
        total['actual_income'] += float(douyin.actual_income or 0)
    
    # 快手数据
    kuaishou = db.query(
        func.sum(市场部快手日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部快手日度数据表.净报名).label('net_signup'),
        func.sum(市场部快手日度数据表.订座数).label('order_count'),
        func.sum(市场部快手日度数据表.上门人数).label('visit_count'),
        func.sum(市场部快手日度数据表.快手咨询量).label('actual_consult_count'),
        func.sum(市场部快手日度数据表.快手花费).label('consumption'),
        func.sum(市场部快手日度数据表.快手实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部快手日度数据表.神殿 == campus,
            市场部快手日度数据表.日期 >= cast(start_date, Date),
            市场部快手日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    if kuaishou:
        total['gross_total'] += int(kuaishou.gross_total or 0)
        total['net_signup'] += int(kuaishou.net_signup or 0)
        total['order_count'] += int(kuaishou.order_count or 0)
        total['visit_count'] += int(kuaishou.visit_count or 0)
        total['actual_consult_count'] += int(kuaishou.actual_consult_count or 0)
        total['consumption'] += float(kuaishou.consumption or 0)
        total['consult_total'] += int(kuaishou.actual_consult_count or 0)
        total['actual_income'] += float(kuaishou.actual_income or 0)
    
    # B站数据
    bilibili = db.query(
        func.sum(市场部B站日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部B站日度数据表.净报名).label('net_signup'),
        func.sum(市场部B站日度数据表.订座数).label('order_count'),
        func.sum(市场部B站日度数据表.上门人数).label('visit_count'),
        func.sum(市场部B站日度数据表.B站咨询量).label('actual_consult_count'),
        func.sum(市场部B站日度数据表.B站花费).label('consumption'),
        func.sum(市场部B站日度数据表.B站实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部B站日度数据表.神殿 == campus,
            市场部B站日度数据表.日期 >= cast(start_date, Date),
            市场部B站日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    if bilibili:
        total['gross_total'] += int(bilibili.gross_total or 0)
        total['net_signup'] += int(bilibili.net_signup or 0)
        total['order_count'] += int(bilibili.order_count or 0)
        total['visit_count'] += int(bilibili.visit_count or 0)
        total['actual_consult_count'] += int(bilibili.actual_consult_count or 0)
        total['consumption'] += float(bilibili.consumption or 0)
        total['consult_total'] += int(bilibili.actual_consult_count or 0)
        total['actual_income'] += float(bilibili.actual_income or 0)
    
    # 小红书数据
    xiaohongshu = db.query(
        func.sum(市场部小红书日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部小红书日度数据表.净报名).label('net_signup'),
        func.sum(市场部小红书日度数据表.订座数).label('order_count'),
        func.sum(市场部小红书日度数据表.上门人数).label('visit_count'),
        func.sum(市场部小红书日度数据表.小红书总量).label('actual_consult_count'),
        func.sum(市场部小红书日度数据表.小红书消费).label('consumption'),
        func.sum(市场部小红书日度数据表.小红书实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部小红书日度数据表.神殿 == campus,
            市场部小红书日度数据表.日期 >= cast(start_date, Date),
            市场部小红书日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    if xiaohongshu:
        total['gross_total'] += int(xiaohongshu.gross_total or 0)
        total['net_signup'] += int(xiaohongshu.net_signup or 0)
        total['order_count'] += int(xiaohongshu.order_count or 0)
        total['visit_count'] += int(xiaohongshu.visit_count or 0)
        total['actual_consult_count'] += int(xiaohongshu.actual_consult_count or 0)
        total['consumption'] += float(xiaohongshu.consumption or 0)
        total['consult_total'] += int(xiaohongshu.actual_consult_count or 0)
        total['actual_income'] += float(xiaohongshu.actual_income or 0)
    
    # 微信视频号数据
    wechat = db.query(
        func.sum(市场部微信视频号日度数据表.毛报总数).label('gross_total'),
        func.sum(市场部微信视频号日度数据表.净报名).label('net_signup'),
        func.sum(市场部微信视频号日度数据表.订座数).label('order_count'),
        func.sum(市场部微信视频号日度数据表.上门人数).label('visit_count'),
        func.sum(市场部微信视频号日度数据表.微信视频号总量).label('actual_consult_count'),
        func.sum(市场部微信视频号日度数据表.微信视频号消费).label('consumption'),
        func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('actual_income'),
    ).filter(
        and_(
            市场部微信视频号日度数据表.神殿 == campus,
            市场部微信视频号日度数据表.日期 >= cast(start_date, Date),
            市场部微信视频号日度数据表.日期 <= cast(end_date, Date)
        )
    ).first()
    
    if wechat:
        total['gross_total'] += int(wechat.gross_total or 0)
        total['net_signup'] += int(wechat.net_signup or 0)
        total['order_count'] += int(wechat.order_count or 0)
        total['visit_count'] += int(wechat.visit_count or 0)
        total['actual_consult_count'] += int(wechat.actual_consult_count or 0)
        total['consumption'] += float(wechat.consumption or 0)
        total['consult_total'] += int(wechat.actual_consult_count or 0)
        total['actual_income'] += float(wechat.actual_income or 0)
    
    return total


@router.get(
    '/monthly-business-progress/all-campus-summary',
    summary='获取所有神殿的月度业务推进汇总数据'
)
def get_all_campus_summary(
    year: str = Query(..., description='年份'),
    month: str = Query(..., description='月份'),
    startDate: str = Query(..., description='开始日期'),
    endDate: str = Query(..., description='结束日期'),
    db: Session = Depends(get_db)
):
    """
    获取所有神殿的月度业务推进汇总数据
    
    数据来源说明：
    1. 计划数据（计划收入、计划报名、计划咨询量、月计划消费）：
       来自 012-市场部年度网络计划表（MarketNetworkPlan）
       - plan_income: network_plan_income（网络计划收入）
       - plan_enrollment: network_plan_signup（网络计划报名）
       - plan_consult_volume: network_plan_total（网络计划总量）
       - monthly_consult_cost: network_plan_cost（网络计划消费）
    
    2. 实际数据：从各渠道日度数据表汇总
       - 口碑数据：市场部口碑日度数据表
       - 合作伙伴数据：市场部网络合作伙伴日度数据表
       - SEM数据：市场部SEM日度数据表（百度+其他平台）
       - 新媒体数据：抖音、快手、B站、小红书、微信视频号日度数据表
    """
    from app.models.market.network_plan import MarketNetworkPlan
    
    try:
        datetime.strptime(startDate, '%Y-%m-%d')
        datetime.strptime(endDate, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail='日期格式错误')
    
    month_int = int(month)
    
    # 调试：查看查询条件
    print(f"查询条件: year={year}, month={month_int}, startDate={startDate}, endDate={endDate}")
    
    # 先查询所有数据看看
    all_plans = db.query(MarketNetworkPlan).filter(
        MarketNetworkPlan.year == year
    ).all()
    print(f"找到 {len(all_plans)} 条年度数据")
    for p in all_plans:
        print(f"  - month={p.month}, campus={p.campus}")
    
    # 按条件查询
    plans = db.query(MarketNetworkPlan).filter(
        and_(
            MarketNetworkPlan.year == year,
            MarketNetworkPlan.month == month_int,
            MarketNetworkPlan.campus != ''
        )
    ).all()
    
    print(f"符合条件的计划数据: {len(plans)}")
    
    result_items = []
    
    for plan in plans:
        campus = plan.campus
        print(f"处理神殿: {campus}")
        
        # 将012表中的神殿名称转换为日度数据表中的神殿名称
        daily_data_campus = get_daily_data_campus_name(campus)
        print(f"  日度数据表神殿名称: {daily_data_campus}")
        
        try:
            reputation_data = get_reputation_summary(db, daily_data_campus, startDate, endDate)
            partner_data = get_partner_summary(db, daily_data_campus, startDate, endDate)
            sem_data = get_sem_summary(db, daily_data_campus, startDate, endDate)
            newmedia_data = get_newmedia_summary(db, daily_data_campus, startDate, endDate)
            
            # 计划收入：从012市场部年度网络计划表获取
            # network_plan_income = sem_plan_income + newmedia_plan_income
            plan_income = float(plan.network_plan_income or 0)
            
            # 实际收入：从4个日度数据表汇总
            # 1. 007-市场部口碑日度数据表
            # 2. 006-市场部网络合作伙伴日度数据表
            # 3. 005-市场部SEM日度数据表（百度+其他平台）
            # 4. 004-市场部新媒体日度数据表（抖音+快手+B站+小红书+微信视频号）
            reputation_income = float(reputation_data.get('actual_income', 0))
            partner_income = float(partner_data.get('actual_income', 0))
            sem_income = float(sem_data.get('actual_income', 0))
            newmedia_income = float(newmedia_data.get('actual_income', 0))
            
            actual_income = reputation_income + partner_income + sem_income + newmedia_income
            
            print(f"  神殿 {campus} 实际收入明细:")
            print(f"    - 口碑实际收入: {reputation_income}")
            print(f"    - 合作伙伴实际收入: {partner_income}")
            print(f"    - SEM实际收入: {sem_income}")
            print(f"    - 新媒体实际收入: {newmedia_income}")
            print(f"    - 总实际收入: {actual_income}")
            
            result_items.append({
                'campus': campus,
                'plan_income': plan_income,  # 从012表获取的网络计划收入
                'plan_enrollment': int(plan.network_plan_signup or 0),  # 网络计划报名
                'plan_consult_volume': int(plan.network_plan_total or 0),  # 网络计划总量（咨询量）
                'monthly_consult_cost': float(plan.network_plan_cost or 0),  # 网络计划消费
                'actual_income': actual_income,  # 实际收入：从4个日度数据表汇总
                'reputation_data': reputation_data,
                'partner_data': partner_data,
                'sem_data': sem_data,
                'newmedia_data': newmedia_data,
            })
            print(f"  ✓ 神殿 {campus} 数据处理完成")
        except Exception as e:
            print(f"  ✗ 处理神殿 {campus} 失败: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"最终返回 {len(result_items)} 个神殿的数据")
    return {'items': result_items}

