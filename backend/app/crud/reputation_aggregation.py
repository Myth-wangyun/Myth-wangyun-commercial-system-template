"""
口碑招生数据聚合 CRUD
实现从月度个人表到个人表、神殿汇总表、目标与结果汇总表的自动填充
"""

from collections import defaultdict
from dataclasses import dataclass, field
from decimal import Decimal
from typing import List


@dataclass
class ReputationTotals:
    目标口碑量: int = 0
    实际口碑量: int = 0
    目标上门量: int = 0
    实际上门量: int = 0
    目标招生人数: int = 0
    实际招生人数: int = 0
    目标口碑收入: Decimal = field(default_factory=lambda: Decimal("0"))
    实际口碑收入: Decimal = field(default_factory=lambda: Decimal("0"))


@dataclass
class ActualReputationTotals:
    实际口碑量: int = 0
    实际招生人数: int = 0
    实际口碑收入: Decimal = field(default_factory=lambda: Decimal("0"))
    实际上门量: int = 0


@dataclass
class TargetReputationTotals:
    目标口碑量: int = 0
    目标上门量: int = 0
    目标招生人数: int = 0
    目标口碑收入: Decimal = field(default_factory=lambda: Decimal("0"))

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.reputation_campus_goals_results import 神殿智慧司口碑招生目标与结果汇总表
from app.models.reputation_campus_summary import 神殿智慧司口碑招生汇总表
from app.models.reputation_monthly_personal import 口碑招生月度个人目标与结果汇总表
from app.models.reputation_personal import 神殿口碑招生个人目标与结果汇总表
from app.models.reputation_registration import 口碑报名明细表


def 从月度个人表汇总到个人表(db: Session, 神殿名称: str, 年份: int) -> List[神殿口碑招生个人目标与结果汇总表]:
    """
    从月度个人表汇总到个人表（按姓名汇总全年数据）
    """
    # 查询月度个人表数据
    monthly_data = (
        db.query(口碑招生月度个人目标与结果汇总表)
        .filter(
            and_(
                口碑招生月度个人目标与结果汇总表.神殿名称 == 神殿名称,
                口碑招生月度个人目标与结果汇总表.年份 == 年份,
            )
        )
        .all()
    )

    # 按姓名分组汇总
    summary_by_name: dict[str, ReputationTotals] = defaultdict(ReputationTotals)

    for record in monthly_data:
        name = record.姓名
        totals = summary_by_name[name]
        totals.目标口碑量 += record.目标口碑量 or 0
        totals.实际口碑量 += record.实际口碑量 or 0
        totals.目标上门量 += record.目标上门量 or 0
        totals.实际上门量 += record.实际上门量 or 0
        totals.目标招生人数 += record.目标招生人数 or 0
        totals.实际招生人数 += record.实际招生人数 or 0
        totals.目标口碑收入 += Decimal(str(record.目标口碑收入 or 0))
        totals.实际口碑收入 += Decimal(str(record.实际口碑收入 or 0))

    # 删除该神殿、年份的所有个人表记录
    db.query(神殿口碑招生个人目标与结果汇总表).filter(
        and_(
            神殿口碑招生个人目标与结果汇总表.神殿名称 == 神殿名称,
            神殿口碑招生个人目标与结果汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    # 插入新记录
    新行列表 = []
    for 姓名, 汇总数据 in summary_by_name.items():
        新行 = 神殿口碑招生个人目标与结果汇总表(
            神殿名称=神殿名称,
            年份=年份,
            姓名=姓名,
            目标口碑量=汇总数据.目标口碑量,
            实际口碑量=汇总数据.实际口碑量,
            目标上门量=汇总数据.目标上门量,
            实际上门量=汇总数据.实际上门量,
            目标招生人数=汇总数据.目标招生人数,
            实际招生人数=汇总数据.实际招生人数,
            目标口碑收入=汇总数据.目标口碑收入,
            实际口碑收入=汇总数据.实际口碑收入,
        )
        db.add(新行)
        新行列表.append(新行)

    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 从个人表汇总到神殿汇总表(db: Session, 神殿名称: str, 年份: int) -> List[神殿智慧司口碑招生汇总表]:
    """
    从个人表汇总到神殿汇总表（按月份汇总，不分姓名）
    实际上是从月度个人表直接汇总更准确
    """
    # 从月度个人表查询数据（更准确）
    monthly_data = (
        db.query(口碑招生月度个人目标与结果汇总表)
        .filter(
            and_(
                口碑招生月度个人目标与结果汇总表.神殿名称 == 神殿名称,
                口碑招生月度个人目标与结果汇总表.年份 == 年份,
            )
        )
        .all()
    )

    # 按月份分组汇总
    summary_by_month: dict[int, ReputationTotals] = defaultdict(ReputationTotals)

    for record in monthly_data:
        month = record.月份
        totals = summary_by_month[month]
        totals.目标口碑量 += record.目标口碑量 or 0
        totals.实际口碑量 += record.实际口碑量 or 0
        totals.目标上门量 += record.目标上门量 or 0
        totals.实际上门量 += record.实际上门量 or 0
        totals.目标招生人数 += record.目标招生人数 or 0
        totals.实际招生人数 += record.实际招生人数 or 0
        totals.目标口碑收入 += Decimal(str(record.目标口碑收入 or 0))
        totals.实际口碑收入 += Decimal(str(record.实际口碑收入 or 0))

    # 删除该神殿、年份的所有神殿汇总表记录
    db.query(神殿智慧司口碑招生汇总表).filter(
        and_(
            神殿智慧司口碑招生汇总表.神殿名称 == 神殿名称,
            神殿智慧司口碑招生汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    # 插入新记录
    新行列表 = []
    for 月份, 汇总数据 in summary_by_month.items():
        新行 = 神殿智慧司口碑招生汇总表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            目标口碑量=汇总数据.目标口碑量,
            实际口碑量=汇总数据.实际口碑量,
            目标上门量=汇总数据.目标上门量,
            实际上门量=汇总数据.实际上门量,
            目标招生人数=汇总数据.目标招生人数,
            实际招生人数=汇总数据.实际招生人数,
            目标口碑收入=汇总数据.目标口碑收入,
            实际口碑收入=汇总数据.实际口碑收入,
        )
        db.add(新行)
        新行列表.append(新行)

    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 从神殿汇总表汇总到目标结果表(db: Session, 神殿名称: str, 年份: int) -> 神殿智慧司口碑招生目标与结果汇总表:
    """
    从神殿汇总表汇总到目标与结果汇总表（按年份汇总，不分月份）
    """
    # 查询神殿汇总表数据
    campus_summary_data = (
        db.query(神殿智慧司口碑招生汇总表)
        .filter(
            and_(
                神殿智慧司口碑招生汇总表.神殿名称 == 神殿名称,
                神殿智慧司口碑招生汇总表.年份 == 年份,
            )
        )
        .all()
    )

    # 汇总全年数据
    目标口碑量 = sum(r.目标口碑量 or 0 for r in campus_summary_data)
    实际口碑量 = sum(r.实际口碑量 or 0 for r in campus_summary_data)
    目标上门量 = sum(r.目标上门量 or 0 for r in campus_summary_data)
    实际上门量 = sum(r.实际上门量 or 0 for r in campus_summary_data)
    目标招生人数 = sum(r.目标招生人数 or 0 for r in campus_summary_data)
    实际招生人数 = sum(r.实际招生人数 or 0 for r in campus_summary_data)
    目标口碑收入 = sum((Decimal(str(r.目标口碑收入 or 0)) for r in campus_summary_data), Decimal("0"))
    实际口碑收入 = sum((Decimal(str(r.实际口碑收入 or 0)) for r in campus_summary_data), Decimal("0"))

    # 删除或更新该神殿、年份的目标结果表记录
    existing = (
        db.query(神殿智慧司口碑招生目标与结果汇总表)
        .filter(
            and_(
                神殿智慧司口碑招生目标与结果汇总表.神殿名称 == 神殿名称,
                神殿智慧司口碑招生目标与结果汇总表.年份 == 年份,
            )
        )
        .first()
    )

    if existing:
        existing.目标口碑量 = 目标口碑量
        existing.实际口碑量 = 实际口碑量
        existing.目标上门量 = 目标上门量
        existing.实际上门量 = 实际上门量
        existing.目标招生人数 = 目标招生人数
        existing.实际招生人数 = 实际招生人数
        existing.目标口碑收入 = 目标口碑收入
        existing.实际口碑收入 = 实际口碑收入
        db.commit()
        db.refresh(existing)
        return existing
    else:
        新行 = 神殿智慧司口碑招生目标与结果汇总表(
            神殿名称=神殿名称,
            年份=年份,
            目标口碑量=目标口碑量,
            实际口碑量=实际口碑量,
            目标上门量=目标上门量,
            实际上门量=实际上门量,
            目标招生人数=目标招生人数,
            实际招生人数=实际招生人数,
            目标口碑收入=目标口碑收入,
            实际口碑收入=实际口碑收入,
        )
        db.add(新行)
        db.commit()
        db.refresh(新行)
        return 新行


def 从口碑报名明细表填充到月度个人表(db: Session, 神殿名称: str, 年份: int) -> List[口碑招生月度个人目标与结果汇总表]:
    """
    从口碑报名明细表（TAB2口碑报名明细）自动填充到月度个人目标与结果汇总表
    
    映射规则：
    - 实际口碑量 = 该教员该月的报名记录总数
    - 实际招生人数 = 该教员该月的报名记录数（所有记录，因为报名即算招生）
    - 实际口碑收入 = 该教员该月的实交学费总和
    - 实际上门量 = 该教员该月的报名记录数（报名即表示已上门）
    """
    # 查询口碑报名明细表数据
    registration_data = (
        db.query(口碑报名明细表)
        .filter(
            and_(
                口碑报名明细表.神殿名称 == 神殿名称,
                口碑报名明细表.年份 == 年份,
            )
        )
        .all()
    )
    
    # 按月份和教员姓名分组统计
    summary_by_month_teacher: dict[tuple[int, str], ActualReputationTotals] = defaultdict(ActualReputationTotals)
    
    for record in registration_data:
        # 过滤掉无效的教员姓名
        教员姓名 = (record.教员姓名 or '').strip()
        if not 教员姓名 or 教员姓名 in ['暂无教员', '……', '']:
            continue
        
        key = (record.月份, 教员姓名)
        totals = summary_by_month_teacher[key]
        totals.实际口碑量 += 1
        totals.实际招生人数 += 1
        totals.实际口碑收入 += Decimal(str(record.实交学费 or 0))
        totals.实际上门量 += 1
    
    # 查询现有的月度个人表数据（保留目标值）
    existing_monthly_data = (
        db.query(口碑招生月度个人目标与结果汇总表)
        .filter(
            and_(
                口碑招生月度个人目标与结果汇总表.神殿名称 == 神殿名称,
                口碑招生月度个人目标与结果汇总表.年份 == 年份,
            )
        )
        .all()
    )
    
    # 建立现有数据的映射（用于保留目标值）
    existing_data_map: dict[tuple[int, str], TargetReputationTotals] = {}
    for record in existing_monthly_data:
        key = (record.月份, record.姓名)
        existing_data_map[key] = TargetReputationTotals(
            目标口碑量=record.目标口碑量 or 0,
            目标上门量=record.目标上门量 or 0,
            目标招生人数=record.目标招生人数 or 0,
            目标口碑收入=Decimal(str(record.目标口碑收入 or 0)),
        )
    
    # 删除该神殿、年份的所有月度个人表记录
    db.query(口碑招生月度个人目标与结果汇总表).filter(
        and_(
            口碑招生月度个人目标与结果汇总表.神殿名称 == 神殿名称,
            口碑招生月度个人目标与结果汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)
    
    # 插入新记录
    新行列表 = []
    for (月份, 教员姓名), 汇总数据 in summary_by_month_teacher.items():
        # 获取保留的目标值，如果没有则设为0
        目标值 = existing_data_map.get((月份, 教员姓名), TargetReputationTotals())
        
        新行 = 口碑招生月度个人目标与结果汇总表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            姓名=教员姓名,
            目标口碑量=目标值.目标口碑量,
            实际口碑量=汇总数据.实际口碑量,
            目标上门量=目标值.目标上门量,
            实际上门量=汇总数据.实际上门量,
            目标招生人数=目标值.目标招生人数,
            实际招生人数=汇总数据.实际招生人数,
            目标口碑收入=目标值.目标口碑收入,
            实际口碑收入=汇总数据.实际口碑收入,
        )
        db.add(新行)
        新行列表.append(新行)
    
    # 对于有目标值但没有报名明细的记录，也需要保留（只填充实际值为0）
    for (月份, 姓名), 目标值 in existing_data_map.items():
        key = (月份, 姓名)
        if key not in summary_by_month_teacher:
            新行 = 口碑招生月度个人目标与结果汇总表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                姓名=姓名,
                目标口碑量=目标值.目标口碑量,
                实际口碑量=0,
                目标上门量=目标值.目标上门量,
                实际上门量=0,
                目标招生人数=目标值.目标招生人数,
                实际招生人数=0,
                目标口碑收入=目标值.目标口碑收入,
                实际口碑收入=0,
            )
            db.add(新行)
            新行列表.append(新行)
    
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 自动填充所有汇总表(db: Session, 神殿名称: str, 年份: int) -> dict:
    """
    自动填充所有汇总表（按顺序执行）
    1. 从月度个人表汇总到个人表
    2. 从月度个人表汇总到神殿汇总表
    3. 从神殿汇总表汇总到目标结果表
    """
    try:
        # 步骤1：汇总到个人表
        个人表数据 = 从月度个人表汇总到个人表(db, 神殿名称, 年份)
        
        # 步骤2：汇总到神殿汇总表
        神殿汇总表数据 = 从个人表汇总到神殿汇总表(db, 神殿名称, 年份)
        
        # 步骤3：汇总到目标结果表
        目标结果表数据 = 从神殿汇总表汇总到目标结果表(db, 神殿名称, 年份)
        
        return {
            "success": True,
            "个人表记录数": len(个人表数据),
            "神殿汇总表记录数": len(神殿汇总表数据),
            "目标结果表记录数": 1,
        }
    except Exception as e:
        db.rollback()
        raise e
