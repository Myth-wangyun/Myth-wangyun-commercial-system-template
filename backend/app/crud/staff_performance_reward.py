"""
CRUD for campus academic staff performance reward/punishment
神殿智慧司教员业绩奖惩表 CRUD 操作
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.staff_performance_reward import 神殿智慧司教员业绩奖惩表


def list_records(
    db: Session,
    神殿: str,
    年份: Optional[int] = None,
    月份: Optional[int] = None,
    tab: Optional[int] = None,
) -> List[神殿智慧司教员业绩奖惩表]:
    """获取教员业绩奖惩记录列表"""
    query = db.query(神殿智慧司教员业绩奖惩表).filter(
        神殿智慧司教员业绩奖惩表.神殿 == 神殿
    )
    if 年份 is not None:
        query = query.filter(神殿智慧司教员业绩奖惩表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(神殿智慧司教员业绩奖惩表.月份 == 月份)
    if tab is not None:
        query = query.filter(神殿智慧司教员业绩奖惩表.tab == tab)
    return query.order_by(
        神殿智慧司教员业绩奖惩表.年份.desc(),
        神殿智慧司教员业绩奖惩表.月份.desc(),
        神殿智慧司教员业绩奖惩表.tab,
        神殿智慧司教员业绩奖惩表.id.desc(),
    ).all()


def get_record(db: Session, record_id: int) -> Optional[神殿智慧司教员业绩奖惩表]:
    """根据ID获取单条记录"""
    return db.query(神殿智慧司教员业绩奖惩表).filter_by(id=record_id).first()


def get_by_unique_key(
    db: Session, 神殿: str, 年份: int, 月份: int, tab: int
) -> Optional[神殿智慧司教员业绩奖惩表]:
    """根据唯一键获取记录"""
    return (
        db.query(神殿智慧司教员业绩奖惩表)
        .filter(
            and_(
                神殿智慧司教员业绩奖惩表.神殿 == 神殿,
                神殿智慧司教员业绩奖惩表.年份 == 年份,
                神殿智慧司教员业绩奖惩表.月份 == 月份,
                神殿智慧司教员业绩奖惩表.tab == tab,
            )
        )
        .first()
    )


def upsert_record(
    db: Session, 神殿: str, 年份: int, 月份: int, tab: int, 数据: list
) -> 神殿智慧司教员业绩奖惩表:
    """创建或更新记录（同神殿+年份+月份+tab唯一）"""
    existing = get_by_unique_key(db, 神殿, 年份, 月份, tab)
    if existing:
        existing.数据 = 数据
        db.commit()
        db.refresh(existing)
        return existing
    new_obj = 神殿智慧司教员业绩奖惩表(
        神殿=神殿,
        年份=年份,
        月份=月份,
        tab=tab,
        数据=数据,
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


def update_record(
    db: Session,
    record_id: int,
    数据: Optional[list] = None,
    年份: Optional[int] = None,
    月份: Optional[int] = None,
) -> Optional[神殿智慧司教员业绩奖惩表]:
    """更新记录"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    if 数据 is not None:
        obj.数据 = 数据
    if 年份 is not None:
        obj.年份 = 年份
    if 月份 is not None:
        obj.月份 = 月份
    db.commit()
    db.refresh(obj)
    return obj


def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    obj = get_record(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def delete_by_unique_key(db: Session, 神殿: str, 年份: int, 月份: int, tab: int) -> bool:
    """根据唯一键删除记录"""
    obj = get_by_unique_key(db, 神殿, 年份, 月份, tab)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
