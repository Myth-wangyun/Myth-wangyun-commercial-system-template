"""
004神殿各类人群数据汇总 API
TAB1 - 网络各学历、各状态分析
TAB2 - 网络各咨询师、各学历、各状态分析

按学历×状态分组统计咨询量、上门量、报名量，
分两大渠道组（网络其他推广 / 网络新媒体），并计算合计与占比。
TAB2在TAB1基础上增加按咨询师维度拆分统计。

网络其他推广 = 量来源=网络 且 媒体来源 不属于 新媒体平台来源列表
网络新媒体 = 量来源=网络 且 媒体来源 属于 新媒体平台来源列表（如抨音/快手/小红书等）

学历分组:
  大学生 = 大专 + 本科 + 本科以上
  本科及以上 = 本科 + 本科以上
  大专 = 大专
  高中、三校合计 = 高中 + 三校生
  高中 = 高中
  三校生 = 三校生
  初中 = 初中
  空白 = 学历为空

状态: 应届 / 在读 / 在职 / 待业 / 空白(状态为空)
"""

from datetime import date
from typing import Any, Dict, List, Optional, Sequence

from app.core.database import get_db
from app.models.consult.consultation_record import 咨询量明细表
from app.models.media_source_config import MediaCategory
from app.models.user import User
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, func, literal, or_
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== 辅助函数 ====================

def _get_new_media_sources(db: Session) -> List[str]:
    """获取新媒体平台的媒体来源列表"""
    try:
        categories = db.query(MediaCategory).filter(
            MediaCategory.name == "网络",
            MediaCategory.is_active == True
        ).first()

        if categories:
            for source in categories.media_sources:
                if source.name == "新媒体平台" and source.is_active:
                    return [detail.name for detail in source.media_details if detail.is_active]
        return []
    except Exception:
        return ["抖音", "快手", "小红书", "微信公众号", "微博", "B站"]


def _build_campus_filter(column, campus: str):
    """神殿名称模糊匹配（兼容'主神殿'与'河北主神殿'）"""
    core_name = campus.replace("神殿", "").strip()
    return column.like(f"%{core_name}%")


def _safe_rate(numerator: int, denominator: int) -> Optional[float]:
    """安全计算百分比，分母为 0 时返回 None（对应 Excel 中的 '-'）"""
    if denominator == 0:
        return None
    return round(numerator / denominator * 100, 2)


# 学历分组定义
# key = 显示名称, value = DB中学历值列表 (None 表示空白)
# 注意：DB中存在复合值如 "大专应届", "高中在读", "初中待业" 等，必须包含在内
EDUCATION_GROUPS = [
    ("大学生", ["大专", "大专应届", "本科", "本科待业", "本科以上", "硕士", "研究生", "博士"]),
    ("本科及以上", ["本科", "本科待业", "本科以上", "硕士", "研究生", "博士"]),
    ("大专", ["大专", "大专应届"]),
    ("高中、三校合计", ["高中", "高中在读", "高中应届", "三校生"]),
    ("高中", ["高中", "高中在读", "高中应届"]),
    ("三校生", ["三校生"]),
    ("初中", ["初中", "初中待业", "初中在读"]),
]

STATUS_LIST = ["应届", "在读", "在职", "待业", "空白"]  # 空白=目前状态为空


# ==================== 核心查询 ====================

