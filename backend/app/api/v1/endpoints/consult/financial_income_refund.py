"""
财务收入和退费API路由
007财务收入和退费 - 最高议事厅核心数据

TAB1 - 最高议事厅核心数据汇总（从TAB2各神殿数据汇总获取）
TAB2 - 各神殿数据看板汇总（按神殿、月份、数据类型存储）

数据来源说明：
- 计划收入/计划招生：手动输入，存储到数据库
- 实际收入/实际招生/退费人数：从咨询量录入系统自动读取

数据类型与量来源映射：
- SEM -> 量来源="网络" 且 媒体来源 不属于 新媒体平台
- 新媒体 -> 量来源="网络" 且 媒体来源 属于 新媒体平台
- 市场口碑 -> 量来源="口碑" 且 媒体来源="市场口碑"
- 合作伙伴 -> 量来源="合作伙伴"
- 口碑 -> 量来源="口碑"
- 渠道 -> 量来源="渠道"
- 神殿新媒体 -> 量来源="神殿新媒体"
- 汇总 -> 所有有效记录
"""

import logging
from decimal import Decimal
from typing import Dict, List, Optional, Protocol, TypeAlias, TypedDict

from app.core.database import get_db
from app.crud.consult.consultant_monthly_plan import ConsultantMonthlyPlanCRUD
from app.crud.consult.financial_income_refund import (
    神殿月度财务数据CRUD,
    最高议事厅核心数据汇总CRUD,
)
from app.models.consult.consultation_record import 咨询量明细表
from app.models.market import (
    市场部B站日度数据表,
    市场部SEM其他平台日度数据表,
    市场部SEM百度推广日度数据表,
    市场部小红书日度数据表,
    市场部微信视频号日度数据表,
    市场部快手日度数据表,
    市场部抖音日度数据表,
    市场部网络合作伙伴日度数据表,
)
from app.models.media_source_config import MediaCategory
from app.schemas.consult.financial_income_refund import (
    DATA_TYPES,
    神殿月度财务数据创建,
    神殿月度财务数据响应,
    神殿月度财务数据批量创建,
    神殿月度财务数据更新,
    最高议事厅核心数据汇总创建,
    最高议事厅核心数据汇总响应,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Integer, and_, case, extract, func, or_
from sqlalchemy.orm import Session

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter()


class _PlanValue(TypedDict):
    计划收入: float
    计划招生: int


class _MonthlyAutoRow(TypedDict):
    月份: int
    咨询总量: int
    上门量: int
    实际招生: int
    订座量: int
    退费人数: int
    实际收入: float
    退费金额: float


class _CombinedMonthlyRow(_MonthlyAutoRow):
    计划收入: float
    计划招生: int
    总转化率: float
    当面转化率: float
    电转门: float


class _AnnualSummaryRow(TypedDict):
    计划收入: float
    计划招生: int
    咨询总量: int
    上门量: int
    实际招生: int
    退费人数: int
    实际收入: float
    退费金额: float
    总转化率: float
    当面转化率: float
    电转门: float


PlanByCampus: TypeAlias = Dict[str, _PlanValue]
PlanByCampusAndType: TypeAlias = Dict[tuple[str, str], _PlanValue]
MonthlyAutoMap: TypeAlias = Dict[int, _MonthlyAutoRow]


class _MarketDailyTable(Protocol):
    日期: object
    退费数: object
    净报名: object
    上门人数: object
    神殿: object


def _to_float(value: object) -> float:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bool):
        return float(int(value))
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return 0.0
    return 0.0


def _to_int(value: object) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, Decimal):
        return int(value)
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(float(value))
        except ValueError:
            return 0
    return 0


def _empty_plan_value() -> _PlanValue:
    return {"计划收入": 0.0, "计划招生": 0}


def _empty_monthly_auto_row(month: int) -> _MonthlyAutoRow:
    return {
        "月份": month,
        "咨询总量": 0,
        "上门量": 0,
        "实际招生": 0,
        "订座量": 0,
        "退费人数": 0,
        "实际收入": 0.0,
        "退费金额": 0.0,
    }


def _plan_value(plan_income: object, plan_enrollment: object) -> _PlanValue:
    return {
        "计划收入": _to_float(plan_income),
        "计划招生": _to_int(plan_enrollment),
    }


def _extract_monthly_rows(response: object) -> List[_MonthlyAutoRow]:
    if not isinstance(response, dict):
        return []
    data = response.get("data")
    if not isinstance(data, dict):
        return []
    monthly_list = data.get("月度数据")
    if not isinstance(monthly_list, list):
        return []
    rows: List[_MonthlyAutoRow] = []
    for item in monthly_list:
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "月份": _to_int(item.get("月份")),
                "咨询总量": _to_int(item.get("咨询总量")),
                "上门量": _to_int(item.get("上门量")),
                "实际招生": _to_int(item.get("实际招生")),
                "订座量": _to_int(item.get("订座量")),
                "退费人数": _to_int(item.get("退费人数")),
                "实际收入": _to_float(item.get("实际收入")),
                "退费金额": _to_float(item.get("退费金额")),
            }
        )
    return rows


def _build_combined_monthly_row(month: int, plan: object, auto: _MonthlyAutoRow) -> _CombinedMonthlyRow:
    咨询总量 = auto["咨询总量"]
    上门量 = auto["上门量"]
    实际招生 = auto["实际招生"]
    退费人数 = auto["退费人数"]
    实际收入 = auto["实际收入"]
    退费金额 = auto["退费金额"]

    总转化率 = round(实际招生 / 咨询总量 * 100, 2) if 咨询总量 > 0 else 0.0
    当面转化率 = round(实际招生 / 上门量 * 100, 2) if 上门量 > 0 else 0.0
    电转门 = round(上门量 / 咨询总量 * 100, 2) if 咨询总量 > 0 else 0.0

    计划收入 = 0.0
    计划招生 = 0
    if isinstance(plan, dict):
        计划收入 = _to_float(plan.get("计划收入"))
        计划招生 = _to_int(plan.get("计划招生"))

    return {
        "月份": month,
        "计划收入": 计划收入,
        "计划招生": 计划招生,
        "咨询总量": 咨询总量,
        "上门量": 上门量,
        "实际招生": 实际招生,
        "订座量": auto["订座量"],
        "退费人数": 退费人数,
        "实际收入": 实际收入,
        "退费金额": 退费金额,
        "总转化率": 总转化率,
        "当面转化率": 当面转化率,
        "电转门": 电转门,
    }


def _build_annual_summary(combined_monthly: List[_CombinedMonthlyRow]) -> _AnnualSummaryRow:
    计划收入 = sum(row["计划收入"] for row in combined_monthly)
    计划招生 = sum(row["计划招生"] for row in combined_monthly)
    咨询总量 = sum(row["咨询总量"] for row in combined_monthly)
    上门量 = sum(row["上门量"] for row in combined_monthly)
    实际招生 = sum(row["实际招生"] for row in combined_monthly)
    退费人数 = sum(row["退费人数"] for row in combined_monthly)
    实际收入 = sum(row["实际收入"] for row in combined_monthly)
    退费金额 = sum(row["退费金额"] for row in combined_monthly)

    return {
        "计划收入": 计划收入,
        "计划招生": 计划招生,
        "咨询总量": 咨询总量,
        "上门量": 上门量,
        "实际招生": 实际招生,
        "退费人数": 退费人数,
        "实际收入": 实际收入,
        "退费金额": 退费金额,
        "总转化率": round(实际招生 / 咨询总量 * 100, 2) if 咨询总量 > 0 else 0.0,
        "当面转化率": round(实际招生 / 上门量 * 100, 2) if 上门量 > 0 else 0.0,
        "电转门": round(上门量 / 咨询总量 * 100, 2) if 咨询总量 > 0 else 0.0,
    }


# ==================== 辅助函数：神殿名称模糊匹配 ====================

def build_campus_filter(column, campus: str):
    """
    构建神殿名称模糊匹配条件。
    
    咨询量明细表中神殿字段存储的是完整名称（如"河北主神殿"），
    而前端传入的是简短名称（如"主神殿"）。
    使用 LIKE 进行模糊匹配以兼容两种格式。
    """
    # 去掉"神殿"后缀，取核心名称用于模糊匹配
    core_name = campus.replace("神殿", "").strip()
    return column.like(f"%{core_name}%")


def extract_campus_core_name(campus_name: str) -> str:
    """
    提取神殿核心名称（移除省份前缀和"神殿"后缀）
    例如：河北主神殿 -> 盛邦
    """
    import re
    # 移除省份前缀
    name = re.sub(r'^(河北|山西|广西|贵州|山东|河南|湖北|湖南|广东|四川|云南|江苏|浙江|福建|安徽|江西|辽宁|吉林|黑龙江|内蒙古|新疆|西藏|青海|宁夏|重庆|北京|天津|上海)', '', campus_name)
    # 移除"神殿"后缀
    name = name.replace("神殿", "").strip()
    return name


