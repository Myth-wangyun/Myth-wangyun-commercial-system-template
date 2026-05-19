"""
003神殿各咨询师数据汇总 V3 API
===================================
严格按照标准模板输出三个看板：
  TAB1 - 年度核心数据汇总：月份 | 神殿 | 咨询师职数 | 所有媒体来源(10列)，12月 + 合计
  TAB2 - 年度核心数据看板：序号 | 咨询师 | 职位 | 所有媒体来源(10列)，各咨询师 + 其他 + 合计
  TAB3 - 月度核心数据看板：月份 | 咨询师 | 咨询师职数 | 所有媒体来源(10列)，12月 × (咨询师 + 其他 + 合计)

数据来源：
- 实际数据：consult.咨询量明细表_v2
  - 实际收入 = SUM(缴费金额) WHERE 是否报名=1 OR 是否订座=1（含订座和报名缴费）
  - 实际招生 = COUNT(*) WHERE 是否报名=1
  - 退费数 = COUNT(*) WHERE 是否退费=1
  - 上门量 = COUNT(*) WHERE 是否上门=1
  - 咨询量 = COUNT(*) WHERE 是否无效量=0
  - 口碑平台 = 量来源="口碑" 的所有媒体来源总和（不含市场口碑，市场口碑在网络TAB中）
- 网络媒体分类：从 config.media_categories/media_sources/media_details 三级配置动态加载
  - 常规SEM平台 → SEM列, 新媒体平台 → 新媒体列, 网络合作伙伴 → 合作伙伴列, 市场口碑 → 市场口碑列, 免费推广 → 免费推广列
- 咨询师列表 & 职数：consult.咨询师月度归属记录（支持调动）
- 计划数据：consult.咨询师月度计划数据
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, case, extract, func, or_, text
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....models.consult.consultation_record import 咨询量明细表
from .....models.media_source_config import MediaCategory, MediaDetail, MediaSource
from .....models.user import User, UserStatus
from .consultant_assignment import get_monthly_headcount

router = APIRouter()


# ==================== 数据模型 ====================

class MediaStats(BaseModel):
    """所有媒体来源统计列"""
    计划收入: float = 0
    实际收入: float = 0
    收入完成率: Optional[float] = None
    计划招生: int = 0
    实际招生: int = 0
    总转化率: Optional[float] = None
    退费数: int = 0
    上门总量: int = 0
    上门率: Optional[float] = None
    咨询总量: int = 0


class SourceStats(BaseModel):
    """网络来源子类统计列"""
    实际收入: float = 0
    报名转化率: Optional[float] = None
    实际招生: int = 0
    上门率: Optional[float] = None
    上门量: int = 0
    咨询量: int = 0


class NetworkSummaryStats(BaseModel):
    """网络媒体汇总统计列"""
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


class Tab1Row(BaseModel):
    """TAB1 年度核心数据汇总 - 行"""
    月份: str
    神殿: str
    咨询师职数: int = 0
    所有媒体来源: MediaStats = Field(default_factory=MediaStats)


class Tab2NetworkRow(BaseModel):
    """TAB2 网络媒体核心数据汇总 - 行"""
    月份: str
    神殿: str
    咨询师职数: int = 0
    网络媒体: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    SEM: SourceStats = Field(default_factory=SourceStats)
    新媒体: SourceStats = Field(default_factory=SourceStats)
    市场口碑: SourceStats = Field(default_factory=SourceStats)
    合作伙伴: SourceStats = Field(default_factory=SourceStats)
    免费推广: SourceStats = Field(default_factory=SourceStats)


class Tab2NetworkAnnualRow(BaseModel):
    """TAB2 网络媒体年度核心数据看板 - 行"""
    序号: int | str = ""
    咨询师: str
    职位: str = ""
    网络媒体: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    SEM: SourceStats = Field(default_factory=SourceStats)
    新媒体: SourceStats = Field(default_factory=SourceStats)
    市场口碑: SourceStats = Field(default_factory=SourceStats)
    合作伙伴: SourceStats = Field(default_factory=SourceStats)
    免费推广: SourceStats = Field(default_factory=SourceStats)


class Tab2NetworkMonthlyRow(BaseModel):
    """TAB2 网络媒体月度核心数据看板 - 行"""
    月份: str
    咨询师: str
    咨询师职数: int | str = ""
    网络媒体: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    SEM: SourceStats = Field(default_factory=SourceStats)
    新媒体: SourceStats = Field(default_factory=SourceStats)
    市场口碑: SourceStats = Field(default_factory=SourceStats)
    合作伙伴: SourceStats = Field(default_factory=SourceStats)
    免费推广: SourceStats = Field(default_factory=SourceStats)


class Tab3ChannelSummaryRow(BaseModel):
    """TAB3 渠道核心数据汇总 - 行"""
    月份: str
    神殿: str
    咨询师职数: int = 0
    渠道平台: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    渠道: SourceStats = Field(default_factory=SourceStats)


class Tab3ChannelAnnualRow(BaseModel):
    """TAB3 渠道年度核心数据看板 - 行"""
    序号: int | str = ""
    咨询师: str
    职位: str = ""
    渠道平台: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    渠道: SourceStats = Field(default_factory=SourceStats)


class Tab3ChannelMonthlyRow(BaseModel):
    """TAB3 渠道月度核心数据看板 - 行"""
    月份: str
    咨询师: str
    咨询师职数: int | str = ""
    渠道平台: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    渠道: SourceStats = Field(default_factory=SourceStats)


class Tab4KoubeiSummaryRow(BaseModel):
    """TAB4 口碑核心数据汇总 - 行"""
    月份: str
    神殿: str
    咨询师职数: int = 0
    口碑平台: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    咨询口碑: SourceStats = Field(default_factory=SourceStats)
    教质口碑: SourceStats = Field(default_factory=SourceStats)
    学术口碑: SourceStats = Field(default_factory=SourceStats)
    校园口碑: SourceStats = Field(default_factory=SourceStats)
    其他口碑: SourceStats = Field(default_factory=SourceStats)


class Tab4KoubeiAnnualRow(BaseModel):
    """TAB4 口碑年度核心数据看板 - 行"""
    序号: int | str = ""
    咨询师: str
    职位: str = ""
    口碑平台: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    咨询口碑: SourceStats = Field(default_factory=SourceStats)
    教质口碑: SourceStats = Field(default_factory=SourceStats)
    学术口碑: SourceStats = Field(default_factory=SourceStats)
    校园口碑: SourceStats = Field(default_factory=SourceStats)
    其他口碑: SourceStats = Field(default_factory=SourceStats)


class Tab4KoubeiMonthlyRow(BaseModel):
    """TAB4 口碑月度核心数据看板 - 行"""
    月份: str
    咨询师: str
    咨询师职数: int | str = ""
    口碑平台: NetworkSummaryStats = Field(default_factory=NetworkSummaryStats)
    咨询口碑: SourceStats = Field(default_factory=SourceStats)
    教质口碑: SourceStats = Field(default_factory=SourceStats)
    学术口碑: SourceStats = Field(default_factory=SourceStats)
    校园口碑: SourceStats = Field(default_factory=SourceStats)
    其他口碑: SourceStats = Field(default_factory=SourceStats)


class Tab2Row(BaseModel):
    """TAB2 年度核心数据看板 - 行"""
    序号: int | str = ""
    咨询师: str
    职位: str = ""
    所有媒体来源: MediaStats = Field(default_factory=MediaStats)


class Tab3Row(BaseModel):
    """TAB3 月度核心数据看板 - 行"""
    月份: str = ""
    咨询师: str
    咨询师职数: int | str = ""
    所有媒体来源: MediaStats = Field(default_factory=MediaStats)


class FullV3Response(BaseModel):
    """完整响应"""
    神殿: str
    年份: int
    tab1_年度核心数据汇总: List[Tab1Row]
    tab2_网络媒体_核心数据汇总: List[Tab2NetworkRow]
    tab2_网络媒体_年度核心数据看板: List[Tab2NetworkAnnualRow]
    tab2_网络媒体_月度核心数据看板: List[Tab2NetworkMonthlyRow]
    tab3_渠道_核心数据汇总: List[Tab3ChannelSummaryRow]
    tab3_渠道_年度核心数据看板: List[Tab3ChannelAnnualRow]
    tab3_渠道_月度核心数据看板: List[Tab3ChannelMonthlyRow]
    tab4_口碑_核心数据汇总: List[Tab4KoubeiSummaryRow]
    tab4_口碑_年度核心数据看板: List[Tab4KoubeiAnnualRow]
    tab4_口碑_月度核心数据看板: List[Tab4KoubeiMonthlyRow]
    tab2_年度核心数据看板: List[Tab2Row]
    tab3_月度核心数据看板: List[Tab3Row]


# ==================== 内部工具 ====================

def _calc_rates(stats: dict) -> MediaStats:
    """根据原始统计量计算率指标并返回 MediaStats"""
    咨询量 = stats.get("咨询量", 0)
    上门量 = stats.get("上门量", 0)
    实际招生 = stats.get("实际招生", 0)
    实际收入 = float(stats.get("实际收入", 0))
    计划收入 = float(stats.get("计划收入", 0))
    计划招生 = int(stats.get("计划招生", 0))
    退费数 = int(stats.get("退费数", 0))

    return MediaStats(
        计划收入=计划收入,
        实际收入=实际收入,
        收入完成率=round(实际收入 / 计划收入 * 100, 1) if 计划收入 > 0 else None,
        计划招生=计划招生,
        实际招生=实际招生,
        总转化率=round(实际招生 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        退费数=退费数,
        上门总量=上门量,
        上门率=round(上门量 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        咨询总量=咨询量,
    )


def _calc_network_summary_stats(stats: dict) -> NetworkSummaryStats:
    """网络媒体汇总统计（含计划字段）"""
    咨询量 = stats.get("咨询量", 0)
    上门量 = stats.get("上门量", 0)
    实际招生 = stats.get("实际招生", 0)
    实际收入 = float(stats.get("实际收入", 0))
    计划收入 = float(stats.get("计划收入", 0))
    计划招生 = int(stats.get("计划招生", 0))
    退费数 = int(stats.get("退费数", 0))

    return NetworkSummaryStats(
        计划收入=计划收入,
        实际收入=实际收入,
        收入完成率=round(实际收入 / 计划收入 * 100, 1) if 计划收入 > 0 else None,
        计划招生=计划招生,
        实际招生=实际招生,
        总转化率=round(实际招生 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        退费数=退费数,
        上门量=上门量,
        上门率=round(上门量 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        咨询量=咨询量,
    )


def _calc_source_stats(stats: dict) -> SourceStats:
    """来源子类统计"""
    咨询量 = stats.get("咨询量", 0)
    上门量 = stats.get("上门量", 0)
    实际招生 = stats.get("实际招生", 0)
    实际收入 = float(stats.get("实际收入", 0))
    return SourceStats(
        实际收入=实际收入,
        报名转化率=round(实际招生 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        实际招生=实际招生,
        上门率=round(上门量 / 咨询量 * 100, 1) if 咨询量 > 0 else None,
        上门量=上门量,
        咨询量=咨询量,
    )


def _empty_bucket() -> dict:
    return {"咨询量": 0, "上门量": 0, "实际招生": 0, "实际收入": 0, "退费数": 0, "计划收入": 0, "计划招生": 0}


def _add_bucket(dst: dict, src: dict):
    for k in ("咨询量", "上门量", "实际招生", "实际收入", "退费数", "计划收入", "计划招生"):
        dst[k] = dst.get(k, 0) + src.get(k, 0)


def _campus_like_filter(column, campus: str):
    """
    神殿名称模糊匹配：前端传"主神殿"，DB存"河北主神殿"。
    去掉"神殿"后缀，用 LIKE %核心名% 匹配。
    """
    core_name = campus.replace("神殿", "").strip()
    return column.like(f"%{core_name}%")


def _empty_source_bucket() -> dict:
    return {"咨询量": 0, "上门量": 0, "实际招生": 0, "实际收入": 0}


# 网络媒体分类 — 从 config DB 动态加载
# config L2 名称 → 前端列名的映射
_L2_TO_COLUMN = {
    "常规SEM平台": "SEM",
    "SEM平台": "SEM",
    "新媒体平台": "新媒体",
    "网络合作伙伴": "合作伙伴",
    "市场口碑": "市场口碑",
    "免费推广": "免费推广",
}

# 前端5列名称（用于 fallback）
NETWORK_CATEGORIES = ["SEM", "新媒体", "市场口碑", "合作伙伴", "免费推广"]


def _get_user_consultants(db: Session, campus: str) -> List[str]:
    """Get consultants from public.users by department/position filters."""
    campus_base = campus.replace("神殿", "").strip()
    for province in ["河北", "山西", "广西", "贵州", "山东", "河南", "湖北"]:
        campus_base = campus_base.replace(province, "")
    campus_base = campus_base.strip()

    query = db.query(User.real_name).filter(
        User.status == UserStatus.ACTIVE,
        User.department == "祈福司",
        or_(User.position.is_(None), User.position != "分析规划师助理"),
        User.campus.like(f"%{campus_base}%"),
        User.real_name.isnot(None),
        User.real_name != "",
    ).distinct()

    return sorted([r[0] for r in query.all()])


def _load_network_classify_map(db: Session) -> Dict[str, str]:
    """
    从 config.media_categories/sources/details 动态加载网络媒体分类映射。
    返回: { 细分媒体名(L3): 前端列名 } 如 {"百度推广": "SEM", "抖音": "新媒体", ...}
    同时包含 L2 名称本身的映射，以便匹配直接用 L2 名称作为 媒体来源 的记录。
    """
    # 找到 量来源="网络" 的 category
    cat = db.query(MediaCategory).filter(
        MediaCategory.name == "网络",
        MediaCategory.is_active.is_(True),
    ).first()
    if not cat:
        return {}

    # 加载该 category 下所有 L2 media_sources
    sources = db.query(MediaSource).filter(
        MediaSource.media_category_id == cat.id,
        MediaSource.is_active.is_(True),
    ).all()

    source_ids = [s.id for s in sources]
    # 加载所有 L3 details
    details = db.query(MediaDetail).filter(
        MediaDetail.media_source_id.in_(source_ids),
        MediaDetail.is_active.is_(True),
    ).all() if source_ids else []

    # 建立 source_id → 前端列名 映射
    sid_to_col: Dict[int, str] = {}
    for s in sources:
        col = _L2_TO_COLUMN.get(s.name, s.name)
        sid_to_col[s.id] = col

    # 细分媒体名 → 前端列名
    result: Dict[str, str] = {}
    for d in details:
        col = sid_to_col.get(d.media_source_id, "新媒体")
        result[d.name] = col

    # 也把 L2 名称本身加入（处理 媒体来源 直接存 L2 名称的情况，如 "市场口碑"）
    for s in sources:
        col = _L2_TO_COLUMN.get(s.name, s.name)
        result[s.name] = col

    return result

# 口碑子分类（学术口碑/教学口碑都归为学术口碑列）
KOUBEI_SOURCE_MAPPING = {
    "咨询口碑": ["咨询口碑"],
    "教质口碑": ["教质口碑"],
    "学术口碑": ["学术口碑", "教学口碑"],
    "校园口碑": ["校园口碑"],
    "其他口碑": ["其他口碑", "总部口碑"],
}


def classify_network_source(media_source: str, classify_map: Dict[str, str] | None = None) -> str:
    """
    分类网络媒体来源（按 config DB 的 量来源→媒体来源→细分媒体 三级配置）。
    classify_map: 由 _load_network_classify_map() 生成的 {细分媒体名: 前端列名} 映射。
    """
    if not media_source:
        return "新媒体"
    if classify_map:
        return classify_map.get(media_source, "新媒体")
    # fallback: 无映射时返回默认
    return "新媒体"


def classify_koubei_source(media_source: str) -> str:
    """分类口碑来源"""
    for category, keywords in KOUBEI_SOURCE_MAPPING.items():
        if any(kw in (media_source or "") for kw in keywords):
            return category
    return "其他口碑"


def _aggregate_network_raw(db: Session, campus: str, year: int) -> Dict:
    """
    聚合网络媒体数据（按月份+媒体来源）。
    包含 量来源=网络 的所有记录，以及 量来源=口碑 AND 媒体来源=市场口碑 的记录。
    返回: { (月份, 媒体来源): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        extract("month", 咨询量明细表.登记日期).label("月份"),
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
        # 网络媒体：量来源=网络，或者 量来源=口碑+媒体来源=市场口碑（历史数据兼容）
        or_(
            咨询量明细表.量来源 == "网络",
            and_(咨询量明细表.量来源 == "口碑", 咨询量明细表.媒体来源 == "市场口碑"),
        ),
    ).group_by(
        extract("month", 咨询量明细表.登记日期),
        咨询量明细表.媒体来源,
    )

    result: Dict = {}
    for row in query.all():
        key = (int(row.月份), row.媒体来源 or "")
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _aggregate_network_raw_by_consultant(db: Session, campus: str, year: int) -> Dict:
    """
    聚合网络媒体数据（按咨询师+月份+媒体来源）。
    包含 量来源=网络 的所有记录，以及 量来源=口碑 AND 媒体来源=市场口碑 的记录。
    返回: { (咨询师, 月份, 媒体来源): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期).label("月份"),
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
        # 网络媒体：量来源=网络，或者 量来源=口碑+媒体来源=市场口碑（历史数据兼容）
        or_(
            咨询量明细表.量来源 == "网络",
            and_(咨询量明细表.量来源 == "口碑", 咨询量明细表.媒体来源 == "市场口碑"),
        ),
    ).group_by(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期),
        咨询量明细表.媒体来源,
    )

    result: Dict = {}
    for row in query.all():
        key = (row.咨询师 or "未分配", int(row.月份), row.媒体来源 or "")
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _aggregate_channel_raw(db: Session, campus: str, year: int) -> Dict:
    """
    聚合渠道数据（按月份）。
    返回: { (月份): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        extract("month", 咨询量明细表.登记日期).label("月份"),
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
        咨询量明细表.量来源 == "渠道",
    ).group_by(
        extract("month", 咨询量明细表.登记日期),
    )

    result: Dict = {}
    for row in query.all():
        key = int(row.月份)
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _aggregate_channel_raw_by_consultant(db: Session, campus: str, year: int) -> Dict:
    """
    聚合渠道数据（按咨询师+月份）。
    返回: { (咨询师, 月份): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期).label("月份"),
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
        咨询量明细表.量来源 == "渠道",
    ).group_by(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期),
    )

    result: Dict = {}
    for row in query.all():
        key = (row.咨询师 or "未分配", int(row.月份))
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _aggregate_koubei_raw(db: Session, campus: str, year: int) -> Dict:
    """
    聚合口碑数据（按月份+媒体来源），排除市场口碑。
    返回: { (月份, 媒体来源): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        extract("month", 咨询量明细表.登记日期).label("月份"),
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
        咨询量明细表.量来源 == "口碑",
        咨询量明细表.媒体来源 != "市场口碑",
    ).group_by(
        extract("month", 咨询量明细表.登记日期),
        咨询量明细表.媒体来源,
    )

    result: Dict = {}
    for row in query.all():
        key = (int(row.月份), row.媒体来源 or "")
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _aggregate_koubei_raw_by_consultant(db: Session, campus: str, year: int) -> Dict:
    """
    聚合口碑数据（按咨询师+月份+媒体来源），排除市场口碑。
    返回: { (咨询师, 月份, 媒体来源): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期).label("月份"),
        咨询量明细表.媒体来源,
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
        咨询量明细表.量来源 == "口碑",
        咨询量明细表.媒体来源 != "市场口碑",
    ).group_by(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期),
        咨询量明细表.媒体来源,
    )

    result: Dict = {}
    for row in query.all():
        key = (row.咨询师 or "未分配", int(row.月份), row.媒体来源 or "")
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _aggregate_raw(db: Session, campus: str, year: int) -> Dict:
    """
    从 consult.咨询量明细表_v2 聚合数据。
    返回: { (咨询师, 月份): {咨询量, 上门量, 实际招生, 实际收入, 退费数} }
    """
    query = db.query(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期).label("月份"),
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.sum(case((咨询量明细表.是否上门 == 1, 1), else_=0)).label("上门量"),
        func.sum(case((咨询量明细表.是否报名 == 1, 1), else_=0)).label("实际招生"),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), 咨询量明细表.缴费金额), else_=0)).label("实际收入"),
        func.sum(case((咨询量明细表.是否退费 == 1, 1), else_=0)).label("退费数"),
    ).filter(
        extract("year", 咨询量明细表.登记日期) == year,
        _campus_like_filter(咨询量明细表.神殿, campus),
        咨询量明细表.是否无效量 == 0,
    ).group_by(
        咨询量明细表.咨询师,
        extract("month", 咨询量明细表.登记日期),
    )

    result: Dict = {}
    for row in query.all():
        key = (row.咨询师 or "未分配", int(row.月份))
        result[key] = {
            "咨询量": int(row.咨询量 or 0),
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费数": int(row.退费数 or 0),
        }
    return result


def _get_plan_data(db: Session, campus: str, year: int) -> Dict:
    """获取计划数据（所有数据类型合计）: { (咨询师, 月份): {计划收入, 计划招生} }"""
    try:
        sql = text("""
            SELECT 咨询师, 月份, 
                   COALESCE(SUM(计划收入), 0) as 计划收入,
                   COALESCE(SUM(计划招生), 0) as 计划招生
            FROM consult.咨询师月度计划数据
            WHERE 神殿 = :campus AND 年份 = :year
            GROUP BY 咨询师, 月份
        """)
        rows = db.execute(sql, {"campus": campus, "year": year}).fetchall()
        return {
            (row.咨询师, row.月份): {
                "计划收入": float(row.计划收入 or 0),
                "计划招生": int(row.计划招生 or 0),
            }
            for row in rows
        }
    except Exception:
        return {}


def _get_plan_data_by_type(db: Session, campus: str, year: int, data_type: str) -> Dict:
    """获取指定数据类型的计划数据: { (咨询师, 月份): {计划收入, 计划招生} }"""
    try:
        sql = text("""
            SELECT 咨询师, 月份, 
                   COALESCE(计划收入, 0) as 计划收入,
                   COALESCE(计划招生, 0) as 计划招生
            FROM consult.咨询师月度计划数据
            WHERE 神殿 = :campus AND 年份 = :year AND 数据类型 = :data_type
        """)
        rows = db.execute(sql, {"campus": campus, "year": year, "data_type": data_type}).fetchall()
        return {
            (row.咨询师, row.月份): {
                "计划收入": float(row.计划收入 or 0),
                "计划招生": int(row.计划招生 or 0),
            }
            for row in rows
        }
    except Exception:
        return {}


def _get_subtable1_plan_data(db: Session, campus: str, year: int, data_type: str) -> Dict:
    """获取子表1（神殿月度汇总）的计划数据: { 月份: {计划收入, 计划招生} }
    从 consult.神殿月度财务数据 读取（与007 TAB2同源）"""
    try:
        sql = text("""
            SELECT 月份, 
                   COALESCE(计划收入, 0) as 计划收入,
                   COALESCE(计划招生, 0) as 计划招生
            FROM consult.神殿月度财务数据
            WHERE 神殿 = :campus AND 年份 = :year AND 数据类型 = :data_type
        """)
        rows = db.execute(sql, {"campus": campus, "year": year, "data_type": data_type}).fetchall()
        return {
            row.月份: {
                "计划收入": float(row.计划收入 or 0),
                "计划招生": int(row.计划招生 or 0),
            }
            for row in rows
        }
    except Exception:
        return {}


def _sync_to_financial(db: Session, campus: str, year: int, month: int, data_type: str, plan_income: float, plan_enrollment: int):
    """将子表1计划数据同步到007 TAB2的 consult.神殿月度财务数据"""
    try:
        check_sql = text("""
            SELECT COUNT(*) FROM consult.神殿月度财务数据
            WHERE 神殿 = :campus AND 年份 = :year AND 月份 = :month AND 数据类型 = :data_type
        """)
        count = db.execute(check_sql, {
            "campus": campus, "year": year, "month": month, "data_type": data_type
        }).scalar() or 0

        if count > 0:
            update_sql = text("""
                UPDATE consult.神殿月度财务数据
                SET 计划收入 = :plan_income,
                    计划招生 = :plan_enrollment,
                    更新时间 = NOW()
                WHERE 神殿 = :campus AND 年份 = :year AND 月份 = :month AND 数据类型 = :data_type
            """)
        else:
            update_sql = text("""
                INSERT INTO consult.神殿月度财务数据
                (神殿, 年份, 月份, 数据类型, 计划收入, 计划招生, 创建时间, 更新时间)
                VALUES (:campus, :year, :month, :data_type, :plan_income, :plan_enrollment, NOW(), NOW())
            """)

        db.execute(update_sql, {
            "campus": campus, "year": year, "month": month, "data_type": data_type,
            "plan_income": plan_income, "plan_enrollment": plan_enrollment,
        })
    except Exception as e:
        print(f"[sync_to_financial] 同步到神殿月度财务数据失败: {e}")


# ==================== API 端点 ====================

@router.get("/full-data", response_model=FullV3Response)
async def get_v3_full_data(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FullV3Response:
    """
    003 V3 完整数据 — 三个看板一次性返回。
    """
    # 0. 从 config DB 加载网络媒体分类映射
    network_classify_map = _load_network_classify_map(db)

    # 1. 聚合原始数据
    raw = _aggregate_raw(db, campus, year)
    plan = _get_plan_data(db, campus, year)  # 所有类型合计（用于Tab1总表）
    network_raw = _aggregate_network_raw(db, campus, year)
    network_raw_by_consultant = _aggregate_network_raw_by_consultant(db, campus, year)
    channel_raw = _aggregate_channel_raw(db, campus, year)
    channel_raw_by_consultant = _aggregate_channel_raw_by_consultant(db, campus, year)
    koubei_raw = _aggregate_koubei_raw(db, campus, year)
    koubei_raw_by_consultant = _aggregate_koubei_raw_by_consultant(db, campus, year)

    # 1.5 分类型计划数据（用于各TAB子表2&3独立计划）
    # 网络类型: 聚合SEM+新媒体+市场口碑+合作伙伴+免费推广
    network_types = ["SEM", "新媒体", "市场口碑", "合作伙伴", "免费推广"]
    plan_network: Dict = {}
    for nt in network_types:
        nt_data = _get_plan_data_by_type(db, campus, year, nt)
        for key, value in nt_data.items():
            if key not in plan_network:
                plan_network[key] = {"计划收入": 0, "计划招生": 0}
            plan_network[key]["计划收入"] += float(value.get("计划收入", 0))
            plan_network[key]["计划招生"] += int(value.get("计划招生", 0))

    # 渠道和口碑直接读取对应类型
    plan_channel = _get_plan_data_by_type(db, campus, year, "渠道")
    plan_koubei = _get_plan_data_by_type(db, campus, year, "口碑")
    
    # 1.6 子表1计划数据：从咨询师月度计划数据聚合（统一数据源）
    # 不再从神殿月度财务数据读取，而是从上面已获取的 plan_network / plan_channel / plan_koubei 聚合
    # （这些数据来自 _get_plan_data_by_type → consult.咨询师月度计划数据）

    # 2. 预加载各月归属记录（咨询师职数 + 咨询师列表）
    monthly_assignment: Dict[int, Dict] = {}
    for m in range(1, 13):
        monthly_assignment[m] = get_monthly_headcount(db, campus, year, m, auto_snapshot=True)

    # 3. 咨询师列表：从 public.users 获取（祈福司，排除分析规划师助理）
    user_consultants = _get_user_consultants(db, campus)
    all_consultants_set: set = set(user_consultants)
    # 也把有实际数据但不在 users 里的咨询师加上
    for (c, _m) in raw.keys():
        all_consultants_set.add(c)
    all_consultants = sorted(all_consultants_set)

    # 已知咨询师（users 中的）
    known_consultants = sorted(set(user_consultants))
    # 其他咨询师（有数据但不在 users 中）
    other_consultants = sorted(all_consultants_set - set(known_consultants))

    # 3.5 Tab1子表1: 计划数据按月汇总 = 所有类型的咨询师计划数据合计
    plan_month_totals: Dict[int, Dict[str, float]] = {m: {"计划收入": 0, "计划招生": 0} for m in range(1, 13)}
    for (_c, m), p in plan.items():
        if m in plan_month_totals:
            plan_month_totals[m]["计划收入"] += float(p.get("计划收入", 0))
            plan_month_totals[m]["计划招生"] += int(p.get("计划招生", 0))

    # 3.6 各TAB子表1计划数据（从咨询师月度计划数据聚合，统一数据源）
    # 网络: 从 plan_network 按月汇总（已含SEM+新媒体+市场口碑+合作伙伴+免费推广）
    network_plan_month_totals: Dict[int, Dict[str, float]] = {m: {"计划收入": 0.0, "计划招生": 0} for m in range(1, 13)}
    for (_c, m), p in plan_network.items():
        if m in network_plan_month_totals:
            network_plan_month_totals[m]["计划收入"] += float(p.get("计划收入", 0))
            network_plan_month_totals[m]["计划招生"] += int(p.get("计划招生", 0))
    
    # 渠道: 从 plan_channel 按月汇总
    channel_plan_month_totals: Dict[int, Dict[str, float]] = {m: {"计划收入": 0.0, "计划招生": 0} for m in range(1, 13)}
    for (_c, m), p in plan_channel.items():
        if m in channel_plan_month_totals:
            channel_plan_month_totals[m]["计划收入"] += float(p.get("计划收入", 0))
            channel_plan_month_totals[m]["计划招生"] += int(p.get("计划招生", 0))
    
    # 口碑: 从 plan_koubei 按月汇总
    koubei_plan_month_totals: Dict[int, Dict[str, float]] = {m: {"计划收入": 0.0, "计划招生": 0} for m in range(1, 13)}
    for (_c, m), p in plan_koubei.items():
        if m in koubei_plan_month_totals:
            koubei_plan_month_totals[m]["计划收入"] += float(p.get("计划收入", 0))
            koubei_plan_month_totals[m]["计划招生"] += int(p.get("计划招生", 0))

    # 4. 构建 per-consultant per-month 汇总（Tab1 总表用）
    #    cm_data[(consultant, month)] = {咨询量, 上门量, 实际招生, 实际收入, 退费数, 计划收入, 计划招生}
    #    计划数据 = 该咨询师在 网络+渠道+口碑 三类型的计划合计
    cm_data: Dict = {}
    for c in all_consultants:
        for m in range(1, 13):
            bucket = _empty_bucket()
            if (c, m) in raw:
                _add_bucket(bucket, raw[(c, m)])
            # 计划数据从三个类型汇总
            p_net = plan_network.get((c, m), {})
            p_ch = plan_channel.get((c, m), {})
            p_kb = plan_koubei.get((c, m), {})
            bucket["计划收入"] = float(p_net.get("计划收入", 0)) + float(p_ch.get("计划收入", 0)) + float(p_kb.get("计划收入", 0))
            bucket["计划招生"] = int(p_net.get("计划招生", 0)) + int(p_ch.get("计划招生", 0)) + int(p_kb.get("计划招生", 0))
            cm_data[(c, m)] = bucket

    # ---------- TAB1: 年度核心数据汇总 (12月 + 合计) ----------
    tab1_rows: List[Tab1Row] = []
    year_total_bucket = _empty_bucket()

    for m in range(1, 13):
        month_bucket = _empty_bucket()
        for c in all_consultants:
            _add_bucket(month_bucket, cm_data[(c, m)])
        _add_bucket(year_total_bucket, month_bucket)

        tab1_rows.append(Tab1Row(
            月份=f"{m}月",
            神殿=campus if m == 1 else "",
            咨询师职数=monthly_assignment[m]["咨询师职数"],
            所有媒体来源=_calc_rates(month_bucket),
        ))

    # 合计行
    tab1_rows.append(Tab1Row(
        月份="合计",
        神殿="",
        咨询师职数=0,  # 合计行不显示职数
        所有媒体来源=_calc_rates(year_total_bucket),
    ))

    # ---------- TAB2 子表: 网络媒体核心数据汇总 ----------
    tab2_network_rows: List[Tab2NetworkRow] = []
    network_total_bucket = _empty_bucket()
    category_total = {
        "SEM": _empty_source_bucket(),
        "新媒体": _empty_source_bucket(),
        "市场口碑": _empty_source_bucket(),
        "合作伙伴": _empty_source_bucket(),
        "免费推广": _empty_source_bucket(),
    }

    for m in range(1, 13):
        month_bucket = _empty_bucket()
        category_bucket = {
            "SEM": _empty_source_bucket(),
            "新媒体": _empty_source_bucket(),
            "市场口碑": _empty_source_bucket(),
            "合作伙伴": _empty_source_bucket(),
            "免费推广": _empty_source_bucket(),
        }

        for (mm, media), stats in network_raw.items():
            if mm != m:
                continue
            _add_bucket(month_bucket, stats)
            category = classify_network_source(media, network_classify_map)
            for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                category_bucket[category][k] += stats.get(k, 0)

        # 计划数据（子表1用神殿月度财务数据）
        month_bucket["计划收入"] = network_plan_month_totals[m]["计划收入"]
        month_bucket["计划招生"] = network_plan_month_totals[m]["计划招生"]

        _add_bucket(network_total_bucket, month_bucket)
        for cat in category_total.keys():
            for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                category_total[cat][k] += category_bucket[cat][k]

        tab2_network_rows.append(Tab2NetworkRow(
            月份=f"{m}月",
            神殿=campus if m == 1 else "",
            咨询师职数=monthly_assignment[m]["咨询师职数"],
            网络媒体=_calc_network_summary_stats(month_bucket),
            SEM=_calc_source_stats(category_bucket["SEM"]),
            新媒体=_calc_source_stats(category_bucket["新媒体"]),
            市场口碑=_calc_source_stats(category_bucket["市场口碑"]),
            合作伙伴=_calc_source_stats(category_bucket["合作伙伴"]),
            免费推广=_calc_source_stats(category_bucket["免费推广"]),
        ))

    tab2_network_rows.append(Tab2NetworkRow(
        月份="合计",
        神殿="",
        咨询师职数=0,
        网络媒体=_calc_network_summary_stats(network_total_bucket),
        SEM=_calc_source_stats(category_total["SEM"]),
        新媒体=_calc_source_stats(category_total["新媒体"]),
        市场口碑=_calc_source_stats(category_total["市场口碑"]),
        合作伙伴=_calc_source_stats(category_total["合作伙伴"]),
        免费推广=_calc_source_stats(category_total["免费推广"]),
    ))

    # ---------- TAB2 子表: 网络媒体年度核心数据看板 ----------
    tab2_network_annual_rows: List[Tab2NetworkAnnualRow] = []
    seq = 1

    for c in known_consultants:
        c_yearly = _empty_bucket()
        c_cat = {
            "SEM": _empty_source_bucket(),
            "新媒体": _empty_source_bucket(),
            "市场口碑": _empty_source_bucket(),
            "合作伙伴": _empty_source_bucket(),
            "免费推广": _empty_source_bucket(),
        }

        for m in range(1, 13):
            # 汇总网络总量
            for (cc, mm, media), stats in network_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(c_yearly, stats)
                category = classify_network_source(media, network_classify_map)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    c_cat[category][k] += stats.get(k, 0)

            # 计划数据（按咨询师年度汇总 - 网络类型独立计划）
            p = plan_network.get((c, m), {})
            c_yearly["计划收入"] += float(p.get("计划收入", 0))
            c_yearly["计划招生"] += int(p.get("计划招生", 0))

        # 获取职位
        position = ""
        for m in range(1, 13):
            records = monthly_assignment[m].get("咨询师列表", [])
            if c in records:
                from app.models.consult.consultant_assignment import 咨询师月度归属记录
                rec = db.query(咨询师月度归属记录.岗位).filter(
                    咨询师月度归属记录.年份 == year,
                    咨询师月度归属记录.月份 == m,
                    咨询师月度归属记录.咨询师姓名 == c,
                ).first()
                if rec and rec.岗位:
                    position = rec.岗位
                    break

        tab2_network_annual_rows.append(Tab2NetworkAnnualRow(
            序号=seq,
            咨询师=c,
            职位=position,
            网络媒体=_calc_network_summary_stats(c_yearly),
            SEM=_calc_source_stats(c_cat["SEM"]),
            新媒体=_calc_source_stats(c_cat["新媒体"]),
            市场口碑=_calc_source_stats(c_cat["市场口碑"]),
            合作伙伴=_calc_source_stats(c_cat["合作伙伴"]),
            免费推广=_calc_source_stats(c_cat["免费推广"]),
        ))
        seq += 1

    # 其他咨询师
    other_yearly = _empty_bucket()
    other_cat = {
        "SEM": _empty_source_bucket(),
        "新媒体": _empty_source_bucket(),
        "市场口碑": _empty_source_bucket(),
        "合作伙伴": _empty_source_bucket(),
        "免费推广": _empty_source_bucket(),
    }
    for c in other_consultants:
        for m in range(1, 13):
            for (cc, mm, media), stats in network_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(other_yearly, stats)
                category = classify_network_source(media, network_classify_map)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    other_cat[category][k] += stats.get(k, 0)
            p = plan_network.get((c, m), {})
            other_yearly["计划收入"] += float(p.get("计划收入", 0))
            other_yearly["计划招生"] += int(p.get("计划招生", 0))

    if other_consultants:
        tab2_network_annual_rows.append(Tab2NetworkAnnualRow(
            序号=seq,
            咨询师="其他",
            职位="",
            网络媒体=_calc_network_summary_stats(other_yearly),
            SEM=_calc_source_stats(other_cat["SEM"]),
            新媒体=_calc_source_stats(other_cat["新媒体"]),
            市场口碑=_calc_source_stats(other_cat["市场口碑"]),
            合作伙伴=_calc_source_stats(other_cat["合作伙伴"]),
            免费推广=_calc_source_stats(other_cat["免费推广"]),
        ))

    # 合计（所有咨询师）
    all_yearly = _empty_bucket()
    all_cat = {
        "SEM": _empty_source_bucket(),
        "新媒体": _empty_source_bucket(),
        "市场口碑": _empty_source_bucket(),
        "合作伙伴": _empty_source_bucket(),
        "免费推广": _empty_source_bucket(),
    }
    for c in all_consultants:
        for m in range(1, 13):
            for (cc, mm, media), stats in network_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(all_yearly, stats)
                category = classify_network_source(media, network_classify_map)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    all_cat[category][k] += stats.get(k, 0)
            p = plan_network.get((c, m), {})
            all_yearly["计划收入"] += float(p.get("计划收入", 0))
            all_yearly["计划招生"] += int(p.get("计划招生", 0))

    tab2_network_annual_rows.append(Tab2NetworkAnnualRow(
        序号="合计",
        咨询师="纯数字",
        职位="",
        网络媒体=_calc_network_summary_stats(all_yearly),
        SEM=_calc_source_stats(all_cat["SEM"]),
        新媒体=_calc_source_stats(all_cat["新媒体"]),
        市场口碑=_calc_source_stats(all_cat["市场口碑"]),
        合作伙伴=_calc_source_stats(all_cat["合作伙伴"]),
        免费推广=_calc_source_stats(all_cat["免费推广"]),
    ))

    # ---------- TAB2 子表: 网络媒体月度核心数据看板 ----------
    tab2_network_monthly_rows: List[Tab2NetworkMonthlyRow] = []

    for m in range(1, 13):
        month_label = f"{m}月"
        assigned = set(monthly_assignment[m]["咨询师列表"])

        # 该月有网络数据的其他咨询师
        month_other_set: set = set()
        for (c, mm, _media), stats in network_raw_by_consultant.items():
            if mm != m:
                continue
            if c not in known_consultants and stats.get("咨询量", 0) > 0:
                month_other_set.add(c)

        month_total = _empty_bucket()
        month_total_cat = {
            "SEM": _empty_source_bucket(),
            "新媒体": _empty_source_bucket(),
            "市场口碑": _empty_source_bucket(),
            "合作伙伴": _empty_source_bucket(),
            "免费推广": _empty_source_bucket(),
        }

        first = True
        for c in known_consultants:
            row_bucket = _empty_bucket()
            row_cat = {
                "SEM": _empty_source_bucket(),
                "新媒体": _empty_source_bucket(),
                "市场口碑": _empty_source_bucket(),
                "合作伙伴": _empty_source_bucket(),
                "免费推广": _empty_source_bucket(),
            }

            for (cc, mm, media), stats in network_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(row_bucket, stats)
                category = classify_network_source(media, network_classify_map)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    row_cat[category][k] += stats.get(k, 0)

            # 计划数据（使用网络类型的独立计划）
            p = plan_network.get((c, m), {})
            row_bucket["计划收入"] = float(p.get("计划收入", 0))
            row_bucket["计划招生"] = int(p.get("计划招生", 0))

            _add_bucket(month_total, row_bucket)
            for cat in month_total_cat.keys():
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    month_total_cat[cat][k] += row_cat[cat][k]

            tab2_network_monthly_rows.append(Tab2NetworkMonthlyRow(
                月份=month_label if first else "",
                咨询师=c,
                咨询师职数=1 if c in assigned else 0,
                网络媒体=_calc_network_summary_stats(row_bucket),
                SEM=_calc_source_stats(row_cat["SEM"]),
                新媒体=_calc_source_stats(row_cat["新媒体"]),
                市场口碑=_calc_source_stats(row_cat["市场口碑"]),
                合作伙伴=_calc_source_stats(row_cat["合作伙伴"]),
                免费推广=_calc_source_stats(row_cat["免费推广"]),
            ))
            first = False

        if month_other_set:
            other_bucket = _empty_bucket()
            other_cat = {
                "SEM": _empty_source_bucket(),
                "新媒体": _empty_source_bucket(),
                "市场口碑": _empty_source_bucket(),
                "合作伙伴": _empty_source_bucket(),
                "免费推广": _empty_source_bucket(),
            }
            for c in sorted(month_other_set):
                for (cc, mm, media), stats in network_raw_by_consultant.items():
                    if cc != c or mm != m:
                        continue
                    _add_bucket(other_bucket, stats)
                    category = classify_network_source(media, network_classify_map)
                    for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                        other_cat[category][k] += stats.get(k, 0)
                p = plan_network.get((c, m), {})
                other_bucket["计划收入"] += float(p.get("计划收入", 0))
                other_bucket["计划招生"] += int(p.get("计划招生", 0))

            _add_bucket(month_total, other_bucket)
            for cat in month_total_cat.keys():
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    month_total_cat[cat][k] += other_cat[cat][k]

            tab2_network_monthly_rows.append(Tab2NetworkMonthlyRow(
                月份=month_label if first else "",
                咨询师="其他",
                咨询师职数=len(month_other_set),
                网络媒体=_calc_network_summary_stats(other_bucket),
                SEM=_calc_source_stats(other_cat["SEM"]),
                新媒体=_calc_source_stats(other_cat["新媒体"]),
                市场口碑=_calc_source_stats(other_cat["市场口碑"]),
                合作伙伴=_calc_source_stats(other_cat["合作伙伴"]),
                免费推广=_calc_source_stats(other_cat["免费推广"]),
            ))
            first = False

        total_headcount = len(assigned) + len(month_other_set)
        tab2_network_monthly_rows.append(Tab2NetworkMonthlyRow(
            月份=month_label if first else "",
            咨询师="合计",
            咨询师职数=total_headcount,
            网络媒体=_calc_network_summary_stats(month_total),
            SEM=_calc_source_stats(month_total_cat["SEM"]),
            新媒体=_calc_source_stats(month_total_cat["新媒体"]),
            市场口碑=_calc_source_stats(month_total_cat["市场口碑"]),
            合作伙伴=_calc_source_stats(month_total_cat["合作伙伴"]),
            免费推广=_calc_source_stats(month_total_cat["免费推广"]),
        ))

    # ---------- TAB3 子表: 渠道核心数据汇总 ----------
    tab3_channel_rows: List[Tab3ChannelSummaryRow] = []
    channel_total_bucket = _empty_bucket()

    for m in range(1, 13):
        month_bucket = _empty_bucket()
        if m in channel_raw:
            _add_bucket(month_bucket, channel_raw[m])

        # 计划数据（子表1用神殿月度财务数据）
        month_bucket["计划收入"] = channel_plan_month_totals[m]["计划收入"]
        month_bucket["计划招生"] = channel_plan_month_totals[m]["计划招生"]

        _add_bucket(channel_total_bucket, month_bucket)

        tab3_channel_rows.append(Tab3ChannelSummaryRow(
            月份=f"{m}月",
            神殿=campus if m == 1 else "",
            咨询师职数=monthly_assignment[m]["咨询师职数"],
            渠道平台=_calc_network_summary_stats(month_bucket),
            渠道=_calc_source_stats(month_bucket),
        ))

    tab3_channel_rows.append(Tab3ChannelSummaryRow(
        月份="合计",
        神殿="",
        咨询师职数=0,
        渠道平台=_calc_network_summary_stats(channel_total_bucket),
        渠道=_calc_source_stats(channel_total_bucket),
    ))

    # ---------- TAB3 子表: 渠道年度核心数据看板 ----------
    tab3_channel_annual_rows: List[Tab3ChannelAnnualRow] = []
    seq = 1

    for c in known_consultants:
        c_yearly = _empty_bucket()
        for m in range(1, 13):
            _add_bucket(c_yearly, channel_raw_by_consultant.get((c, m), {}))
            p = plan_channel.get((c, m), {})
            c_yearly["计划收入"] += float(p.get("计划收入", 0))
            c_yearly["计划招生"] += int(p.get("计划招生", 0))

        position = ""
        for m in range(1, 13):
            records = monthly_assignment[m].get("咨询师列表", [])
            if c in records:
                from app.models.consult.consultant_assignment import 咨询师月度归属记录
                rec = db.query(咨询师月度归属记录.岗位).filter(
                    咨询师月度归属记录.年份 == year,
                    咨询师月度归属记录.月份 == m,
                    咨询师月度归属记录.咨询师姓名 == c,
                ).first()
                if rec and rec.岗位:
                    position = rec.岗位
                    break

        tab3_channel_annual_rows.append(Tab3ChannelAnnualRow(
            序号=seq,
            咨询师=c,
            职位=position,
            渠道平台=_calc_network_summary_stats(c_yearly),
            渠道=_calc_source_stats(c_yearly),
        ))
        seq += 1

    other_yearly = _empty_bucket()
    for c in other_consultants:
        for m in range(1, 13):
            _add_bucket(other_yearly, channel_raw_by_consultant.get((c, m), {}))
            p = plan_channel.get((c, m), {})
            other_yearly["计划收入"] += float(p.get("计划收入", 0))
            other_yearly["计划招生"] += int(p.get("计划招生", 0))

    if other_consultants:
        tab3_channel_annual_rows.append(Tab3ChannelAnnualRow(
            序号=seq,
            咨询师="其他",
            职位="",
            渠道平台=_calc_network_summary_stats(other_yearly),
            渠道=_calc_source_stats(other_yearly),
        ))

    all_yearly = _empty_bucket()
    for c in all_consultants:
        for m in range(1, 13):
            _add_bucket(all_yearly, channel_raw_by_consultant.get((c, m), {}))
            p = plan_channel.get((c, m), {})
            all_yearly["计划收入"] += float(p.get("计划收入", 0))
            all_yearly["计划招生"] += int(p.get("计划招生", 0))

    tab3_channel_annual_rows.append(Tab3ChannelAnnualRow(
        序号="合计",
        咨询师="纯数字",
        职位="",
        渠道平台=_calc_network_summary_stats(all_yearly),
        渠道=_calc_source_stats(all_yearly),
    ))

    # ---------- TAB3 子表: 渠道月度核心数据看板 ----------
    tab3_channel_monthly_rows: List[Tab3ChannelMonthlyRow] = []

    for m in range(1, 13):
        month_label = f"{m}月"
        assigned = set(monthly_assignment[m]["咨询师列表"])

        month_other_set = set()
        for (c, mm), stats in channel_raw_by_consultant.items():
            if mm != m:
                continue
            if c not in known_consultants and stats.get("咨询量", 0) > 0:
                month_other_set.add(c)

        month_total = _empty_bucket()
        first = True

        for c in known_consultants:
            row_bucket = _empty_bucket()
            _add_bucket(row_bucket, channel_raw_by_consultant.get((c, m), {}))

            p = plan_channel.get((c, m), {})
            row_bucket["计划收入"] = float(p.get("计划收入", 0))
            row_bucket["计划招生"] = int(p.get("计划招生", 0))

            _add_bucket(month_total, row_bucket)

            tab3_channel_monthly_rows.append(Tab3ChannelMonthlyRow(
                月份=month_label if first else "",
                咨询师=c,
                咨询师职数=1 if c in assigned else 0,
                渠道平台=_calc_network_summary_stats(row_bucket),
                渠道=_calc_source_stats(row_bucket),
            ))
            first = False

        if month_other_set:
            other_bucket = _empty_bucket()
            for c in sorted(month_other_set):
                _add_bucket(other_bucket, channel_raw_by_consultant.get((c, m), {}))
                p = plan_channel.get((c, m), {})
                other_bucket["计划收入"] += float(p.get("计划收入", 0))
                other_bucket["计划招生"] += int(p.get("计划招生", 0))

            _add_bucket(month_total, other_bucket)

            tab3_channel_monthly_rows.append(Tab3ChannelMonthlyRow(
                月份=month_label if first else "",
                咨询师="其他",
                咨询师职数=len(month_other_set),
                渠道平台=_calc_network_summary_stats(other_bucket),
                渠道=_calc_source_stats(other_bucket),
            ))
            first = False

        total_headcount = len(assigned) + len(month_other_set)
        tab3_channel_monthly_rows.append(Tab3ChannelMonthlyRow(
            月份=month_label if first else "",
            咨询师="合计",
            咨询师职数=total_headcount,
            渠道平台=_calc_network_summary_stats(month_total),
            渠道=_calc_source_stats(month_total),
        ))

    # ---------- TAB4 子表: 口碑核心数据汇总 ----------
    tab4_koubei_rows: List[Tab4KoubeiSummaryRow] = []
    koubei_total_bucket = _empty_bucket()
    koubei_total_cat = {
        "咨询口碑": _empty_source_bucket(),
        "教质口碑": _empty_source_bucket(),
        "学术口碑": _empty_source_bucket(),
        "校园口碑": _empty_source_bucket(),
        "其他口碑": _empty_source_bucket(),
    }

    for m in range(1, 13):
        month_bucket = _empty_bucket()
        month_cat = {
            "咨询口碑": _empty_source_bucket(),
            "教质口碑": _empty_source_bucket(),
            "学术口碑": _empty_source_bucket(),
            "校园口碑": _empty_source_bucket(),
            "其他口碑": _empty_source_bucket(),
        }

        for (mm, media), stats in koubei_raw.items():
            if mm != m:
                continue
            _add_bucket(month_bucket, stats)
            category = classify_koubei_source(media)
            for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                month_cat[category][k] += stats.get(k, 0)

        month_bucket["计划收入"] = koubei_plan_month_totals[m]["计划收入"]
        month_bucket["计划招生"] = koubei_plan_month_totals[m]["计划招生"]

        _add_bucket(koubei_total_bucket, month_bucket)
        for cat in koubei_total_cat.keys():
            for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                koubei_total_cat[cat][k] += month_cat[cat][k]

        tab4_koubei_rows.append(Tab4KoubeiSummaryRow(
            月份=f"{m}月",
            神殿=campus if m == 1 else "",
            咨询师职数=monthly_assignment[m]["咨询师职数"],
            口碑平台=_calc_network_summary_stats(month_bucket),
            咨询口碑=_calc_source_stats(month_cat["咨询口碑"]),
            教质口碑=_calc_source_stats(month_cat["教质口碑"]),
            学术口碑=_calc_source_stats(month_cat["学术口碑"]),
            校园口碑=_calc_source_stats(month_cat["校园口碑"]),
            其他口碑=_calc_source_stats(month_cat["其他口碑"]),
        ))

    tab4_koubei_rows.append(Tab4KoubeiSummaryRow(
        月份="合计",
        神殿="",
        咨询师职数=0,
        口碑平台=_calc_network_summary_stats(koubei_total_bucket),
        咨询口碑=_calc_source_stats(koubei_total_cat["咨询口碑"]),
        教质口碑=_calc_source_stats(koubei_total_cat["教质口碑"]),
        学术口碑=_calc_source_stats(koubei_total_cat["学术口碑"]),
        校园口碑=_calc_source_stats(koubei_total_cat["校园口碑"]),
        其他口碑=_calc_source_stats(koubei_total_cat["其他口碑"]),
    ))

    # ---------- TAB4 子表: 口碑年度核心数据看板 ----------
    tab4_koubei_annual_rows: List[Tab4KoubeiAnnualRow] = []
    seq = 1

    for c in known_consultants:
        c_yearly = _empty_bucket()
        c_cat = {
            "咨询口碑": _empty_source_bucket(),
            "教质口碑": _empty_source_bucket(),
            "学术口碑": _empty_source_bucket(),
            "校园口碑": _empty_source_bucket(),
            "其他口碑": _empty_source_bucket(),
        }

        for m in range(1, 13):
            for (cc, mm, media), stats in koubei_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(c_yearly, stats)
                category = classify_koubei_source(media)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    c_cat[category][k] += stats.get(k, 0)

            p = plan_koubei.get((c, m), {})
            c_yearly["计划收入"] += float(p.get("计划收入", 0))
            c_yearly["计划招生"] += int(p.get("计划招生", 0))

        position = ""
        for m in range(1, 13):
            records = monthly_assignment[m].get("咨询师列表", [])
            if c in records:
                from app.models.consult.consultant_assignment import 咨询师月度归属记录
                rec = db.query(咨询师月度归属记录.岗位).filter(
                    咨询师月度归属记录.年份 == year,
                    咨询师月度归属记录.月份 == m,
                    咨询师月度归属记录.咨询师姓名 == c,
                ).first()
                if rec and rec.岗位:
                    position = rec.岗位
                    break

        tab4_koubei_annual_rows.append(Tab4KoubeiAnnualRow(
            序号=seq,
            咨询师=c,
            职位=position,
            口碑平台=_calc_network_summary_stats(c_yearly),
            咨询口碑=_calc_source_stats(c_cat["咨询口碑"]),
            教质口碑=_calc_source_stats(c_cat["教质口碑"]),
            学术口碑=_calc_source_stats(c_cat["学术口碑"]),
            校园口碑=_calc_source_stats(c_cat["校园口碑"]),
            其他口碑=_calc_source_stats(c_cat["其他口碑"]),
        ))
        seq += 1

    other_yearly = _empty_bucket()
    other_cat = {
        "咨询口碑": _empty_source_bucket(),
        "教质口碑": _empty_source_bucket(),
        "学术口碑": _empty_source_bucket(),
        "校园口碑": _empty_source_bucket(),
        "其他口碑": _empty_source_bucket(),
    }
    for c in other_consultants:
        for m in range(1, 13):
            for (cc, mm, media), stats in koubei_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(other_yearly, stats)
                category = classify_koubei_source(media)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    other_cat[category][k] += stats.get(k, 0)
            p = plan_koubei.get((c, m), {})
            other_yearly["计划收入"] += float(p.get("计划收入", 0))
            other_yearly["计划招生"] += int(p.get("计划招生", 0))

    if other_consultants:
        tab4_koubei_annual_rows.append(Tab4KoubeiAnnualRow(
            序号=seq,
            咨询师="其他",
            职位="",
            口碑平台=_calc_network_summary_stats(other_yearly),
            咨询口碑=_calc_source_stats(other_cat["咨询口碑"]),
            教质口碑=_calc_source_stats(other_cat["教质口碑"]),
            学术口碑=_calc_source_stats(other_cat["学术口碑"]),
            校园口碑=_calc_source_stats(other_cat["校园口碑"]),
            其他口碑=_calc_source_stats(other_cat["其他口碑"]),
        ))

    all_yearly = _empty_bucket()
    all_cat = {
        "咨询口碑": _empty_source_bucket(),
        "教质口碑": _empty_source_bucket(),
        "学术口碑": _empty_source_bucket(),
        "校园口碑": _empty_source_bucket(),
        "其他口碑": _empty_source_bucket(),
    }
    for c in all_consultants:
        for m in range(1, 13):
            for (cc, mm, media), stats in koubei_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(all_yearly, stats)
                category = classify_koubei_source(media)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    all_cat[category][k] += stats.get(k, 0)
            p = plan_koubei.get((c, m), {})
            all_yearly["计划收入"] += float(p.get("计划收入", 0))
            all_yearly["计划招生"] += int(p.get("计划招生", 0))

    tab4_koubei_annual_rows.append(Tab4KoubeiAnnualRow(
        序号="合计",
        咨询师="纯数字",
        职位="",
        口碑平台=_calc_network_summary_stats(all_yearly),
        咨询口碑=_calc_source_stats(all_cat["咨询口碑"]),
        教质口碑=_calc_source_stats(all_cat["教质口碑"]),
        学术口碑=_calc_source_stats(all_cat["学术口碑"]),
        校园口碑=_calc_source_stats(all_cat["校园口碑"]),
        其他口碑=_calc_source_stats(all_cat["其他口碑"]),
    ))

    # ---------- TAB4 子表: 口碑月度核心数据看板 ----------
    tab4_koubei_monthly_rows: List[Tab4KoubeiMonthlyRow] = []

    for m in range(1, 13):
        month_label = f"{m}月"
        assigned = set(monthly_assignment[m]["咨询师列表"])

        month_other_set = set()
        for (c, mm, _media), stats in koubei_raw_by_consultant.items():
            if mm != m:
                continue
            if c not in known_consultants and stats.get("咨询量", 0) > 0:
                month_other_set.add(c)

        month_total = _empty_bucket()
        month_total_cat = {
            "咨询口碑": _empty_source_bucket(),
            "教质口碑": _empty_source_bucket(),
            "学术口碑": _empty_source_bucket(),
            "校园口碑": _empty_source_bucket(),
            "其他口碑": _empty_source_bucket(),
        }

        first = True
        for c in known_consultants:
            row_bucket = _empty_bucket()
            row_cat = {
                "咨询口碑": _empty_source_bucket(),
                "教质口碑": _empty_source_bucket(),
                "学术口碑": _empty_source_bucket(),
                "校园口碑": _empty_source_bucket(),
                "其他口碑": _empty_source_bucket(),
            }

            for (cc, mm, media), stats in koubei_raw_by_consultant.items():
                if cc != c or mm != m:
                    continue
                _add_bucket(row_bucket, stats)
                category = classify_koubei_source(media)
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    row_cat[category][k] += stats.get(k, 0)

            p = plan_koubei.get((c, m), {})
            row_bucket["计划收入"] = float(p.get("计划收入", 0))
            row_bucket["计划招生"] = int(p.get("计划招生", 0))

            _add_bucket(month_total, row_bucket)
            for cat in month_total_cat.keys():
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    month_total_cat[cat][k] += row_cat[cat][k]

            tab4_koubei_monthly_rows.append(Tab4KoubeiMonthlyRow(
                月份=month_label if first else "",
                咨询师=c,
                咨询师职数=1 if c in assigned else 0,
                口碑平台=_calc_network_summary_stats(row_bucket),
                咨询口碑=_calc_source_stats(row_cat["咨询口碑"]),
                教质口碑=_calc_source_stats(row_cat["教质口碑"]),
                学术口碑=_calc_source_stats(row_cat["学术口碑"]),
                校园口碑=_calc_source_stats(row_cat["校园口碑"]),
                其他口碑=_calc_source_stats(row_cat["其他口碑"]),
            ))
            first = False

        if month_other_set:
            other_bucket = _empty_bucket()
            other_cat = {
                "咨询口碑": _empty_source_bucket(),
                "教质口碑": _empty_source_bucket(),
                "学术口碑": _empty_source_bucket(),
                "校园口碑": _empty_source_bucket(),
                "其他口碑": _empty_source_bucket(),
            }
            for c in sorted(month_other_set):
                for (cc, mm, media), stats in koubei_raw_by_consultant.items():
                    if cc != c or mm != m:
                        continue
                    _add_bucket(other_bucket, stats)
                    category = classify_koubei_source(media)
                    for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                        other_cat[category][k] += stats.get(k, 0)
                p = plan_koubei.get((c, m), {})
                other_bucket["计划收入"] += float(p.get("计划收入", 0))
                other_bucket["计划招生"] += int(p.get("计划招生", 0))

            _add_bucket(month_total, other_bucket)
            for cat in month_total_cat.keys():
                for k in ("咨询量", "上门量", "实际招生", "实际收入"):
                    month_total_cat[cat][k] += other_cat[cat][k]

            tab4_koubei_monthly_rows.append(Tab4KoubeiMonthlyRow(
                月份=month_label if first else "",
                咨询师="其他",
                咨询师职数=len(month_other_set),
                口碑平台=_calc_network_summary_stats(other_bucket),
                咨询口碑=_calc_source_stats(other_cat["咨询口碑"]),
                教质口碑=_calc_source_stats(other_cat["教质口碑"]),
                学术口碑=_calc_source_stats(other_cat["学术口碑"]),
                校园口碑=_calc_source_stats(other_cat["校园口碑"]),
                其他口碑=_calc_source_stats(other_cat["其他口碑"]),
            ))
            first = False

        total_headcount = len(assigned) + len(month_other_set)
        tab4_koubei_monthly_rows.append(Tab4KoubeiMonthlyRow(
            月份=month_label if first else "",
            咨询师="合计",
            咨询师职数=total_headcount,
            口碑平台=_calc_network_summary_stats(month_total),
            咨询口碑=_calc_source_stats(month_total_cat["咨询口碑"]),
            教质口碑=_calc_source_stats(month_total_cat["教质口碑"]),
            学术口碑=_calc_source_stats(month_total_cat["学术口碑"]),
            校园口碑=_calc_source_stats(month_total_cat["校园口碑"]),
            其他口碑=_calc_source_stats(month_total_cat["其他口碑"]),
        ))

    # ---------- TAB2: 年度核心数据看板 (各咨询师年度汇总) ----------
    tab2_rows: List[Tab2Row] = []

    yearly_total_bucket = _empty_bucket()
    seq = 1

    for c in known_consultants:
        c_yearly = _empty_bucket()
        for m in range(1, 13):
            _add_bucket(c_yearly, cm_data[(c, m)])
        _add_bucket(yearly_total_bucket, c_yearly)

        # 尝试获取职位
        position = ""
        for m in range(1, 13):
            records = monthly_assignment[m].get("咨询师列表", [])
            if c in records:
                # 从归属记录查职位
                from app.models.consult.consultant_assignment import 咨询师月度归属记录
                rec = db.query(咨询师月度归属记录.岗位).filter(
                    咨询师月度归属记录.年份 == year,
                    咨询师月度归属记录.月份 == m,
                    咨询师月度归属记录.咨询师姓名 == c,
                ).first()
                if rec and rec.岗位:
                    position = rec.岗位
                    break

        tab2_rows.append(Tab2Row(
            序号=seq,
            咨询师=c,
            职位=position,
            所有媒体来源=_calc_rates(c_yearly),
        ))
        seq += 1

    # "其他" 行
    other_yearly = _empty_bucket()
    for c in other_consultants:
        c_yearly = _empty_bucket()
        for m in range(1, 13):
            _add_bucket(c_yearly, cm_data[(c, m)])
        _add_bucket(other_yearly, c_yearly)

    # 合计 — 从所有咨询师汇总
    all_yearly_total = _empty_bucket()
    for c in all_consultants:
        for m in range(1, 13):
            _add_bucket(all_yearly_total, cm_data[(c, m)])

    if other_consultants:
        tab2_rows.append(Tab2Row(
            序号=seq,
            咨询师="其他",
            职位="",
            所有媒体来源=_calc_rates(other_yearly),
        ))

    # 合计行
    tab2_rows.append(Tab2Row(
        序号="合计",
        咨询师="纯数字",
        职位="",
        所有媒体来源=_calc_rates(all_yearly_total),
    ))

    # ---------- TAB3: 月度核心数据看板 ----------
    tab3_rows: List[Tab3Row] = []

    for m in range(1, 13):
        month_label = f"{m}月"
        assigned_consultants = user_consultants  # 咨询师列表来自 public.users
        assigned_set = set(assigned_consultants)

        # 该月所有有数据的咨询师（不在归属记录中）
        month_data_only = set()
        for c in all_consultants:
            if cm_data[(c, m)]["咨询量"] > 0 and c not in assigned_set:
                month_data_only.add(c)

        # 展示顺序：先列出所有归属咨询师（不管有没有数据），再"其他"
        month_total = _empty_bucket()
        first = True

        for c in sorted(assigned_consultants):
            row_bucket = cm_data[(c, m)].copy()
            _add_bucket(month_total, row_bucket)

            tab3_rows.append(Tab3Row(
                月份=month_label if first else "",
                咨询师=c,
                咨询师职数=1,
                所有媒体来源=_calc_rates(row_bucket),
            ))
            first = False

        # "其他" — 有数据但不在该月归属记录中的咨询师
        if month_data_only:
            other_bucket = _empty_bucket()
            for c in sorted(month_data_only):
                _add_bucket(other_bucket, cm_data[(c, m)])
            _add_bucket(month_total, other_bucket)

            tab3_rows.append(Tab3Row(
                月份=month_label if first else "",
                咨询师="其他",
                咨询师职数=len(month_data_only),
                所有媒体来源=_calc_rates(other_bucket),
            ))
            first = False

        # 月合计行
        total_headcount = len(assigned_consultants) + len(month_data_only)
        tab3_rows.append(Tab3Row(
            月份=month_label if first else "",
            咨询师="合计",
            咨询师职数=total_headcount,
            所有媒体来源=_calc_rates(month_total),
        ))

    return FullV3Response(
        神殿=campus,
        年份=year,
        tab1_年度核心数据汇总=tab1_rows,
        tab2_网络媒体_核心数据汇总=tab2_network_rows,
        tab2_网络媒体_年度核心数据看板=tab2_network_annual_rows,
        tab2_网络媒体_月度核心数据看板=tab2_network_monthly_rows,
        tab3_渠道_核心数据汇总=tab3_channel_rows,
        tab3_渠道_年度核心数据看板=tab3_channel_annual_rows,
        tab3_渠道_月度核心数据看板=tab3_channel_monthly_rows,
        tab4_口碑_核心数据汇总=tab4_koubei_rows,
        tab4_口碑_年度核心数据看板=tab4_koubei_annual_rows,
        tab4_口碑_月度核心数据看板=tab4_koubei_monthly_rows,
        tab2_年度核心数据看板=tab2_rows,
        tab3_月度核心数据看板=tab3_rows,
    )


@router.post("/save-plan")
async def save_plan_data_v3(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    保存计划数据（计划收入、计划招生）

    注意: 此端点已废弃,请使用 /consult/consultant-plan/batch 接口
    保留此端点仅为向后兼容

    data: { campus, year, month, consultant, plan_income, plan_enrollment, data_type }
    """
    try:
        campus = data["campus"]
        year = data["year"]
        month = data["month"]
        consultant = data["consultant"]
        plan_income = data.get("plan_income", 0)
        plan_enrollment = data.get("plan_enrollment", 0)
        data_type = data.get("data_type", "汇总")

        check_sql = text("""
            SELECT COUNT(*) FROM consult.咨询师月度计划数据
            WHERE 神殿 = :campus AND 年份 = :year AND 月份 = :month
              AND 咨询师 = :consultant AND 数据类型 = :data_type
        """)
        count = db.execute(check_sql, {
            "campus": campus, "year": year, "month": month,
            "consultant": consultant, "data_type": data_type
        }).scalar()
        count_value = count or 0

        if count_value > 0:
            update_sql = text("""
                UPDATE consult.咨询师月度计划数据
                SET 计划收入 = COALESCE(:plan_income, 计划收入),
                    计划招生 = COALESCE(:plan_enrollment, 计划招生),
                    更新时间 = NOW()
                WHERE 神殿 = :campus AND 年份 = :year AND 月份 = :month
                  AND 咨询师 = :consultant AND 数据类型 = :data_type
            """)
        else:
            update_sql = text("""
                INSERT INTO consult.咨询师月度计划数据
                (神殿, 年份, 月份, 咨询师, 计划收入, 计划招生, 数据类型, 创建时间, 更新时间)
                VALUES (:campus, :year, :month, :consultant, :plan_income, :plan_enrollment, :data_type, NOW(), NOW())
            """)

        db.execute(update_sql, {
            "campus": campus, "year": year, "month": month, "consultant": consultant,
            "plan_income": plan_income,
            "plan_enrollment": plan_enrollment,
            "data_type": data_type,
        })
        db.commit()

        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": str(e)}
