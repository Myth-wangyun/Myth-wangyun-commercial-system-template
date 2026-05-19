"""
005 神殿每日咨询量汇总表 API（新版）
=====================================
实时统计从当月1日到当前日期的咨询量数据

分区结构：
1. 网络（传统大搜+新媒体）汇总
2. 传统大搜明细（SEM平台 + 网络合作伙伴 + 市场口碑）
3. 新媒体明细（抖音、快手、微信视频号、B站、小红书）
4. 口碑明细
5. 渠道明细
6. 咨询师总汇总
7. 月度汇总

传统大搜匹配规则：
- SEM平台: 量来源或来源类别包含"SEM"关键字
- 网络合作伙伴: 量来源或来源类别为"网络合作伙伴"
- 市场口碑: 量来源或来源类别为"市场口碑"

数据来源：咨询量录入系统（consult.咨询量明细表_v2）
"""

from datetime import date
from typing import Any, Dict, List, Optional

from app.core.database import get_db
from app.models.consult.consultation_record import 咨询量明细表
from app.models.user import User
from app.utils.consultation_date_utils import (
    get_business_day_range,
    get_business_month_range,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

router = APIRouter(prefix="/consultation", tags=["005咨询量汇总"])


# ==================== 常量定义 ====================

# 传统大搜包含的媒体来源（媒体来源字段值）
# 传统大搜 = SEM平台 + 网络合作伙伴 + 市场口碑
# 注意：实际数据中 来源类别 为空，媒体来源存储了Level2或Level3的名称
TRADITIONAL_SEARCH_MEDIA_SOURCES = [
    # SEM平台（常规SEM平台下的细分媒体）
    '百度', '百度推广', '中心来电', '在线报名/网站留言', '百度表单', '直接上门',
    # 网络合作伙伴
    '百教网', '91搜客', '知了好学', '坦途网', '厚学网',
    # 市场口碑
    '市场口碑',
    # 兼容旧数据
    '常规SEM平台', '网络合作伙伴',
]

# 新媒体包含的媒体来源（具体来源）
# 新媒体 = 来源类别为新媒体平台 + 具体来源为抖音、快手、微信视频号、B站、小红书
NEW_MEDIA_SOURCES = ['抖音', '快手', '微信视频号', 'B站', '小红书']

# 兼容旧配置
TRADITIONAL_SEARCH_SOURCES = TRADITIONAL_SEARCH_MEDIA_SOURCES + ['TQ', '表单', '中心来电', '在线报名/直接访问']

# 量来源分类映射
SOURCE_TYPE_MAP = {
    '传统大搜': {
        '量来源': ['常规SEM平台', '网络合作伙伴', '市场口碑'],
        '媒体来源': TRADITIONAL_SEARCH_MEDIA_SOURCES
    },
    '新媒体': {
        '量来源': ['新媒体平台'],
        '媒体来源': NEW_MEDIA_SOURCES
    },
    '口碑': {
        '量来源': ['口碑']
    },
    '渠道': {
        '量来源': ['渠道']
    }
}


# ==================== 响应模型 ====================

class ConsultantStats(BaseModel):
    """咨询师统计数据"""
    咨询师: str
    日咨询量: int = 0
    日上门量: int = 0
    日报名: int = 0
    月总咨询量: int = 0
    月总上门量: int = 0
    月总报名: int = 0
    月上门率: Optional[float] = None
    月总转化率: Optional[float] = None
    月当面转化率: Optional[float] = None
    订座: int = 0


class SectionSummary(BaseModel):
    """分区汇总数据"""
    月咨询总量: int = 0
    月总上门量: int = 0
    月报名数_短期: int = 0
    月报名数_长期: int = 0
    月报名数_学三: int = 0
    月报名数_学二: int = 0
    月报名数_合计: int = 0
    月无效量数量: int = 0
    月无效率: Optional[float] = None
    月电话上门转化率: Optional[float] = None
    月度总转化率: Optional[float] = None
    月退费人数: int = 0
    月退费率: Optional[float] = None
    日咨询量: int = 0
    日上门量: int = 0
    日报名数_短期: int = 0
    日报名数_长期: int = 0
    日报名数_学三: int = 0
    日报名数_学二: int = 0


class SectionData(BaseModel):
    """分区完整数据"""
    section_name: str
    summary: SectionSummary
    consultants: List[ConsultantStats]
    total: ConsultantStats


class DailySummaryResponse(BaseModel):
    """完整响应"""
    success: bool = True
    campus: str
    month: str
    current_date: str
    sections: Dict[str, SectionData]
    grand_total: Dict[str, Any]


# ==================== 辅助函数 ====================

def get_month_range(target_date: date | None = None) -> tuple[date, date]:
    """获取当月的日期范围（从1日到当前日期）"""
    if target_date is None:
        target_date = date.today()
    
    month_start = target_date.replace(day=1)
    return month_start, target_date


def resolve_date_boundaries(month_start: date, month_end: date, today: date, db) -> tuple:
    """
    根据咨询量截止时间配置，计算月度和当日的实际 datetime 查询边界。
    
    返回 (month_start_dt, month_end_dt, today_start_dt, today_end_dt)
    
    如果没有配置，回退到传统的 00:00~23:59:59 规则。
    """
    month_start_dt, month_end_dt = get_business_month_range(month_start, month_end, db)
    today_start_dt, today_end_dt = get_business_day_range(today, db)
    return month_start_dt, month_end_dt, today_start_dt, today_end_dt


def calculate_rate(numerator: int, denominator: int) -> Optional[float]:
    """计算比率，分母为0时返回None"""
    if denominator == 0:
        return None
    return round(numerator / denominator, 4)


def build_source_filter(db_query, source_type: str):
    """根据来源类型构建筛选条件
    
    传统大搜定义（新规则）：
    - SEM平台: 量来源 或 来源类别 包含"SEM"关键字（匹配"常规SEM平台"等）
    - 网络合作伙伴: 量来源 或 来源类别 为"网络合作伙伴"
    - 市场口碑: 量来源 或 来源类别 为"市场口碑"
    - 兼容旧数据: 媒体来源 在传统大搜列表中
    
    新媒体定义：
    - 量来源 或 来源类别 为"新媒体平台"
    - 或 具体来源（媒体来源）为：抖音、快手、微信视频号、B站、小红书
    """
    if source_type == '传统大搜':
        # 传统大搜 = SEM平台 + 网络合作伙伴 + 市场口碑
        return db_query.filter(
            or_(
                # SEM平台: 只匹配"SEM"关键字
                咨询量明细表.量来源.like('%SEM%'),
                咨询量明细表.来源类别.like('%SEM%'),
                # 网络合作伙伴
                咨询量明细表.量来源 == '网络合作伙伴',
                咨询量明细表.来源类别 == '网络合作伙伴',
                # 市场口碑
                咨询量明细表.量来源 == '市场口碑',
                咨询量明细表.来源类别 == '市场口碑',
                # 兼容旧数据: 媒体来源直接匹配
                咨询量明细表.媒体来源.in_(TRADITIONAL_SEARCH_MEDIA_SOURCES),
            ),
            # 排除新媒体
            ~咨询量明细表.媒体来源.in_(NEW_MEDIA_SOURCES)
        )
    elif source_type == '新媒体':
        # 新媒体：量来源/来源类别为新媒体平台 或 具体来源在新媒体列表中
        return db_query.filter(
            or_(
                咨询量明细表.量来源 == '新媒体平台',
                咨询量明细表.来源类别 == '新媒体平台',
                咨询量明细表.媒体来源.in_(NEW_MEDIA_SOURCES)
            )
        )
    elif source_type == '口碑':
        return db_query.filter(咨询量明细表.量来源 == '口碑')
    elif source_type == '渠道':
        return db_query.filter(咨询量明细表.量来源 == '渠道')
    elif source_type == '网络':
        # 网络 = 传统大搜 + 新媒体（排除免费推广和其他非传统大搜/新媒体）
        all_network_media = TRADITIONAL_SEARCH_MEDIA_SOURCES + NEW_MEDIA_SOURCES
        return db_query.filter(
            or_(
                # 媒体来源直接匹配传统大搜或新媒体
                咨询量明细表.媒体来源.in_(all_network_media),
                # 兼容其他量来源值
                咨询量明细表.量来源.like('%SEM%'),
                咨询量明细表.量来源 == '网络合作伙伴',
                咨询量明细表.量来源 == '市场口碑',
                咨询量明细表.量来源 == '新媒体平台',
            )
        )
    return db_query


def get_consultant_stats(
    db: Session,
    campus: str,
    month_start: date,
    month_end: date,
    today: date,
    source_type: str | None = None,
    group_by_field: str = '咨询师'
) -> tuple:
    """
    获取咨询师/来源统计数据
    
    Returns:
        (consultants_list, summary, total)
    """
    # 计算截止时间边界（支持冬季/夏季作息配置）
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, today, db
    )
    
    # 基础查询 - 排除无效量和不算量
    base_query = db.query(咨询量明细表).filter(
        咨询量明细表.神殿 == campus,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    # 应用来源筛选
    if source_type:
        base_query = build_source_filter(base_query, source_type)
    
    # 按咨询师/来源分组统计
    group_field = getattr(咨询量明细表, group_by_field)
    
    # 月度统计
    month_stats = db.query(
        group_field.label('分组字段'),
        func.count(咨询量明细表.记录ID).label('月总咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月总报名'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    if source_type:
        month_stats = build_source_filter(month_stats, source_type)
    
    month_stats = month_stats.group_by(group_field).all()
    
    # 今日统计
    today_stats = db.query(
        group_field.label('分组字段'),
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    if source_type:
        today_stats = build_source_filter(today_stats, source_type)
    
    today_stats = today_stats.group_by(group_field).all()
    
    # 合并数据
    month_dict = {row.分组字段: row for row in month_stats if row.分组字段}
    today_dict = {row.分组字段: row for row in today_stats if row.分组字段}
    
    all_names = set(month_dict.keys()) | set(today_dict.keys())
    
    consultants = []
    total_月咨询 = total_月上门 = total_月报名 = total_订座 = 0
    total_日咨询 = total_日上门 = total_日报名 = 0
    
    for name in sorted(all_names):
        month_row = month_dict.get(name)
        today_row = today_dict.get(name)
        
        月咨询 = int(month_row.月总咨询量) if month_row else 0
        月上门 = int(month_row.月总上门量) if month_row else 0
        月报名 = int(month_row.月总报名) if month_row else 0
        订座 = int(month_row.订座) if month_row else 0
        日咨询 = int(today_row.日咨询量) if today_row else 0
        日上门 = int(today_row.日上门量) if today_row else 0
        日报名 = int(today_row.日报名) if today_row else 0
        
        consultants.append(ConsultantStats(
            咨询师=name or '未分配',
            日咨询量=日咨询,
            日上门量=日上门,
            日报名=日报名,
            月总咨询量=月咨询,
            月总上门量=月上门,
            月总报名=月报名,
            月上门率=calculate_rate(月上门, 月咨询),
            月总转化率=calculate_rate(月报名, 月咨询),
            月当面转化率=calculate_rate(月报名, 月上门),
            订座=订座
        ))
        
        total_月咨询 += 月咨询
        total_月上门 += 月上门
        total_月报名 += 月报名
        total_订座 += 订座
        total_日咨询 += 日咨询
        total_日上门 += 日上门
        total_日报名 += 日报名
    
    # 合计行
    total = ConsultantStats(
        咨询师='合计',
        日咨询量=total_日咨询,
        日上门量=total_日上门,
        日报名=total_日报名,
        月总咨询量=total_月咨询,
        月总上门量=total_月上门,
        月总报名=total_月报名,
        月上门率=calculate_rate(total_月上门, total_月咨询),
        月总转化率=calculate_rate(total_月报名, total_月咨询),
        月当面转化率=calculate_rate(total_月报名, total_月上门),
        订座=total_订座
    )
    
    # 汇总信息
    # 获取无效量统计
    invalid_query = db.query(func.count(咨询量明细表.记录ID)).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否无效量 == 1
    )
    if source_type:
        invalid_query = build_source_filter(invalid_query, source_type)
    invalid_count = invalid_query.scalar() or 0
    
    # 获取退费统计
    refund_query = db.query(func.count(咨询量明细表.记录ID)).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否退费 == 1
    )
    if source_type:
        refund_query = build_source_filter(refund_query, source_type)
    refund_count = refund_query.scalar() or 0
    
    # 获取报名类型分类统计（月度）
    enrollment_type_query = db.query(
        咨询量明细表.长期短期,
        func.count(咨询量明细表.记录ID).label('数量')
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否报名 == 1,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    if source_type:
        enrollment_type_query = build_source_filter(enrollment_type_query, source_type)
    enrollment_type_stats = enrollment_type_query.group_by(咨询量明细表.长期短期).all()
    
    # 解析报名类型
    月报名数_短期 = 0
    月报名数_长期 = 0
    月报名数_学三 = 0
    月报名数_学二 = 0
    for row in enrollment_type_stats:
        type_name = row.长期短期 or ''
        count = row.数量 or 0
        if '短' in type_name:
            月报名数_短期 += count
        elif '三' in type_name or '3' in type_name:
            月报名数_学三 += count
        elif '二' in type_name or '两' in type_name or '2' in type_name:
            月报名数_学二 += count
        elif '长' in type_name:
            月报名数_长期 += count
        # 如果没有分类，默认算入长期
        elif type_name == '' or type_name is None:
            月报名数_长期 += count
    
    # 获取报名类型分类统计（日）
    daily_enrollment_type_query = db.query(
        咨询量明细表.长期短期,
        func.count(咨询量明细表.记录ID).label('数量')
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        咨询量明细表.是否报名 == 1,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    if source_type:
        daily_enrollment_type_query = build_source_filter(daily_enrollment_type_query, source_type)
    daily_enrollment_type_stats = daily_enrollment_type_query.group_by(咨询量明细表.长期短期).all()
    
    # 解析日报名类型
    日报名数_短期 = 0
    日报名数_长期 = 0
    日报名数_学三 = 0
    日报名数_学二 = 0
    for row in daily_enrollment_type_stats:
        type_name = row.长期短期 or ''
        count = row.数量 or 0
        if '短' in type_name:
            日报名数_短期 += count
        elif '三' in type_name:
            日报名数_学三 += count
        elif '二' in type_name or '两' in type_name:
            日报名数_学二 += count
        else:
            日报名数_长期 += count
    
    # 总咨询量（含无效）用于计算无效率
    total_with_invalid = total_月咨询 + invalid_count
    
    summary = SectionSummary(
        月咨询总量=total_月咨询,
        月总上门量=total_月上门,
        月报名数_短期=月报名数_短期,
        月报名数_长期=月报名数_长期,
        月报名数_学三=月报名数_学三,
        月报名数_学二=月报名数_学二,
        月报名数_合计=total_月报名,
        月无效量数量=invalid_count,
        月无效率=calculate_rate(invalid_count, total_with_invalid),
        月电话上门转化率=calculate_rate(total_月上门, total_月咨询),
        月度总转化率=calculate_rate(total_月报名, total_月咨询),
        月退费人数=refund_count,
        月退费率=calculate_rate(refund_count, total_月报名),
        日咨询量=total_日咨询,
        日上门量=total_日上门,
        日报名数_短期=日报名数_短期,
        日报名数_长期=日报名数_长期,
        日报名数_学三=日报名数_学三,
        日报名数_学二=日报名数_学二
    )
    
    return consultants, summary, total


# ==================== API 端点 ====================

@router.get("/daily-summary", summary="获取神殿每日咨询量汇总")
def get_daily_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期，默认今天"),
    db: Session = Depends(get_db)
):
    """
    获取神殿从当月1日到当前日期的咨询量汇总
    
    返回所有分区的数据：
    - 网络（传统大搜+新媒体）汇总
    - 传统大搜明细
    - 新媒体明细
    - 口碑明细
    - 渠道明细
    - 咨询师总汇总
    - 月度汇总
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, month_end = get_month_range(target_date)
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    
    sections = {}
    
    # 1. 网络（传统大搜+新媒体）汇总
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '网络'
    )
    sections['网络汇总'] = SectionData(
        section_name='网络（传统大搜+新媒体）月度总咨询量',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 2. 传统大搜明细
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '传统大搜'
    )
    sections['传统大搜'] = SectionData(
        section_name='网络-传统大搜 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 3. 新媒体明细
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '新媒体'
    )
    sections['新媒体'] = SectionData(
        section_name='网络-新媒体 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 4. 口碑明细（按口碑提供人分组）
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '口碑', '口碑提供人'
    )
    sections['口碑'] = SectionData(
        section_name='口碑 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 4.1 口碑-咨询师分配表（按咨询师分组）
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '口碑', '咨询师'
    )
    sections['口碑_咨询师分配'] = SectionData(
        section_name='口碑-咨询师分配 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 5. 渠道明细（按渠道专员分组）
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '渠道', '渠道专员'
    )
    sections['渠道'] = SectionData(
        section_name='渠道 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 5.1 渠道-咨询师分配表（按咨询师分组）
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, '渠道', '咨询师'
    )
    sections['渠道_咨询师分配'] = SectionData(
        section_name='渠道-咨询师分配 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 6. 咨询师总汇总（全部来源）
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, None
    )
    sections['咨询师汇总'] = SectionData(
        section_name='传统大搜+新媒体+口碑+渠道 月度总咨询量报名情况表',
        summary=summary,
        consultants=consultants,
        total=total
    )
    
    # 7. 总汇总
    # 根据 Excel 公式：月咨询总量 = 传统大搜 + 新媒体 + 口碑(咨询师分配) + 渠道(咨询师分配)
    月咨询总量 = (
        sections['传统大搜'].total.月总咨询量 +
        sections['新媒体'].total.月总咨询量 +
        sections['口碑_咨询师分配'].total.月总咨询量 +
        sections['渠道_咨询师分配'].total.月总咨询量
    )
    月总上门量 = (
        sections['传统大搜'].total.月总上门量 +
        sections['新媒体'].total.月总上门量 +
        sections['口碑_咨询师分配'].total.月总上门量 +
        sections['渠道_咨询师分配'].total.月总上门量
    )
    月总报名数 = (
        sections['传统大搜'].total.月总报名 +
        sections['新媒体'].total.月总报名 +
        sections['口碑_咨询师分配'].total.月总报名 +
        sections['渠道_咨询师分配'].total.月总报名
    )
    月总订座数 = (
        sections['传统大搜'].total.订座 +
        sections['新媒体'].total.订座 +
        sections['口碑_咨询师分配'].total.订座 +
        sections['渠道_咨询师分配'].total.订座
    )
    grand_total: Dict[str, Any] = {
        '月咨询总量': 月咨询总量,
        '月总上门量': 月总上门量,
        '月总报名数': 月总报名数,
        '月总订座数': 月总订座数,
        '网络传统大搜月总咨询量': sections['传统大搜'].total.月总咨询量,
        '网络新媒体月总咨询量': sections['新媒体'].total.月总咨询量,
        '口碑量咨询师分配总计': sections['口碑_咨询师分配'].total.月总咨询量,
        '渠道量咨询老师分配总计': sections['渠道_咨询师分配'].total.月总咨询量,
        # 汇总行
        '网络传统大搜': {
            '月咨询量': sections['传统大搜'].total.月总咨询量,
            '月上门量': sections['传统大搜'].total.月总上门量,
            '月报名': sections['传统大搜'].total.月总报名,
        },
        '网络新媒体': {
            '月咨询量': sections['新媒体'].total.月总咨询量,
            '月上门量': sections['新媒体'].total.月总上门量,
            '月报名': sections['新媒体'].total.月总报名,
        },
        '口碑': {
            '月咨询量': sections['口碑'].total.月总咨询量,
            '月上门量': sections['口碑'].total.月总上门量,
            '月报名': sections['口碑'].total.月总报名,
        },
        '渠道': {
            '月咨询量': sections['渠道'].total.月总咨询量,
            '月上门量': sections['渠道'].total.月总上门量,
            '月报名': sections['渠道'].total.月总报名,
        },
    }
    
    # 计算率值
    grand_total['月当面转化率'] = calculate_rate(月总报名数, 月总上门量)
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'sections': {k: v.model_dump() for k, v in sections.items()},
        'grand_total': grand_total
    }


@router.get("/daily-summary/section/{section_type}", summary="获取单个分区数据")
def get_section_data(
    section_type: str,
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期"),
    db: Session = Depends(get_db)
):
    """
    获取单个分区的详细数据
    
    section_type 可选值：
    - network: 网络汇总（传统大搜+新媒体）
    - traditional: 传统大搜
    - newmedia: 新媒体
    - reputation: 口碑（按口碑提供人分组）
    - reputation_consultant: 口碑-咨询师分配（按咨询师分组）
    - channel: 渠道（按渠道专员分组）
    - channel_consultant: 渠道-咨询师分配（按咨询师分组）
    - consultant: 咨询师汇总
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, month_end = get_month_range(target_date)
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    
    section_map = {
        'network': ('网络', '咨询师', '网络（传统大搜+新媒体）月度总咨询量'),
        'traditional': ('传统大搜', '咨询师', '网络-传统大搜 月度总咨询量报名情况表'),
        'newmedia': ('新媒体', '咨询师', '网络-新媒体 月度总咨询量报名情况表'),
        'reputation': ('口碑', '口碑提供人', '口碑 月度总咨询量报名情况表'),
        'reputation_consultant': ('口碑', '咨询师', '口碑-咨询师分配 月度总咨询量报名情况表'),
        'channel': ('渠道', '渠道专员', '渠道 月度总咨询量报名情况表'),
        'channel_consultant': ('渠道', '咨询师', '渠道-咨询师分配 月度总咨询量报名情况表'),
        'consultant': (None, '咨询师', '传统大搜+新媒体+口碑+渠道 月度总咨询量报名情况表'),
    }
    
    if section_type not in section_map:
        raise HTTPException(status_code=400, detail=f"无效的分区类型: {section_type}")
    
    source_type, group_field, section_name = section_map[section_type]
    
    consultants, summary, total = get_consultant_stats(
        db, campus, month_start, month_end, target_date, source_type, group_field
    )
    
    return {
        'success': True,
        'campus': campus,
        'section_type': section_type,
        'section_name': section_name,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'summary': summary.model_dump(),
        'consultants': [c.model_dump() for c in consultants],
        'total': total.model_dump()
    }


@router.get("/source-config", summary="获取量来源配置")
def get_source_config():
    """
    获取量来源分类配置
    
    返回传统大搜、新媒体、口碑、渠道的媒体来源列表
    """
    return {
        'success': True,
        'data': {
            '传统大搜': {
                '说明': '量来源为网络类，媒体来源在以下列表中',
                '媒体来源': TRADITIONAL_SEARCH_SOURCES
            },
            '新媒体': {
                '说明': '媒体来源在以下列表中',
                '媒体来源': NEW_MEDIA_SOURCES
            },
            '口碑': {
                '说明': '量来源为口碑',
                '分组字段': '口碑提供人'
            },
            '渠道': {
                '说明': '量来源为渠道',
                '分组字段': '渠道专员'
            }
        }
    }


# ==================== 分析规划师（咨询师）数据汇总 ====================

class AnalystPlannerStats(BaseModel):
    """分析规划师（咨询师）统计数据"""
    分析规划师: str
    日咨询量: int = 0
    日上门量: int = 0
    日报名: int = 0
    月总咨询量: int = 0
    月总上门量: int = 0
    月总报名: int = 0
    月上门率: Optional[str] = "-"
    月总转化率: Optional[str] = "-"
    月当面转化率: Optional[str] = "-"
    订座: int = 0


class AnalystPlannerSummaryResponse(BaseModel):
    """分析规划师汇总响应"""
    success: bool = True
    campus: str
    month: str
    current_date: str
    analysts: List[AnalystPlannerStats]
    total: AnalystPlannerStats


def format_rate_percent(numerator: int, denominator: int) -> str:
    """格式化比率为百分比字符串，分母为0时返回'-'"""
    if denominator == 0:
        return "-"
    rate = numerator / denominator * 100
    return f"{rate:.1f}%"


@router.get("/analyst-planner-summary", summary="分析规划师（咨询师）数据汇总")
def get_analyst_planner_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期"),
    db: Session = Depends(get_db)
):
    """
    获取分析规划师（咨询师）数据汇总
    
    根据 public.users 表的 department（部门）和 position（岗位）字段获取咨询师列表，
    然后统计每个咨询师的咨询量数据。
    
    字段说明：
    - 分析规划师：咨询师姓名
    - 日咨询量：当天的咨询量
    - 日上门量：当天的上门量
    - 日报名：当天的报名量
    - 月总咨询量：当月月初到当前日期的咨询量
    - 月总上门量：当月月初到当前日期的上门量
    - 月总报名：当月月初到当前日期的报名量
    - 月上门率 = 月总上门量 / 月总咨询量
    - 月总转化率 = 月总报名 / 月总咨询量
    - 月当面转化率 = 月总报名 / 月总上门量
    - 订座：月初到当前日期订座状态的咨询量
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, month_end = get_month_range(target_date)
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    # 1. 从 users 表获取咨询师列表
    # 筛选条件：部门为祈福司，排除分析规划师助理，且神殿匹配
    consultants_query = db.query(User.real_name).filter(
        User.campus == campus,
        User.department == '祈福司',
        or_(User.position.is_(None), User.position != '分析规划师助理'),
    ).distinct()
    
    consultant_names = [row.real_name for row in consultants_query.all() if row.real_name]
    
    # 2. 查询月度统计数据（按咨询师分组）
    month_stats_query = db.query(
        咨询量明细表.咨询师.label('咨询师'),
        func.count(咨询量明细表.记录ID).label('月总咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月总报名'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.咨询师)
    
    month_stats = {row.咨询师: row for row in month_stats_query.all() if row.咨询师}
    
    # 3. 查询今日统计数据（按咨询师分组）
    today_stats_query = db.query(
        咨询量明细表.咨询师.label('咨询师'),
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.咨询师)
    
    today_stats = {row.咨询师: row for row in today_stats_query.all() if row.咨询师}
    
    # 4. 合并用户表咨询师名单和有数据的咨询师名单
    all_consultant_names = set(consultant_names) | set(month_stats.keys()) | set(today_stats.keys())
    
    # 5. 构建结果
    analysts = []
    total_日咨询 = total_日上门 = total_日报名 = 0
    total_月咨询 = total_月上门 = total_月报名 = total_订座 = 0
    
    for name in sorted(all_consultant_names):
        if not name:
            continue
            
        month_row = month_stats.get(name)
        today_row = today_stats.get(name)
        
        日咨询 = int(today_row.日咨询量) if today_row else 0
        日上门 = int(today_row.日上门量) if today_row else 0
        日报名 = int(today_row.日报名) if today_row else 0
        月咨询 = int(month_row.月总咨询量) if month_row else 0
        月上门 = int(month_row.月总上门量) if month_row else 0
        月报名 = int(month_row.月总报名) if month_row else 0
        订座 = int(month_row.订座) if month_row else 0
        
        analysts.append(AnalystPlannerStats(
            分析规划师=name,
            日咨询量=日咨询,
            日上门量=日上门,
            日报名=日报名,
            月总咨询量=月咨询,
            月总上门量=月上门,
            月总报名=月报名,
            月上门率=format_rate_percent(月上门, 月咨询),
            月总转化率=format_rate_percent(月报名, 月咨询),
            月当面转化率=format_rate_percent(月报名, 月上门),
            订座=订座
        ))
        
        total_日咨询 += 日咨询
        total_日上门 += 日上门
        total_日报名 += 日报名
        total_月咨询 += 月咨询
        total_月上门 += 月上门
        total_月报名 += 月报名
        total_订座 += 订座
    
    # 合计行
    total = AnalystPlannerStats(
        分析规划师='合计',
        日咨询量=total_日咨询,
        日上门量=total_日上门,
        日报名=total_日报名,
        月总咨询量=total_月咨询,
        月总上门量=total_月上门,
        月总报名=total_月报名,
        月上门率=format_rate_percent(total_月上门, total_月咨询),
        月总转化率=format_rate_percent(total_月报名, total_月咨询),
        月当面转化率=format_rate_percent(total_月报名, total_月上门),
        订座=total_订座
    )
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'analysts': [a.model_dump() for a in analysts],
        'total': total.model_dump()
    }


# ==================== 传统大搜子表（汇总+分析规划师明细） ====================

class SourceSectionSummary(BaseModel):
    """来源分区汇总数据"""
    月咨询总量: int = 0
    月总上门量: int = 0
    月报名数_短期: int = 0
    月报名数_长期: int = 0
    月报名数_学三: int = 0
    月报名数_学二: int = 0
    月报名数_合计: int = 0
    月无效量数量: int = 0
    月无效率: str = "0.0%"
    月电话上门转化率: str = "0.0%"
    月度总转化率: str = "0.0%"
    月退费人数: int = 0
    月退费率: str = "-"
    日咨询量: int = 0
    日上门量: int = 0
    日报名数_短期: int = 0
    日报名数_长期: int = 0
    日报名数_学三: int = 0
    日报名数_学二: int = 0


class SourceSectionResponse(BaseModel):
    """来源分区完整响应"""
    success: bool = True
    campus: str
    month: str
    current_date: str
    section_name: str
    summary: SourceSectionSummary
    analysts: List[AnalystPlannerStats]
    total: AnalystPlannerStats


def get_source_section_data(
    db: Session,
    campus: str,
    target_date: date,
    source_type: str
) -> dict:
    """
    获取指定来源类型的完整数据（汇总 + 分析规划师明细）
    """
    month_start, month_end = get_month_range(target_date)
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    # ============ 1. 汇总数据 ============
    
    # 月度基础统计
    month_base_query = db.query(
        func.count(咨询量明细表.记录ID).label('月咨询总量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名数_合计'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    month_base_query = build_source_filter(month_base_query, source_type)
    month_base = month_base_query.first()
    
    月咨询总量 = int(month_base.月咨询总量) if month_base and month_base.月咨询总量 else 0
    月总上门量 = int(month_base.月总上门量) if month_base and month_base.月总上门量 else 0
    月报名数_合计 = int(month_base.月报名数_合计) if month_base and month_base.月报名数_合计 else 0
    
    # 日统计
    today_base_query = db.query(
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    today_base_query = build_source_filter(today_base_query, source_type)
    today_base = today_base_query.first()
    
    日咨询量 = int(today_base.日咨询量) if today_base and today_base.日咨询量 else 0
    日上门量 = int(today_base.日上门量) if today_base and today_base.日上门量 else 0
    
    # 无效量统计
    invalid_query = db.query(func.count(咨询量明细表.记录ID)).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否无效量 == 1
    )
    invalid_query = build_source_filter(invalid_query, source_type)
    月无效量数量 = invalid_query.scalar() or 0
    
    # 退费统计
    refund_query = db.query(func.count(咨询量明细表.记录ID)).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否退费 == 1
    )
    refund_query = build_source_filter(refund_query, source_type)
    月退费人数 = refund_query.scalar() or 0
    
    # 报名类型分类统计（月度）
    enrollment_type_query = db.query(
        咨询量明细表.长期短期,
        func.count(咨询量明细表.记录ID).label('数量')
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否报名 == 1,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    enrollment_type_query = build_source_filter(enrollment_type_query, source_type)
    enrollment_type_stats = enrollment_type_query.group_by(咨询量明细表.长期短期).all()
    
    月报名数_短期 = 月报名数_长期 = 月报名数_学三 = 月报名数_学二 = 0
    for row in enrollment_type_stats:
        type_name = row.长期短期 or ''
        count = row.数量 or 0
        if '短' in type_name:
            月报名数_短期 += count
        elif '三' in type_name or '3' in type_name:
            月报名数_学三 += count
        elif '二' in type_name or '两' in type_name or '2' in type_name:
            月报名数_学二 += count
        elif '长' in type_name:
            月报名数_长期 += count
        elif type_name == '' or type_name is None:
            月报名数_长期 += count
    
    # 报名类型分类统计（日）
    daily_enrollment_query = db.query(
        咨询量明细表.长期短期,
        func.count(咨询量明细表.记录ID).label('数量')
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        咨询量明细表.是否报名 == 1,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    daily_enrollment_query = build_source_filter(daily_enrollment_query, source_type)
    daily_enrollment_stats = daily_enrollment_query.group_by(咨询量明细表.长期短期).all()
    
    日报名数_短期 = 日报名数_长期 = 日报名数_学三 = 日报名数_学二 = 0
    for row in daily_enrollment_stats:
        type_name = row.长期短期 or ''
        count = row.数量 or 0
        if '短' in type_name:
            日报名数_短期 += count
        elif '三' in type_name or '3' in type_name:
            日报名数_学三 += count
        elif '二' in type_name or '两' in type_name or '2' in type_name:
            日报名数_学二 += count
        elif '长' in type_name:
            日报名数_长期 += count
        elif type_name == '' or type_name is None:
            日报名数_长期 += count
    
    # 计算率值
    total_with_invalid = 月咨询总量 + 月无效量数量
    
    summary = SourceSectionSummary(
        月咨询总量=月咨询总量,
        月总上门量=月总上门量,
        月报名数_短期=月报名数_短期,
        月报名数_长期=月报名数_长期,
        月报名数_学三=月报名数_学三,
        月报名数_学二=月报名数_学二,
        月报名数_合计=月报名数_合计,
        月无效量数量=月无效量数量,
        月无效率=format_rate_percent(月无效量数量, total_with_invalid),
        月电话上门转化率=format_rate_percent(月总上门量, 月咨询总量),
        月度总转化率=format_rate_percent(月报名数_合计, 月咨询总量),
        月退费人数=月退费人数,
        月退费率=format_rate_percent(月退费人数, 月报名数_合计) if 月报名数_合计 > 0 else "#DIV/0!",
        日咨询量=日咨询量,
        日上门量=日上门量,
        日报名数_短期=日报名数_短期,
        日报名数_长期=日报名数_长期,
        日报名数_学三=日报名数_学三,
        日报名数_学二=日报名数_学二,
    )
    
    # ============ 2. 分析规划师明细 ============
    
    # 月度统计（按咨询师分组）
    month_stats_query = db.query(
        咨询量明细表.咨询师.label('咨询师'),
        func.count(咨询量明细表.记录ID).label('月总咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月总报名'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    month_stats_query = build_source_filter(month_stats_query, source_type)
    month_stats_query = month_stats_query.group_by(咨询量明细表.咨询师)
    month_stats = {row.咨询师: row for row in month_stats_query.all() if row.咨询师}
    
    # 今日统计（按咨询师分组）
    today_stats_query = db.query(
        咨询量明细表.咨询师.label('咨询师'),
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    today_stats_query = build_source_filter(today_stats_query, source_type)
    today_stats_query = today_stats_query.group_by(咨询量明细表.咨询师)
    today_stats = {row.咨询师: row for row in today_stats_query.all() if row.咨询师}
    
    # 从 users 表获取咨询师列表
    consultants_query = db.query(User.real_name).filter(
        User.campus == campus,
        or_(
            User.department.ilike('%咨询%'),
            User.position.ilike('%咨询师%'),
            User.position.ilike('%分析规划师%'),
            User.position.ilike('%咨询%'),
        )
    ).distinct()
    consultant_names = [row.real_name for row in consultants_query.all() if row.real_name]
    
    # 合并名单
    all_consultant_names = set(consultant_names) | set(month_stats.keys()) | set(today_stats.keys())
    
    # 构建分析规划师列表
    analysts = []
    total_日咨询 = total_日上门 = total_日报名 = 0
    total_月咨询 = total_月上门 = total_月报名 = total_订座 = 0
    
    for name in sorted(all_consultant_names):
        if not name:
            continue
            
        month_row = month_stats.get(name)
        today_row = today_stats.get(name)
        
        日咨询 = int(today_row.日咨询量) if today_row else 0
        日上门 = int(today_row.日上门量) if today_row else 0
        日报名 = int(today_row.日报名) if today_row else 0
        月咨询 = int(month_row.月总咨询量) if month_row else 0
        月上门 = int(month_row.月总上门量) if month_row else 0
        月报名 = int(month_row.月总报名) if month_row else 0
        订座 = int(month_row.订座) if month_row else 0
        
        analysts.append(AnalystPlannerStats(
            分析规划师=name,
            日咨询量=日咨询,
            日上门量=日上门,
            日报名=日报名,
            月总咨询量=月咨询,
            月总上门量=月上门,
            月总报名=月报名,
            月上门率=format_rate_percent(月上门, 月咨询),
            月总转化率=format_rate_percent(月报名, 月咨询),
            月当面转化率=format_rate_percent(月报名, 月上门),
            订座=订座
        ))
        
        total_日咨询 += 日咨询
        total_日上门 += 日上门
        total_日报名 += 日报名
        total_月咨询 += 月咨询
        total_月上门 += 月上门
        total_月报名 += 月报名
        total_订座 += 订座
    
    # 合计行
    total = AnalystPlannerStats(
        分析规划师='合计',
        日咨询量=total_日咨询,
        日上门量=total_日上门,
        日报名=total_日报名,
        月总咨询量=total_月咨询,
        月总上门量=total_月上门,
        月总报名=total_月报名,
        月上门率=format_rate_percent(total_月上门, total_月咨询),
        月总转化率=format_rate_percent(total_月报名, total_月咨询),
        月当面转化率=format_rate_percent(total_月报名, total_月上门),
        订座=total_订座
    )
    
    return {
        'summary': summary,
        'analysts': analysts,
        'total': total
    }


@router.get("/traditional-search-summary", summary="传统大搜子表（汇总+分析规划师明细）")
def get_traditional_search_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期"),
    db: Session = Depends(get_db)
):
    """
    获取传统大搜完整子表数据
    
    传统大搜定义：
    - SEM平台：量来源或来源类别包含"SEM"关键字（匹配"常规SEM平台"等）
    - 网络合作伙伴：量来源或来源类别为"网络合作伙伴"
    - 市场口碑：量来源或来源类别为"市场口碑"
    
    返回：
    - summary: 汇总数据（月咨询量、上门量、报名数、无效量、退费等）
    - analysts: 分析规划师明细列表
    - total: 合计行
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, _ = get_month_range(target_date)
    
    data = get_source_section_data(db, campus, target_date, '传统大搜')
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '网络-传统大搜',
        'summary': data['summary'].model_dump(),
        'analysts': [a.model_dump() for a in data['analysts']],
        'total': data['total'].model_dump()
    }


@router.get("/newmedia-summary", summary="新媒体子表（汇总+分析规划师明细）")
def get_newmedia_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期"),
    db: Session = Depends(get_db)
):
    """
    获取新媒体完整子表数据
    
    新媒体定义：
    - 量来源（来源类别）为"新媒体平台"
    - 或 具体来源（媒体来源）为：抖音、快手、微信视频号、B站、小红书
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, _ = get_month_range(target_date)
    
    data = get_source_section_data(db, campus, target_date, '新媒体')
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '网络-新媒体',
        'summary': data['summary'].model_dump(),
        'analysts': [a.model_dump() for a in data['analysts']],
        'total': data['total'].model_dump()
    }


# ==================== 口碑子表（按口碑提供人分组） ====================

class ReputationProviderStats(BaseModel):
    """口碑来源（口碑提供人）统计数据"""
    口碑来源: str
    日口碑量: int = 0
    日上门量: int = 0
    日报名: int = 0
    月口碑量: int = 0
    月上门量: int = 0
    月报名量: int = 0
    月上门率: str = "-"
    月总转化率: str = "-"
    月当面转化率: str = "-"
    订座: int = 0


@router.get("/reputation-summary", summary="口碑子表（汇总+口碑提供人明细）")
def get_reputation_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期"),
    db: Session = Depends(get_db)
):
    """
    获取口碑完整子表数据
    
    口碑定义：
    - 量来源（来源类别）为"口碑"
    - 包含子分类：咨询口碑、教质口碑、教学口碑、校园口碑、总部口碑、其他口碑
    
    按口碑提供人分组统计
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, month_end = get_month_range(target_date)
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    # ============ 1. 汇总数据 ============
    
    # 月度基础统计
    month_base_query = db.query(
        func.count(咨询量明细表.记录ID).label('月咨询总量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名数_合计'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    month_base = month_base_query.first()
    
    月咨询总量 = int(month_base.月咨询总量) if month_base and month_base.月咨询总量 else 0
    月总上门量 = int(month_base.月总上门量) if month_base and month_base.月总上门量 else 0
    月报名数_合计 = int(month_base.月报名数_合计) if month_base and month_base.月报名数_合计 else 0
    
    # 日统计
    today_base_query = db.query(
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    today_base = today_base_query.first()
    
    日咨询量 = int(today_base.日咨询量) if today_base and today_base.日咨询量 else 0
    日上门量 = int(today_base.日上门量) if today_base and today_base.日上门量 else 0
    
    # 退费统计
    refund_query = db.query(func.count(咨询量明细表.记录ID)).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否退费 == 1
    )
    月退费人数 = refund_query.scalar() or 0
    
    # 报名类型分类统计（月度）
    enrollment_type_query = db.query(
        咨询量明细表.长期短期,
        func.count(咨询量明细表.记录ID).label('数量')
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.是否报名 == 1,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.长期短期).all()
    
    月报名数_短期 = 月报名数_长期 = 月报名数_学三 = 月报名数_学二 = 0
    for row in enrollment_type_query:
        type_name = row.长期短期 or ''
        count = row.数量 or 0
        if '短' in type_name:
            月报名数_短期 += count
        elif '三' in type_name or '3' in type_name:
            月报名数_学三 += count
        elif '二' in type_name or '两' in type_name or '2' in type_name:
            月报名数_学二 += count
        elif '长' in type_name:
            月报名数_长期 += count
        elif type_name == '' or type_name is None:
            月报名数_长期 += count
    
    # 报名类型分类统计（日）
    daily_enrollment_query = db.query(
        咨询量明细表.长期短期,
        func.count(咨询量明细表.记录ID).label('数量')
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        咨询量明细表.是否报名 == 1,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.长期短期).all()
    
    日报名数_短期 = 日报名数_长期 = 日报名数_学三 = 日报名数_学二 = 0
    for row in daily_enrollment_query:
        type_name = row.长期短期 or ''
        count = row.数量 or 0
        if '短' in type_name:
            日报名数_短期 += count
        elif '三' in type_name or '3' in type_name:
            日报名数_学三 += count
        elif '二' in type_name or '两' in type_name or '2' in type_name:
            日报名数_学二 += count
        elif '长' in type_name:
            日报名数_长期 += count
        elif type_name == '' or type_name is None:
            日报名数_长期 += count
    
    summary = SourceSectionSummary(
        月咨询总量=月咨询总量,
        月总上门量=月总上门量,
        月报名数_短期=月报名数_短期,
        月报名数_长期=月报名数_长期,
        月报名数_学三=月报名数_学三,
        月报名数_学二=月报名数_学二,
        月报名数_合计=月报名数_合计,
        月无效量数量=0,  # 口碑不统计无效量
        月无效率="-",
        月电话上门转化率=format_rate_percent(月总上门量, 月咨询总量),
        月度总转化率=format_rate_percent(月报名数_合计, 月咨询总量),
        月退费人数=月退费人数,
        月退费率=format_rate_percent(月退费人数, 月报名数_合计) if 月报名数_合计 > 0 else "#DIV/0!",
        日咨询量=日咨询量,
        日上门量=日上门量,
        日报名数_短期=日报名数_短期,
        日报名数_长期=日报名数_长期,
        日报名数_学三=日报名数_学三,
        日报名数_学二=日报名数_学二,
    )
    
    # ============ 2. 口碑提供人明细 ============
    
    # 月度统计（按口碑提供人分组）
    month_stats_query = db.query(
        咨询量明细表.口碑提供人.label('口碑提供人'),
        func.count(咨询量明细表.记录ID).label('月口碑量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.口碑提供人)
    
    month_stats = {row.口碑提供人: row for row in month_stats_query.all() if row.口碑提供人}
    
    # 今日统计（按口碑提供人分组）
    today_stats_query = db.query(
        咨询量明细表.口碑提供人.label('口碑提供人'),
        func.count(咨询量明细表.记录ID).label('日口碑量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.口碑提供人)
    
    today_stats = {row.口碑提供人: row for row in today_stats_query.all() if row.口碑提供人}
    
    # 合并名单
    all_provider_names = set(month_stats.keys()) | set(today_stats.keys())
    
    # 构建口碑提供人列表
    providers = []
    total_日口碑 = total_日上门 = total_日报名 = 0
    total_月口碑 = total_月上门 = total_月报名 = total_订座 = 0
    
    for name in sorted(all_provider_names):
        if not name:
            continue
            
        month_row = month_stats.get(name)
        today_row = today_stats.get(name)
        
        日口碑 = int(today_row.日口碑量) if today_row else 0
        日上门 = int(today_row.日上门量) if today_row else 0
        日报名 = int(today_row.日报名) if today_row else 0
        月口碑 = int(month_row.月口碑量) if month_row else 0
        月上门 = int(month_row.月上门量) if month_row else 0
        月报名 = int(month_row.月报名量) if month_row else 0
        订座 = int(month_row.订座) if month_row else 0
        
        providers.append(ReputationProviderStats(
            口碑来源=name,
            日口碑量=日口碑,
            日上门量=日上门,
            日报名=日报名,
            月口碑量=月口碑,
            月上门量=月上门,
            月报名量=月报名,
            月上门率=format_rate_percent(月上门, 月口碑),
            月总转化率=format_rate_percent(月报名, 月口碑),
            月当面转化率=format_rate_percent(月报名, 月上门),
            订座=订座
        ))
        
        total_日口碑 += 日口碑
        total_日上门 += 日上门
        total_日报名 += 日报名
        total_月口碑 += 月口碑
        total_月上门 += 月上门
        total_月报名 += 月报名
        total_订座 += 订座
    
    # 添加"其他口碑"行（没有口碑提供人的记录）
    other_month_query = db.query(
        func.count(咨询量明细表.记录ID).label('月口碑量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.口碑提供人.is_(None), 咨询量明细表.口碑提供人 == ''),
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    other_today_query = db.query(
        func.count(咨询量明细表.记录ID).label('日口碑量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '口碑',
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.口碑提供人.is_(None), 咨询量明细表.口碑提供人 == ''),
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    if other_month_query and other_month_query.月口碑量 and other_month_query.月口碑量 > 0:
        other_日口碑 = int(other_today_query.日口碑量) if other_today_query and other_today_query.日口碑量 else 0
        other_日上门 = int(other_today_query.日上门量) if other_today_query and other_today_query.日上门量 else 0
        other_日报名 = int(other_today_query.日报名) if other_today_query and other_today_query.日报名 else 0
        other_月口碑 = int(other_month_query.月口碑量) if other_month_query.月口碑量 else 0
        other_月上门 = int(other_month_query.月上门量) if other_month_query.月上门量 else 0
        other_月报名 = int(other_month_query.月报名量) if other_month_query.月报名量 else 0
        other_订座 = int(other_month_query.订座) if other_month_query.订座 else 0
        
        providers.append(ReputationProviderStats(
            口碑来源='其他口碑',
            日口碑量=other_日口碑,
            日上门量=other_日上门,
            日报名=other_日报名,
            月口碑量=other_月口碑,
            月上门量=other_月上门,
            月报名量=other_月报名,
            月上门率=format_rate_percent(other_月上门, other_月口碑),
            月总转化率=format_rate_percent(other_月报名, other_月口碑),
            月当面转化率=format_rate_percent(other_月报名, other_月上门),
            订座=other_订座
        ))
        
        total_日口碑 += other_日口碑
        total_日上门 += other_日上门
        total_日报名 += other_日报名
        total_月口碑 += other_月口碑
        total_月上门 += other_月上门
        total_月报名 += other_月报名
        total_订座 += other_订座
    
    # 合计行
    total = ReputationProviderStats(
        口碑来源='合计',
        日口碑量=total_日口碑,
        日上门量=total_日上门,
        日报名=total_日报名,
        月口碑量=total_月口碑,
        月上门量=total_月上门,
        月报名量=total_月报名,
        月上门率=format_rate_percent(total_月上门, total_月口碑),
        月总转化率=format_rate_percent(total_月报名, total_月口碑),
        月当面转化率=format_rate_percent(total_月报名, total_月上门),
        订座=total_订座
    )
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '口碑',
        'summary': summary.model_dump(),
        'providers': [p.model_dump() for p in providers],
        'total': total.model_dump()
    }


# ==================== 口碑咨询师分配子表（按咨询师分组） ====================

class ReputationConsultantStats(BaseModel):
    """口碑咨询师分配统计数据"""
    分析规划师: str
    日口碑量: int = 0
    日上门量: int = 0
    日报名: int = 0
    月口碑量: int = 0
    月上门量: int = 0
    月报名量: int = 0
    月上门率: str = "-"
    月总转化率: str = "-"
    月当面转化率: str = "-"
    订座: int = 0


@router.get("/reputation-consultant-summary", summary="口碑咨询师分配子表")
def get_reputation_consultant_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: Optional[date] = Query(None, description="目标日期"),
    db: Session = Depends(get_db)
):
    """
    获取口碑咨询师分配子表数据
    
    口碑定义：量来源（来源类别）为"口碑"
    按咨询师分组统计各咨询师的口碑量数据
    """
    if target_date is None:
        target_date = date.today()
    
    month_start, month_end = get_month_range(target_date)
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    # ============ 1. 获取该神殿的所有咨询师列表 ============
    
    # 从 public.users 获取祈福司员工（排除分析规划师助理）
    from app.models.user import UserStatus
    consultant_names_query = db.query(
        User.real_name
    ).filter(
        User.campus == campus,
        User.status == UserStatus.ACTIVE,
        User.department == '祈福司',
        or_(User.position.is_(None), User.position != '分析规划师助理'),
        User.real_name.isnot(None),
        User.real_name != ''
    ).distinct().all()
    
    consultant_list = [c[0] for c in consultant_names_query if c[0]]
    
    # ============ 2. 统计每个咨询师的口碑数据 ============
    
    consultants_data: List[ReputationConsultantStats] = []
    
    # 合计累加器
    total_日口碑 = 0
    total_日上门 = 0
    total_日报名 = 0
    total_月口碑 = 0
    total_月上门 = 0
    total_月报名 = 0
    total_订座 = 0
    
    for consultant_name in sorted(consultant_list):
        # 基础过滤条件：口碑 + 该咨询师
        base_filter = and_(
            咨询量明细表.神殿 == campus,
            咨询量明细表.量来源 == '口碑',
            咨询量明细表.咨询师 == consultant_name,
            or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
            or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
        )
        
        # 月度统计
        month_stats = db.query(
            func.count(咨询量明细表.记录ID).label('月口碑量'),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
            func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
        ).filter(
            base_filter,
            咨询量明细表.登记日期 >= month_start_dt,
            咨询量明细表.登记日期 <= month_end_dt
        ).first()
        
        月口碑量 = int(month_stats.月口碑量) if month_stats and month_stats.月口碑量 else 0
        月上门量 = int(month_stats.月上门量) if month_stats and month_stats.月上门量 else 0
        月报名量 = int(month_stats.月报名量) if month_stats and month_stats.月报名量 else 0
        订座 = int(month_stats.订座) if month_stats and month_stats.订座 else 0
        
        # 日统计
        day_stats = db.query(
            func.count(咨询量明细表.记录ID).label('日口碑量'),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名量'),
        ).filter(
            base_filter,
            咨询量明细表.登记日期 >= today_start_dt,
            咨询量明细表.登记日期 <= today_end_dt
        ).first()
        
        日口碑量 = int(day_stats.日口碑量) if day_stats and day_stats.日口碑量 else 0
        日上门量 = int(day_stats.日上门量) if day_stats and day_stats.日上门量 else 0
        日报名 = int(day_stats.日报名量) if day_stats and day_stats.日报名量 else 0
        
        consultants_data.append(ReputationConsultantStats(
            分析规划师=consultant_name,
            日口碑量=日口碑量,
            日上门量=日上门量,
            日报名=日报名,
            月口碑量=月口碑量,
            月上门量=月上门量,
            月报名量=月报名量,
            月上门率=format_rate_percent(月上门量, 月口碑量),
            月总转化率=format_rate_percent(月报名量, 月口碑量),
            月当面转化率=format_rate_percent(月报名量, 月上门量),
            订座=订座
        ))
        
        # 累加合计
        total_日口碑 += 日口碑量
        total_日上门 += 日上门量
        total_日报名 += 日报名
        total_月口碑 += 月口碑量
        total_月上门 += 月上门量
        total_月报名 += 月报名量
        total_订座 += 订座
    
    # 合计行
    total = ReputationConsultantStats(
        分析规划师='合计',
        日口碑量=total_日口碑,
        日上门量=total_日上门,
        日报名=total_日报名,
        月口碑量=total_月口碑,
        月上门量=total_月上门,
        月报名量=total_月报名,
        月上门率=format_rate_percent(total_月上门, total_月口碑),
        月总转化率=format_rate_percent(total_月报名, total_月口碑),
        月当面转化率=format_rate_percent(total_月报名, total_月上门),
        订座=total_订座
    )
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '口碑量咨询师分配',
        'consultants': [c.model_dump() for c in consultants_data],
        'total': total.model_dump()
    }


# ==================== 神殿新媒体子表（按新媒体介绍人分组） ====================

class CampusNewMediaReferrerStats(BaseModel):
    """神殿新媒体（新媒体介绍人）统计数据"""
    新媒体介绍人: str
    日提供量: int = 0
    日上门量: int = 0
    日报名: int = 0
    总提供量: int = 0
    总上门量: int = 0
    总报名: int = 0
    总转化率: str = "0.00%"
    当面转化率: str = "0.00%"
    订座: int = 0


class CampusNewMediaConsultantStats(BaseModel):
    """神殿新媒体咨询师分配统计数据"""
    分析规划师: str
    日咨询量: int = 0
    日上门量: int = 0
    日报名: int = 0
    总咨询量: int = 0
    总上门量: int = 0
    总报名: int = 0
    总转化率: str = "0.00%"
    当面转化率: str = "0.00%"
    订座: int = 0


@router.get("/campus-newmedia-summary", summary="神殿新媒体子表（汇总+新媒体介绍人明细+咨询师分配）")
async def get_campus_newmedia_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: date = Query(default=None, description="目标日期，默认今天"),
    db: Session = Depends(get_db)
):
    """
    神殿新媒体咨询量统计子表
    
    返回数据结构：
    1. 汇总区：月咨询总量、日咨询量、月总上门量、日上门量、月报名数、日报报名量
    2. 新媒体介绍人明细：按介绍人分组统计
    3. 咨询师分配明细：按咨询师分组统计
    """
    if target_date is None:
        target_date = date.today()
    
    today = target_date
    month_start = today.replace(day=1)
    month_end = today
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    
    # ============ 1. 汇总区 ============
    # 月度汇总
    month_summary = db.query(
        func.count(咨询量明细表.记录ID).label('月咨询总量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '神殿新媒体',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    # 日汇总
    day_summary = db.query(
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名量'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '神殿新媒体',
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    月咨询总量 = int(month_summary.月咨询总量) if month_summary and month_summary.月咨询总量 else 0
    月上门量 = int(month_summary.月上门量) if month_summary and month_summary.月上门量 else 0
    日咨询量 = int(day_summary.日咨询量) if day_summary and day_summary.日咨询量 else 0
    日上门量 = int(day_summary.日上门量) if day_summary and day_summary.日上门量 else 0
    
    # 月报名数分类统计（短期、长期、学三、学二）
    signup_breakdown = db.query(
        func.sum(case((咨询量明细表.长期短期 == '短期', 1), else_=0)).label('短期'),
        func.sum(case((咨询量明细表.长期短期 == '长期', 1), else_=0)).label('长期'),
        func.sum(case((咨询量明细表.课程 == '学三', 1), else_=0)).label('学三'),
        func.sum(case((咨询量明细表.课程 == '学二', 1), else_=0)).label('学二'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '神殿新媒体',
        咨询量明细表.是否报名 == 1,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    日报名分类 = db.query(
        func.sum(case((咨询量明细表.长期短期 == '短期', 1), else_=0)).label('短期'),
        func.sum(case((咨询量明细表.长期短期 == '长期', 1), else_=0)).label('长期'),
        func.sum(case((咨询量明细表.课程 == '学三', 1), else_=0)).label('学三'),
        func.sum(case((咨询量明细表.课程 == '学二', 1), else_=0)).label('学二'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '神殿新媒体',
        咨询量明细表.是否报名 == 1,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    # 处理可能为 None 的情况
    if signup_breakdown:
        月报名详情 = f"{int(signup_breakdown.短期 or 0)}短{int(signup_breakdown.长期 or 0)}长{int(signup_breakdown.学三 or 0)}学三{int(signup_breakdown.学二 or 0)}学二"
    else:
        月报名详情 = "0短0长0学三0学二"
    
    if 日报名分类:
        日报名详情 = f"{int(日报名分类.短期 or 0)}短{int(日报名分类.长期 or 0)}长{int(日报名分类.学三 or 0)}学三{int(日报名分类.学二 or 0)}学二"
    else:
        日报名详情 = "0短0长0学三0学二"
    
    summary = {
        '月咨询总量': 月咨询总量,
        '日咨询量': 日咨询量,
        '月总上门量': 月上门量,
        '日上门量': 日上门量,
        '月报名数': 月报名详情,
        '日报报名量': 日报名详情,
    }
    
    # ============ 2. 新媒体介绍人明细 ============
    # 获取所有新媒体介绍人（口碑提供人字段复用）
    referrer_query = db.query(
        咨询量明细表.口碑提供人.label('新媒体介绍人'),
        func.count(咨询量明细表.记录ID).label('总提供量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('总报名'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '神殿新媒体',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.口碑提供人.isnot(None),
        咨询量明细表.口碑提供人 != '',
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.口碑提供人).all()
    
    referrers = []
    total_日提供 = 0
    total_日上门 = 0
    total_日报名 = 0
    total_总提供 = 0
    total_总上门 = 0
    total_总报名 = 0
    total_订座 = 0
    
    for row in referrer_query:
        name = row.新媒体介绍人
        总提供量 = int(row.总提供量) if row.总提供量 else 0
        总上门量 = int(row.总上门量) if row.总上门量 else 0
        总报名 = int(row.总报名) if row.总报名 else 0
        订座 = int(row.订座) if row.订座 else 0
        
        # 日统计
        day_stats = db.query(
            func.count(咨询量明细表.记录ID).label('日提供量'),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
        ).filter(
            咨询量明细表.神殿 == campus,
            咨询量明细表.量来源 == '神殿新媒体',
            咨询量明细表.口碑提供人 == name,
            咨询量明细表.登记日期 >= today_start_dt,
            咨询量明细表.登记日期 <= today_end_dt,
            or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
            or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
        ).first()
        
        日提供量 = int(day_stats.日提供量) if day_stats and day_stats.日提供量 else 0
        日上门量_r = int(day_stats.日上门量) if day_stats and day_stats.日上门量 else 0
        日报名_r = int(day_stats.日报名) if day_stats and day_stats.日报名 else 0
        
        referrers.append(CampusNewMediaReferrerStats(
            新媒体介绍人=name,
            日提供量=日提供量,
            日上门量=日上门量_r,
            日报名=日报名_r,
            总提供量=总提供量,
            总上门量=总上门量,
            总报名=总报名,
            总转化率=format_rate_percent(总报名, 总提供量),
            当面转化率=format_rate_percent(总报名, 总上门量),
            订座=订座
        ))
        
        total_日提供 += 日提供量
        total_日上门 += 日上门量_r
        total_日报名 += 日报名_r
        total_总提供 += 总提供量
        total_总上门 += 总上门量
        total_总报名 += 总报名
        total_订座 += 订座
    
    referrer_total = CampusNewMediaReferrerStats(
        新媒体介绍人='合计',
        日提供量=total_日提供,
        日上门量=total_日上门,
        日报名=total_日报名,
        总提供量=total_总提供,
        总上门量=total_总上门,
        总报名=total_总报名,
        总转化率=format_rate_percent(total_总报名, total_总提供),
        当面转化率=format_rate_percent(total_总报名, total_总上门),
        订座=total_订座
    )
    
    # ============ 3. 咨询师分配明细 ============
    consultant_query = db.query(
        咨询量明细表.咨询师.label('分析规划师'),
        func.count(咨询量明细表.记录ID).label('总咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('总报名'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '神殿新媒体',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != '',
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.咨询师).all()
    
    consultants = []
    c_total_日咨询 = 0
    c_total_日上门 = 0
    c_total_日报名 = 0
    c_total_总咨询 = 0
    c_total_总上门 = 0
    c_total_总报名 = 0
    c_total_订座 = 0
    
    for row in consultant_query:
        name = row.分析规划师
        总咨询量 = int(row.总咨询量) if row.总咨询量 else 0
        总上门量 = int(row.总上门量) if row.总上门量 else 0
        总报名 = int(row.总报名) if row.总报名 else 0
        订座 = int(row.订座) if row.订座 else 0
        
        # 日统计
        day_stats = db.query(
            func.count(咨询量明细表.记录ID).label('日咨询量'),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
        ).filter(
            咨询量明细表.神殿 == campus,
            咨询量明细表.量来源 == '神殿新媒体',
            咨询量明细表.咨询师 == name,
            咨询量明细表.登记日期 >= today_start_dt,
            咨询量明细表.登记日期 <= today_end_dt,
            or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
            or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
        ).first()
        
        日咨询量_c = int(day_stats.日咨询量) if day_stats and day_stats.日咨询量 else 0
        日上门量_c = int(day_stats.日上门量) if day_stats and day_stats.日上门量 else 0
        日报名_c = int(day_stats.日报名) if day_stats and day_stats.日报名 else 0
        
        consultants.append(CampusNewMediaConsultantStats(
            分析规划师=name,
            日咨询量=日咨询量_c,
            日上门量=日上门量_c,
            日报名=日报名_c,
            总咨询量=总咨询量,
            总上门量=总上门量,
            总报名=总报名,
            总转化率=format_rate_percent(总报名, 总咨询量),
            当面转化率=format_rate_percent(总报名, 总上门量),
            订座=订座
        ))
        
        c_total_日咨询 += 日咨询量_c
        c_total_日上门 += 日上门量_c
        c_total_日报名 += 日报名_c
        c_total_总咨询 += 总咨询量
        c_total_总上门 += 总上门量
        c_total_总报名 += 总报名
        c_total_订座 += 订座
    
    consultant_total = CampusNewMediaConsultantStats(
        分析规划师='合计',
        日咨询量=c_total_日咨询,
        日上门量=c_total_日上门,
        日报名=c_total_日报名,
        总咨询量=c_total_总咨询,
        总上门量=c_total_总上门,
        总报名=c_total_总报名,
        总转化率=format_rate_percent(c_total_总报名, c_total_总咨询),
        当面转化率=format_rate_percent(c_total_总报名, c_total_总上门),
        订座=c_total_订座
    )
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '神殿新媒体咨询量报名情况表',
        'summary': summary,
        'referrers': [r.model_dump() for r in referrers],
        'referrer_total': referrer_total.model_dump(),
        'consultants': [c.model_dump() for c in consultants],
        'consultant_total': consultant_total.model_dump()
    }


# ==================== 渠道子表 ====================

class ChannelAgentStats(BaseModel):
    """渠道代理统计数据"""
    渠道代理: str
    日信息量: int = 0
    日上门量: int = 0
    日报名: int = 0
    月信息量: int = 0
    月上门量: int = 0
    月报名量: int = 0
    月上门率: str = "-"
    月总转化率: str = "-"
    月当面转化率: str = "-"
    订座: int = 0


class ChannelConsultantStats(BaseModel):
    """渠道量咨询老师分配统计数据"""
    分析规划师: str
    日信息量: int = 0
    日上门量: int = 0
    日报名: int = 0
    月信息量: int = 0
    月上门量: int = 0
    月报名量: int = 0
    月上门率: str = "-"
    月总转化率: str = "-"
    月当面转化率: str = "-"
    订座: int = 0


@router.get("/channel-summary", summary="渠道子表（汇总+渠道代理明细+咨询师分配）")
async def get_channel_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: date = Query(default=None, description="目标日期，默认今天"),
    db: Session = Depends(get_db)
):
    """
    渠道咨询量统计子表
    
    返回数据结构：
    1. 汇总区：月咨询量、日咨询量、月总上门量、日上门量、月报名数、日报名量、转化率等
    2. 渠道代理明细：按渠道代理分组统计
    3. 咨询师分配明细：按咨询师分组统计
    """
    if target_date is None:
        target_date = date.today()
    
    today = target_date
    month_start = today.replace(day=1)
    month_end = today
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    
    # ============ 1. 汇总区 ============
    # 月度汇总
    month_summary = db.query(
        func.count(咨询量明细表.记录ID).label('月咨询总量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label('月退费人数'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '渠道',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    # 日汇总
    day_summary = db.query(
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名量'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '渠道',
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    月咨询总量 = int(month_summary.月咨询总量) if month_summary and month_summary.月咨询总量 else 0
    月上门量 = int(month_summary.月上门量) if month_summary and month_summary.月上门量 else 0
    月报名量 = int(month_summary.月报名量) if month_summary and month_summary.月报名量 else 0
    月退费人数 = int(month_summary.月退费人数) if month_summary and month_summary.月退费人数 else 0
    
    日咨询量 = int(day_summary.日咨询量) if day_summary and day_summary.日咨询量 else 0
    日上门量 = int(day_summary.日上门量) if day_summary and day_summary.日上门量 else 0
    # 月报名数分类统计（短期、长期、学三、学二）
    signup_breakdown = db.query(
        func.sum(case((咨询量明细表.长期短期 == '短期', 1), else_=0)).label('短期'),
        func.sum(case((咨询量明细表.长期短期 == '长期', 1), else_=0)).label('长期'),
        func.sum(case((咨询量明细表.课程 == '学三', 1), else_=0)).label('学三'),
        func.sum(case((咨询量明细表.课程 == '学二', 1), else_=0)).label('学二'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '渠道',
        咨询量明细表.是否报名 == 1,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    日报名分类 = db.query(
        func.sum(case((咨询量明细表.长期短期 == '短期', 1), else_=0)).label('短期'),
        func.sum(case((咨询量明细表.长期短期 == '长期', 1), else_=0)).label('长期'),
        func.sum(case((咨询量明细表.课程 == '学三', 1), else_=0)).label('学三'),
        func.sum(case((咨询量明细表.课程 == '学二', 1), else_=0)).label('学二'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '渠道',
        咨询量明细表.是否报名 == 1,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).first()
    
    # 处理可能为 None 的情况
    if signup_breakdown:
        月报名短期 = int(signup_breakdown.短期 or 0)
        月报名长期 = int(signup_breakdown.长期 or 0)
        月报名学三 = int(signup_breakdown.学三 or 0)
        月报名学二 = int(signup_breakdown.学二 or 0)
        月报名详情 = f"{月报名短期}短 {月报名长期}长 {月报名学二}学二 {月报名学三}学三"
    else:
        月报名短期 = 月报名长期 = 月报名学三 = 月报名学二 = 0
        月报名详情 = "0短 0长 0学二 0学三"
    
    if 日报名分类:
        日报名短期 = int(日报名分类.短期 or 0)
        日报名长期 = int(日报名分类.长期 or 0)
        日报名学三 = int(日报名分类.学三 or 0)
        日报名学二 = int(日报名分类.学二 or 0)
        日报名详情 = f"{日报名短期}短 {日报名长期}长 {日报名学二}学二 {日报名学三}学三"
    else:
        日报名短期 = 日报名长期 = 日报名学三 = 日报名学二 = 0
        日报名详情 = "0短 0长 0学二 0学三"
    
    # 计算转化率
    月电话上门转化率 = format_rate_percent(月上门量, 月咨询总量)
    月度总转化率 = format_rate_percent(月报名量, 月咨询总量)
    月退费率 = format_rate_percent(月退费人数, 月报名量) if 月报名量 > 0 else "-"
    
    summary = {
        '渠道-月咨询总量': 月咨询总量,
        '月总上门量': 月上门量,
        '月报名数': 月报名详情,
        '日咨询量': 日咨询量,
        '日上门量': 日上门量,
        '日报报名量': 日报名详情,
        '月电话总上门转化率': 月电话上门转化率,
        '月度总转化率': 月度总转化率,
        '月退费人数': 月退费人数,
        '月退费率': 月退费率,
    }
    
    # ============ 2. 渠道代理明细 ============
    agent_query = db.query(
        咨询量明细表.渠道代理.label('渠道代理'),
        func.count(咨询量明细表.记录ID).label('月信息量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '渠道',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.渠道代理.isnot(None),
        咨询量明细表.渠道代理 != '',
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.渠道代理).all()
    
    agents = []
    agent_total_日信息 = 0
    agent_total_日上门 = 0
    agent_total_日报名 = 0
    agent_total_月信息 = 0
    agent_total_月上门 = 0
    agent_total_月报名 = 0
    agent_total_订座 = 0
    
    for row in agent_query:
        name = row.渠道代理
        月信息量 = int(row.月信息量) if row.月信息量 else 0
        月上门量_a = int(row.月上门量) if row.月上门量 else 0
        月报名量_a = int(row.月报名量) if row.月报名量 else 0
        订座 = int(row.订座) if row.订座 else 0
        
        # 日统计
        day_stats = db.query(
            func.count(咨询量明细表.记录ID).label('日信息量'),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
        ).filter(
            咨询量明细表.神殿 == campus,
            咨询量明细表.量来源 == '渠道',
            咨询量明细表.渠道代理 == name,
            咨询量明细表.登记日期 >= today_start_dt,
            咨询量明细表.登记日期 <= today_end_dt,
            or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
            or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
        ).first()
        
        日信息量 = int(day_stats.日信息量) if day_stats and day_stats.日信息量 else 0
        日上门量_a = int(day_stats.日上门量) if day_stats and day_stats.日上门量 else 0
        日报名_a = int(day_stats.日报名) if day_stats and day_stats.日报名 else 0
        
        agents.append(ChannelAgentStats(
            渠道代理=name,
            日信息量=日信息量,
            日上门量=日上门量_a,
            日报名=日报名_a,
            月信息量=月信息量,
            月上门量=月上门量_a,
            月报名量=月报名量_a,
            月上门率=format_rate_percent(月上门量_a, 月信息量),
            月总转化率=format_rate_percent(月报名量_a, 月信息量),
            月当面转化率=format_rate_percent(月报名量_a, 月上门量_a),
            订座=订座
        ))
        
        agent_total_日信息 += 日信息量
        agent_total_日上门 += 日上门量_a
        agent_total_日报名 += 日报名_a
        agent_total_月信息 += 月信息量
        agent_total_月上门 += 月上门量_a
        agent_total_月报名 += 月报名量_a
        agent_total_订座 += 订座
    
    agent_total = ChannelAgentStats(
        渠道代理='合计',
        日信息量=agent_total_日信息,
        日上门量=agent_total_日上门,
        日报名=agent_total_日报名,
        月信息量=agent_total_月信息,
        月上门量=agent_total_月上门,
        月报名量=agent_total_月报名,
        月上门率=format_rate_percent(agent_total_月上门, agent_total_月信息),
        月总转化率=format_rate_percent(agent_total_月报名, agent_total_月信息),
        月当面转化率=format_rate_percent(agent_total_月报名, agent_total_月上门),
        订座=agent_total_订座
    )
    
    # ============ 3. 咨询师分配明细 ============
    consultant_query = db.query(
        咨询量明细表.咨询师.label('分析规划师'),
        func.count(咨询量明细表.记录ID).label('月信息量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('月上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('月报名量'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.量来源 == '渠道',
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != '',
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.咨询师).all()
    
    consultants = []
    c_total_日信息 = 0
    c_total_日上门 = 0
    c_total_日报名 = 0
    c_total_月信息 = 0
    c_total_月上门 = 0
    c_total_月报名 = 0
    c_total_订座 = 0
    
    for row in consultant_query:
        name = row.分析规划师
        月信息量 = int(row.月信息量) if row.月信息量 else 0
        月上门量_c = int(row.月上门量) if row.月上门量 else 0
        月报名量_c = int(row.月报名量) if row.月报名量 else 0
        订座 = int(row.订座) if row.订座 else 0
        
        # 日统计
        day_stats = db.query(
            func.count(咨询量明细表.记录ID).label('日信息量'),
            func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
            func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
        ).filter(
            咨询量明细表.神殿 == campus,
            咨询量明细表.量来源 == '渠道',
            咨询量明细表.咨询师 == name,
            咨询量明细表.登记日期 >= today_start_dt,
            咨询量明细表.登记日期 <= today_end_dt,
            or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
            or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
        ).first()
        
        日信息量_c = int(day_stats.日信息量) if day_stats and day_stats.日信息量 else 0
        日上门量_c = int(day_stats.日上门量) if day_stats and day_stats.日上门量 else 0
        日报名_c = int(day_stats.日报名) if day_stats and day_stats.日报名 else 0
        
        consultants.append(ChannelConsultantStats(
            分析规划师=name,
            日信息量=日信息量_c,
            日上门量=日上门量_c,
            日报名=日报名_c,
            月信息量=月信息量,
            月上门量=月上门量_c,
            月报名量=月报名量_c,
            月上门率=format_rate_percent(月上门量_c, 月信息量),
            月总转化率=format_rate_percent(月报名量_c, 月信息量),
            月当面转化率=format_rate_percent(月报名量_c, 月上门量_c),
            订座=订座
        ))
        
        c_total_日信息 += 日信息量_c
        c_total_日上门 += 日上门量_c
        c_total_日报名 += 日报名_c
        c_total_月信息 += 月信息量
        c_total_月上门 += 月上门量_c
        c_total_月报名 += 月报名量_c
        c_total_订座 += 订座
    
    consultant_total = ChannelConsultantStats(
        分析规划师='合计',
        日信息量=c_total_日信息,
        日上门量=c_total_日上门,
        日报名=c_total_日报名,
        月信息量=c_total_月信息,
        月上门量=c_total_月上门,
        月报名量=c_total_月报名,
        月上门率=format_rate_percent(c_total_月上门, c_total_月信息),
        月总转化率=format_rate_percent(c_total_月报名, c_total_月信息),
        月当面转化率=format_rate_percent(c_total_月报名, c_total_月上门),
        订座=c_total_订座
    )
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '渠道 月度总咨询量报名情况表',
        'summary': summary,
        'agents': [a.model_dump() for a in agents],
        'agent_total': agent_total.model_dump(),
        'consultants': [c.model_dump() for c in consultants],
        'consultant_total': consultant_total.model_dump()
    }


# ==================== 全来源咨询师汇总子表（传统大搜+新媒体+口碑+渠道） ====================

class AllSourceConsultantStats(BaseModel):
    """全来源咨询师统计数据"""
    分析规划师: str
    日咨询量: int = 0
    日上门量: int = 0
    日报名: int = 0
    总咨询量: int = 0
    总上门量: int = 0
    总报名: int = 0
    总上门率: str = "-"
    总转化率: str = "-"
    当面转化率: str = "-"
    订座: int = 0


@router.get("/all-source-consultant-summary", summary="全来源咨询师汇总子表（传统大搜+新媒体+口碑+渠道）")
async def get_all_source_consultant_summary(
    campus: str = Query(..., description="神殿名称"),
    target_date: date = Query(default=None, description="目标日期，默认今天"),
    db: Session = Depends(get_db)
):
    """
    全来源咨询师汇总子表（传统大搜+新媒体+口碑+渠道）
    
    咨询师列表从 public.users 表根据 department 和 position 字段获取
    统计所有来源类型（传统大搜+新媒体+口碑+渠道）的咨询量数据
    
    返回数据结构：
    - 分析规划师：咨询师姓名（从users表获取）
    - 日咨询量：当天的咨询量
    - 日上门量：当天的上门量
    - 日报名：当天的报名量
    - 总咨询量：当月月初到当前日期的咨询量（月度）
    - 总上门量：当月月初到当前日期的上门量（月度）
    - 总报名：当月月初到当前日期的报名量（月度）
    - 总上门率 = 总上门量 / 总咨询量
    - 总转化率 = 总报名 / 总咨询量
    - 当面转化率 = 总报名 / 总上门量
    - 订座：月初到当前日期订座状态的咨询量
    """
    if target_date is None:
        target_date = date.today()
    
    today = target_date
    month_start = today.replace(day=1)
    month_end = today
    month_start_dt, month_end_dt, today_start_dt, today_end_dt = resolve_date_boundaries(
        month_start, month_end, target_date, db
    )
    
    # 1. 从 users 表获取咨询师列表
    # 筛选条件：部门为祈福司，排除分析规划师助理，且神殿匹配
    consultants_query = db.query(User.real_name).filter(
        User.campus == campus,
        User.department == '祈福司',
        or_(User.position.is_(None), User.position != '分析规划师助理'),
    ).distinct()
    
    consultant_names = [row.real_name for row in consultants_query.all() if row.real_name]
    
    # 2. 查询月度统计数据（按咨询师分组，所有来源类型）
    month_stats_query = db.query(
        咨询量明细表.咨询师.label('咨询师'),
        func.count(咨询量明细表.记录ID).label('总咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('总上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('总报名'),
        func.sum(case((咨询量明细表.是否订座 == 1, 1), else_=0)).label('订座'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= month_start_dt,
        咨询量明细表.登记日期 <= month_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.咨询师)
    
    month_stats = {row.咨询师: row for row in month_stats_query.all() if row.咨询师}
    
    # 3. 查询今日统计数据（按咨询师分组，所有来源类型）
    today_stats_query = db.query(
        咨询量明细表.咨询师.label('咨询师'),
        func.count(咨询量明细表.记录ID).label('日咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('日上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('日报名'),
    ).filter(
        咨询量明细表.神殿 == campus,
        咨询量明细表.登记日期 >= today_start_dt,
        咨询量明细表.登记日期 <= today_end_dt,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    ).group_by(咨询量明细表.咨询师)
    
    today_stats = {row.咨询师: row for row in today_stats_query.all() if row.咨询师}
    
    # 4. 合并用户表咨询师名单和有数据的咨询师名单
    all_consultant_names = set(consultant_names) | set(month_stats.keys()) | set(today_stats.keys())
    
    # 5. 构建结果
    consultants = []
    total_日咨询 = total_日上门 = total_日报名 = 0
    total_月咨询 = total_月上门 = total_月报名 = total_订座 = 0
    
    for name in sorted(all_consultant_names):
        if not name:
            continue
            
        month_row = month_stats.get(name)
        today_row = today_stats.get(name)
        
        日咨询 = int(today_row.日咨询量) if today_row else 0
        日上门 = int(today_row.日上门量) if today_row else 0
        日报名 = int(today_row.日报名) if today_row else 0
        月咨询 = int(month_row.总咨询量) if month_row else 0
        月上门 = int(month_row.总上门量) if month_row else 0
        月报名 = int(month_row.总报名) if month_row else 0
        订座 = int(month_row.订座) if month_row else 0
        
        consultants.append(AllSourceConsultantStats(
            分析规划师=name,
            日咨询量=日咨询,
            日上门量=日上门,
            日报名=日报名,
            总咨询量=月咨询,
            总上门量=月上门,
            总报名=月报名,
            总上门率=format_rate_percent(月上门, 月咨询),
            总转化率=format_rate_percent(月报名, 月咨询),
            当面转化率=format_rate_percent(月报名, 月上门),
            订座=订座
        ))
        
        total_日咨询 += 日咨询
        total_日上门 += 日上门
        total_日报名 += 日报名
        total_月咨询 += 月咨询
        total_月上门 += 月上门
        total_月报名 += 月报名
        total_订座 += 订座
    
    # 合计行
    consultant_total = AllSourceConsultantStats(
        分析规划师='合计',
        日咨询量=total_日咨询,
        日上门量=total_日上门,
        日报名=total_日报名,
        总咨询量=total_月咨询,
        总上门量=total_月上门,
        总报名=total_月报名,
        总上门率=format_rate_percent(total_月上门, total_月咨询),
        总转化率=format_rate_percent(total_月报名, total_月咨询),
        当面转化率=format_rate_percent(total_月报名, total_月上门),
        订座=total_订座
    )
    
    return {
        'success': True,
        'campus': campus,
        'month': month_start.strftime('%Y-%m'),
        'current_date': target_date.isoformat(),
        'section_name': '传统大搜+新媒体+口碑+渠道 月度总咨询量报名情况表',
        'consultants': [c.model_dump() for c in consultants],
        'consultant_total': consultant_total.model_dump()
    }