def match_campus_names(name1: str, name2: str) -> bool:
    """
    判断两个神殿名称是否匹配（忽略省份前缀和"神殿"后缀）
    """
    core1 = extract_campus_core_name(name1)
    core2 = extract_campus_core_name(name2)
    return core1 == core2 or core1 in core2 or core2 in core1


# ==================== 辅助函数：获取媒体来源配置 ====================

def get_new_media_sources(db: Session) -> List[str]:
    """获取新媒体平台的媒体来源列表"""
    try:
        # 从 MediaCategory 获取 "网络" 下的 "新媒体平台" 子项
        categories = db.query(MediaCategory).filter(
            MediaCategory.name == "网络",
            MediaCategory.is_active
        ).first()
        
        if categories:
            for source in categories.media_sources:
                if source.name == "新媒体平台" and source.is_active:
                    return [detail.name for detail in source.media_details if detail.is_active]
        return []
    except Exception:
        # 默认新媒体平台列表
        return ["抖音", "快手", "小红书", "微信公众号", "微博", "B站"]


def build_data_type_filter(db: Session, data_type: str, base_query):
    """根据数据类型构建查询条件"""
    new_media_sources = get_new_media_sources(db)
    
    if data_type == "SEM":
        # SEM: 量来源=网络 且 媒体来源 不属于 新媒体平台 且 不是市场口碑
        if new_media_sources:
            exclude_list = new_media_sources + ["市场口碑"]
            return base_query.filter(
                咨询量明细表.量来源 == "网络",
                ~咨询量明细表.媒体来源.in_(exclude_list)
            )
        else:
            return base_query.filter(
                咨询量明细表.量来源 == "网络",
                咨询量明细表.媒体来源 != "新媒体平台",
                咨询量明细表.媒体来源 != "市场口碑"
            )
    elif data_type == "新媒体":
        # 新媒体: 量来源=网络 且 媒体来源 属于 新媒体平台
        if new_media_sources:
            return base_query.filter(
                咨询量明细表.量来源 == "网络",
                咨询量明细表.媒体来源.in_(new_media_sources)
            )
        else:
            return base_query.filter(
                咨询量明细表.量来源 == "网络",
                咨询量明细表.媒体来源 == "新媒体平台"
            )
    elif data_type == "市场口碑":
        # 市场口碑：媒体来源=市场口碑（兼容新旧数据：量来源可能是口碑或网络）
        return base_query.filter(
            咨询量明细表.媒体来源 == "市场口碑"
        )
    elif data_type == "合作伙伴":
        return base_query.filter(咨询量明细表.量来源 == "合作伙伴")
    elif data_type == "口碑":
        return base_query.filter(
            咨询量明细表.量来源 == "口碑",
            咨询量明细表.媒体来源 != "市场口碑"
        )
    elif data_type == "渠道":
        return base_query.filter(咨询量明细表.量来源 == "渠道")
    elif data_type == "神殿新媒体":
        return base_query.filter(咨询量明细表.量来源 == "神殿新媒体")
    elif data_type == "汇总":
        # 汇总：所有有效记录
        return base_query
    else:
        return base_query


# ==================== TAB2 - 神殿月度财务数据 API ====================

@router.post(
    "/campus-monthly-data",
    response_model=神殿月度财务数据响应,
    summary="创建/更新神殿月度财务数据"
)
def upsert_campus_monthly_data(
    obj_in: 神殿月度财务数据创建,
    db: Session = Depends(get_db)
):
    """
    创建或更新神殿月度财务数据（根据年份、月份、神殿、数据类型唯一确定）
    
    - **年份**: 统计年份
    - **月份**: 1-12月
    - **神殿**: 神殿名称
    - **数据类型**: SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总
    """
    try:
        record = 神殿月度财务数据CRUD.upsert(db, obj_in)
        
        # 同步更新最高议事厅汇总数据
        最高议事厅核心数据汇总CRUD.sync_from_monthly_data(
            db, obj_in.年份, obj_in.神殿, obj_in.数据类型
        )
        
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"操作失败: {str(e)}") from e


