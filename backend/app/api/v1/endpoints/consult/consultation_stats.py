"""
咨询量统计筛选API
根据配置中心的市场配置规则动态生成各TAB的统计数据

TAB结构：
- 总表：所有有效咨询量
- 网络：量来源=网络 的记录
- 网络新媒体：量来源=网络 且 媒体来源 属于新媒体平台的记录
- 市场口碑：量来源=口碑 且 媒体来源=市场口碑
- 合作伙伴：量来源=合作伙伴
- 口碑：量来源=口碑
- 渠道：量来源=渠道
- 神殿新媒体：量来源=神殿新媒体
- 上门：是否上门=1
- 报名人数明细：是否报名=1
- 订座人数明细：是否订座=1
- 无效量：是否无效量=1
- 不算量：是否不算量=1
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional, TypedDict

from app.core.database import get_db
from app.models.consult.consultation_record import 咨询量明细表
from app.models.media_source_config import MediaCategory, MediaDetail, MediaSource
from app.models.user import User, UserStatus
from app.utils.consultation_date_utils import get_business_day_range, get_business_month_range
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import Integer, and_, case, extract, func, or_
from sqlalchemy.orm import Session

router = APIRouter()

import re

# 省份前缀列表，与前端 normalizeCampusName 保持一致
_PROVINCE_PREFIXES = re.compile(
    r'^(河北|山西|广西|贵州|山东|河南|湖北|湖南|广东|四川|云南|'
    r'江苏|浙江|福建|安徽|江西|辽宁|吉林|黑龙江|'
    r'内蒙古|新疆|西藏|青海|宁夏|重庆|北京|天津|上海)'
)

def _normalize_campus_name(name: str) -> str:
    """标准化神殿名称，去除省份前缀，确保'神殿'后缀，与前端一致"""
    if not name:
        return name
    result = _PROVINCE_PREFIXES.sub('', name).strip()
    # 确保有"神殿"后缀（"测试神殿"不动，"石美"→"慈悲殿"）
    if result and not result.endswith('神殿'):
        result = result + '神殿'
    return result


class StatsQueryParams(BaseModel):
    """统计查询参数"""
    神殿: Optional[str] = None
    开始日期: Optional[date] = None
    结束日期: Optional[date] = None


class TabStatsResponse(BaseModel):
    """TAB统计响应"""
    tab_name: str
    total_count: int
    data: List[Dict[str, Any]]


class CampusStatsRow(TypedDict):
    神殿: str
    咨询总量: int
    上门量: int
    报名量: int
    订座量: int
    退费人数: int
    电话量: int
    实际收入: float


class ConsultantMonthStats(TypedDict):
    咨询总量: int
    上门量: int
    报名量: int
    订座量: int
    退费人数: int
    电话量: int
    实际收入: float


def get_media_config_tree(db: Session) -> Dict[str, Any]:
    """
    获取媒体来源配置树，用于动态筛选
    返回结构：{
        "量来源名称": {
            "媒体来源名称": ["细分媒体1", "细分媒体2", ...],
            ...
        },
        ...
    }
    """
    categories = db.query(MediaCategory).filter(
        MediaCategory.is_active == True
    ).order_by(MediaCategory.sort_order).all()
    
    tree: dict[str, dict[str, list[str]]] = {}
    for category in categories:
        cat_name = category.name
        tree[cat_name] = {}
        
        for source in sorted(category.media_sources, key=lambda x: x.sort_order):
            if source.is_active:
                source_name = source.name
                tree[cat_name][source_name] = []
                
                for detail in sorted(source.media_details, key=lambda x: x.sort_order):
                    if detail.is_active:
                        tree[cat_name][source_name].append(detail.name)
    
    return tree


def _campus_like_filter(column, campus: str):
    """神殿名称模糊匹配：前端传'主神殿'，DB存'河北主神殿'。"""
    core_name = campus.replace("神殿", "").strip()
    return column.like(f"%{core_name}%")


def build_base_query(db: Session, params: StatsQueryParams):
    """构建基础查询（应用通用筛选条件）"""
    query = db.query(咨询量明细表)
    
    if params.神殿:
        query = query.filter(_campus_like_filter(咨询量明细表.神殿, params.神殿))
    
    if params.开始日期 and params.结束日期:
        # 使用咨询量截止时间配置计算实际查询边界
        start_dt, end_dt = get_business_month_range(params.开始日期, params.结束日期, db)
        query = query.filter(咨询量明细表.登记日期 >= start_dt)
        query = query.filter(咨询量明细表.登记日期 <= end_dt)
    elif params.开始日期:
        start_dt, _ = get_business_day_range(params.开始日期, db)
        query = query.filter(咨询量明细表.登记日期 >= start_dt)
    elif params.结束日期:
        _, end_dt = get_business_day_range(params.结束日期, db)
        query = query.filter(咨询量明细表.登记日期 <= end_dt)
    
    return query


def get_media_config_full_tree(db: Session) -> Dict[str, Any]:
    """
    获取媒体来源完整配置树（包含排序信息），用于前端动态生成TAB和列
    返回结构：{
        "categories": [
            {
                "name": "量来源名称",
                "sort_order": 0,
                "sources": [
                    {
                        "name": "媒体来源名称",
                        "sort_order": 0,
                        "is_important": false,
                        "details": [
                            {"name": "细分媒体1", "sort_order": 0, "is_important": false},
                            ...
                        ]
                    },
                    ...
                ]
            },
            ...
        ]
    }
    """
    categories = db.query(MediaCategory).filter(
        MediaCategory.is_active == True
    ).order_by(MediaCategory.sort_order).all()
    
    result: dict[str, list[dict[str, Any]]] = {"categories": []}
    for category in categories:
        cat_item = {
            "name": category.name,
            "sort_order": category.sort_order,
            "description": category.description,
            "sources": []
        }
        
        for source in sorted(category.media_sources, key=lambda x: x.sort_order):
            if source.is_active:
                source_item = {
                    "name": source.name,
                    "sort_order": source.sort_order,
                    "description": source.description,
                    "is_important": getattr(source, 'is_important', False),
                    "details": []
                }
                
                for detail in sorted(source.media_details, key=lambda x: x.sort_order):
                    if detail.is_active:
                        source_item["details"].append({
                            "name": detail.name,
                            "sort_order": detail.sort_order,
                            "description": detail.description,
                            "is_important": getattr(detail, 'is_important', False)
                        })
                
                cat_item["sources"].append(source_item)
        
        result["categories"].append(cat_item)
    
    return result


@router.get("/consultation/stats/config-tree", summary="获取媒体来源配置树")
def get_config_tree(db: Session = Depends(get_db)):
    """获取当前媒体来源配置树，用于前端动态渲染筛选条件"""
    tree = get_media_config_tree(db)
    return {"success": True, "data": tree}


@router.get("/consultation/stats/config-tree-full", summary="获取媒体来源完整配置树（含排序）")
def get_config_tree_full(db: Session = Depends(get_db)):
    """获取当前媒体来源完整配置树，包含排序信息，用于前端动态生成TAB和列"""
    tree = get_media_config_full_tree(db)
    return {"success": True, "data": tree}


@router.get("/consultation/stats/tabs", summary="获取所有TAB的统计数据")
def get_all_tabs_stats(
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    开始日期: Optional[date] = Query(None, description="开始日期"),
    结束日期: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    """
    获取所有TAB的统计数据
    根据配置中心的规则动态计算各TAB的记录数
    """
    params = StatsQueryParams(神殿=神殿, 开始日期=开始日期, 结束日期=结束日期)
    config_tree = get_media_config_tree(db)
    
    # 网络类的媒体来源列表
    网络媒体来源列表 = list(config_tree.get("网络", {}).keys())
    新媒体平台来源列表 = config_tree.get("网络", {}).get("新媒体平台", [])
    
    # 口碑类的媒体来源列表
    口碑媒体来源列表 = list(config_tree.get("口碑", {}).keys())
    
    # 构建基础查询
    base_query = build_base_query(db, params)
    
    # 排除无效量和不算量的有效记录
    有效记录_query = base_query.filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    tabs_stats = []
    
    # 1. 总表 - 所有有效记录
    总表_count = 有效记录_query.count()
    tabs_stats.append({"tab_name": "总表", "count": 总表_count})
    
    # 2. 网络 - 量来源=网络，以及 量来源=口碑+媒体来源=市场口碑（历史数据兼容）
    网络_count = 有效记录_query.filter(
        or_(
            咨询量明细表.量来源 == "网络",
            and_(咨询量明细表.量来源 == "口碑", 咨询量明细表.媒体来源 == "市场口碑"),
        )
    ).count()
    tabs_stats.append({"tab_name": "网络", "count": 网络_count})
    
    # 3. 网络新媒体 - 量来源=网络 且 媒体来源 属于新媒体平台
    if 新媒体平台来源列表:
        网络新媒体_count = 有效记录_query.filter(
            咨询量明细表.量来源 == "网络",
            咨询量明细表.媒体来源.in_(新媒体平台来源列表)
        ).count()
    else:
        网络新媒体_count = 有效记录_query.filter(
            咨询量明细表.量来源 == "网络",
            咨询量明细表.媒体来源 == "新媒体平台"
        ).count()
    tabs_stats.append({"tab_name": "网络新媒体", "count": 网络新媒体_count})
    
    # 4. 市场口碑 - 媒体来源=市场口碑（兼容新旧数据：量来源可能是口碑或网络）
    市场口碑_count = 有效记录_query.filter(
        咨询量明细表.媒体来源 == "市场口碑"
    ).count()
    tabs_stats.append({"tab_name": "市场口碑", "count": 市场口碑_count})
    
    # 5. 合作伙伴 - 量来源=合作伙伴
    合作伙伴_count = 有效记录_query.filter(咨询量明细表.量来源 == "合作伙伴").count()
    tabs_stats.append({"tab_name": "合作伙伴", "count": 合作伙伴_count})
    
    # 6. 口碑 - 量来源=口碑
    口碑_count = 有效记录_query.filter(咨询量明细表.量来源 == "口碑").count()
    tabs_stats.append({"tab_name": "口碑", "count": 口碑_count})
    
    # 7. 渠道 - 量来源=渠道
    渠道_count = 有效记录_query.filter(咨询量明细表.量来源 == "渠道").count()
    tabs_stats.append({"tab_name": "渠道", "count": 渠道_count})
    
    # 8. 神殿新媒体 - 量来源=神殿新媒体
    神殿新媒体_count = 有效记录_query.filter(咨询量明细表.量来源 == "神殿新媒体").count()
    tabs_stats.append({"tab_name": "神殿新媒体", "count": 神殿新媒体_count})
    
    # 9. 上门 - 是否上门=1
    上门_count = 有效记录_query.filter(咨询量明细表.是否上门 == 1).count()
    tabs_stats.append({"tab_name": "上门", "count": 上门_count})
    
    # 10. 报名人数明细 - 是否报名=1
    报名_count = 有效记录_query.filter(咨询量明细表.是否报名 == 1).count()
    tabs_stats.append({"tab_name": "报名人数明细", "count": 报名_count})
    
    # 11. 订座人数明细 - 是否订座=1
    订座_count = 有效记录_query.filter(咨询量明细表.是否订座 == 1).count()
    tabs_stats.append({"tab_name": "订座人数明细", "count": 订座_count})
    
    # 12. 无效量 - 是否无效量=1
    无效量_count = base_query.filter(咨询量明细表.是否无效量 == 1).count()
    tabs_stats.append({"tab_name": "无效量", "count": 无效量_count})
    
    # 13. 不算量 - 是否不算量=1
    不算量_count = base_query.filter(咨询量明细表.是否不算量 == 1).count()
    tabs_stats.append({"tab_name": "不算量", "count": 不算量_count})
    
    # 14. 未分配 - 咨询师为空的记录
    未分配_count = 有效记录_query.filter(
        or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == '')
    ).count()
    tabs_stats.append({"tab_name": "未分配", "count": 未分配_count})
    
    return {
        "success": True,
        "data": tabs_stats,
        "config_tree": config_tree,
        "query_params": {
            "神殿": 神殿,
            "开始日期": str(开始日期) if 开始日期 else None,
            "结束日期": str(结束日期) if 结束日期 else None
        }
    }


@router.get("/consultation/stats/tab-data/{tab_name}", summary="获取指定TAB的详细数据")
def get_tab_data(
    tab_name: str,
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    开始日期: Optional[date] = Query(None, description="开始日期"),
    结束日期: Optional[date] = Query(None, description="结束日期"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=500, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取指定TAB的详细数据列表
    """
    params = StatsQueryParams(神殿=神殿, 开始日期=开始日期, 结束日期=结束日期)
    config_tree = get_media_config_tree(db)
    
    # 网络类的媒体来源
    新媒体平台来源列表 = config_tree.get("网络", {}).get("新媒体平台", [])
    
    # 构建基础查询
    base_query = build_base_query(db, params)
    
    # 有效记录查询（排除无效量和不算量）
    有效记录_query = base_query.filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    # 根据tab_name应用不同的筛选条件
    if tab_name == "总表":
        query = 有效记录_query
    elif tab_name == "网络":
        query = 有效记录_query.filter(
            or_(
                咨询量明细表.量来源 == "网络",
                and_(咨询量明细表.量来源 == "口碑", 咨询量明细表.媒体来源 == "市场口碑"),
            )
        )
    elif tab_name == "网络新媒体":
        if 新媒体平台来源列表:
            query = 有效记录_query.filter(
                咨询量明细表.量来源 == "网络",
                咨询量明细表.媒体来源.in_(新媒体平台来源列表)
            )
        else:
            query = 有效记录_query.filter(
                咨询量明细表.量来源 == "网络",
                咨询量明细表.媒体来源 == "新媒体平台"
            )
    elif tab_name == "市场口碑":
        query = 有效记录_query.filter(
            咨询量明细表.媒体来源 == "市场口碑"
        )
    elif tab_name == "合作伙伴":
        query = 有效记录_query.filter(咨询量明细表.量来源 == "合作伙伴")
    elif tab_name == "口碑":
        query = 有效记录_query.filter(咨询量明细表.量来源 == "口碑")
    elif tab_name == "渠道":
        query = 有效记录_query.filter(咨询量明细表.量来源 == "渠道")
    elif tab_name == "神殿新媒体":
        query = 有效记录_query.filter(咨询量明细表.量来源 == "神殿新媒体")
    elif tab_name == "上门":
        query = 有效记录_query.filter(咨询量明细表.是否上门 == 1)
    elif tab_name == "报名人数明细":
        query = 有效记录_query.filter(咨询量明细表.是否报名 == 1)
    elif tab_name == "订座人数明细":
        query = 有效记录_query.filter(咨询量明细表.是否订座 == 1)
    elif tab_name == "无效量":
        query = base_query.filter(咨询量明细表.是否无效量 == 1)
    elif tab_name == "不算量":
        query = base_query.filter(咨询量明细表.是否不算量 == 1)
    elif tab_name == "未分配":
        query = 有效记录_query.filter(
            or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == '')
        )
    else:
        # 动态处理其他可能的TAB（基于口碑细分）
        口碑媒体来源列表 = list(config_tree.get("口碑", {}).keys())
        if tab_name in 口碑媒体来源列表:
            query = 有效记录_query.filter(
                咨询量明细表.量来源 == "口碑",
                咨询量明细表.媒体来源 == tab_name
            )
        else:
            return {"success": False, "message": f"未知的TAB名称: {tab_name}"}
    
    # 统计总数
    total = query.count()
    
    # 分页查询
    records = query.order_by(咨询量明细表.登记日期.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [r.to_dict() for r in records]
    }


@router.get("/consultation/stats/summary", summary="获取汇总统计")
def get_summary_stats(
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    开始日期: Optional[date] = Query(None, description="开始日期"),
    结束日期: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    """
    获取汇总统计数据
    """
    params = StatsQueryParams(神殿=神殿, 开始日期=开始日期, 结束日期=结束日期)
    config_tree = get_media_config_tree(db)
    
    base_query = build_base_query(db, params)
    
    # 有效记录（排除无效量和不算量）
    有效记录_query = base_query.filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    # 按量来源分组统计
    量来源统计 = db.query(
        咨询量明细表.量来源,
        func.count(咨询量明细表.记录ID).label("数量")
    ).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    if params.神殿:
        量来源统计 = 量来源统计.filter(_campus_like_filter(咨询量明细表.神殿, params.神殿))
    if params.开始日期 and params.结束日期:
        start_dt, end_dt = get_business_month_range(params.开始日期, params.结束日期, db)
        量来源统计 = 量来源统计.filter(咨询量明细表.登记日期 >= start_dt)
        量来源统计 = 量来源统计.filter(咨询量明细表.登记日期 <= end_dt)
    elif params.开始日期:
        start_dt, _ = get_business_day_range(params.开始日期, db)
        量来源统计 = 量来源统计.filter(咨询量明细表.登记日期 >= start_dt)
    elif params.结束日期:
        _, end_dt = get_business_day_range(params.结束日期, db)
        量来源统计 = 量来源统计.filter(咨询量明细表.登记日期 <= end_dt)
    
    量来源统计 = 量来源统计.group_by(咨询量明细表.量来源).all()
    
    # 按媒体来源分组统计
    媒体来源统计 = db.query(
        咨询量明细表.量来源,
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label("数量")
    ).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None))
    )
    
    if params.神殿:
        媒体来源统计 = 媒体来源统计.filter(_campus_like_filter(咨询量明细表.神殿, params.神殿))
    if params.开始日期 and params.结束日期:
        start_dt, end_dt = get_business_month_range(params.开始日期, params.结束日期, db)
        媒体来源统计 = 媒体来源统计.filter(咨询量明细表.登记日期 >= start_dt)
        媒体来源统计 = 媒体来源统计.filter(咨询量明细表.登记日期 <= end_dt)
    elif params.开始日期:
        start_dt, _ = get_business_day_range(params.开始日期, db)
        媒体来源统计 = 媒体来源统计.filter(咨询量明细表.登记日期 >= start_dt)
    elif params.结束日期:
        _, end_dt = get_business_day_range(params.结束日期, db)
        媒体来源统计 = 媒体来源统计.filter(咨询量明细表.登记日期 <= end_dt)
    
    媒体来源统计 = 媒体来源统计.group_by(咨询量明细表.量来源, 咨询量明细表.媒体来源).all()
    
    return {
        "success": True,
        "data": {
            "总量": 有效记录_query.count(),
            "上门量": 有效记录_query.filter(咨询量明细表.是否上门 == 1).count(),
            "报名量": 有效记录_query.filter(咨询量明细表.是否报名 == 1).count(),
            "订座量": 有效记录_query.filter(咨询量明细表.是否订座 == 1).count(),
            "无效量": base_query.filter(咨询量明细表.是否无效量 == 1).count(),
            "不算量": base_query.filter(咨询量明细表.是否不算量 == 1).count(),
            "量来源分布": {row[0] or "未分类": row[1] for row in 量来源统计},
            "媒体来源分布": [
                {"量来源": row[0] or "未分类", "媒体来源": row[1] or "未分类", "数量": row[2]}
                for row in 媒体来源统计
            ]
        },
        "config_tree": config_tree
    }


