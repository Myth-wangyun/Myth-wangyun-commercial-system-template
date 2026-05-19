"""
003神殿各咨询师数据汇总 V2 API
===================================
支持多Tab数据结构：
- Tab1: 神殿汇总（总表）
- Tab2: 网络媒体明细
- Tab3: 渠道明细  
- Tab4: 口碑明细

数据来源：
- 实际数据：consult.咨询量明细表_v2
- 计划数据：consult.咨询师月度计划数据（用户手动填写）

自动获取字段：咨询量、上门量、实际招生、实际收入、退费数
手动填写字段：计划收入、计划招生、咨询师职数
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import case, extract, func, or_, text
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....models.consult.consultation_record import 咨询量明细表
from .....models.user import User

router = APIRouter()


# ==================== 数据模型定义 ====================

class SourceStats(BaseModel):
    """来源统计基础模型"""
    实际收入: float = 0
    报名转化率: Optional[float] = None
    实际招生: int = 0
    上门率: Optional[float] = None
    上门量: int = 0
    咨询量: int = 0


class SummaryStats(BaseModel):
    """汇总统计（含计划字段）"""
    计划收入: float = 0
    实际收入: float = 0
    收入完成率: Optional[float] = None
    计划招生: int = 0
    实际招生: int = 0
    总转化率: Optional[float] = None
    退费数: int = 0
    上门量: int = 0
    上门率: Optional[float] = None
    咨询量: int = 0


class ConsultantRowData(BaseModel):
    """咨询师行数据"""
    月份: int
    神殿: str
    咨询师: str
    咨询师职数: int = 0
    
    # 总表用
    所有媒体来源: Optional[SummaryStats] = None
    
    # 网络明细用
    网络媒体: Optional[SummaryStats] = None
    SEM: Optional[SourceStats] = None
    新媒体: Optional[SourceStats] = None
    市场口碑: Optional[SourceStats] = None
    合作伙伴: Optional[SourceStats] = None
    免费推广: Optional[SourceStats] = None
    
    # 渠道明细用
    渠道平台: Optional[SummaryStats] = None
    渠道: Optional[SourceStats] = None
    
    # 口碑明细用
    口碑平台: Optional[SummaryStats] = None
    咨询口碑: Optional[SourceStats] = None
    教质口碑: Optional[SourceStats] = None
    学术口碑: Optional[SourceStats] = None
    校园口碑: Optional[SourceStats] = None
    其他口碑: Optional[SourceStats] = None


class MonthBlock(BaseModel):
    """月度数据块"""
    月份: int
    月汇总: ConsultantRowData
    咨询师数据: List[ConsultantRowData]


class TabResponse(BaseModel):
    """Tab数据响应"""
    tab_name: str
    神殿: str
    年份: int
    columns: List[Dict[str, Any]]  # 列定义
    月度数据: List[MonthBlock]


class FullPageResponse(BaseModel):
    """完整页面响应"""
    神殿: str
    年份: int
    神殿汇总: TabResponse
    网络媒体: TabResponse
    渠道: TabResponse
    口碑: TabResponse


CATEGORY_NAMES = (
    "SEM",
    "新媒体",
    "市场口碑",
    "合作伙伴",
    "免费推广",
    "渠道",
    "咨询口碑",
    "教质口碑",
    "学术口碑",
    "校园口碑",
    "其他口碑",
)


@dataclass
class RawMetrics:
    咨询量: int = 0
    上门量: int = 0
    实际招生: int = 0
    实际收入: float = 0.0
    退费数: int = 0


@dataclass
class SourceAccumulator:
    咨询量: int = 0
    上门量: int = 0
    实际招生: int = 0
    实际收入: float = 0.0


@dataclass
class SummaryAccumulator:
    咨询量: int = 0
    上门量: int = 0
    实际招生: int = 0
    实际收入: float = 0.0
    退费数: int = 0
    计划收入: float = 0.0
    计划招生: int = 0
    咨询师职数: int = 0
    分类: dict[str, SourceAccumulator] = field(
        default_factory=lambda: {name: SourceAccumulator() for name in CATEGORY_NAMES}
    )


@dataclass
class PlanAccumulator:
    计划收入: float = 0.0
    计划招生: int = 0
    咨询师职数: int = 0


def add_raw_metrics(target: SummaryAccumulator, stats: RawMetrics) -> None:
    target.咨询量 += stats.咨询量
    target.上门量 += stats.上门量
    target.实际招生 += stats.实际招生
    target.实际收入 += stats.实际收入
    target.退费数 += stats.退费数


def add_source_metrics(target: SourceAccumulator, stats: RawMetrics) -> None:
    target.咨询量 += stats.咨询量
    target.上门量 += stats.上门量
    target.实际招生 += stats.实际招生
    target.实际收入 += stats.实际收入


# ==================== 来源映射配置 ====================

# 网络媒体分类
NETWORK_SOURCE_MAPPING = {
    'SEM': ['百度推广', '百度表单', '中心来电', '在线报名/网站留言', '直接上门',
            '百度', 'TQ', '表单', '常规SEM平台'],
    '新媒体': ['抖音', '快手', '微信视频号', 'B站', '小红书', '腾讯视频号', '视频号', 
              '抖音企业号', '快手主页', '公众号', '美团', '大众点评'],
    '市场口碑': ['市场口碑'],
    '合作伙伴': ['百教网', '91搜客', '知了好学', '坦途网', '厚学网', '合作伙伴', '网络合作伙伴'],
    '免费推广': ['免费推广', '诸神殿', '58同城', '社交化媒体', '问答', '分类信息', '地图', '视频'],
}

# 口碑子分类
KOUBEI_SOURCE_MAPPING = {
    '咨询口碑': ['咨询口碑'],
    '教质口碑': ['教质口碑'],
    '学术口碑': ['学术口碑'],
    '校园口碑': ['校园口碑'],
    '其他口碑': ['其他口碑', '总部口碑'],
}


def classify_network_source(media_source: str) -> str:
    """分类网络媒体来源"""
    for category, keywords in NETWORK_SOURCE_MAPPING.items():
        if any(kw in (media_source or '') for kw in keywords):
            return category
    return '新媒体'  # 默认归入新媒体


def classify_koubei_source(media_source: str) -> str:
    """分类口碑来源"""
    for category, keywords in KOUBEI_SOURCE_MAPPING.items():
        if any(kw in (media_source or '') for kw in keywords):
            return category
    return '其他口碑'  # 默认归入其他


# ==================== 列定义 ====================

def get_summary_columns():
    """神殿汇总列定义"""
    return [
        {"key": "月份", "title": "月份", "width": 60, "fixed": "left"},
        {"key": "神殿", "title": "神殿", "width": 80},
        {"key": "咨询师职数", "title": "咨询师职数", "width": 90, "editable": True},
        {"key": "所有媒体来源", "title": "所有媒体来源", "children": [
            {"key": "计划收入", "title": "计划收入", "width": 100, "editable": True},
            {"key": "实际收入", "title": "实际收入", "width": 100},
            {"key": "收入完成率", "title": "收入完成率", "width": 90},
            {"key": "计划招生", "title": "计划招生", "width": 80, "editable": True},
            {"key": "实际招生", "title": "实际招生", "width": 80},
            {"key": "总转化率", "title": "总转化率", "width": 80},
            {"key": "退费数", "title": "退费数", "width": 70},
            {"key": "上门总量", "title": "上门总量", "width": 80},
            {"key": "上门率", "title": "上门率", "width": 70},
            {"key": "咨询总量", "title": "咨询总量", "width": 80},
        ]}
    ]


def get_network_columns():
    """网络媒体列定义"""
    source_children = [
        {"key": "实际收入", "title": "实际收入", "width": 90},
        {"key": "报名转化率", "title": "报名转化率", "width": 90},
        {"key": "实际招生", "title": "实际招生", "width": 80},
        {"key": "上门率", "title": "上门率", "width": 70},
        {"key": "上门量", "title": "上门量", "width": 70},
        {"key": "咨询量", "title": "咨询量", "width": 70},
    ]
    return [
        {"key": "月份", "title": "月份", "width": 60, "fixed": "left"},
        {"key": "神殿", "title": "神殿", "width": 80},
        {"key": "咨询师职数", "title": "咨询师职数", "width": 90},
        {"key": "网络媒体", "title": "网络媒体", "children": [
            {"key": "计划收入", "title": "计划收入", "width": 100, "editable": True},
            {"key": "实际收入", "title": "实际收入", "width": 100},
            {"key": "收入完成率", "title": "收入完成率", "width": 90},
            {"key": "计划招生", "title": "计划招生", "width": 80, "editable": True},
            {"key": "实际招生", "title": "实际招生", "width": 80},
            {"key": "总转化率", "title": "总转化率", "width": 80},
            {"key": "退费数", "title": "退费数", "width": 70},
            {"key": "上门量", "title": "上门量", "width": 80},
            {"key": "上门率", "title": "上门率", "width": 70},
            {"key": "咨询量", "title": "咨询量", "width": 80},
        ]},
        {"key": "SEM", "title": "SEM", "children": source_children.copy()},
        {"key": "新媒体", "title": "新媒体", "children": source_children.copy()},
        {"key": "市场口碑", "title": "市场口碑", "children": source_children.copy()},
        {"key": "合作伙伴", "title": "合作伙伴", "children": source_children.copy()},
        {"key": "免费推广", "title": "免费推广", "children": source_children.copy()},
    ]


def get_channel_columns():
    """渠道列定义"""
    source_children = [
        {"key": "实际收入", "title": "实际收入", "width": 90},
        {"key": "报名转化率", "title": "报名转化率", "width": 90},
        {"key": "实际招生", "title": "实际招生", "width": 80},
        {"key": "上门率", "title": "上门率", "width": 70},
        {"key": "上门量", "title": "上门量", "width": 70},
        {"key": "咨询量", "title": "咨询量", "width": 70},
    ]
    return [
        {"key": "月份", "title": "月份", "width": 60, "fixed": "left"},
        {"key": "神殿", "title": "神殿", "width": 80},
        {"key": "咨询师职数", "title": "咨询师职数", "width": 90},
        {"key": "渠道平台", "title": "渠道平台", "children": [
            {"key": "计划收入", "title": "计划收入", "width": 100, "editable": True},
            {"key": "实际收入", "title": "实际收入", "width": 100},
            {"key": "收入完成率", "title": "收入完成率", "width": 90},
            {"key": "计划招生", "title": "计划招生", "width": 80, "editable": True},
            {"key": "实际招生", "title": "实际招生", "width": 80},
            {"key": "总转化率", "title": "总转化率", "width": 80},
            {"key": "退费数", "title": "退费数", "width": 70},
            {"key": "上门量", "title": "上门量", "width": 80},
            {"key": "上门率", "title": "上门率", "width": 70},
            {"key": "咨询量", "title": "咨询量", "width": 80},
        ]},
        {"key": "渠道", "title": "渠道", "children": source_children.copy()},
    ]


def get_koubei_columns():
    """口碑列定义"""
    source_children = [
        {"key": "实际收入", "title": "实际收入", "width": 90},
        {"key": "报名转化率", "title": "报名转化率", "width": 90},
        {"key": "实际招生", "title": "实际招生", "width": 80},
        {"key": "上门率", "title": "上门率", "width": 70},
        {"key": "上门量", "title": "上门量", "width": 70},
        {"key": "咨询量", "title": "咨询量", "width": 70},
    ]
    return [
        {"key": "月份", "title": "月份", "width": 60, "fixed": "left"},
        {"key": "神殿", "title": "神殿", "width": 80},
        {"key": "咨询师职数", "title": "咨询师职数", "width": 90},
        {"key": "口碑平台", "title": "口碑平台", "children": [
            {"key": "计划收入", "title": "计划收入", "width": 100, "editable": True},
            {"key": "实际收入", "title": "实际收入", "width": 100},
            {"key": "收入完成率", "title": "收入完成率", "width": 90},
            {"key": "计划招生", "title": "计划招生", "width": 80, "editable": True},
            {"key": "实际招生", "title": "实际招生", "width": 80},
            {"key": "总转化率", "title": "总转化率", "width": 80},
            {"key": "退费数", "title": "退费数", "width": 70},
            {"key": "上门量", "title": "上门量", "width": 80},
            {"key": "上门率", "title": "上门率", "width": 70},
            {"key": "咨询量", "title": "咨询量", "width": 80},
        ]},
        {"key": "咨询口碑", "title": "咨询口碑", "children": source_children.copy()},
        {"key": "教质口碑", "title": "教质口碑", "children": source_children.copy()},
        {"key": "学术口碑", "title": "学术口碑", "children": source_children.copy()},
        {"key": "校园口碑", "title": "校园口碑", "children": source_children.copy()},
        {"key": "其他口碑", "title": "其他口碑（总部）", "children": source_children.copy()},
    ]


# ==================== 数据聚合函数 ====================

RawDataMap = dict[tuple[str, int, str, str], RawMetrics]
PlanDataMap = dict[tuple[str, int], PlanAccumulator]


def aggregate_raw_data(db: Session, campus: str, year: int) -> RawDataMap:
    """
    从数据库聚合原始数据
    返回: { (咨询师, 月份, 量来源, 媒体来源): RawMetrics }
    """
    query = db.query(
        咨询量明细表.咨询师,
        extract('month', 咨询量明细表.登记日期).label('月份'),
        咨询量明细表.量来源,
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label('咨询量'),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label('上门量'),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label('实际招生'),
        func.sum(case((咨询量明细表.是否报名 == 1, 咨询量明细表.缴费金额), else_=0)).label('实际收入'),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label('退费数'),
    ).filter(
        extract('year', 咨询量明细表.登记日期) == year,
        咨询量明细表.神殿 == campus,
        咨询量明细表.是否无效量 == 0,
    ).group_by(
        咨询量明细表.咨询师,
        extract('month', 咨询量明细表.登记日期),
        咨询量明细表.量来源,
        咨询量明细表.媒体来源,
    )

    result: RawDataMap = {}
    for row in query.all():
        key = (
            row.咨询师 or '未分配',
            int(row.月份),
            row.量来源 or '',
            row.媒体来源 or '',
        )
        result[key] = RawMetrics(
            咨询量=int(row.咨询量 or 0),
            上门量=int(row.上门量 or 0),
            实际招生=int(row.实际招生 or 0),
            实际收入=float(row.实际收入 or 0),
            退费数=int(row.退费数 or 0),
        )
    return result


def get_plan_data(db: Session, campus: str, year: int) -> PlanDataMap:
    """
    获取计划数据
    返回: { (咨询师, 月份): PlanAccumulator }
    """
    try:
        sql = text("""
            SELECT 
                咨询师, 月份, 
                COALESCE(计划收入, 0) as 计划收入,
                COALESCE(计划招生, 0) as 计划招生,
                COALESCE(咨询师职数, 0) as 咨询师职数
            FROM consult.咨询师月度计划数据
            WHERE 神殿 = :campus AND 年份 = :year
        """)
        rows = db.execute(sql, {"campus": campus, "year": year}).fetchall()
        return {
            (row.咨询师, row.月份): PlanAccumulator(
                计划收入=float(row.计划收入 or 0),
                计划招生=int(row.计划招生 or 0),
                咨询师职数=int(row.咨询师职数 or 0),
            )
            for row in rows
        }
    except Exception:
        return {}


def _get_consultant_count(
    db: Session,
    campus: str,
    year: int | None = None,
    month: int | None = None,
) -> int:
    """
    获取指定神殿指定月份的咨询师职数。
    优先从 consult.咨询师月度归属记录 查询（支持调动历史）。
    若无记录则自动从 public.users 生成快照。
    如果未传 year/month，则直接从 public.users 实时查询。
    """
    if year is not None and month is not None:
        from .consultant_assignment import get_monthly_headcount

        result = get_monthly_headcount(db, campus, year, month, auto_snapshot=True)
        return int(result["咨询师职数"])

    users = db.query(User.real_name, User.position).filter(
        User.department == "祈福司",
        User.status == "ACTIVE",
        User.campus.like(f"%{campus.replace('神殿', '').strip()}%"),
    ).all()

    count = 0
    for name, position in users:
        if not name:
            continue
        if position and any(kw in position for kw in ["校长", "经理", "主管"]):
            continue
        count += 1
    return count


def calculate_rates(
    *,
    咨询量: int,
    上门量: int,
    实际招生: int,
    实际收入: float,
    计划收入: float = 0.0,
) -> dict[str, float | None]:
    """计算各种转化率"""
    return {
        '总转化率': round(实际招生 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        '上门率': round(上门量 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        '报名转化率': round(实际招生 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        '收入完成率': round(实际收入 / 计划收入 * 100, 1) if 计划收入 > 0 else None,
        '当面转化率': round(实际招生 / 上门量 * 100, 1) if 上门量 > 0 else None,
    }


def build_source_stats(data: SourceAccumulator, calc_rates: bool = True) -> SourceStats:
    """构建来源统计对象"""
    stats = SourceStats(
        实际收入=data.实际收入,
        实际招生=data.实际招生,
        上门量=data.上门量,
        咨询量=data.咨询量,
    )
    if calc_rates:
        rates = calculate_rates(
            咨询量=data.咨询量,
            上门量=data.上门量,
            实际招生=data.实际招生,
            实际收入=data.实际收入,
        )
        stats.报名转化率 = rates['报名转化率']
        stats.上门率 = rates['上门率']
    return stats


def build_summary_stats(data: SummaryAccumulator) -> SummaryStats:
    """构建汇总统计对象"""
    rates = calculate_rates(
        咨询量=data.咨询量,
        上门量=data.上门量,
        实际招生=data.实际招生,
        实际收入=data.实际收入,
        计划收入=data.计划收入,
    )
    return SummaryStats(
        计划收入=data.计划收入,
        实际收入=data.实际收入,
        收入完成率=rates['收入完成率'],
        计划招生=data.计划招生,
        实际招生=data.实际招生,
        总转化率=rates['总转化率'],
        退费数=data.退费数,
        上门量=data.上门量,
        上门率=rates['上门率'],
        咨询量=data.咨询量,
    )


def populate_tab_row(tab_name: str, row: ConsultantRowData, data: SummaryAccumulator) -> None:
    """根据 Tab 类型填充统计字段。"""
    if tab_name == '神殿汇总':
        row.所有媒体来源 = build_summary_stats(data)
    elif tab_name == '网络媒体':
        row.网络媒体 = build_summary_stats(data)
        row.SEM = build_source_stats(data.分类['SEM'])
        row.新媒体 = build_source_stats(data.分类['新媒体'])
        row.市场口碑 = build_source_stats(data.分类['市场口碑'])
        row.合作伙伴 = build_source_stats(data.分类['合作伙伴'])
        row.免费推广 = build_source_stats(data.分类['免费推广'])
    elif tab_name == '渠道':
        row.渠道平台 = build_summary_stats(data)
        row.渠道 = build_source_stats(data.分类['渠道'])
    elif tab_name == '口碑':
        row.口碑平台 = build_summary_stats(data)
        row.咨询口碑 = build_source_stats(data.分类['咨询口碑'])
        row.教质口碑 = build_source_stats(data.分类['教质口碑'])
        row.学术口碑 = build_source_stats(data.分类['学术口碑'])
        row.校园口碑 = build_source_stats(data.分类['校园口碑'])
        row.其他口碑 = build_source_stats(data.分类['其他口碑'])


# ==================== API 端点 ====================

@router.get("/full-data")
async def get_full_page_data(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FullPageResponse:
    """
    获取003页面完整数据（4个Tab）
    
    - Tab1: 神殿汇总 - 所有媒体来源
    - Tab2: 网络媒体 - SEM/新媒体/市场口碑/合作伙伴/免费推广
    - Tab3: 渠道 - 渠道平台/渠道
    - Tab4: 口碑 - 口碑平台/各口碑分类
    """
    # 1. 聚合原始数据
    raw_data = aggregate_raw_data(db, campus, year)
    plan_data = get_plan_data(db, campus, year)
    
    # 1.5 预加载各月咨询师职数（从归属记录表，支持调动）
    monthly_headcount: dict[int, int] = {}
    for m in range(1, 13):
        monthly_headcount[m] = _get_consultant_count(db, campus, year, m)
    
    # 2. 获取所有咨询师和月份
    consultants = sorted(set(k[0] for k in raw_data.keys()))
    months = sorted(set(k[1] for k in raw_data.keys()))
    if not months:
        months = list(range(1, 13))
    
    # 3. 构建各Tab数据
    def build_tab_data(
        tab_name: str,
        columns: List[Dict[str, Any]],
        source_filter: str | None = None,
    ) -> TabResponse:
        月度数据: list[MonthBlock] = []

        for month in months:
            consultant_rows: list[ConsultantRowData] = []
            month_totals = SummaryAccumulator()

            for consultant in consultants:
                row_data = SummaryAccumulator()

                for (c, m, source, media), stats in raw_data.items():
                    if c != consultant or m != month:
                        continue

                    if source_filter == 'network' and source != '网络':
                        continue
                    if source_filter == 'channel' and source != '渠道':
                        continue
                    if source_filter == 'koubei' and source != '口碑':
                        continue

                    add_raw_metrics(row_data, stats)
                    add_raw_metrics(month_totals, stats)

                    if source == '网络':
                        category = classify_network_source(media)
                        add_source_metrics(row_data.分类[category], stats)
                        add_source_metrics(month_totals.分类[category], stats)
                    elif source == '渠道':
                        add_source_metrics(row_data.分类['渠道'], stats)
                        add_source_metrics(month_totals.分类['渠道'], stats)
                    elif source == '口碑':
                        category = classify_koubei_source(media)
                        add_source_metrics(row_data.分类[category], stats)
                        add_source_metrics(month_totals.分类[category], stats)

                plan = plan_data.get((consultant, month))
                if plan is not None:
                    row_data.计划收入 = plan.计划收入
                    row_data.计划招生 = plan.计划招生
                    row_data.咨询师职数 = plan.咨询师职数

                month_totals.计划收入 += row_data.计划收入
                month_totals.计划招生 += row_data.计划招生

                consultant_row = ConsultantRowData(
                    月份=month,
                    神殿=campus,
                    咨询师=consultant,
                    咨询师职数=row_data.咨询师职数,
                )
                populate_tab_row(tab_name, consultant_row, row_data)

                if row_data.咨询量 > 0:
                    consultant_rows.append(consultant_row)

            month_summary = ConsultantRowData(
                月份=month,
                神殿=campus,
                咨询师='合计',
                咨询师职数=monthly_headcount.get(month, 0),
            )
            populate_tab_row(tab_name, month_summary, month_totals)

            月度数据.append(MonthBlock(
                月份=month,
                月汇总=month_summary,
                咨询师数据=consultant_rows,
            ))

        return TabResponse(
            tab_name=tab_name,
            神殿=campus,
            年份=year,
            columns=columns,
            月度数据=月度数据,
        )
    
    return FullPageResponse(
        神殿=campus,
        年份=year,
        神殿汇总=build_tab_data('神殿汇总', get_summary_columns()),
        网络媒体=build_tab_data('网络媒体', get_network_columns(), 'network'),
        渠道=build_tab_data('渠道', get_channel_columns(), 'channel'),
        口碑=build_tab_data('口碑', get_koubei_columns(), 'koubei'),
    )


@router.get("/tab/{tab_name}")
async def get_single_tab_data(
    tab_name: str,
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TabResponse:
    """
    获取单个Tab数据
    
    tab_name: summary | network | channel | koubei
    """
    full_data = await get_full_page_data(year, campus, db, current_user)
    
    tab_map = {
        'summary': full_data.神殿汇总,
        '神殿汇总': full_data.神殿汇总,
        'network': full_data.网络媒体,
        '网络媒体': full_data.网络媒体,
        'channel': full_data.渠道,
        '渠道': full_data.渠道,
        'koubei': full_data.口碑,
        '口碑': full_data.口碑,
    }
    
    if tab_name not in tab_map:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"无效的tab名称: {tab_name}")
    
    return tab_map[tab_name]


@router.post("/save-plan")
async def save_plan_data(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    保存计划数据（用户手动填写的字段）
    
    data: {
        campus: str,
        year: int,
        month: int,
        consultant: str,
        plan_income: float,
        plan_enrollment: int,
        staff_count: int
    }
    """
    try:
        campus = data['campus']
        year = data['year']
        month = data['month']
        consultant = data['consultant']
        
        # 检查是否存在记录
        check_sql = text("""
            SELECT COUNT(*) FROM consult.咨询师月度计划数据
            WHERE 神殿 = :campus AND 年份 = :year AND 月份 = :month AND 咨询师 = :consultant
        """)
        count = int(db.execute(check_sql, {
            "campus": campus, "year": year, "month": month, "consultant": consultant
        }).scalar() or 0)
        
        if count > 0:
            # 更新
            update_sql = text("""
                UPDATE consult.咨询师月度计划数据
                SET 计划收入 = :plan_income,
                    计划招生 = :plan_enrollment,
                    咨询师职数 = :staff_count,
                    更新时间 = NOW()
                WHERE 神殿 = :campus AND 年份 = :year AND 月份 = :month AND 咨询师 = :consultant
            """)
        else:
            # 插入
            update_sql = text("""
                INSERT INTO consult.咨询师月度计划数据 
                (神殿, 年份, 月份, 咨询师, 计划收入, 计划招生, 咨询师职数, 创建时间, 更新时间)
                VALUES (:campus, :year, :month, :consultant, :plan_income, :plan_enrollment, :staff_count, NOW(), NOW())
            """)
        
        db.execute(update_sql, {
            "campus": campus,
            "year": year,
            "month": month,
            "consultant": consultant,
            "plan_income": data.get('plan_income', 0),
            "plan_enrollment": data.get('plan_enrollment', 0),
            "staff_count": data.get('staff_count', 0),
        })
        db.commit()
        
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": str(e)}


@router.get("/consultants")
async def get_consultant_list(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[str]:
    """获取神殿咨询师列表（从 public.users 表获取祈福司员工，排除分析规划师助理）"""
    from app.models.user import UserStatus
    
    # 标准化神殿名称用于模糊匹配
    campus_base = campus.replace("神殿", "").strip()
    for province in ["河北", "山西", "广西", "贵州", "山东", "河南", "湖北"]:
        campus_base = campus_base.replace(province, "")
    campus_base = campus_base.strip()
    
    query = db.query(User.real_name).filter(
        User.status == UserStatus.ACTIVE,
        User.department == "祈福司",
        or_(User.position.is_(None), User.position != '分析规划师助理'),
        User.campus.like(f"%{campus_base}%"),
    ).distinct()
    
    return sorted([r[0] for r in query.all() if r[0]])