@router.post(
    "/campus-monthly-data/batch",
    response_model=dict,
    summary="批量创建/更新神殿月度财务数据"
)
def batch_upsert_campus_monthly_data(
    obj_in: 神殿月度财务数据批量创建,
    db: Session = Depends(get_db)
):
    """批量创建或更新神殿月度财务数据"""
    try:
        results = []
        sync_keys = set()  # 记录需要同步的(年份, 神殿, 数据类型)组合
        
        for item in obj_in.数据列表:
            record = 神殿月度财务数据CRUD.upsert(db, item)
            results.append(神殿月度财务数据响应.model_validate(record))
            sync_keys.add((item.年份, item.神殿, item.数据类型))
        
        # 批量同步最高议事厅汇总数据
        for year, campus, data_type in sync_keys:
            最高议事厅核心数据汇总CRUD.sync_from_monthly_data(db, year, campus, data_type)
        
        return {
            "成功数量": len(results),
            "数据列表": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量操作失败: {str(e)}") from e


@router.get(
    "/campus-monthly-data/{record_id}",
    response_model=神殿月度财务数据响应,
    summary="获取神殿月度财务数据详情"
)
def get_campus_monthly_data(
    record_id: int,
    db: Session = Depends(get_db)
):
    """根据记录ID获取神殿月度财务数据详情"""
    record = 神殿月度财务数据CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get(
    "/campus-monthly-data",
    response_model=dict,
    summary="获取神殿月度财务数据（用于TAB2展示）"
)
def get_campus_monthly_data_list(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    获取某神殿某年某数据类型的全年（1-12月）数据
    用于TAB2各神殿数据看板汇总的月度表格展示
    """
    monthly_data = 神殿月度财务数据CRUD.get_campus_monthly_data(
        db, year, campus, data_type
    )
    
    yearly_summary = 神殿月度财务数据CRUD.get_yearly_summary_by_campus(
        db, year, campus, data_type
    )
    
    return {
        "神殿": campus,
        "年份": year,
        "数据类型": data_type,
        "月度数据": [神殿月度财务数据响应.model_validate(r) for r in monthly_data],
        "年度汇总": yearly_summary
    }


@router.get(
    "/all-campus-yearly-plan-summary",
    response_model=list,
    summary="获取所有神殿年度计划汇总（从神殿月度财务数据）"
)
def get_all_campus_yearly_plan_summary(
    year: int = Query(..., description="年份"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    获取所有神殿某年某数据类型的年度计划汇总
    从神殿月度财务数据表按神殿分组聚合，返回每个神殿的计划收入和计划招生
    用于002子表1的神殿汇总行中计划数据展示
    """
    return 神殿月度财务数据CRUD.get_all_campus_yearly_plan_summary(
        db, year, data_type
    )


@router.get(
    "/campus-all-data",
    response_model=dict,
    summary="获取神殿所有数据类型的数据"
)
def get_campus_all_data(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db)
):
    """
    获取某神殿某年所有数据类型的全部数据
    用于TAB2神殿数据汇总页面
    """
    all_data = 神殿月度财务数据CRUD.get_campus_all_types(db, year, campus)
    
    # 按数据类型分组
    grouped: Dict[str, List[神殿月度财务数据响应]] = {}
    for item in all_data:
        if item.数据类型 not in grouped:
            grouped[item.数据类型] = []
        grouped[item.数据类型].append(神殿月度财务数据响应.model_validate(item))
    
    # 获取各数据类型的年度汇总
    summaries: Dict[str, Dict[str, float | int]] = {}
    for data_type in grouped.keys():
        summaries[data_type] = 神殿月度财务数据CRUD.get_yearly_summary_by_campus(
            db, year, campus, data_type
        )
    
    return {
        "神殿": campus,
        "年份": year,
        "分类数据": grouped,
        "分类汇总": summaries
    }


@router.put(
    "/campus-monthly-data/{record_id}",
    response_model=神殿月度财务数据响应,
    summary="更新神殿月度财务数据"
)
def update_campus_monthly_data(
    record_id: int,
    obj_in: 神殿月度财务数据更新,
    db: Session = Depends(get_db)
):
    """更新神殿月度财务数据"""
    obj_in.记录ID = record_id
    record = 神殿月度财务数据CRUD.update(db, obj_in)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    # 同步更新最高议事厅汇总数据
    最高议事厅核心数据汇总CRUD.sync_from_monthly_data(
        db, record.年份, record.神殿, record.数据类型
    )
    
    return record


@router.delete(
    "/campus-monthly-data/{record_id}",
    response_model=dict,
    summary="删除神殿月度财务数据"
)
def delete_campus_monthly_data(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除神殿月度财务数据"""
    record = 神殿月度财务数据CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    year, campus, data_type = record.年份, record.神殿, record.数据类型
    
    success = 神殿月度财务数据CRUD.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=500, detail="删除失败")
    
    # 同步更新最高议事厅汇总数据
    最高议事厅核心数据汇总CRUD.sync_from_monthly_data(db, year, campus, data_type)
    
    return {"message": "删除成功", "记录ID": record_id}


# ==================== TAB1 - 最高议事厅核心数据汇总 API ====================

@router.get(
    "/mgnt-core-summary",
    response_model=dict,
    summary="获取最高议事厅核心数据汇总（TAB1）"
)
def get_mgnt_core_summary(
    year: int = Query(..., description="年份"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    获取最高议事厅核心数据汇总（TAB1）
    数据来源于TAB2各神殿数据汇总
    
    计划数据来源：
    - SEM、新媒体：从市场部年度网络计划表获取
    - 市场口碑：从市场部口碑月度计划表获取
    - 合作伙伴：从市场部网络合作伙伴月度计划表获取
    - 免费推广：从市场部免费推广月度计划表获取
    - 其他：从神殿月度财务数据表获取
    
    - **年份**: 统计年份
    - **数据类型**: SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总
    """
    # 获取各神殿汇总数据
    campus_data = 最高议事厅核心数据汇总CRUD.get_by_year_and_type(db, year, data_type)
    
    # 根据数据类型从不同来源获取计划数据
    plan_by_campus: PlanByCampus = {}
    
    if data_type in ["SEM", "新媒体"]:
        # SEM和新媒体：从市场部年度网络计划表获取
        from app.models.market.network_plan import MarketNetworkPlan
        
        network_plans = db.query(
            MarketNetworkPlan.campus,
            func.sum(MarketNetworkPlan.sem_plan_income if data_type == "SEM" else MarketNetworkPlan.newmedia_plan_income).label('计划收入'),
            func.sum(MarketNetworkPlan.sem_plan_signup if data_type == "SEM" else MarketNetworkPlan.newmedia_plan_signup).label('计划招生')
        ).filter(
            and_(
                MarketNetworkPlan.year == str(year),
                MarketNetworkPlan.campus != '',  # 排除总计行
                MarketNetworkPlan.month != 0  # 排除总计月
            )
        ).group_by(MarketNetworkPlan.campus).all()
        
        for network_plan in network_plans:
            plan_by_campus[network_plan.campus] = _plan_value(
                network_plan.计划收入,
                network_plan.计划招生,
            )
    
    elif data_type == "市场口碑":
        # 市场口碑：从市场部口碑月度计划表获取
        from app.models.market.monthly_plan_data import 市场部口碑月度计划表
        
        reputation_plans = db.query(
            市场部口碑月度计划表.campus,
            func.sum(市场部口碑月度计划表.plan_income).label('计划收入'),
            func.sum(市场部口碑月度计划表.plan_enrollment).label('计划招生')
        ).filter(
            市场部口碑月度计划表.year == str(year)
        ).group_by(市场部口碑月度计划表.campus).all()
        
        for reputation_plan in reputation_plans:
            plan_by_campus[reputation_plan.campus] = _plan_value(
                reputation_plan.计划收入,
                reputation_plan.计划招生,
            )
    
    elif data_type == "合作伙伴":
        # 合作伙伴：从市场部网络合作伙伴月度计划表汇总获取
        from app.models.market.monthly_plan_data import 市场部网络合作伙伴月度计划表
        
        partner_plans = db.query(
            市场部网络合作伙伴月度计划表.campus,
            func.sum(市场部网络合作伙伴月度计划表.plan_income).label('计划收入'),
            func.sum(市场部网络合作伙伴月度计划表.plan_enrollment).label('计划招生')
        ).filter(
            市场部网络合作伙伴月度计划表.year == str(year)
        ).group_by(市场部网络合作伙伴月度计划表.campus).all()
        
        for partner_plan in partner_plans:
            plan_by_campus[partner_plan.campus] = _plan_value(
                partner_plan.计划收入,
                partner_plan.计划招生,
            )
    
    elif data_type == "免费推广":
        # 免费推广：从市场部免费推广月度计划表获取
        from app.models.market.monthly_plan_data import 市场部免费推广月度计划表
        
        free_promo_plans = db.query(
            市场部免费推广月度计划表.campus,
            func.sum(市场部免费推广月度计划表.plan_income).label('计划收入'),
            func.sum(市场部免费推广月度计划表.plan_enrollment).label('计划招生')
        ).filter(
            市场部免费推广月度计划表.year == str(year)
        ).group_by(市场部免费推广月度计划表.campus).all()
        
        for free_promo_plan in free_promo_plans:
            plan_by_campus[free_promo_plan.campus] = _plan_value(
                free_promo_plan.计划收入,
                free_promo_plan.计划招生,
            )
    
    else:
        # 其他数据类型：从神殿月度财务数据表获取
        plan_totals_list = 神殿月度财务数据CRUD.get_all_campus_yearly_plan_summary(
            db, year, data_type
        )
        for plan_total in plan_totals_list:
            plan_by_campus[plan_total["神殿"]] = _plan_value(
                plan_total["计划收入"],
                plan_total["计划招生"],
            )
    
    # 覆盖计划数据
    response_list = []
    for item in campus_data:
        resp = 最高议事厅核心数据汇总响应.model_validate(item)
        # 使用智能神殿名称匹配
        for campus_key, plan_val in plan_by_campus.items():
            if match_campus_names(campus_key, item.神殿):
                resp.计划收入 = Decimal(str(plan_val["计划收入"]))
                resp.计划招生 = int(plan_val["计划招生"])
                logger.info(f"[财务收入API] 单个类型匹配成功: {campus_key} <-> {item.神殿}, 数据类型: {data_type}")
                break
        response_list.append(resp)
    
    # 获取总计（也用计划数据覆盖）
    total = 最高议事厅核心数据汇总CRUD.get_total_by_year_and_type(db, year, data_type)
    plan_type_sum: _PlanValue = {"计划收入": 0.0, "计划招生": 0}
    for plan_value in plan_by_campus.values():
        plan_type_sum["计划收入"] += plan_value["计划收入"]
        plan_type_sum["计划招生"] += plan_value["计划招生"]
    if plan_by_campus:
        total["计划收入"] = plan_type_sum["计划收入"]
        total["计划招生"] = plan_type_sum["计划招生"]
    
    return {
        "年份": year,
        "数据类型": data_type,
        "神殿数据": response_list,
        "总计": total
    }


@router.get(
    "/mgnt-core-summary/all",
    response_model=dict,
    summary="获取最高议事厅所有数据类型的核心数据汇总"
)
def get_mgnt_core_summary_all(
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db)
):
    """
    获取最高议事厅所有数据类型的核心数据汇总
    用于TAB1整体展示
    
    计划数据来源：
    - SEM、新媒体：从市场部年度网络计划表获取
    - 市场口碑：从市场部口碑月度计划表获取
    - 合作伙伴：从市场部网络合作伙伴月度计划表获取
    - 免费推广：从市场部免费推广月度计划表获取
    - 其他：从神殿月度财务数据表获取
    """
    all_data = 最高议事厅核心数据汇总CRUD.get_all_by_year(db, year)
    
    # 构建计划数据映射：(神殿, 数据类型) → {计划收入, 计划招生}
    plan_map: PlanByCampusAndType = {}
    
    # 1. 从市场部年度网络计划表获取SEM和新媒体的计划数据
    from app.models.market.network_plan import MarketNetworkPlan
    
    network_plans = db.query(MarketNetworkPlan).filter(
        and_(
            MarketNetworkPlan.year == str(year),
            MarketNetworkPlan.campus != '',  # 排除总计行
            MarketNetworkPlan.month != 0  # 排除总计月
        )
    ).all()
    
    # 按神殿汇总SEM和新媒体计划
    sem_by_campus: PlanByCampus = {}
    newmedia_by_campus: PlanByCampus = {}
    for network_plan in network_plans:
        campus = network_plan.campus
        if campus not in sem_by_campus:
            sem_by_campus[campus] = {"计划收入": 0.0, "计划招生": 0}
        if campus not in newmedia_by_campus:
            newmedia_by_campus[campus] = {"计划收入": 0.0, "计划招生": 0}
        
        sem_by_campus[campus]["计划收入"] += float(network_plan.sem_plan_income or 0)
        sem_by_campus[campus]["计划招生"] += int(network_plan.sem_plan_signup or 0)
        newmedia_by_campus[campus]["计划收入"] += float(
            network_plan.newmedia_plan_income or 0
        )
        newmedia_by_campus[campus]["计划招生"] += int(
            network_plan.newmedia_plan_signup or 0
        )
    
    for campus, data in sem_by_campus.items():
        plan_map[(campus, "SEM")] = data
    for campus, data in newmedia_by_campus.items():
        plan_map[(campus, "新媒体")] = data
    
    # 2. 从市场部口碑月度计划表获取市场口碑的计划数据
    from app.models.market.monthly_plan_data import 市场部口碑月度计划表
    
    reputation_plans = db.query(
        市场部口碑月度计划表.campus,
        func.sum(市场部口碑月度计划表.plan_income).label('计划收入'),
        func.sum(市场部口碑月度计划表.plan_enrollment).label('计划招生')
    ).filter(
        市场部口碑月度计划表.year == str(year)
    ).group_by(市场部口碑月度计划表.campus).all()
    
    for reputation_plan in reputation_plans:
        plan_map[(reputation_plan.campus, "市场口碑")] = _plan_value(
            reputation_plan.计划收入,
            reputation_plan.计划招生,
        )
    
    # 3. 从市场部网络合作伙伴月度计划表获取合作伙伴的计划数据
    from app.models.market.monthly_plan_data import 市场部网络合作伙伴月度计划表
    
    partner_plans = db.query(
        市场部网络合作伙伴月度计划表.campus,
        func.sum(市场部网络合作伙伴月度计划表.plan_income).label('计划收入'),
        func.sum(市场部网络合作伙伴月度计划表.plan_enrollment).label('计划招生')
    ).filter(
        市场部网络合作伙伴月度计划表.year == str(year)
    ).group_by(市场部网络合作伙伴月度计划表.campus).all()
    
    for partner_plan in partner_plans:
        plan_map[(partner_plan.campus, "合作伙伴")] = _plan_value(
            partner_plan.计划收入,
            partner_plan.计划招生,
        )
    
    # 4. 从市场部免费推广月度计划表获取免费推广的计划数据
    from app.models.market.monthly_plan_data import 市场部免费推广月度计划表
    
    free_promo_plans = db.query(
        市场部免费推广月度计划表.campus,
        func.sum(市场部免费推广月度计划表.plan_income).label('计划收入'),
        func.sum(市场部免费推广月度计划表.plan_enrollment).label('计划招生')
    ).filter(
        市场部免费推广月度计划表.year == str(year)
    ).group_by(市场部免费推广月度计划表.campus).all()
    
    logger.info(f"[财务收入API] 免费推广计划数据查询结果: {len(free_promo_plans)} 条")
    for free_promo_plan in free_promo_plans:
        logger.info(
            f"[财务收入API] 免费推广 - 神殿: {free_promo_plan.campus}, 计划收入: {free_promo_plan.计划收入}, 计划招生: {free_promo_plan.计划招生}"
        )
        plan_map[(free_promo_plan.campus, "免费推广")] = _plan_value(
            free_promo_plan.计划收入,
            free_promo_plan.计划招生,
        )
    
    # 5. 从神殿月度财务数据表获取其他数据类型的计划数据
    other_types = ["口碑", "渠道", "神殿新媒体", "汇总"]
    for data_type in other_types:
        plan_summary = 神殿月度财务数据CRUD.get_all_campus_yearly_plan_summary(
            db, year, data_type
        )
        for plan_total in plan_summary:
            plan_map[(plan_total["神殿"], data_type)] = _plan_value(
                plan_total["计划收入"],
                plan_total["计划招生"],
            )
    
    # 按数据类型分组，并用计划数据覆盖
    grouped: Dict[str, List[最高议事厅核心数据汇总响应]] = {}
    for item in all_data:
        # 将"网络合作伙伴"归类到"合作伙伴"
        data_type = "合作伙伴" if item.数据类型 == "网络合作伙伴" else item.数据类型
        
        if data_type not in grouped:
            grouped[data_type] = []
        resp = 最高议事厅核心数据汇总响应.model_validate(item)
        
        # 修改响应中的数据类型
        resp.数据类型 = data_type
        
        # 用计划数据覆盖 (使用智能神殿名称匹配)
        matched_plan: _PlanValue | None = None
        for (campus_key, dt_key), plan_val in plan_map.items():
            if dt_key == data_type:
                logger.info(f"[财务收入API] 尝试匹配: {campus_key} vs {item.神殿}, 数据类型: {dt_key}, 匹配结果: {match_campus_names(campus_key, item.神殿)}")
                if match_campus_names(campus_key, item.神殿):
                    matched_plan = plan_val
                    logger.info(f"[财务收入API] ✓ 匹配成功: {campus_key} <-> {item.神殿}, 数据类型: {dt_key}, 计划收入: {plan_val['计划收入']}, 计划招生: {plan_val['计划招生']}")
                    break
        if matched_plan:
            resp.计划收入 = Decimal(str(matched_plan["计划收入"]))
            resp.计划招生 = int(matched_plan["计划招生"])
        else:
            logger.warning(f"[财务收入API] ✗ 未匹配到计划数据: 神殿={item.神殿}, 数据类型={data_type}")
        
        grouped[data_type].append(resp)
    
    # 确保所有数据类型都有对应的键
    for data_type in DATA_TYPES:
        if data_type not in grouped:
            grouped[data_type] = []
    
    # 为所有有计划数据但没有实际数据记录的神殿创建虚拟记录
    for data_type in DATA_TYPES:
        # 获取该数据类型已有的神殿列表
        existing_campuses = {item.神殿 for item in grouped[data_type]}
        logger.info(f"[财务收入API] 数据类型 {data_type} 已有神殿: {existing_campuses}")
        
        # 检查plan_map中该数据类型的所有神殿
        plan_campuses = {campus for (campus, dt) in plan_map.keys() if dt == data_type}
        logger.info(f"[财务收入API] 数据类型 {data_type} 计划数据神殿: {plan_campuses}")
        
        # 找出有计划数据但没有实际数据记录的神殿
        for plan_campus in plan_campuses:
            # 规范化神殿名称
            core_name = extract_campus_core_name(plan_campus)
            normalized_campus = f"{core_name}神殿" if not core_name.endswith("神殿") else core_name
            
            # 检查是否已存在该神殿的记录（使用智能匹配）
            campus_exists = any(match_campus_names(normalized_campus, existing) for existing in existing_campuses)
            
            if not campus_exists:
                # 获取该神殿的计划数据
                plan_data = plan_map.get((plan_campus, data_type), _empty_plan_value())
                
                logger.info(f"[财务收入API] 为 {data_type} 创建虚拟记录: 原神殿={plan_campus}, 规范化神殿={normalized_campus}, 计划收入={plan_data['计划收入']}, 计划招生={plan_data['计划招生']}")
                
                virtual_record = 最高议事厅核心数据汇总响应(
                    记录ID=0,
                    年份=year,
                    神殿=normalized_campus,
                    数据类型=data_type,
                    计划收入=Decimal(str(plan_data["计划收入"])),
                    实际收入=Decimal("0"),
                    计划招生=plan_data["计划招生"],
                    实际招生=0,
                    退费人数=0,
                    创建人ID=None,
                    创建人姓名=None,
                    创建时间=None,
                    更新时间=None
                )
                grouped[data_type].append(virtual_record)
    
    # 获取各数据类型的总计（用计划数据覆盖计划字段）
    totals: Dict[str, Dict[str, float | int]] = {}
    # 先按数据类型汇总计划数据
    plan_type_totals: Dict[str, _PlanValue] = {}
    for (_, dt), plan_val in plan_map.items():
        if dt not in plan_type_totals:
            plan_type_totals[dt] = {"计划收入": 0.0, "计划招生": 0}
        plan_type_totals[dt]["计划收入"] += plan_val["计划收入"]
        plan_type_totals[dt]["计划招生"] += plan_val["计划招生"]
    
    for data_type in DATA_TYPES:
        total = 最高议事厅核心数据汇总CRUD.get_total_by_year_and_type(
            db, year, data_type
        )
        # 用计划数据覆盖计划字段
        if data_type in plan_type_totals:
            total["计划收入"] = plan_type_totals[data_type]["计划收入"]
            total["计划招生"] = plan_type_totals[data_type]["计划招生"]
        totals[data_type] = total
    
    return {
        "年份": year,
        "分类数据": grouped,
        "分类总计": totals
    }


@router.post(
    "/mgnt-core-summary",
    response_model=最高议事厅核心数据汇总响应,
    summary="创建/更新最高议事厅核心数据汇总"
)
def upsert_mgnt_core_summary(
    obj_in: 最高议事厅核心数据汇总创建,
    db: Session = Depends(get_db)
):
    """
    创建或更新最高议事厅核心数据汇总
    通常应该通过神殿月度数据自动同步，此API用于直接维护
    """
    try:
        record = 最高议事厅核心数据汇总CRUD.upsert(db, obj_in)
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"操作失败: {str(e)}") from e


