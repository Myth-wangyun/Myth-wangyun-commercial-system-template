"""
企业文化考试计划表CRUD操作
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.culture_exam import 企业文化考试计划表
from app.schemas.culture_exam import 考试计划创建, 考试计划更新, 考试计划行更新


def 获取考试计划(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int
) -> List[企业文化考试计划表]:
    """
    获取指定神殿、年份、月份的考试计划列表
    
    Args:
        db: 数据库会话
        神殿名称: 神殿名称
        年份: 年份
        月份: 月份
    
    Returns:
        考试计划列表，按序号排序
    """
    query = db.query(企业文化考试计划表).filter(
        and_(
            企业文化考试计划表.神殿名称 == 神殿名称,
            企业文化考试计划表.年份 == 年份,
            企业文化考试计划表.月份 == 月份
        )
    ).order_by(企业文化考试计划表.序号)
    
    return query.all()


def 创建考试计划(
    db: Session,
    计划数据: 考试计划创建
) -> List[企业文化考试计划表]:
    """
    创建考试计划（批量创建多行）
    
    Args:
        db: 数据库会话
        计划数据: 考试计划创建数据模型
    
    Returns:
        创建的考试计划列表
    """
    # 先删除该神殿、年份、月份的旧数据（如果存在）
    删除考试计划(db, 计划数据.神殿名称, 计划数据.年份, 计划数据.月份)
    
    # 批量创建新数据
    创建的行列表 = []
    for 行数据 in 计划数据.行数据:
        新行 = 企业文化考试计划表(
            神殿名称=计划数据.神殿名称,
            年份=计划数据.年份,
            月份=计划数据.月份,
            序号=行数据.序号,
            考试时间=行数据.考试时间,
            考试地点=行数据.考试地点,
            考试方式=行数据.考试方式,
            考试主题=行数据.考试主题,
            考试内容概述=行数据.考试内容概述,
            考试对象=行数据.考试对象,
            监考人=行数据.监考人,
            考场布置=行数据.考场布置,
            需准备资料=行数据.需准备资料,
            备注=行数据.备注
        )
        db.add(新行)
        创建的行列表.append(新行)
    
    db.commit()
    
    # 刷新对象以获取数据库生成的值
    for 行 in 创建的行列表:
        db.refresh(行)
    
    return 创建的行列表


def 更新考试计划(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int,
    计划数据: 考试计划更新
) -> List[企业文化考试计划表]:
    """
    更新考试计划（批量更新多行）
    
    Args:
        db: 数据库会话
        神殿名称: 神殿名称
        年份: 年份
        月份: 月份
        计划数据: 考试计划更新数据模型
    
    Returns:
        更新后的考试计划列表
    """
    # 先删除旧数据
    删除考试计划(db, 神殿名称, 年份, 月份)
    
    # 创建新数据（与创建逻辑相同）
    创建的行列表 = []
    for 行数据 in 计划数据.行数据:
        新行 = 企业文化考试计划表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            序号=行数据.序号,
            考试时间=行数据.考试时间,
            考试地点=行数据.考试地点,
            考试方式=行数据.考试方式,
            考试主题=行数据.考试主题,
            考试内容概述=行数据.考试内容概述,
            考试对象=行数据.考试对象,
            监考人=行数据.监考人,
            考场布置=行数据.考场布置,
            需准备资料=行数据.需准备资料,
            备注=行数据.备注
        )
        db.add(新行)
        创建的行列表.append(新行)
    
    db.commit()
    
    # 刷新对象
    for 行 in 创建的行列表:
        db.refresh(行)
    
    return 创建的行列表


def 删除考试计划(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int
) -> int:
    """
    删除指定神殿、年份、月份的考试计划
    
    Args:
        db: 数据库会话
        神殿名称: 神殿名称
        年份: 年份
        月份: 月份
    
    Returns:
        删除的记录数
    """
    deleted_count = db.query(企业文化考试计划表).filter(
        and_(
            企业文化考试计划表.神殿名称 == 神殿名称,
            企业文化考试计划表.年份 == 年份,
            企业文化考试计划表.月份 == 月份
        )
    ).delete(synchronize_session=False)
    
    db.commit()
    return deleted_count


def 获取考试计划行(
    db: Session,
    计划ID: int
) -> Optional[企业文化考试计划表]:
    """
    根据计划ID获取单行考试计划
    
    Args:
        db: 数据库会话
        计划ID: 计划ID
    
    Returns:
        考试计划行，如果不存在则返回None
    """
    return db.query(企业文化考试计划表).filter(
        企业文化考试计划表.计划ID == 计划ID
    ).first()


def 更新考试计划行(
    db: Session,
    计划ID: int,
    行数据: 考试计划行更新
) -> Optional[企业文化考试计划表]:
    """
    更新单行考试计划
    
    Args:
        db: 数据库会话
        计划ID: 计划ID
        行数据: 考试计划行更新数据模型
    
    Returns:
        更新后的考试计划行，如果不存在则返回None
    """
    行 = db.query(企业文化考试计划表).filter(
        企业文化考试计划表.计划ID == 计划ID
    ).first()
    
    if not 行:
        return None
    
    # 更新字段
    if 行数据.考试时间 is not None:
        行.考试时间 = 行数据.考试时间
    if 行数据.考试地点 is not None:
        行.考试地点 = 行数据.考试地点
    if 行数据.考试方式 is not None:
        行.考试方式 = 行数据.考试方式
    if 行数据.考试主题 is not None:
        行.考试主题 = 行数据.考试主题
    if 行数据.考试对象 is not None:
        行.考试对象 = 行数据.考试对象
    if 行数据.组织人 is not None:
        行.组织人 = 行数据.组织人
    if 行数据.监考人 is not None:
        行.监考人 = 行数据.监考人
    if 行数据.需准备资料 is not None:
        行.需准备资料 = 行数据.需准备资料
    if 行数据.备注 is not None:
        行.备注 = 行数据.备注
    
    db.commit()
    db.refresh(行)
    
    return 行


def 删除考试计划行(
    db: Session,
    计划ID: int
) -> bool:
    """
    删除单行考试计划
    
    Args:
        db: 数据库会话
        计划ID: 计划ID
    
    Returns:
        是否删除成功
    """
    行 = db.query(企业文化考试计划表).filter(
        企业文化考试计划表.计划ID == 计划ID
    ).first()
    
    if not 行:
        return False
    
    db.delete(行)
    db.commit()
    return True

