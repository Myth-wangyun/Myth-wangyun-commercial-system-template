"""
咨询模块CRUD操作
"""

from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.consult import 咨询量明细表
from app.schemas.consult.consultation_record import (
    咨询量明细表创建 as 咨询量明细创建,
)
from app.schemas.consult.consultation_record import (
    咨询量明细表更新 as 咨询量明细更新,
)


def 获取咨询量明细列表(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    咨询日期: Optional[date] = None,
    咨询状态: Optional[str] = None,
    学员姓名: Optional[str] = None,
    联系电话: Optional[str] = None
) -> dict:
    """
    获取咨询量明细列表
    
    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的记录数
        咨询日期: 筛选咨询日期
        咨询状态: 筛选咨询状态
        学员姓名: 筛选学员姓名
        联系电话: 筛选联系电话
    
    Returns:
        包含数据和总数的字典
    """
    query = db.query(咨询量明细表)
    
    # 应用筛选条件
    if 咨询日期:
        query = query.filter(咨询量明细表.咨询日期 == 咨询日期)
    
    if 咨询状态:
        query = query.filter(咨询量明细表.咨询状态 == 咨询状态)
    
    if 学员姓名:
        query = query.filter(咨询量明细表.学员姓名.like(f"%{学员姓名}%"))
    
    if 联系电话:
        query = query.filter(咨询量明细表.联系电话.like(f"%{联系电话}%"))
    
    # 获取总数
    total = query.count()
    
    # 分页和排序
    data = query.order_by(咨询量明细表.咨询日期.desc()).offset(skip).limit(limit).all()
    
    return {
        "data": data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


def 获取咨询量明细(db: Session, 咨询ID: int) -> Optional[咨询量明细表]:
    """
    根据ID获取咨询量明细
    
    Args:
        db: 数据库会话
        咨询ID: 咨询ID
    
    Returns:
        咨询量明细记录或None
    """
    return db.query(咨询量明细表).filter(咨询量明细表.咨询ID == 咨询ID).first()


def 创建咨询量明细(db: Session, data: 咨询量明细创建) -> 咨询量明细表:
    """
    创建新的咨询量明细记录
    
    Args:
        db: 数据库会话
        data: 咨询量明细创建数据
    
    Returns:
        创建的咨询量明细记录
    """
    db_data = 咨询量明细表(**data.model_dump())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data


def 更新咨询量明细(db: Session, 咨询ID: int, data: 咨询量明细更新) -> Optional[咨询量明细表]:
    """
    更新咨询量明细记录
    
    Args:
        db: 数据库会话
        咨询ID: 咨询ID
        data: 更新数据
    
    Returns:
        更新后的咨询量明细记录或None
    """
    db_data = db.query(咨询量明细表).filter(咨询量明细表.咨询ID == 咨询ID).first()
    
    if not db_data:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_data, field, value)
    
    db.commit()
    db.refresh(db_data)
    return db_data


def 删除咨询量明细(db: Session, 咨询ID: int) -> bool:
    """
    删除咨询量明细记录
    
    Args:
        db: 数据库会话
        咨询ID: 咨询ID
    
    Returns:
        是否删除成功
    """
    db_data = db.query(咨询量明细表).filter(咨询量明细表.咨询ID == 咨询ID).first()
    
    if not db_data:
        return False
    
    db.delete(db_data)
    db.commit()
    return True


def 获取咨询统计(db: Session, 开始日期: Optional[date] = None, 结束日期: Optional[date] = None) -> dict:
    """
    获取咨询统计数据
    
    Args:
        db: 数据库会话
        开始日期: 开始日期
        结束日期: 结束日期
    
    Returns:
        统计数据字典
    """
    query = db.query(咨询量明细表)
    
    if 开始日期:
        query = query.filter(咨询量明细表.咨询日期 >= 开始日期)
    
    if 结束日期:
        query = query.filter(咨询量明细表.咨询日期 <= 结束日期)
    
    # 总咨询数
    total_consultations = query.count()
    
    # 按咨询状态统计
    status_stats = {}
    for status in ["待跟进", "跟进中", "已报名", "已放弃"]:
        count = query.filter(咨询量明细表.咨询状态 == status).count()
        status_stats[status] = count
    
    # 按转化状态统计
    conversion_stats = {}
    for status in ["未转化", "已转化", "流失"]:
        count = query.filter(咨询量明细表.转化状态 == status).count()
        conversion_stats[status] = count
    
    # 按咨询方式统计
    method_stats = {}
    for method in ["在线", "电话", "到访"]:
        count = query.filter(咨询量明细表.咨询方式 == method).count()
        method_stats[method] = count
    
    # 按意向等级统计
    level_stats = {}
    for level in ["高", "中", "低"]:
        count = query.filter(咨询量明细表.意向等级 == level).count()
        level_stats[level] = count
    
    return {
        "total_consultations": total_consultations,
        "status_stats": status_stats,
        "conversion_stats": conversion_stats,
        "method_stats": method_stats,
        "level_stats": level_stats
    }