@router.get("/consultation/stats/monthly-campus-summary", summary="按月份和神殿汇总统计")
def get_monthly_campus_summary(
    年份: int = Query(..., description="年份"),
    神殿: Optional[str] = Query(None, description="神殿筛选，不填则查询所有神殿"),
    数据类型: Optional[str] = Query(None, description="数据类型筛选(网络/渠道/口碑/神殿新媒体等)，对应量来源字段"),
    媒体来源: Optional[str] = Query(None, description="媒体来源筛选(百教网/知了好学等)，多个用逗号分隔"),
    分类: Optional[str] = Query(None, description="配置驱动分类(SEM/新媒体/市场口碑/合作伙伴/免费推广/口碑/渠道/神殿新媒体)"),
    db: Session = Depends(get_db)
):
    """
    获取按月份和神殿汇总的咨询量统计数据
    用于001最高议事厅核心数据和002神殿年月表的数据联动
    
    返回每个月的：咨询总量、上门量、报名量、退费人数、电话量、实际收入
    
    分类参数优先于数据类型和媒体来源，使用配置中心的媒体来源层级自动筛选
    """
    # 按月份统计
    月度统计 = db.query(
        extract('month', 咨询量明细表.登记日期).label('月份'),
        func.count(咨询量明细表.记录ID).label('咨询总量'),
        func.sum(func.cast(咨询量明细表.是否上门 == 1, Integer)).label('上门量'),
        func.sum(func.cast(咨询量明细表.是否报名 == 1, Integer)).label('报名量'),
        func.sum(func.cast(咨询量明细表.是否订座 == 1, Integer)).label('订座量'),
        func.sum(func.cast(咨询量明细表.是否退费 == 1, Integer)).label('退费人数'),
        func.count(func.distinct(咨询量明细表.电话)).label('电话量'),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), func.coalesce(咨询量明细表.缴费金额, 0)), else_=0)).label('实际收入'),
    ).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        extract('year', 咨询量明细表.登记日期) == 年份
    )
    
    if 神殿:
        月度统计 = 月度统计.filter(_campus_like_filter(咨询量明细表.神殿, 神殿))
    
    # 分类参数优先
    if 分类:
        分类filter = _build_category_filter(分类, db)
        if 分类filter is not None:
            月度统计 = 月度统计.filter(分类filter)
    elif 数据类型:
        月度统计 = 月度统计.filter(咨询量明细表.量来源 == 数据类型)
    
    if not 分类 and 媒体来源:
        媒体来源列表 = [s.strip() for s in 媒体来源.split(',')]
        月度统计 = 月度统计.filter(咨询量明细表.媒体来源.in_(媒体来源列表))
    
    月度统计 = 月度统计.group_by(extract('month', 咨询量明细表.登记日期)).all()
    
    # 构建返回数据
    月度数据 = {}
    for row in 月度统计:
        月份 = int(row.月份)
        月度数据[月份] = {
            "月份": 月份,
            "咨询总量": row.咨询总量 or 0,
            "上门量": int(row.上门量 or 0),
            "报名量": int(row.报名量 or 0),
            "订座量": int(row.订座量 or 0),
            "退费人数": int(row.退费人数 or 0),
            "电话量": int(row.电话量 or 0),
            "实际收入": float(row.实际收入 or 0),
        }
    
    # 填充空月份
    for m in range(1, 13):
        if m not in 月度数据:
            月度数据[m] = {"月份": m, "咨询总量": 0, "上门量": 0, "报名量": 0, "订座量": 0, "退费人数": 0, "电话量": 0, "实际收入": 0}
    
    # 计算年度汇总
    年度汇总 = {
        "咨询总量": sum(d["咨询总量"] for d in 月度数据.values()),
        "上门量": sum(d["上门量"] for d in 月度数据.values()),
        "报名量": sum(d["报名量"] for d in 月度数据.values()),
        "订座量": sum(d["订座量"] for d in 月度数据.values()),
        "退费人数": sum(d["退费人数"] for d in 月度数据.values()),
        "电话量": sum(d["电话量"] for d in 月度数据.values()),
        "实际收入": sum(d["实际收入"] for d in 月度数据.values()),
    }
    
    return {
        "success": True,
        "data": {
            "年份": 年份,
            "神殿": 神殿 or "全部",
            "数据类型": 数据类型 or "全部",
            "月度数据": [月度数据[m] for m in range(1, 13)],
            "年度汇总": 年度汇总
        }
    }