def _query_stats(
    db: Session,
    campus: str,
    start_date: Optional[date],
    end_date: Optional[date],
    channel_filter,
    education_values: Sequence[Optional[str]],
    status_value: Optional[str],  # None 意味着 "空白"
    consultant: Optional[str] = None,  # 咨询师（TAB2用）
) -> Dict[str, int]:
    """
    查询指定条件下的 咨询量/上门量/报名量
    """
    query = db.query(
        func.count(咨询量明细表.记录ID).label("咨询量"),
        func.coalesce(func.sum(
            case((咨询量明细表.是否上门 == 1, 1), else_=0)
        ), 0).label("上门"),
        func.coalesce(func.sum(
            case((咨询量明细表.是否报名 == 1, 1), else_=0)
        ), 0).label("报名"),
    ).filter(
        # 有效记录
        or_(咨询量明细表.是否无效量 == 0, 咨询量明细表.是否无效量.is_(None)),
        or_(咨询量明细表.是否不算量 == 0, 咨询量明细表.是否不算量.is_(None)),
        # 神殿
        _build_campus_filter(咨询量明细表.神殿, campus),
    )

    # 日期范围
    if start_date:
        query = query.filter(咨询量明细表.登记日期 >= start_date)
    if end_date:
        query = query.filter(咨询量明细表.登记日期 <= end_date)

    # 渠道筛选
    query = query.filter(channel_filter)

    # 咨询师筛选（TAB2）
    if consultant is not None:
        query = query.filter(咨询量明细表.咨询师 == consultant)

    # 学历筛选
    if education_values == [None]:
        # 空白: 学历为 NULL 或空字符串
        query = query.filter(
            or_(咨询量明细表.学历.is_(None), 咨询量明细表.学历 == "")
        )
    else:
        query = query.filter(咨询量明细表.学历.in_(education_values))

    # 状态筛选
    if status_value is None:
        # "合计" - 不筛选状态
        pass
    elif status_value == "空白":
        query = query.filter(
            or_(咨询量明细表.目前状态.is_(None), 咨询量明细表.目前状态 == "")
        )
    else:
        query = query.filter(咨询量明细表.目前状态 == status_value)

    row = query.one()
    return {
        "咨询量": int(row.咨询量 or 0),
        "上门": int(row.上门 or 0),
        "报名": int(row.报名 or 0),
    }


def _build_row(
    education_label: str,
    status_label: str,
    sem_stats: Dict[str, int],
    newmedia_stats: Dict[str, int],
    grand_total_stats: Dict[str, int],  # 全局合计行，用于计算占比
) -> Dict[str, Any]:
    """构建一行数据"""
    # 合计
    total = {
        "咨询量": sem_stats["咨询量"] + newmedia_stats["咨询量"],
        "上门": sem_stats["上门"] + newmedia_stats["上门"],
        "报名": sem_stats["报名"] + newmedia_stats["报名"],
    }

    return {
        "学历": education_label,
        "状态": status_label,
        # 网络其他推广
        "网络其他推广_咨询量": sem_stats["咨询量"],
        "网络其他推广_上门": sem_stats["上门"],
        "网络其他推广_报名": sem_stats["报名"],
        "网络其他推广_上门率": _safe_rate(sem_stats["上门"], sem_stats["咨询量"]),
        "网络其他推广_面转率": _safe_rate(sem_stats["报名"], sem_stats["上门"]),
        "网络其他推广_总转": _safe_rate(sem_stats["报名"], sem_stats["咨询量"]),
        # 网络新媒体
        "网络新媒体_咨询量": newmedia_stats["咨询量"],
        "网络新媒体_上门": newmedia_stats["上门"],
        "网络新媒体_报名": newmedia_stats["报名"],
        "网络新媒体_上门率": _safe_rate(newmedia_stats["上门"], newmedia_stats["咨询量"]),
        "网络新媒体_面转率": _safe_rate(newmedia_stats["报名"], newmedia_stats["上门"]),
        "网络新媒体_总转": _safe_rate(newmedia_stats["报名"], newmedia_stats["咨询量"]),
        # 合计
        "合计_咨询量": total["咨询量"],
        "合计_上门": total["上门"],
        "合计_报名": total["报名"],
        "合计_上门率": _safe_rate(total["上门"], total["咨询量"]),
        "合计_面转率": _safe_rate(total["报名"], total["上门"]),
        "合计_总转": _safe_rate(total["报名"], total["咨询量"]),
        # 占比 (占全局合计)
        "占比_咨询量": _safe_rate(total["咨询量"], grand_total_stats["咨询量"]) if grand_total_stats["咨询量"] else 0,
        "占比_上门": _safe_rate(total["上门"], grand_total_stats["上门"]) if grand_total_stats["上门"] else 0,
        "占比_报名": _safe_rate(total["报名"], grand_total_stats["报名"]) if grand_total_stats["报名"] else 0,
    }


# ==================== API ====================

