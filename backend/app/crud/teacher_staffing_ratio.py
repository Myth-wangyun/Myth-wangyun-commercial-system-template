"""
CRUD for campus academic teacher staffing ratio
神殿智慧司师资配比表 CRUD 操作
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.teacher_staffing_ratio import 神殿智慧司师资配比表


def list_records(
    db: Session,
    神殿: str,
    年份: Optional[int] = None,
) -> List[神殿智慧司师资配比表]:
    """获取师资配比记录列表"""
    query = db.query(神殿智慧司师资配比表).filter(
        神殿智慧司师资配比表.神殿 == 神殿
    )
    if 年份 is not None:
        query = query.filter(神殿智慧司师资配比表.年份 == 年份)
    return query.order_by(
        神殿智慧司师资配比表.年份.desc(),
        神殿智慧司师资配比表.id.desc(),
    ).all()


def get_record(db: Session, record_id: int) -> Optional[神殿智慧司师资配比表]:
    """根据ID获取单条记录"""
    return db.query(神殿智慧司师资配比表).filter_by(id=record_id).first()


def upsert_record(db: Session, 神殿: str, 年份: int, 数据: dict) -> 神殿智慧司师资配比表:
    """创建或更新记录（同神殿+年份唯一）"""
    existing = (
        db.query(神殿智慧司师资配比表)
        .filter(
            and_(
                神殿智慧司师资配比表.神殿 == 神殿,
                神殿智慧司师资配比表.年份 == 年份,
            )
        )
        .first()
    )
    if existing:
        existing.数据 = 数据
        db.commit()
        db.refresh(existing)
        return existing
    new_obj = 神殿智慧司师资配比表(
        神殿=神殿,
        年份=年份,
        数据=数据,
    )
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


def update_record(
    db: Session, record_id: int, 数据: Optional[dict] = None, 年份: Optional[int] = None
) -> Optional[神殿智慧司师资配比表]:
    """更新记录"""
    obj = get_record(db, record_id)
    if not obj:
        return None
    if 数据 is not None:
        obj.数据 = 数据
    if 年份 is not None:
        obj.年份 = 年份
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