@router.get("/consultation/stats/all-campus-yearly-summary", summary="获取所有神殿年度汇总")
def get_all_campus_yearly_summary(
    年份: int = Query(..., description="年份"),
    数据类型: Optional[str] = Query(None, description="数据类型筛选(网络/渠道/口碑/神殿新媒体等)"),
    媒体来源: Optional[str] = Query(None, description="媒体来源筛选（二级分类）"),
    分类: Optional[str] = Query(None, description="配置驱动分类(SEM/新媒体/市场口碑/合作伙伴/免费推广/口碑/渠道/神殿新媒体)，自动按配置中心的媒体来源层级筛选"),
    db: Session = Depends(get_db)
):
    """
    获取所有神殿的年度汇总统计数据
    用于001最高议事厅核心数据汇总表的数据联动
    
    返回每个神殿的：咨询总量、上门量、报名量、退费人数、电话量、实际收入
    
    分类参数说明（读取配置中心媒体来源配置）：
    - SEM: 量来源=网络, 媒体来源 in 常规SEM平台子项
    - 新媒体: 量来源=网络, 媒体来源 in 新媒体平台子项  
    - 市场口碑: (量来源=口碑 AND 媒体来源=市场口碑) OR (量来源=网络 AND 媒体来源=市场口碑)
    - 合作伙伴: 量来源=网络, 媒体来源 in 网络合作伙伴子项
    - 免费推广: 量来源=网络, 媒体来源 in 免费推广子项
    - 口碑: 量来源=口碑, 排除市场口碑
    - 渠道: 量来源=渠道
    - 神殿新媒体: 量来源=神殿新媒体
    """
    # 按神殿统计
    神殿统计 = db.query(
        咨询量明细表.神殿,
        func.count(咨询量明细表.记录ID).label('咨询总量'),
        func.sum(func.cast(咨询量明细表.是否上门 == 1, Integer)).label('上门量'),
        func.sum(func.cast(咨询量明细表.是否报名 == 1, Integer)).label('报名量'),
        func.sum(func.cast(咨询量明细表.是否订座 == 1, Integer)).label('订座量'),
        func.sum(func.cast(咨询量明细表.是否退费 == 1, Integer)).label('退费人数'),
        func.count(func.distinct(咨询量明细表.电话)).label('电话量'),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), func.coalesce(咨询量明细表.缴费金额, 0)), else_=0)).label('实际收入'),
    ).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        extract('year', 咨询量明细表.登记日期) == 年份
    )
    
    # 分类参数：从配置中心读取媒体来源层级，自动构建筛选条件
    实际分类 = 分类 or ""
    if 分类:
        分类filter = _build_category_filter(分类, db)
        if 分类filter is not None:
            神殿统计 = 神殿统计.filter(分类filter)
    elif 数据类型:
        神殿统计 = 神殿统计.filter(咨询量明细表.量来源 == 数据类型)
    
    if not 分类 and 媒体来源:
        # 支持多个媒体来源，用逗号分隔
        媒体来源列表 = [s.strip() for s in 媒体来源.split(',')]
        神殿统计 = 神殿统计.filter(咨询量明细表.媒体来源.in_(媒体来源列表))
    
    神殿统计 = 神殿统计.group_by(咨询量明细表.神殿).all()
    
    # 构建返回数据（合并同名神殿，例如"河北慈悲殿"和"石美"都归为"慈悲殿"）
    神殿合并: dict[str, CampusStatsRow] = {}
    for row in 神殿统计:
        normalized = _normalize_campus_name(row.神殿 or "未分类")
        if normalized in 神殿合并:
            d = 神殿合并[normalized]
            d["咨询总量"] += (row.咨询总量 or 0)
            d["上门量"] += int(row.上门量 or 0)
            d["报名量"] += int(row.报名量 or 0)
            d["订座量"] += int(row.订座量 or 0)
            d["退费人数"] += int(row.退费人数 or 0)
            d["电话量"] += int(row.电话量 or 0)
            d["实际收入"] += float(row.实际收入 or 0)
        else:
            神殿合并[normalized] = {
                "神殿": normalized,
                "咨询总量": int(row.咨询总量 or 0),
                "上门量": int(row.上门量 or 0),
                "报名量": int(row.报名量 or 0),
                "订座量": int(row.订座量 or 0),
                "退费人数": int(row.退费人数 or 0),
                "电话量": int(row.电话量 or 0),
                "实际收入": float(row.实际收入 or 0),
            }
    神殿数据列表 = list(神殿合并.values())
    
    # 计算合计
    合计 = {
        "神殿": "合计",
        "咨询总量": sum(d["咨询总量"] for d in 神殿数据列表),
        "上门量": sum(d["上门量"] for d in 神殿数据列表),
        "报名量": sum(d["报名量"] for d in 神殿数据列表),
        "订座量": sum(d["订座量"] for d in 神殿数据列表),
        "退费人数": sum(d["退费人数"] for d in 神殿数据列表),
        "电话量": sum(d["电话量"] for d in 神殿数据列表),
        "实际收入": sum(d["实际收入"] for d in 神殿数据列表),
    }
    
    return {
        "success": True,
        "data": {
            "年份": 年份,
            "数据类型": 数据类型 or 实际分类 or "全部",
            "媒体来源": 媒体来源 or "全部",
            "分类": 分类 or "全部",
            "神殿数据": 神殿数据列表,
            "合计": 合计
        }
    }


def _build_category_filter(分类: str, db: Session):
    """
    根据配置中心的媒体来源层级构建SQLAlchemy筛选条件
    
    配置结构：量来源(L1) → 媒体来源(L2) → 细分媒体(L3)
    咨询量明细表存储：量来源列 对应 L1，媒体来源列 对应 L2或L3
    
    当L2下有L3子项时，实际录入的媒体来源是L3的值
    当L2下无L3子项时，实际录入的媒体来源是L2本身（如市场口碑）
    """
    # 配置驱动映射：分类名 → 对应配置中心的媒体来源(L2)名称
    # 从config.media_sources表按name查找对应的L2记录，获取其下所有L3细分媒体
    分类映射 = {
        'SEM': {
            '量来源候选': ['SEM', '网络'],
            '媒体来源候选': ['常规SEM平台', 'SEM平台', '常规SEM'],
        },
        '新媒体': {
            '量来源候选': ['新媒体', '网络'],
            '媒体来源候选': ['新媒体平台', '新媒体'],
        },
        '合作伙伴': {
            '量来源候选': ['合作伙伴', '网络'],
            '媒体来源候选': ['合作伙伴平台', '网络合作伙伴', '合作伙伴'],
        },
        '免费推广': {
            '量来源候选': ['免费推广', '网络'],
            '媒体来源候选': ['免费推广', '免费网络'],
        },
    }
    
    if 分类 == '市场口碑':
        # 市场口碑是特殊的混合类别：
        # - 旧数据: 量来源='口碑', 媒体来源='市场口碑'
        # - 新数据: 量来源='网络', 媒体来源='市场口碑'
        return or_(
            and_(咨询量明细表.量来源 == '口碑', 咨询量明细表.媒体来源 == '市场口碑'),
            and_(咨询量明细表.量来源 == '网络', 咨询量明细表.媒体来源 == '市场口碑'),
        )
    
    if 分类 == '口碑':
        # 口碑：量来源='口碑'，排除市场口碑
        return and_(
            咨询量明细表.量来源 == '口碑',
            or_(咨询量明细表.媒体来源 != '市场口碑', 咨询量明细表.媒体来源.is_(None)),
        )
    
    if 分类 == '渠道':
        return 咨询量明细表.量来源 == '渠道'
    
    if 分类 == '神殿新媒体':
        return 咨询量明细表.量来源 == '神殿新媒体'
    
    if 分类 in 分类映射:
        映射 = 分类映射[分类]
        量来源候选 = 映射['量来源候选']
        媒体来源候选 = 映射['媒体来源候选']

        # 优先匹配配置中心存在的量来源
        category = db.query(MediaCategory).filter(MediaCategory.name.in_(量来源候选)).first()
        if not category:
            # 回退到分类名本身（兼容历史数据）
            return 咨询量明细表.量来源 == 分类

        # 优先匹配该量来源下的媒体来源
        source = db.query(MediaSource).filter(
            MediaSource.media_category_id == category.id,
            MediaSource.name.in_(媒体来源候选)
        ).first()

        if not source:
            return 咨询量明细表.量来源 == category.name

        # 获取L3细分媒体列表
        details = db.query(MediaDetail.name).filter(
            MediaDetail.media_source_id == source.id
        ).all()

        细分列表 = [d.name for d in details]

        if 细分列表:
            # 有L3子项：按L3细分媒体值匹配媒体来源列
            return and_(
                咨询量明细表.量来源 == category.name,
                咨询量明细表.媒体来源.in_(细分列表),
            )
        # 无L3子项：按L2名称直接匹配
        return and_(
            咨询量明细表.量来源 == category.name,
            咨询量明细表.媒体来源 == source.name,
        )
    
    # 未识别的分类，按量来源直接过滤
    return 咨询量明细表.量来源 == 分类