@router.get(
    "/population-analysis/education-status",
    response_model=dict,
    summary="网络各学历各状态人群转化率分析"
)
def get_education_status_analysis(
    campus: str = Query(..., description="神殿名称"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
):
    """
    TAB1 - 按学历×状态分组统计咨询量、上门量、报名量
    分 网络其他推广 / 网络新媒体 两大渠道组
    """
    new_media_sources = _get_new_media_sources(db)

    # 渠道筛选条件
    # 网络其他推广 = 量来源=网络 且 媒体来源 不属于 新媒体平台来源列表
    if new_media_sources:
        sem_filter = and_(
            咨询量明细表.量来源 == "网络",
            ~咨询量明细表.媒体来源.in_(new_media_sources),
        )
    else:
        sem_filter = 咨询量明细表.量来源 == "网络"

    # 网络新媒体 = 量来源=网络 且 媒体来源 属于 新媒体平台来源列表
    if new_media_sources:
        newmedia_filter = and_(
            咨询量明细表.量来源 == "网络",
            咨询量明细表.媒体来源.in_(new_media_sources),
        )
    else:
        newmedia_filter = and_(
            咨询量明细表.量来源 == "网络",
            literal(False),  # 无新媒体配置时返回空
        )

    # 全渠道合计筛选 = 量来源=网络（包含SEM+新媒体）
    all_channel_filter = 咨询量明细表.量来源 == "网络"

    # 所有可能的学历值（用于全局合计）
    ALL_EDUCATION_VALUES = [
        "大专", "大专应届", "本科", "本科待业", "本科以上", "硕士", "研究生", "博士",
        "高中", "高中在读", "高中应届", "三校生",
        "初中", "初中待业", "初中在读",
        None, "",
    ]

    # ---------- 1. 先计算全局合计（用于占比分母）----------
    grand_total = _query_stats(
        db, campus, start_date, end_date,
        all_channel_filter, 
        ALL_EDUCATION_VALUES,
        None,  # 所有状态
    )

    # ---------- 2. 逐组统计 ----------
    rows: List[Dict[str, Any]] = []

    for edu_label, edu_values in EDUCATION_GROUPS:
        # 合计行
        sem_total = _query_stats(db, campus, start_date, end_date, sem_filter, edu_values, None)
        nm_total = _query_stats(db, campus, start_date, end_date, newmedia_filter, edu_values, None)
        rows.append(_build_row(edu_label, "合计", sem_total, nm_total, grand_total))

        # 各状态行
        for status in STATUS_LIST:
            s_val = status if status != "空白" else "空白"
            sem_s = _query_stats(db, campus, start_date, end_date, sem_filter, edu_values, s_val)
            nm_s = _query_stats(db, campus, start_date, end_date, newmedia_filter, edu_values, s_val)
            rows.append(_build_row(edu_label, status, sem_s, nm_s, grand_total))

    # 空白学历行（无状态子行）
    sem_blank = _query_stats(db, campus, start_date, end_date, sem_filter, [None], None)
    nm_blank = _query_stats(db, campus, start_date, end_date, newmedia_filter, [None], None)
    rows.append(_build_row("空白", "", sem_blank, nm_blank, grand_total))

    # 总合计行
    sem_grand = _query_stats(db, campus, start_date, end_date, sem_filter, ALL_EDUCATION_VALUES, None)
    nm_grand = _query_stats(db, campus, start_date, end_date, newmedia_filter, ALL_EDUCATION_VALUES, None)
    rows.append(_build_row("合计", "", sem_grand, nm_grand, grand_total))

    return {
        "success": True,
        "data": {
            "神殿": campus,
            "开始日期": str(start_date) if start_date else None,
            "结束日期": str(end_date) if end_date else None,
            "rows": rows,
        },
    }


# ==================== TAB2 - 网络各咨询师、各学历、各状态分析 ====================

def _get_consultant_list(db: Session, campus: str) -> List[str]:
    """
    从 public.users 获取祈福司咨询师列表（排除校长、经理、主管）
    """
    users = db.query(User.real_name).filter(
        User.department == "祈福司",
        User.status == "ACTIVE",
        _build_campus_filter(User.campus, campus),
    ).all()

    consultants = []
    for (name,) in users:
        if not name:
            continue
        # 排除管理层（校长、经理、主管）
        position = db.query(User.position).filter(
            User.real_name == name,
            User.department == "祈福司",
            User.status == "ACTIVE",
        ).scalar()
        if position and any(kw in position for kw in ["校长", "经理", "主管"]):
            continue
        consultants.append(name)

    return sorted(set(consultants))


def _build_consultant_rows(
    db: Session,
    campus: str,
    start_date: Optional[date],
    end_date: Optional[date],
    sem_filter,
    newmedia_filter,
    all_channel_filter,
    consultant: str,
) -> List[Dict[str, Any]]:
    """为单个咨询师构建完整的学历×状态数据行"""
    ALL_EDUCATION_VALUES = [
        "大专", "大专应届", "本科", "本科待业", "本科以上", "硕士", "研究生", "博士",
        "高中", "高中在读", "高中应届", "三校生",
        "初中", "初中待业", "初中在读",
        None, "",
    ]

    # 该咨询师的全局合计（用于占比分母）
    consultant_grand = _query_stats(
        db, campus, start_date, end_date,
        all_channel_filter, ALL_EDUCATION_VALUES, None, consultant,
    )

    rows: List[Dict[str, Any]] = []

    for edu_label, edu_values in EDUCATION_GROUPS:
        # 合计行
        sem_total = _query_stats(db, campus, start_date, end_date, sem_filter, edu_values, None, consultant)
        nm_total = _query_stats(db, campus, start_date, end_date, newmedia_filter, edu_values, None, consultant)
        row = _build_row(edu_label, "合计", sem_total, nm_total, consultant_grand)
        row["咨询师"] = consultant
        rows.append(row)

        # 各状态行
        for status in STATUS_LIST:
            s_val = status if status != "空白" else "空白"
            sem_s = _query_stats(db, campus, start_date, end_date, sem_filter, edu_values, s_val, consultant)
            nm_s = _query_stats(db, campus, start_date, end_date, newmedia_filter, edu_values, s_val, consultant)
            row = _build_row(edu_label, status, sem_s, nm_s, consultant_grand)
            row["咨询师"] = consultant
            rows.append(row)

    # 空白学历行
    sem_blank = _query_stats(db, campus, start_date, end_date, sem_filter, [None], None, consultant)
    nm_blank = _query_stats(db, campus, start_date, end_date, newmedia_filter, [None], None, consultant)
    row = _build_row("空白", "", sem_blank, nm_blank, consultant_grand)
    row["咨询师"] = consultant
    rows.append(row)

    # 该咨询师的合计行
    sem_grand = _query_stats(db, campus, start_date, end_date, sem_filter, ALL_EDUCATION_VALUES, None, consultant)
    nm_grand = _query_stats(db, campus, start_date, end_date, newmedia_filter, ALL_EDUCATION_VALUES, None, consultant)
    row = _build_row("合计", "", sem_grand, nm_grand, consultant_grand)
    row["咨询师"] = consultant
    rows.append(row)

    return rows


@router.get(
    "/population-analysis/consultant-education-status",
    response_model=dict,
    summary="网络各咨询师各学历各状态人群转化率分析"
)
def get_consultant_education_status_analysis(
    campus: str = Query(..., description="神殿名称"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
):
    """
    TAB2 - 按咨询师×学历×状态分组统计咨询量、上门量、报名量
    分 网络其他推广 / 网络新媒体 两大渠道组
    每个咨询师一组完整的学历×状态数据
    """
    new_media_sources = _get_new_media_sources(db)

    # 渠道筛选条件（与TAB1相同）
    if new_media_sources:
        sem_filter = and_(
            咨询量明细表.量来源 == "网络",
            ~咨询量明细表.媒体来源.in_(new_media_sources),
        )
    else:
        sem_filter = 咨询量明细表.量来源 == "网络"

    if new_media_sources:
        newmedia_filter = and_(
            咨询量明细表.量来源 == "网络",
            咨询量明细表.媒体来源.in_(new_media_sources),
        )
    else:
        newmedia_filter = and_(
            咨询量明细表.量来源 == "网络",
            literal(False),
        )

    all_channel_filter = 咨询量明细表.量来源 == "网络"

    # 获取咨询师列表
    consultants = _get_consultant_list(db, campus)

    # 逐咨询师统计
    all_rows: List[Dict[str, Any]] = []
    for consultant in consultants:
        consultant_rows = _build_consultant_rows(
            db, campus, start_date, end_date,
            sem_filter, newmedia_filter, all_channel_filter,
            consultant,
        )
        all_rows.extend(consultant_rows)

    return {
        "success": True,
        "data": {
            "神殿": campus,
            "开始日期": str(start_date) if start_date else None,
            "结束日期": str(end_date) if end_date else None,
            "咨询师列表": consultants,
            "rows": all_rows,
        },
    }
