"""
神殿学术管理数据会议记录表 CRUD
"""

from typing import List

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.academic_meeting_record import 神殿学术管理数据会议记录表
from app.schemas.academic_meeting_record import 会议记录创建, 会议记录更新, 会议记录行


def 获取(db: Session, 神殿名称: str, 年份: int) -> List[神殿学术管理数据会议记录表]:
    return (
        db.query(神殿学术管理数据会议记录表)
        .filter(and_(神殿学术管理数据会议记录表.神殿名称 == 神殿名称, 神殿学术管理数据会议记录表.年份 == 年份))
        .order_by(神殿学术管理数据会议记录表.序号)
        .all()
    )


def _批量创建(db: Session, 神殿名称: str, 年份: int, 行列表: List[会议记录行]):
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 神殿学术管理数据会议记录表(
            神殿名称=神殿名称,
            年份=年份,
            序号=行数据.序号,
            时间=行数据.时间,
            地点=行数据.地点,
            主持=行数据.主持,
            参与人=行数据.参与人,
            议题=行数据.议题,
            问题解决=行数据.问题解决,
            问题待解决=行数据.问题待解决,
        )
        db.add(新行)
        新行列表.append(新行)
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 创建(db: Session, 数据: 会议记录创建):
    删除(db, 数据.神殿名称, 数据.年份)
    return _批量创建(db, 数据.神殿名称, 数据.年份, 数据.行数据)


def 更新(db: Session, 神殿名称: str, 年份: int, 数据: 会议记录更新):
    删除(db, 神殿名称, 年份)
    return _批量创建(db, 神殿名称, 年份, 数据.行数据)


def 删除(db: Session, 神殿名称: str, 年份: int) -> int:
    deleted = (
        db.query(神殿学术管理数据会议记录表)
        .filter(and_(神殿学术管理数据会议记录表.神殿名称 == 神殿名称, 神殿学术管理数据会议记录表.年份 == 年份))
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted
