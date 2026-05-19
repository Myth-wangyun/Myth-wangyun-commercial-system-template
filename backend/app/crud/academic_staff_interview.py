"""
智慧司访谈记录表 CRUD
"""

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.academic_staff_interview import 智慧司访谈记录表
from app.schemas.academic_staff_interview import 访谈记录创建, 访谈记录更新


def 获取(db: Session, 神殿名称: str, 年份: int, 月份: int) -> 智慧司访谈记录表 | None:
    return (
        db.query(智慧司访谈记录表)
        .filter(
            and_(
                智慧司访谈记录表.神殿名称 == 神殿名称,
                智慧司访谈记录表.年份 == 年份,
                智慧司访谈记录表.月份 == 月份,
            )
        )
        .first()
    )


def 获取月份列表(db: Session, 神殿名称: str, 年份: int) -> List[int]:
    rows = (
        db.query(智慧司访谈记录表.月份)
        .filter(
            and_(
                智慧司访谈记录表.神殿名称 == 神殿名称,
                智慧司访谈记录表.年份 == 年份,
            )
        )
        .distinct()
        .order_by(智慧司访谈记录表.月份)
        .all()
    )
    return [row[0] for row in rows]


def 创建(db: Session, 数据: 访谈记录创建):
    删除(db, 数据.神殿名称, 数据.年份, 数据.月份)
    记录 = 智慧司访谈记录表(
        神殿名称=数据.神殿名称,
        年份=数据.年份,
        月份=数据.月份,
        表格数据=[行.model_dump() for 行 in 数据.表格数据],
    )
    db.add(记录)
    db.commit()
    db.refresh(记录)
    return 记录


def 更新(db: Session, 神殿名称: str, 年份: int, 月份: int, 数据: 访谈记录更新):
    existing = 获取(db, 神殿名称, 年份, 月份)
    if existing:
        existing.表格数据 = [行.model_dump() for 行 in 数据.表格数据]
    else:
        existing = 智慧司访谈记录表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            表格数据=[行.model_dump() for 行 in 数据.表格数据],
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def 删除(db: Session, 神殿名称: str, 年份: int, 月份: int) -> int:
    deleted = (
        db.query(智慧司访谈记录表)
        .filter(
            and_(
                智慧司访谈记录表.神殿名称 == 神殿名称,
                智慧司访谈记录表.年份 == 年份,
                智慧司访谈记录表.月份 == 月份,
            )
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted
