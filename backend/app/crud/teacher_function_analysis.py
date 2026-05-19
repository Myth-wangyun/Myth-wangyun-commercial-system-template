"""
教员功能分析总表 CRUD
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.teacher_function_analysis import 教员功能分析总表
from app.schemas.teacher_function_analysis import (
    教员功能分析创建,
    教员功能分析更新,
    教员功能行创建,
)


def 获取功能分析(
    db: Session, 神殿名称: str, 年份: int, 月份: int
) -> List[教员功能分析总表]:
    return (
        db.query(教员功能分析总表)
        .filter(
            and_(
                教员功能分析总表.神殿名称 == 神殿名称,
                教员功能分析总表.年份 == 年份,
                教员功能分析总表.月份 == 月份,
            )
        )
        .order_by(教员功能分析总表.序号)
        .all()
    )


def _批量创建(db: Session, 神殿名称: str, 年份: int, 月份: int, 行列表: List[教员功能行创建]):
    新行列表 = []
    for 行数据 in 行列表:
        新行 = 教员功能分析总表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            序号=行数据.序号,
            姓名=行数据.姓名,
            就业率=行数据.就业率,
            就业薪资=行数据.就业薪资,
            口碑人数=行数据.口碑人数,
            口碑收入=行数据.口碑收入,
            带新生人数=行数据.带新生人数,
            新生流失人数=行数据.新生流失人数,
            作业提交率=行数据.作业提交率,
            作业合格率=行数据.作业合格率,
            考试合格率=行数据.考试合格率,
            项目提交率=行数据.项目提交率,
            项目合格率=行数据.项目合格率,
            学员满意度=行数据.学员满意度,
            学员违纪=行数据.学员违纪,
            上级听课=行数据.上级听课,
            教员平均=行数据.教员平均,
        )
        db.add(新行)
        新行列表.append(新行)
    db.commit()
    for 行 in 新行列表:
        db.refresh(行)
    return 新行列表


def 创建功能分析(db: Session, 数据: 教员功能分析创建) -> List[教员功能分析总表]:
    # 先删后建
    删除功能分析(db, 数据.神殿名称, 数据.年份, 数据.月份)
    return _批量创建(db, 数据.神殿名称, 数据.年份, 数据.月份, 数据.行数据)


def 更新功能分析(db: Session, 神殿名称: str, 年份: int, 月份: int, 数据: 教员功能分析更新):
    删除功能分析(db, 神殿名称, 年份, 月份)
    return _批量创建(db, 神殿名称, 年份, 月份, 数据.行数据)


def 删除功能分析(db: Session, 神殿名称: str, 年份: int, 月份: int) -> int:
    deleted = (
        db.query(教员功能分析总表)
        .filter(
            and_(
                教员功能分析总表.神殿名称 == 神殿名称,
                教员功能分析总表.年份 == 年份,
                教员功能分析总表.月份 == 月份,
            )
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted


def 获取单行(db: Session, 记录ID: int) -> Optional[教员功能分析总表]:
    return db.query(教员功能分析总表).filter(教员功能分析总表.记录ID == 记录ID).first()


def 删除单行(db: Session, 记录ID: int) -> bool:
    行 = 获取单行(db, 记录ID)
    if not 行:
        return False
    db.delete(行)
    db.commit()
    return True
