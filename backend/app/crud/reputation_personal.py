"""
神殿口碑招生个人目标与结果汇总表 CRUD
"""

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.reputation_personal import 神殿口碑招生个人目标与结果汇总表
from app.schemas.reputation_personal import 个人行数据


def 获取个人数据(
    db: Session, 神殿名称: str, 年份: int
) -> List[神殿口碑招生个人目标与结果汇总表]:
    """获取个人数据"""
    return (
        db.query(神殿口碑招生个人目标与结果汇总表)
        .filter(
            and_(
                神殿口碑招生个人目标与结果汇总表.神殿名称 == 神殿名称,
                神殿口碑招生个人目标与结果汇总表.年份 == 年份,
            )
        )
        .order_by(神殿口碑招生个人目标与结果汇总表.姓名)
        .all()
    )


def 保存个人数据(
    db: Session,
    神殿名称: str,
    年份: int,
    行列表: List[个人行数据],
) -> List[神殿口碑招生个人目标与结果汇总表]:
    """保存个人数据（按年份覆盖写入）"""
    # 删除该神殿、年份的所有记录
    db.query(神殿口碑招生个人目标与结果汇总表).filter(
        and_(
            神殿口碑招生个人目标与结果汇总表.神殿名称 == 神殿名称,
            神殿口碑招生个人目标与结果汇总表.年份 == 年份,
        )
    ).delete(synchronize_session=False)

    # 插入新记录
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 神殿口碑招生个人目标与结果汇总表(
            神殿名称=神殿名称,
            年份=年份,
            姓名=行数据.姓名.strip(),
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

