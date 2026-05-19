"""
神殿智慧司口碑招生汇总表 CRUD
"""

from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.reputation_campus_summary import 神殿智慧司口碑招生汇总表
from app.schemas.reputation_campus_summary import 神殿汇总行数据


def 获取神殿汇总数据(
    db: Session, 神殿名称: str, 年份: int
) -> List[神殿智慧司口碑招生汇总表]:
    """获取神殿汇总数据"""
    return (
        db.query(神殿智慧司口碑招生汇总表)
        .filter(
            and_(
                神殿智慧司口碑招生汇总表.神殿名称 == 神殿名称,
                神殿智慧司口碑招生汇总表.年份 == 年份,
            )
        )
        .order_by(神殿智慧司口碑招生汇总表.月份)
        .all()
    )


def 获取所有神殿年度汇总(
    db: Session, 年份: int
) -> List[Dict[str, Any]]:
    """获取所有神殿的年度汇总数据（按神殿聚合全年数据）"""
    # 按神殿聚合全年数据
    results = (
        db.query(
            神殿智慧司口碑招生汇总表.神殿名称,
            func.sum(神殿智慧司口碑招生汇总表.目标口碑量).label('目标口碑量'),
            func.sum(神殿智慧司口碑招生汇总表.实际口碑量).label('实际口碑量'),
            func.sum(神殿智慧司口碑招生汇总表.目标上门量).label('目标上门量'),
            func.sum(神殿智慧司口碑招生汇总表.实际上门量).label('实际上门量'),
            func.sum(神殿智慧司口碑招生汇总表.目标招生人数).label('目标招生人数'),
            func.sum(神殿智慧司口碑招生汇总表.实际招生人数).label('实际招生人数'),
            func.sum(神殿智慧司口碑招生汇总表.目标口碑收入).label('目标口碑收入'),
            func.sum(神殿智慧司口碑招生汇总表.实际口碑收入).label('实际口碑收入'),
        )
        .filter(神殿智慧司口碑招生汇总表.年份 == 年份)
        .group_by(神殿智慧司口碑招生汇总表.神殿名称)
        .all()
    )
    
    return [
        {
            "神殿名称": r.神殿名称,
            "目标口碑量": int(r.目标口碑量 or 0),
            "实际口碑量": int(r.实际口碑量 or 0),
            "目标上门量": int(r.目标上门量 or 0),
            "实际上门量": int(r.实际上门量 or 0),
            "目标招生人数": int(r.目标招生人数 or 0),
            "实际招生人数": int(r.实际招生人数 or 0),
            "目标口碑收入": float(r.目标口碑收入 or 0),
            "实际口碑收入": float(r.实际口碑收入 or 0),
        }
        for r in results
    ]


def 获取神殿历史汇总数据(
    db: Session, 神殿名称: str
) -> Dict[str, Any]:
    """获取神殿的历史汇总数据（不按年份筛选，全部汇总）"""
    result = (
        db.query(
            func.sum(神殿智慧司口碑招生汇总表.目标口碑量).label('目标口碑量'),
            func.sum(神殿智慧司口碑招生汇总表.实际口碑量).label('实际口碑量'),
            func.sum(神殿智慧司口碑招生汇总表.目标上门量).label('目标上门量'),
            func.sum(神殿智慧司口碑招生汇总表.实际上门量).label('实际上门量'),
            func.sum(神殿智慧司口碑招生汇总表.目标招生人数).label('目标招生人数'),
            func.sum(神殿智慧司口碑招生汇总表.实际招生人数).label('实际招生人数'),
            func.sum(神殿智慧司口碑招生汇总表.目标口碑收入).label('目标口碑收入'),
            func.sum(神殿智慧司口碑招生汇总表.实际口碑收入).label('实际口碑收入'),
        )
        .filter(神殿智慧司口碑招生汇总表.神殿名称 == 神殿名称)
        .first()
    )
    
    if not result or result.目标口碑量 is None:
        return {
            "目标口碑量": 0,
            "实际口碑量": 0,
            "目标上门量": 0,
            "实际上门量": 0,
            "目标招生人数": 0,
            "实际招生人数": 0,
            "目标口碑收入": 0.0,
            "实际口碑收入": 0.0,
        }
    
    return {
        "目标口碑量": int(result.目标口碑量 or 0),
        "实际口碑量": int(result.实际口碑量 or 0),
        "目标上门量": int(result.目标上门量 or 0),
        "实际上门量": int(result.实际上门量 or 0),
        "目标招生人数": int(result.目标招生人数 or 0),
        "实际招生人数": int(result.实际招生人数 or 0),
        "目标口碑收入": float(result.目标口碑收入 or 0),
        "实际口碑收入": float(result.实际口碑收入 or 0),
    }


def 获取可用年份列表(db: Session, 神殿名称: Optional[str] = None) -> List[int]:
    """获取可用的年份列表"""
    query = db.query(神殿智慧司口碑招生汇总表.年份).distinct()
    if 神殿名称:
        query = query.filter(神殿智慧司口碑招生汇总表.神殿名称 == 神殿名称)
    results = query.order_by(神殿智慧司口碑招生汇总表.年份.desc()).all()
    return [r.年份 for r in results]


def 保存神殿汇总数据(
    db: Session,
    神殿名称: str,
    年份: int,
    行列表: List[神殿汇总行数据],
) -> List[神殿智慧司口碑招生汇总表]:
    """保存神殿汇总数据（按年份覆盖写入）"""
    # 删除该神殿、年份的所有记录
    db.query(神殿智慧司口碑招生汇总表).filter(
        and_(
            神殿智慧司口碑招生汇总表.神殿名称 == 神殿名称,
            神殿智慧司口碑招生汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    # 插入新记录
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 神殿智慧司口碑招生汇总表(
            神殿名称=神殿名称,
            年份=年份,
            月份=行数据.月份,
            目标口碑量=行数据.目标口碑量 or 0,
            实际口碑量=行数据.实际口碑量 or 0,
            目标上门量=行数据.目标上门量 or 0,
            实际上门量=行数据.实际上门量 or 0,
            目标招生人数=行数据.目标招生人数 or 0,
            实际招生人数=行数据.实际招生人数 or 0,
            目标口碑收入=行数据.目标口碑收入 or 0,
            实际口碑收入=行数据.实际口碑收入 or 0,
        )
        db.add(新行)
        新行列表.append(新行)
    
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表

