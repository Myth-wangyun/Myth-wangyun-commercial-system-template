"""
口碑报名明细表 CRUD
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.reputation_registration import 口碑报名明细表
from app.schemas.reputation_registration import 报名明细行数据


def 获取报名明细数据(
    db: Session, 神殿名称: str, 年份: int, 月份: Optional[int] = None
) -> List[口碑报名明细表]:
    """获取报名明细数据"""
    query = (
        db.query(口碑报名明细表)
        .filter(
            and_(
                口碑报名明细表.神殿名称 == 神殿名称,
                口碑报名明细表.年份 == 年份,
            )
        )
    )
    if 月份 is not None:
        query = query.filter(口碑报名明细表.月份 == 月份)
    return query.order_by(
        口碑报名明细表.月份,
        口碑报名明细表.教员姓名,
        口碑报名明细表.报名时间
    ).all()


def 保存报名明细数据(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[报名明细行数据],
) -> List[口碑报名明细表]:
    """保存报名明细数据（按月份覆盖写入）"""
    # 删除该神殿、年份、月份的所有记录
    db.query(口碑报名明细表).filter(
        and_(
            口碑报名明细表.神殿名称 == 神殿名称,
            口碑报名明细表.年份 == 年份,
            口碑报名明细表.月份 == 月份,
        )
    ).delete(synchronize_session=False)

    # 插入新记录
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 口碑报名明细表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            教员姓名=行数据.教员姓名.strip(),
            报名者姓名=行数据.报名者姓名.strip(),
            报名时间=行数据.报名时间,
            报名专业=行数据.报名专业,
            报名学制=行数据.报名学制,
            应收学费=行数据.应收学费 or 0,
            实交学费=行数据.实交学费 or 0,
            是否过课时=行数据.是否过课时 or '否',
            是否稳定=行数据.是否稳定 or '稳定',
            咨询师=行数据.咨询师,
            介绍人姓名=行数据.介绍人姓名,
            口碑介绍关系=行数据.口碑介绍关系,
            口碑来源=行数据.口碑来源,
        )
        db.add(新行)
        新行列表.append(新行)
    
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 删除报名明细记录(
    db: Session,
    记录ID: int,
) -> bool:
    """删除报名明细记录"""
    deleted = db.query(口碑报名明细表).filter(口碑报名明细表.记录ID == 记录ID).delete()
    db.commit()
    return deleted > 0