@router.post(
    "/mgnt-core-summary/sync",
    response_model=dict,
    summary="从神殿月度数据同步最高议事厅汇总"
)
def sync_mgnt_core_summary(
    year: int = Query(..., description="年份"),
    campus: Optional[str] = Query(None, description="神殿名称（可选，不填则同步所有神殿）"),
    data_type: Optional[str] = Query(None, description="数据类型（可选，不填则同步所有类型）"),
    db: Session = Depends(get_db)
):
    """
    从神殿月度数据同步最高议事厅汇总数据
    
    - 可以指定神殿和数据类型进行精确同步
    - 不指定则同步所有
    """
    try:
        synced = []
        
        # 获取需要同步的神殿和数据类型组合
        items, _ = 神殿月度财务数据CRUD.get_multi(
            db, year=year, campus=campus, data_type=data_type, limit=10000
        )
        
        # 获取唯一的(神殿, 数据类型)组合
        sync_keys = set()
        for item in items:
            sync_keys.add((item.神殿, item.数据类型))
        
        # 执行同步
        for c, dt in sync_keys:
            result = 最高议事厅核心数据汇总CRUD.sync_from_monthly_data(db, year, c, dt)
            synced.append({
                "神殿": c,
                "数据类型": dt,
                "记录ID": result.记录ID
            })
        
        return {
            "同步数量": len(synced),
            "同步记录": synced
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}") from e


@router.get(
    "/data-types",
    response_model=List[str],
    summary="获取支持的数据类型列表"
)
def get_data_types():
    """获取支持的数据类型列表"""
    return DATA_TYPES


# ==================== 自动读取咨询量系统数据 API ====================

@router.get(
    "/auto-stats/monthly",
    response_model=dict,
    summary="从咨询量系统自动获取月度实际数据"
)
def get_auto_stats_monthly(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    从咨询量录入系统自动获取某神殿某年某数据类型的月度实际数据
    
    返回数据包含：
    - 咨询总量（有效记录数）
    - 上门量（是否上门=1）
    - 实际招生（是否报名=1）
    - 退费人数（是否退费=1）
    - 实际收入（缴费金额总和）
    - 退费金额（退费金额总和）
    
    数据类型与量来源映射：
    - SEM -> 量来源="网络" 且 媒体来源 不属于 新媒体平台
    - 新媒体 -> 量来源="网络" 且 媒体来源 属于 新媒体平台
    - 市场口碑 -> 量来源="口碑" 且 媒体来源="市场口碑"
    - 合作伙伴 -> 量来源="合作伙伴"
    - 口碑 -> 量来源="口碑"
    - 渠道 -> 量来源="渠道"
    - 神殿新媒体 -> 量来源="神殿新媒体"
    - 汇总 -> 所有有效记录
    """
    # 基础查询 - 有效记录（排除无效量和不算量）
    base_query = db.query(咨询量明细表).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        build_campus_filter(咨询量明细表.神殿, campus),
        extract('year', 咨询量明细表.登记日期) == year
    )
    
    # 应用数据类型筛选
    base_query = build_data_type_filter(db, data_type, base_query)
    
    # 按月份统计
    月度统计查询 = db.query(
        extract('month', 咨询量明细表.登记日期).label('月份'),
        func.count(咨询量明细表.记录ID).label('咨询总量'),
        func.sum(func.cast(咨询量明细表.是否上门 == 1, Integer)).label('上门量'),
        func.sum(func.cast(咨询量明细表.是否报名 == 1, Integer)).label('实际招生'),
        func.sum(func.cast(咨询量明细表.是否订座 == 1, Integer)).label('订座量'),
        func.sum(func.cast(咨询量明细表.是否退费 == 1, Integer)).label('退费人数'),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), func.coalesce(咨询量明细表.缴费金额, 0)), else_=0)).label('实际收入'),
        func.sum(func.coalesce(咨询量明细表.退费金额, 0)).label('退费金额'),
    ).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        build_campus_filter(咨询量明细表.神殿, campus),
        extract('year', 咨询量明细表.登记日期) == year
    )
    
    # 应用数据类型筛选
    月度统计查询 = build_data_type_filter(db, data_type, 月度统计查询)
    月度统计结果 = 月度统计查询.group_by(extract('month', 咨询量明细表.登记日期)).all()
    
    # 构建返回数据
    月度数据 = {}
    for row in 月度统计结果:
        月份 = int(row.月份)
        月度数据[月份] = {
            "月份": 月份,
            "咨询总量": row.咨询总量 or 0,
            "上门量": int(row.上门量 or 0),
            "实际招生": int(row.实际招生 or 0),
            "订座量": int(row.订座量 or 0),
            "退费人数": int(row.退费人数 or 0),
            "实际收入": float(row.实际收入 or 0),
            "退费金额": float(row.退费金额 or 0),
        }
    
    # 填充空月份
    for m in range(1, 13):
        if m not in 月度数据:
            月度数据[m] = {
                "月份": m, 
                "咨询总量": 0, 
                "上门量": 0, 
                "实际招生": 0, 
                "订座量": 0,
                "退费人数": 0,
                "实际收入": 0,
                "退费金额": 0,
            }
    
    # 计算年度汇总
    年度汇总 = {
        "咨询总量": sum(d["咨询总量"] for d in 月度数据.values()),
        "上门量": sum(d["上门量"] for d in 月度数据.values()),
        "实际招生": sum(d["实际招生"] for d in 月度数据.values()),
        "订座量": sum(d["订座量"] for d in 月度数据.values()),
        "退费人数": sum(d["退费人数"] for d in 月度数据.values()),
        "实际收入": sum(d["实际收入"] for d in 月度数据.values()),
        "退费金额": sum(d["退费金额"] for d in 月度数据.values()),
    }
    
    return {
        "success": True,
        "data": {
            "年份": year,
            "神殿": campus,
            "数据类型": data_type,
            "月度数据": [月度数据[m] for m in range(1, 13)],
            "年度汇总": 年度汇总
        }
    }


@router.get(
    "/auto-stats/yearly-by-campus",
    response_model=dict,
    summary="从咨询量系统自动获取各神殿年度汇总"
)
def get_auto_stats_yearly_by_campus(
    year: int = Query(..., description="年份"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    从咨询量录入系统自动获取某年某数据类型所有神殿的年度汇总数据
    用于TAB1最高议事厅核心数据汇总的自动填充
    
    返回每个神殿的：咨询总量、上门量、实际招生、退费人数、实际收入、退费金额
    """
    # 按神殿统计
    神殿统计查询 = db.query(
        咨询量明细表.神殿,
        func.count(咨询量明细表.记录ID).label('咨询总量'),
        func.sum(func.cast(咨询量明细表.是否上门 == 1, Integer)).label('上门量'),
        func.sum(func.cast(咨询量明细表.是否报名 == 1, Integer)).label('实际招生'),
        func.sum(func.cast(咨询量明细表.是否订座 == 1, Integer)).label('订座量'),
        func.sum(func.cast(咨询量明细表.是否退费 == 1, Integer)).label('退费人数'),
        func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), func.coalesce(咨询量明细表.缴费金额, 0)), else_=0)).label('实际收入'),
        func.sum(func.coalesce(咨询量明细表.退费金额, 0)).label('退费金额'),
    ).filter(
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        extract('year', 咨询量明细表.登记日期) == year
    )
    
    # 应用数据类型筛选
    神殿统计查询 = build_data_type_filter(db, data_type, 神殿统计查询)
    神殿统计结果 = 神殿统计查询.group_by(咨询量明细表.神殿).all()
    
    # 构建返回数据
    神殿数据列表 = []
    for row in 神殿统计结果:
        if row.神殿:  # 排除空神殿
            神殿数据列表.append({
                "神殿": row.神殿,
                "咨询总量": row.咨询总量 or 0,
                "上门量": int(row.上门量 or 0),
                "实际招生": int(row.实际招生 or 0),
                "订座量": int(row.订座量 or 0),
                "退费人数": int(row.退费人数 or 0),
                "实际收入": float(row.实际收入 or 0),
                "退费金额": float(row.退费金额 or 0),
            })
    
    # 计算合计
    合计 = {
        "神殿": "合计",
        "咨询总量": sum(d["咨询总量"] for d in 神殿数据列表),
        "上门量": sum(d["上门量"] for d in 神殿数据列表),
        "实际招生": sum(d["实际招生"] for d in 神殿数据列表),
        "订座量": sum(d["订座量"] for d in 神殿数据列表),
        "退费人数": sum(d["退费人数"] for d in 神殿数据列表),
        "实际收入": sum(d["实际收入"] for d in 神殿数据列表),
        "退费金额": sum(d["退费金额"] for d in 神殿数据列表),
    }
    
    return {
        "success": True,
        "data": {
            "年份": year,
            "数据类型": data_type,
            "神殿数据": 神殿数据列表,
            "合计": 合计
        }
    }


@router.get(
    "/auto-stats/all-data-types",
    response_model=dict,
    summary="从咨询量系统自动获取所有数据类型的神殿年度汇总"
)
def get_auto_stats_all_data_types(
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db)
):
    """
    从咨询量录入系统自动获取某年所有数据类型所有神殿的年度汇总数据
    用于TAB1最高议事厅核心数据汇总的完整数据展示
    """
    result = {}
    
    for data_type in DATA_TYPES:
        # 按神殿统计
        神殿统计 = db.query(
            咨询量明细表.神殿,
            func.count(咨询量明细表.记录ID).label('咨询总量'),
            func.sum(func.cast(咨询量明细表.是否上门 == 1, Integer)).label('上门量'),
            func.sum(func.cast(咨询量明细表.是否报名 == 1, Integer)).label('实际招生'),
            func.sum(func.cast(咨询量明细表.是否订座 == 1, Integer)).label('订座量'),
            func.sum(func.cast(咨询量明细表.是否退费 == 1, Integer)).label('退费人数'),
            func.sum(case((or_(咨询量明细表.是否报名 == 1, 咨询量明细表.是否订座 == 1), func.coalesce(咨询量明细表.缴费金额, 0)), else_=0)).label('实际收入'),
            func.sum(func.coalesce(咨询量明细表.退费金额, 0)).label('退费金额'),
        ).filter(
            or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
            or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
            extract('year', 咨询量明细表.登记日期) == year
        )
        
        # 应用数据类型筛选
        神殿统计 = build_data_type_filter(db, data_type, 神殿统计)
        神殿统计结果 = 神殿统计.group_by(咨询量明细表.神殿).all()
        
        # 构建返回数据
        神殿数据列表 = []
        for row in 神殿统计结果:
            if row.神殿:  # 排除空神殿
                神殿数据列表.append({
                    "神殿": row.神殿,
                    "咨询总量": row.咨询总量 or 0,
                    "上门量": int(row.上门量 or 0),
                    "实际招生": int(row.实际招生 or 0),
                    "订座量": int(row.订座量 or 0),
                    "退费人数": int(row.退费人数 or 0),
                    "实际收入": float(row.实际收入 or 0),
                    "退费金额": float(row.退费金额 or 0),
                })
        
        # 计算合计
        合计 = {
            "神殿": "合计",
            "咨询总量": sum(d["咨询总量"] for d in 神殿数据列表),
            "上门量": sum(d["上门量"] for d in 神殿数据列表),
            "实际招生": sum(d["实际招生"] for d in 神殿数据列表),
            "订座量": sum(d["订座量"] for d in 神殿数据列表),
            "退费人数": sum(d["退费人数"] for d in 神殿数据列表),
            "实际收入": sum(d["实际收入"] for d in 神殿数据列表),
            "退费金额": sum(d["退费金额"] for d in 神殿数据列表),
        }
        
        result[data_type] = {
            "神殿数据": 神殿数据列表,
            "合计": 合计
        }
    
    return {
        "success": True,
        "data": {
            "年份": year,
            "分类数据": result
        }
    }


