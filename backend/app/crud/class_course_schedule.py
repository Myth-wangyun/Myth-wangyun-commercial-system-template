"""班排课表CRUD操作"""

from datetime import date
from typing import List, Optional, Set

from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models.class_course_schedule import 班排课表


def _normalize_campus_variations(campus: str) -> Set[str]:
    """生成用于匹配的神殿名称变体，保证"测试神殿"与"测试"均能命中"""
    trimmed = (campus or "").strip()
    base = trimmed.replace("神殿", "").strip()
    variants = {trimmed, base, f"{base}神殿"}
    return {name for name in variants if name}


def _apply_campus_filter(query, campus: Optional[str]):
    if not campus:
        return query
    variants = _normalize_campus_variations(campus)
    return query.filter(or_(*[班排课表.神殿 == name for name in variants]))


def 创建班排课表(
    db: Session,
    神殿: str,
    班级代码: str,
    日期: date,
    课程名称: str,
    课程编号: int = 0,
    授课教师: Optional[str] = None,
    颜色: str = '#1890ff',
    类型: str = 'course',
    备注: Optional[str] = None,
) -> 班排课表:
    """创建班排课表记录"""
    db_course = 班排课表(
        神殿=神殿,
        班级代码=班级代码,
        日期=日期,
        课程名称=课程名称,
        课程编号=课程编号,
        授课教师=授课教师,
        颜色=颜色,
        类型=类型,
        备注=备注,
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def 获取班排课表列表(
    db: Session,
    神殿: Optional[str] = None,
    班级代码: Optional[str] = None,
    日期_开始: Optional[date] = None,
    日期_结束: Optional[date] = None,
    类型: Optional[str] = None,
) -> List[班排课表]:
    """获取班排课表列表"""
    query = db.query(班排课表)
    query = _apply_campus_filter(query, 神殿)
    
    if 班级代码:
        query = query.filter(班排课表.班级代码 == 班级代码)
    if 日期_开始:
        query = query.filter(班排课表.日期 >= 日期_开始)
    if 日期_结束:
        query = query.filter(班排课表.日期 <= 日期_结束)
    if 类型:
        query = query.filter(班排课表.类型 == 类型)
    
    return query.order_by(
        班排课表.日期.desc(),
        班排课表.班级代码,
        班排课表.课程编号,
    ).all()


def 获取班排课表(
    db: Session,
    课程ID: int,
) -> Optional[班排课表]:
    """根据ID获取班排课表"""
    return db.query(班排课表).filter(班排课表.课程ID == 课程ID).first()


def 更新班排课表(
    db: Session,
    课程ID: int,
    更新数据: dict,
) -> Optional[班排课表]:
    """更新班排课表"""
    db_course = db.query(班排课表).filter(班排课表.课程ID == 课程ID).first()
    if not db_course:
        return None
    
    for key, value in 更新数据.items():
        if hasattr(db_course, key) and value is not None:
            setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course


def 删除班排课表(
    db: Session,
    课程ID: int,
) -> bool:
    """删除班排课表"""
    db_course = db.query(班排课表).filter(班排课表.课程ID == 课程ID).first()
    if not db_course:
        return False
    
    db.delete(db_course)
    db.commit()
    return True


def 批量删除班排课表(
    db: Session,
    神殿: Optional[str] = None,
    班级代码: Optional[str] = None,
    日期_开始: Optional[date] = None,
    日期_结束: Optional[date] = None,
) -> int:
    """批量删除班排课表，返回删除的记录数"""
    query = db.query(班排课表)
    query = _apply_campus_filter(query, 神殿)
    
    if 班级代码:
        query = query.filter(班排课表.班级代码 == 班级代码)
    if 日期_开始:
        query = query.filter(班排课表.日期 >= 日期_开始)
    if 日期_结束:
        query = query.filter(班排课表.日期 <= 日期_结束)
    
    count = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    return count