@router.get("/consultant-stats", summary="获取咨询师咨询量统计")
def get_consultant_stats(
    campus: Optional[str] = Query(None, description="神殿筛选"),
    consultant: Optional[str] = Query(None, description="咨询师筛选"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    data_source: Optional[str] = Query(None, description="量来源筛选"),
    media_source: Optional[str] = Query(None, description="媒体来源筛选"),
    is_visit: Optional[int] = Query(None, description="是否上门筛选"),
    is_enrolled: Optional[int] = Query(None, description="是否报名筛选"),
    is_reserved: Optional[int] = Query(None, description="是否订座筛选"),
    is_invalid: Optional[int] = Query(None, description="是否无效量筛选"),
    is_excluded: Optional[int] = Query(None, description="是否不算量筛选"),
    db: Session = Depends(get_db)
):
    """
    获取咨询师咨询量统计，用于咨询量列表顶部展示
    
    根据筛选条件统计每个咨询师的咨询量数量
    """
    # 构建基础查询（不带分组）
    base_query = db.query(咨询量明细表)
    
    # 应用筛选条件
    if campus:
        base_query = base_query.filter(_campus_like_filter(咨询量明细表.神殿, campus))
    
    if consultant:
        base_query = base_query.filter(咨询量明细表.咨询师 == consultant)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            base_query = base_query.filter(咨询量明细表.登记日期 >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            base_query = base_query.filter(咨询量明细表.登记日期 <= end)
        except ValueError:
            pass
    
    if data_source:
        base_query = base_query.filter(咨询量明细表.量来源 == data_source)
    
    if media_source:
        base_query = base_query.filter(咨询量明细表.媒体来源 == media_source)
    
    if is_visit is not None:
        base_query = base_query.filter(咨询量明细表.是否上门 == is_visit)
    
    if is_enrolled is not None:
        base_query = base_query.filter(咨询量明细表.是否报名 == is_enrolled)
    
    if is_reserved is not None:
        base_query = base_query.filter(咨询量明细表.是否订座 == is_reserved)
    
    if is_invalid is not None:
        base_query = base_query.filter(咨询量明细表.是否无效量 == is_invalid)
    else:
        # 默认排除无效量
        base_query = base_query.filter(or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)))
    
    if is_excluded is not None:
        base_query = base_query.filter(咨询量明细表.是否不算量 == is_excluded)
    else:
        # 默认排除不算量
        base_query = base_query.filter(or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)))
    
    # 先查询总有效量（不按咨询师过滤）
    total_count = base_query.count()
    
    # 查询未分配数（咨询师为空）
    unassigned_count = base_query.filter(
        or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == '')
    ).count()
    
    # 查询当天新量（当天登记的有效量）
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    # 当天新量基于同样的筛选条件，但限定在今天
    today_base = db.query(咨询量明细表).filter(
        咨询量明细表.登记日期 >= today_start,
        咨询量明细表.登记日期 <= today_end,
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
    )
    if campus:
        today_base = today_base.filter(_campus_like_filter(咨询量明细表.神殿, campus))
    
    today_new_count = today_base.count()
    
    # 当天已分配数（今天登记的且咨询师不为空）
    today_distributed_count = today_base.filter(
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != ''
    ).count()
    
    # 查询每个咨询师当天分的新量数（今天登记的、已分配咨询师的记录，按咨询师分组）
    today_consultant_results = today_base.filter(
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != ''
    ).with_entities(
        咨询量明细表.咨询师,
        func.count(咨询量明细表.记录ID).label('today_count')
    ).group_by(咨询量明细表.咨询师).all()
    
    today_stats_map = {}
    for row in today_consultant_results:
        if row.咨询师:
            today_stats_map[row.咨询师] = row.today_count or 0
    
    # 按咨询师分组并排序
    grouped_query = base_query.with_entities(
        咨询量明细表.咨询师,
        func.count(咨询量明细表.记录ID).label('咨询量')
    )
    results = grouped_query.group_by(咨询量明细表.咨询师).order_by(func.count(咨询量明细表.记录ID).desc()).all()
    
    # 构建返回数据：从 users 表获取祈福司咨询师名单，合并实际统计
    consultant_stats = []
    
    # 从数据库统计中构建咨询师->count 映射
    stats_map = {}
    for row in results:
        if row.咨询师:
            stats_map[row.咨询师] = row.咨询量 or 0
    
    # 从 public.users 获取祈福司咨询师名单（排除分析规划师助理）
    consultant_users = db.query(User.real_name, User.campus).filter(
        User.department == '祈福司',
        User.status == UserStatus.ACTIVE,
        or_(User.position.is_(None), User.position != '分析规划师助理'),
    ).all()
    
    # 如果有神殿筛选，只显示对应神殿的咨询师
    registered_names = set()
    for u in consultant_users:
        if campus and u.campus and campus not in u.campus:
            continue
        registered_names.add(u.real_name)
    
    # 先添加有数据的注册咨询师（按数量降序）
    sorted_names = sorted(
        [(name, stats_map.get(name, 0)) for name in registered_names if stats_map.get(name, 0) > 0],
        key=lambda x: x[1], reverse=True
    )
    for name, count in sorted_names:
        consultant_stats.append({"咨询师": name, "咨询量": count, "今日量": today_stats_map.get(name, 0)})
    
    # 再添加数量为0的注册咨询师
    for name in sorted(registered_names):
        if stats_map.get(name, 0) == 0:
            consultant_stats.append({"咨询师": name, "咨询量": 0, "今日量": today_stats_map.get(name, 0)})
    
    # 添加未注册但有数据的咨询师（可能是已离职或其他部门人员）
    for name, count in sorted(stats_map.items(), key=lambda x: x[1], reverse=True):
        if name not in registered_names and count > 0:
            consultant_stats.append({"咨询师": name, "咨询量": count, "今日量": today_stats_map.get(name, 0)})
    
    # 添加未分配统计
    # 当天未分配量
    today_unassigned_count = today_base.filter(
        or_(咨询量明细表.咨询师.is_(None), 咨询量明细表.咨询师 == '')
    ).count()
    if unassigned_count > 0:
        consultant_stats.append({"咨询师": "", "咨询量": unassigned_count, "今日量": today_unassigned_count})
    
    return {
        "success": True,
        "data": {
            "consultant_stats": consultant_stats,
            "total_count": total_count,
            "consultant_count": len([s for s in consultant_stats if s["咨询师"]]),
            "unassigned_count": unassigned_count,
            "today_new_count": today_new_count,
            "today_distributed_count": today_distributed_count,
        }
    }