@router.get(
    "/combined-monthly-data",
    response_model=dict,
    summary="获取合并后的月度数据（计划+自动实际数据）"
)
def get_combined_monthly_data(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    获取合并后的月度数据：
    - 计划收入/计划招生：从数据库读取（手动输入）
    - 实际收入/实际招生/退费人数：从咨询量系统自动计算
    
    同时返回转化率计算结果：
    - 总转化率 = 实际招生 / 咨询总量
    - 当面转化率 = 实际招生 / 上门量
    - 电转门 = 上门量 / 咨询总量
    """
    # 1. 获取计划数据（从统一的咨询师月度计划数据聚合到神殿级）
    plan_totals = ConsultantMonthlyPlanCRUD.get_campus_monthly_plan_totals(
        db, year=year, campus=campus, data_type=data_type
    )
    plan_map = {item["月份"]: item for item in plan_totals}
    
    # 2. 获取自动统计的实际数据（异常时降级为空数据，避免 500）
    auto_monthly: MonthlyAutoMap = {}
    try:
        auto_stats = get_auto_stats_monthly(year=year, campus=campus, data_type=data_type, db=db)
        auto_monthly = {
            item["月份"]: item for item in _extract_monthly_rows(auto_stats)
        }
    except Exception as exc:
        # 保持合并接口可用，自动数据缺失时使用 0 值
        print(f"[combined-monthly-data] auto stats failed: {exc}")
    
    # 3. 合并数据
    combined_monthly: List[_CombinedMonthlyRow] = []
    for month in range(1, 13):
        plan = plan_map.get(month)
        auto = auto_monthly.get(month, _empty_monthly_auto_row(month))
        combined_monthly.append(_build_combined_monthly_row(month, plan, auto))
    
    # 计算年度汇总
    年度汇总 = _build_annual_summary(combined_monthly)
    
    return {
        "success": True,
        "data": {
            "年份": year,
            "神殿": campus,
            "数据类型": data_type,
            "月度数据": combined_monthly,
            "年度汇总": 年度汇总
        }
    }


# ==================== 从市场表获取数据 API ====================

# 数据类型与数据来源映射
# "来源市场表" 的数据类型
MARKET_SOURCE_DATA_TYPES = ["SEM", "新媒体", "市场口碑", "网络合作伙伴"]
# "自定义" (从咨询量系统) 的数据类型
CONSULT_SOURCE_DATA_TYPES = ["口碑", "渠道", "神殿新媒体"]


def get_market_monthly_stats(db: Session, year: int, campus: str, data_type: str):
    """从市场表获取月度统计数据"""
    
    月度数据 = {}
    
    if data_type == "SEM":
        # SEM: 从百度推广 + 其他平台汇总
        # 百度推广
        百度统计 = db.query(
            extract('month', 市场部SEM百度推广日度数据表.日期).label('月份'),
            func.sum(市场部SEM百度推广日度数据表.百度收入).label('实际收入'),
            func.sum(市场部SEM百度推广日度数据表.退费数).label('退费人数'),
            func.sum(市场部SEM百度推广日度数据表.净报名).label('实际招生'),
            func.sum(市场部SEM百度推广日度数据表.上门人数).label('上门量'),
            func.sum(市场部SEM百度推广日度数据表.百度咨询量).label('咨询总量'),
        ).filter(
            市场部SEM百度推广日度数据表.神殿 == campus,
            extract('year', 市场部SEM百度推广日度数据表.日期) == year
        ).group_by(extract('month', 市场部SEM百度推广日度数据表.日期)).all()
        
        for row in 百度统计:
            月份 = int(row.月份)
            月度数据[月份] = {
                "月份": 月份,
                "实际收入": float(row.实际收入 or 0),
                "退费人数": int(row.退费人数 or 0),
                "实际招生": int(row.实际招生 or 0),
                "上门量": int(row.上门量 or 0),
                "咨询总量": int(row.咨询总量 or 0),
                "退费金额": 0,  # 市场表不统计退费金额
            }
        
        # 合并其他平台数据
        其他统计 = db.query(
            extract('month', 市场部SEM其他平台日度数据表.日期).label('月份'),
            func.sum(市场部SEM其他平台日度数据表.其他收入).label('实际收入'),
            func.sum(市场部SEM其他平台日度数据表.退费数).label('退费人数'),
            func.sum(市场部SEM其他平台日度数据表.净报名).label('实际招生'),
            func.sum(市场部SEM其他平台日度数据表.上门人数).label('上门量'),
            func.sum(市场部SEM其他平台日度数据表.其他咨询量).label('咨询总量'),
        ).filter(
            市场部SEM其他平台日度数据表.神殿 == campus,
            extract('year', 市场部SEM其他平台日度数据表.日期) == year
        ).group_by(extract('month', 市场部SEM其他平台日度数据表.日期)).all()
        
        for row in 其他统计:
            月份 = int(row.月份)
            if 月份 in 月度数据:
                月度数据[月份]["实际收入"] += float(row.实际收入 or 0)
                月度数据[月份]["退费人数"] += int(row.退费人数 or 0)
                月度数据[月份]["实际招生"] += int(row.实际招生 or 0)
                月度数据[月份]["上门量"] += int(row.上门量 or 0)
                月度数据[月份]["咨询总量"] += int(row.咨询总量 or 0)
            else:
                月度数据[月份] = {
                    "月份": 月份,
                    "实际收入": float(row.实际收入 or 0),
                    "退费人数": int(row.退费人数 or 0),
                    "实际招生": int(row.实际招生 or 0),
                    "上门量": int(row.上门量 or 0),
                    "咨询总量": int(row.咨询总量 or 0),
                    "退费金额": 0,
                }
                
    elif data_type == "新媒体":
        # 新媒体: 抖音 + 快手 + 小红书 + B站 + 微信视频号
        平台统计列表 = [
            (
                "抖音",
                db.query(
                    extract('month', 市场部抖音日度数据表.日期).label('月份'),
                    func.sum(市场部抖音日度数据表.抖音实际收入).label('实际收入'),
                    func.sum(市场部抖音日度数据表.退费数).label('退费人数'),
                    func.sum(市场部抖音日度数据表.净报名).label('实际招生'),
                    func.sum(市场部抖音日度数据表.上门人数).label('上门量'),
                    func.sum(市场部抖音日度数据表.抖音咨询量).label('咨询总量'),
                )
                .filter(
                    市场部抖音日度数据表.神殿 == campus,
                    extract('year', 市场部抖音日度数据表.日期) == year,
                )
                .group_by(extract('month', 市场部抖音日度数据表.日期))
                .all(),
            ),
            (
                "快手",
                db.query(
                    extract('month', 市场部快手日度数据表.日期).label('月份'),
                    func.sum(市场部快手日度数据表.快手实际收入).label('实际收入'),
                    func.sum(市场部快手日度数据表.退费数).label('退费人数'),
                    func.sum(市场部快手日度数据表.净报名).label('实际招生'),
                    func.sum(市场部快手日度数据表.上门人数).label('上门量'),
                    func.sum(市场部快手日度数据表.快手咨询量).label('咨询总量'),
                )
                .filter(
                    市场部快手日度数据表.神殿 == campus,
                    extract('year', 市场部快手日度数据表.日期) == year,
                )
                .group_by(extract('month', 市场部快手日度数据表.日期))
                .all(),
            ),
            (
                "小红书",
                db.query(
                    extract('month', 市场部小红书日度数据表.日期).label('月份'),
                    func.sum(市场部小红书日度数据表.小红书实际收入).label('实际收入'),
                    func.sum(市场部小红书日度数据表.退费数).label('退费人数'),
                    func.sum(市场部小红书日度数据表.净报名).label('实际招生'),
                    func.sum(市场部小红书日度数据表.上门人数).label('上门量'),
                    func.sum(市场部小红书日度数据表.小红书总量).label('咨询总量'),
                )
                .filter(
                    市场部小红书日度数据表.神殿 == campus,
                    extract('year', 市场部小红书日度数据表.日期) == year,
                )
                .group_by(extract('month', 市场部小红书日度数据表.日期))
                .all(),
            ),
            (
                "B站",
                db.query(
                    extract('month', 市场部B站日度数据表.日期).label('月份'),
                    func.sum(市场部B站日度数据表.B站实际收入).label('实际收入'),
                    func.sum(市场部B站日度数据表.退费数).label('退费人数'),
                    func.sum(市场部B站日度数据表.净报名).label('实际招生'),
                    func.sum(市场部B站日度数据表.上门人数).label('上门量'),
                    func.sum(市场部B站日度数据表.B站咨询量).label('咨询总量'),
                )
                .filter(
                    市场部B站日度数据表.神殿 == campus,
                    extract('year', 市场部B站日度数据表.日期) == year,
                )
                .group_by(extract('month', 市场部B站日度数据表.日期))
                .all(),
            ),
            (
                "微信视频号",
                db.query(
                    extract('month', 市场部微信视频号日度数据表.日期).label('月份'),
                    func.sum(市场部微信视频号日度数据表.微信视频号实际收入).label('实际收入'),
                    func.sum(市场部微信视频号日度数据表.退费数).label('退费人数'),
                    func.sum(市场部微信视频号日度数据表.净报名).label('实际招生'),
                    func.sum(市场部微信视频号日度数据表.上门人数).label('上门量'),
                    func.sum(市场部微信视频号日度数据表.微信视频号总量).label('咨询总量'),
                )
                .filter(
                    市场部微信视频号日度数据表.神殿 == campus,
                    extract('year', 市场部微信视频号日度数据表.日期) == year,
                )
                .group_by(extract('month', 市场部微信视频号日度数据表.日期))
                .all(),
            ),
        ]

        for platform_name, platform_stats in 平台统计列表:
            try:
                for row in platform_stats:
                    月份 = int(row.月份)
                    if 月份 in 月度数据:
                        月度数据[月份]["实际收入"] += float(row.实际收入 or 0)
                        月度数据[月份]["退费人数"] += int(row.退费人数 or 0)
                        月度数据[月份]["实际招生"] += int(row.实际招生 or 0)
                        月度数据[月份]["上门量"] += int(row.上门量 or 0)
                        月度数据[月份]["咨询总量"] += int(row.咨询总量 or 0)
                    else:
                        月度数据[月份] = {
                            "月份": 月份,
                            "实际收入": float(row.实际收入 or 0),
                            "退费人数": int(row.退费人数 or 0),
                            "实际招生": int(row.实际招生 or 0),
                            "上门量": int(row.上门量 or 0),
                            "咨询总量": int(row.咨询总量 or 0),
                            "退费金额": 0,
                        }
            except Exception as e:
                print(f"获取{platform_name}数据失败: {e}")
        
    elif data_type in ["市场口碑", "网络合作伙伴"]:
        # 市场口碑 和 网络合作伙伴: 从网络合作伙伴日度数据表
        统计 = db.query(
            extract('month', 市场部网络合作伙伴日度数据表.日期).label('月份'),
            func.sum(市场部网络合作伙伴日度数据表.合作伙伴实际收入).label('实际收入'),
            func.sum(市场部网络合作伙伴日度数据表.退费数).label('退费人数'),
            func.sum(市场部网络合作伙伴日度数据表.净报名).label('实际招生'),
            func.sum(市场部网络合作伙伴日度数据表.上门人数).label('上门量'),
            func.sum(市场部网络合作伙伴日度数据表.实际总咨询量).label('咨询总量'),
        ).filter(
            市场部网络合作伙伴日度数据表.神殿 == campus,
            extract('year', 市场部网络合作伙伴日度数据表.日期) == year
        ).group_by(extract('month', 市场部网络合作伙伴日度数据表.日期)).all()
        
        for row in 统计:
            月份 = int(row.月份)
            月度数据[月份] = {
                "月份": 月份,
                "实际收入": float(row.实际收入 or 0),
                "退费人数": int(row.退费人数 or 0),
                "实际招生": int(row.实际招生 or 0),
                "上门量": int(row.上门量 or 0),
                "咨询总量": int(row.咨询总量 or 0),
                "退费金额": 0,
            }
    
    # 填充空月份
    for m in range(1, 13):
        if m not in 月度数据:
            月度数据[m] = {
                "月份": m,
                "实际收入": 0,
                "退费人数": 0,
                "实际招生": 0,
                "上门量": 0,
                "咨询总量": 0,
                "退费金额": 0,
            }
    
    return 月度数据


@router.get(
    "/market-stats/monthly",
    response_model=dict,
    summary="从市场表获取月度实际数据"
)
def get_market_stats_monthly(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    data_type: str = Query(..., description="数据类型: SEM/新媒体/市场口碑/网络合作伙伴"),
    db: Session = Depends(get_db)
):
    """
    从市场部数据表自动获取某神殿某年某数据类型的月度实际数据
    
    数据来源：
    - SEM: 市场部SEM百度推广日度数据表 + 市场部SEM其他平台日度数据表
    - 新媒体: 市场部抖音/快手/小红书/B站/微信视频号日度数据表
    - 市场口碑/网络合作伙伴: 市场部网络合作伙伴日度数据表
    
    返回数据包含：实际收入、退费人数、实际招生、上门量、咨询总量
    """
    if data_type not in MARKET_SOURCE_DATA_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"数据类型 {data_type} 不支持从市场表获取，支持的类型: {MARKET_SOURCE_DATA_TYPES}"
        )
    
    try:
        月度数据 = get_market_monthly_stats(db, year, campus, data_type)
        
        # 计算年度汇总
        年度汇总 = {
            "实际收入": sum(d["实际收入"] for d in 月度数据.values()),
            "退费人数": sum(d["退费人数"] for d in 月度数据.values()),
            "实际招生": sum(d["实际招生"] for d in 月度数据.values()),
            "上门量": sum(d["上门量"] for d in 月度数据.values()),
            "咨询总量": sum(d["咨询总量"] for d in 月度数据.values()),
            "退费金额": 0,
        }
        
        return {
            "success": True,
            "data": {
                "年份": year,
                "神殿": campus,
                "数据类型": data_type,
                "数据来源": "市场表",
                "月度数据": [月度数据[m] for m in range(1, 13)],
                "年度汇总": 年度汇总
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取市场数据失败: {str(e)}") from e


@router.get(
    "/combined-monthly-data-v2",
    response_model=dict,
    summary="获取合并后的月度数据V2（计划+自动实际数据，支持市场表数据源）"
)
def get_combined_monthly_data_v2(
    year: int = Query(..., description="年份"),
    campus: str = Query(..., description="神殿名称"),
    data_type: str = Query(..., description="数据类型"),
    db: Session = Depends(get_db)
):
    """
    获取合并后的月度数据V2版本：
    - 计划收入/计划招生：
      * SEM、新媒体：从市场部年度网络计划表获取
      * 市场口碑、网络合作伙伴：从市场部月度详细计划表获取
      * 其他：从神殿月度财务数据表读取
    - 实际收入/实际招生/退费人数：统一从咨询量录入系统自动读取
    
    所有数据类型的实际数据均来源于咨询量明细表，通过量来源和媒体来源筛选。
    同时返回数据来源标识和转化率计算结果。
    """
    # 1. 获取计划数据（根据数据类型从不同来源获取）
    plan_map = {}
    
    if data_type in ["SEM", "新媒体"]:
        # SEM和新媒体：从市场部年度网络计划表获取
        from app.models.market.network_plan import MarketNetworkPlan
        
        # 调试日志
        logger.info(f"[财务收入API] 查询市场部年度网络计划表: year={year}, campus={campus}, data_type={data_type}")
        
        # 先尝试精确匹配
        network_plans = db.query(MarketNetworkPlan).filter(
            and_(
                MarketNetworkPlan.year == str(year),
                MarketNetworkPlan.campus == campus
            )
        ).order_by(MarketNetworkPlan.month).all()
        
        # 如果精确匹配没有结果，尝试模糊匹配
        if not network_plans:
            logger.info("[财务收入API] 精确匹配无结果，尝试模糊匹配")
            network_plans = db.query(MarketNetworkPlan).filter(
                and_(
                    MarketNetworkPlan.year == str(year),
                    MarketNetworkPlan.campus.like(f"%{campus}%")
                )
            ).order_by(MarketNetworkPlan.month).all()
            
            if network_plans:
                logger.info(f"[财务收入API] 模糊匹配成功，匹配到的神殿名: {network_plans[0].campus}")
        
        logger.info(f"[财务收入API] 查询到 {len(network_plans)} 条记录")
        
        for network_plan_row in network_plans:
            if network_plan_row.month == 0:  # 跳过总计行
                continue
            month = network_plan_row.month
            if data_type == "SEM":
                plan_map[month] = {
                    "计划收入": _to_float(network_plan_row.sem_plan_income),
                    "计划招生": _to_int(network_plan_row.sem_plan_signup)
                }
                logger.info(f"[财务收入API] SEM月份{month}: 计划收入={network_plan_row.sem_plan_income}, 计划招生={network_plan_row.sem_plan_signup}")
            elif data_type == "新媒体":
                plan_map[month] = {
                    "计划收入": _to_float(network_plan_row.newmedia_plan_income),
                    "计划招生": _to_int(network_plan_row.newmedia_plan_signup)
                }
                logger.info(f"[财务收入API] 新媒体月份{month}: 计划收入={network_plan_row.newmedia_plan_income}, 计划招生={network_plan_row.newmedia_plan_signup}")
    
    elif data_type == "市场口碑":
        # 市场口碑：从市场部口碑月度计划表获取
        from app.models.market.monthly_plan_data import 市场部口碑月度计划表
        
        logger.info(f"[财务收入API] 查询市场部口碑月度计划表: year={year}, campus={campus}")
        
        # 先尝试精确匹配
        reputation_plans = db.query(市场部口碑月度计划表).filter(
            and_(
                市场部口碑月度计划表.year == str(year),
                市场部口碑月度计划表.campus == campus
            )
        ).order_by(市场部口碑月度计划表.month).all()
        
        # 如果精确匹配没有结果，尝试模糊匹配
        if not reputation_plans:
            logger.info("[财务收入API] 精确匹配无结果，尝试模糊匹配")
            reputation_plans = db.query(市场部口碑月度计划表).filter(
                and_(
                    市场部口碑月度计划表.year == str(year),
                    市场部口碑月度计划表.campus.like(f"%{campus}%")
                )
            ).order_by(市场部口碑月度计划表.month).all()
            
            if reputation_plans:
                logger.info(f"[财务收入API] 模糊匹配成功，匹配到的神殿名: {reputation_plans[0].campus}")
        
        logger.info(f"[财务收入API] 查询到 {len(reputation_plans)} 条记录")
        
        for reputation_plan_row in reputation_plans:
            plan_map[reputation_plan_row.month] = {
                "计划收入": _to_float(reputation_plan_row.plan_income),
                "计划招生": _to_int(reputation_plan_row.plan_enrollment)
            }
            logger.info(f"[财务收入API] 市场口碑月份{reputation_plan_row.month}: 计划收入={reputation_plan_row.plan_income}, 计划招生={reputation_plan_row.plan_enrollment}")
    
    elif data_type == "网络合作伙伴":
        # 网络合作伙伴：从市场部网络合作伙伴月度计划表汇总获取
        from app.models.market.monthly_plan_data import 市场部网络合作伙伴月度计划表
        
        logger.info(f"[财务收入API] 查询市场部网络合作伙伴月度计划表: year={year}, campus={campus}")
        
        # 先尝试精确匹配
        partner_plans = db.query(
            市场部网络合作伙伴月度计划表.month,
            func.sum(市场部网络合作伙伴月度计划表.plan_income).label('plan_income'),
            func.sum(市场部网络合作伙伴月度计划表.plan_enrollment).label('plan_enrollment')
        ).filter(
            and_(
                市场部网络合作伙伴月度计划表.year == str(year),
                市场部网络合作伙伴月度计划表.campus == campus
            )
        ).group_by(市场部网络合作伙伴月度计划表.month).all()
        
        # 如果精确匹配没有结果，尝试模糊匹配
        if not partner_plans:
            logger.info("[财务收入API] 精确匹配无结果，尝试模糊匹配")
            partner_plans = db.query(
                市场部网络合作伙伴月度计划表.month,
                func.sum(市场部网络合作伙伴月度计划表.plan_income).label('plan_income'),
                func.sum(市场部网络合作伙伴月度计划表.plan_enrollment).label('plan_enrollment')
            ).filter(
                and_(
                    市场部网络合作伙伴月度计划表.year == str(year),
                    市场部网络合作伙伴月度计划表.campus.like(f"%{campus}%")
                )
            ).group_by(市场部网络合作伙伴月度计划表.month).all()
            
            if partner_plans:
                logger.info("[财务收入API] 模糊匹配成功")
        
        logger.info(f"[财务收入API] 查询到 {len(partner_plans)} 条记录")
        
        for partner_plan_row in partner_plans:
            plan_map[partner_plan_row.month] = {
                "计划收入": _to_float(partner_plan_row.plan_income),
                "计划招生": _to_int(partner_plan_row.plan_enrollment)
            }
            logger.info(f"[财务收入API] 网络合作伙伴月份{partner_plan_row.month}: 计划收入={partner_plan_row.plan_income}, 计划招生={partner_plan_row.plan_enrollment}")
    
    else:
        # 其他数据类型：从神殿月度财务数据表读取
        logger.info(f"[财务收入API] 从神殿月度财务数据表读取: year={year}, campus={campus}, data_type={data_type}")
        
        monthly_plan_data = 神殿月度财务数据CRUD.get_campus_monthly_data(
            db, year, campus, data_type
        )
        
        logger.info(f"[财务收入API] 查询到 {len(monthly_plan_data)} 条记录")
        
        plan_map = {
            item.月份: {
                "计划收入": _to_float(item.计划收入),
                "计划招生": _to_int(item.计划招生)
            }
            for item in monthly_plan_data
        }
    
    logger.info(f"[财务收入API] plan_map 最终结果: {plan_map}")
    
    # 2. 从咨询量录入系统获取实际数据（所有数据类型统一从咨询量系统读取）
    auto_monthly = {}
    data_source = "咨询量系统"
    
    try:
        auto_stats = get_auto_stats_monthly(year=year, campus=campus, data_type=data_type, db=db)
        auto_monthly = {
            item["月份"]: item for item in _extract_monthly_rows(auto_stats)
        }
    except Exception as exc:
        print(f"[combined-monthly-data-v2] auto stats failed: {exc}")
    
    # 3. 合并数据
    combined_monthly: List[_CombinedMonthlyRow] = []
    for month in range(1, 13):
        plan = plan_map.get(month, {})
        auto = auto_monthly.get(month, _empty_monthly_auto_row(month))
        combined_monthly.append(_build_combined_monthly_row(month, plan, auto))
    
    # 计算年度汇总
    年度汇总 = _build_annual_summary(combined_monthly)
    
    return {
        "success": True,
        "data": {
            "年份": year,
            "神殿": campus,
            "数据类型": data_type,
            "数据来源": data_source,
            "月度数据": combined_monthly,
            "年度汇总": 年度汇总
        }
    }
