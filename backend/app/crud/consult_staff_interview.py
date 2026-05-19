"""
祈福司员工访谈记录表 CRUD
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.consult.staff_interview import 祈福司访谈记录表
from ..schemas.consult_staff_interview import 访谈记录创建, 访谈记录更新


def 获取(db: Session, year: int) -> Optional[祈福司访谈记录表]:
    """获取指定年份的访谈记录"""
    stmt = select(祈福司访谈记录表).where(祈福司访谈记录表.年份 == year)
    return db.execute(stmt).scalars().first()


def 创建(db: Session, 数据: 访谈记录创建) -> 祈福司访谈记录表:
    """创建新的访谈记录"""
    # 检查是否已存在
    existing = 获取(db, 数据.年份)
    if existing:
        raise ValueError(f"年份 {数据.年份} 的访谈记录已存在")

    # 将 Pydantic 模型转换为 dict
    表格数据_dict = [row.model_dump() for row in 数据.表格数据]

    db_record = 祈福司访谈记录表(
        年份=数据.年份,
        表格数据=表格数据_dict,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def 更新(db: Session, year: int, 数据: 访谈记录更新) -> Optional[祈福司访谈记录表]:
    """更新访谈记录"""
    record = 获取(db, year)
    if not record:
        return None

    # 将 Pydantic 模型转换为 dict
    表格数据_dict = [row.model_dump() for row in 数据.表格数据]
    record.表格数据 = 表格数据_dict

    db.commit()
    db.refresh(record)
    return record


def 删除(db: Session, year: int) -> bool:
    """删除访谈记录"""
    record = 获取(db, year)
    if not record:
        return False

    db.delete(record)
    db.commit()
    return True