@router.get("/consultation/stats/consultant-monthly-summary", summary="获取咨询师按月度统计")
def get_consultant_monthly_summary(
    年份: int = Query(..., description="年份"),
    神殿: str = Query(..., description="神殿"),
    数据类型: Optional[str] = Query(None, description="数据类型筛选(网络/渠道/口碑/神殿新媒体等)，对应量来源字段"),
    媒体来源: Optional[str] = Query(None, description="媒体来源筛选(百教网/知了好学等)，多个用逗号分隔"),
    分类: Optional[str] = Query(None, description="配置驱动分类(SEM/新媒体/市场口碑/合作伙伴/免费推广/口碑/渠道/神殿新媒体)"),
    db: Session = Depends(get_db)
):
    """
    获取咨询师按月度的咨询量统计数据
    用于口碑等页面的咨询师月度表自动填充
    
    分类参数优先于数据类型和媒体来源，使用配置中心的媒体来源层级自动筛选
    
    返回格式：
    {
        "咨询师名称": {
            月份: {"咨询总量": x, "上门量": x, "报名量": x, "退费人数": x, "电话量": x},
            ...
        },
        ...
    }
    """
    # 构建过滤条件（使用LIKE模糊匹配神殿名称）
    filters = [
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        extract('year', 咨询量明细表.登记日期) == 年份,
        _campus_like_filter(咨询量明细表.神殿, 神殿),
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != ''
    ]
    
    # 分类参数优先
    if 分类:
        分类filter = _build_category_filter(分类, db)
        if 分类filter is not None:
            filters.append(分类filter)
    elif 数据类型:
        filters.append(咨询量明细表.量来源 == 数据类型)
    
    if not 分类 and 媒体来源:
        # 支持多个媒体来源，用逗号分隔
        媒体来源列表 = [s.strip() for s in 媒体来源.split(',')]
        filters.append(咨询量明细表.媒体来源.in_(媒体来源列表))
    
    # 按咨询师和月份统计
    咨询师月度统计 = db.query(
        咨询量明细表.咨询师,
        extract('month', 咨询量明细表.登记日期).label('月份'),
        func.count(咨询量明细表.记录ID).label('咨询总量'),
        func.sum(func.cast(咨询量明细表.是否上门 == 1, Integer)).label('上门量'),
        func.sum(func.cast(咨询量明细表.是否报名 == 1, Integer)).label('报名量'),
        func.sum(func.cast(咨询量明细表.是否订座 == 1, Integer)).label('订座量'),
        func.sum(func.cast(咨询量明细表.是否退费 == 1, Integer)).label('退费人数'),
        func.count(func.distinct(咨询量明细表.电话)).label('电话量'),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), func.coalesce(咨询量明细表.缴费金额, 0)), else_=0)).label('实际收入'),
    ).filter(
        *filters
    ).group_by(
        咨询量明细表.咨询师,
        extract('month', 咨询量明细表.登记日期)
    ).all()
    
    # 构建返回数据结构
    result: dict[str, dict[int, ConsultantMonthStats]] = {}
    for row in 咨询师月度统计:
        咨询师 = row.咨询师
        月份 = int(row.月份)
        
        if 咨询师 not in result:
            result[咨询师] = {}
        
        result[咨询师][月份] = {
            "咨询总量": row.咨询总量 or 0,
            "上门量": int(row.上门量 or 0),
            "报名量": int(row.报名量 or 0),
            "订座量": int(row.订座量 or 0),
            "退费人数": int(row.退费人数 or 0),
            "电话量": int(row.电话量 or 0),
            "实际收入": float(row.实际收入 or 0),
        }
    
    return {
        "success": True,
        "data": {
            "年份": 年份,
            "神殿": 神殿,
            "数据类型": 数据类型,
            "咨询师数据": result
        }
    }
