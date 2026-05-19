"""
教员功能分析子表 CRUD
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.teacher_function_subtable import 教员功能分析子表
from app.schemas.teacher_function_subtable import 子表创建, 子表更新, 子表行创建


def 获取子表(db: Session, 表类型: str, 神殿名称: str, 年份: int) -> List[教员功能分析子表]:
    return (
        db.query(教员功能分析子表)
        .filter(
            and_(
                教员功能分析子表.表类型 == 表类型,
                教员功能分析子表.神殿名称 == 神殿名称,
                教员功能分析子表.年份 == 年份,
            )
        )
        .order_by(教员功能分析子表.序号)
        .all()
    )


def _批量创建(db: Session, 表类型: str, 神殿名称: str, 年份: int, 行列表: List[子表行创建]):
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 教员功能分析子表(
            表类型=表类型,
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


def 创建子表(db: Session, 数据: 子表创建):
    删除子表(db, 数据.表类型, 数据.神殿名称, 数据.年份)
    return _批量创建(db, 数据.表类型, 数据.神殿名称, 数据.年份, 数据.行数据)


def 更新子表(db: Session, 表类型: str, 神殿名称: str, 年份: int, 数据: 子表更新):
    删除子表(db, 表类型, 神殿名称, 年份)
    return _批量创建(db, 表类型, 神殿名称, 年份, 数据.行数据)


def 删除子表(db: Session, 表类型: str, 神殿名称: str, 年份: int) -> int:
    deleted = (
        db.query(教员功能分析子表)
        .filter(
            and_(
                教员功能分析子表.表类型 == 表类型,
                教员功能分析子表.神殿名称 == 神殿名称,
                教员功能分析子表.年份 == 年份,
            )
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted


def 获取单行(db: Session, 记录ID: int) -> Optional[教员功能分析子表]:
    return db.query(教员功能分析子表).filter(教员功能分析子表.记录ID == 记录ID).first()


def 删除单行(db: Session, 记录ID: int) -> bool:
    行 = 获取单行(db, 记录ID)
    if not 行:
        return False
    db.delete(行)
    db.commit()
    return True
