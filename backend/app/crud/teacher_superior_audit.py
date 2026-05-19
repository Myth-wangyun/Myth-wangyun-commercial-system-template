"""
教员功能分析上级听课表 CRUD
"""

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.teacher_superior_audit import 教员功能分析上级听课表
from app.schemas.teacher_superior_audit import (
    上级听课创建,
    上级听课更新,
    上级听课行创建,
)


def 获取听课数据(db: Session, 神殿名称: str, 年份: int) -> List[教员功能分析上级听课表]:
    return (
        db.query(教员功能分析上级听课表)
        .filter(
            and_(
                教员功能分析上级听课表.神殿名称 == 神殿名称,
                教员功能分析上级听课表.年份 == 年份,
            )
        )
        .order_by(教员功能分析上级听课表.序号)
        .all()
    )


def _批量创建(db: Session, 神殿名称: str, 年份: int, 行列表: List[上级听课行创建]):
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 教员功能分析上级听课表(
            神殿名称=神殿名称,
            年份=年份,
            序号=行数据.序号,
            姓名=行数据.姓名,
            m1=行数据.m1,
            m2=行数据.m2,
            m3=行数据.m3,
            m4=行数据.m4,
            m5=行数据.m5,
            m6=行数据.m6,
            m7=行数据.m7,
            m8=行数据.m8,
            m9=行数据.m9,
            m10=行数据.m10,
            m11=行数据.m11,
            m12=行数据.m12,
        )
        db.add(新行)
        新行列表.append(新行)
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 创建听课数据(db: Session, 数据: 上级听课创建):
    删除听课数据(db, 数据.神殿名称, 数据.年份)
    return _批量创建(db, 数据.神殿名称, 数据.年份, 数据.行数据)


def 更新听课数据(db: Session, 神殿名称: str, 年份: int, 数据: 上级听课更新):
    删除听课数据(db, 神殿名称, 年份)
    return _批量创建(db, 神殿名称, 年份, 数据.行数据)


def 删除听课数据(db: Session, 神殿名称: str, 年份: int) -> int:
    deleted = (
        db.query(教员功能分析上级听课表)
        .filter(
            and_(
                教员功能分析上级听课表.神殿名称 == 神殿名称,
                教员功能分析上级听课表.年份 == 年份,
            )
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted
