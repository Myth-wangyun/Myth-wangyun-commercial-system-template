"""
智慧司标准化检查表 CRUD
"""

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.academic_standardization_check import 智慧司标准化检查表
from app.schemas.academic_standardization_check import 标准化检查创建, 标准化检查更新


def 获取(db: Session, 神殿名称: str, 日期) -> List[智慧司标准化检查表]:
    return (
        db.query(智慧司标准化检查表)
        .filter(
            and_(
                智慧司标准化检查表.神殿名称 == 神殿名称,
                智慧司标准化检查表.日期 == 日期,
            )
        )
        .order_by(智慧司标准化检查表.序号)
        .all()
    )


def 获取日期列表(db: Session, 神殿名称: str):
    return (
        db.query(智慧司标准化检查表.日期)
        .filter(智慧司标准化检查表.神殿名称 == 神殿名称)
        .distinct()
        .order_by(智慧司标准化检查表.日期)
        .all()
    )


def _批量创建(db: Session, 数据: 标准化检查创建):
    新行列表 = []
    for 行数据 in 数据.行数据:
        新行 = 智慧司标准化检查表(
            神殿名称=数据.神殿名称,
            日期=行数据.日期,
            序号=行数据.序号,
            项目名称=行数据.项目名称,
            需要日期JSON=getattr(行数据, "需要日期JSON", None),
            问题JSON=getattr(行数据, "问题JSON", None),
            **{f"day{i}": getattr(行数据, f"day{i}") for i in range(1, 32)},
        )
        db.add(新行)
        新行列表.append(新行)
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 创建(db: Session, 数据: 标准化检查创建):
    日期集 = {行.日期 for 行 in 数据.行数据}
    for 日期 in 日期集:
        删除(db, 数据.神殿名称, 日期)
    return _批量创建(db, 数据)


def 更新(db: Session, 神殿名称: str, 日期, 数据: 标准化检查更新):
    删除(db, 神殿名称, 日期)
    创建数据 = 标准化检查创建(神殿名称=神殿名称, 行数据=数据.行数据)
    return _批量创建(db, 创建数据)


def 删除(db: Session, 神殿名称: str, 日期) -> int:
    deleted = (
        db.query(智慧司标准化检查表)
        .filter(
            and_(
                智慧司标准化检查表.神殿名称 == 神殿名称,
                智慧司标准化检查表.日期 == 日期,
            )
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted
