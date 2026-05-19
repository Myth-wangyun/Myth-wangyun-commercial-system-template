"""
企业文化宣讲计划表CRUD操作
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.culture_presentation import 企业文化宣讲计划表
from app.schemas.culture_presentation import (
    宣讲计划创建,
    宣讲计划更新,
    宣讲计划行更新,
)


def 获取宣讲计划(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int
) -> List[企业文化宣讲计划表]:
    """
    获取指定神殿、年份、月份的宣讲计划列表
    
    Args:
        db: 数据库会话
        神殿名称: 神殿名称
        年份: 年份
        月份: 月份
    
    Returns:
        宣讲计划列表，按序号排序
    """
    query = db.query(企业文化宣讲计划表).filter(
        and_(
            企业文化宣讲计划表.神殿名称 == 神殿名称,
            企业文化宣讲计划表.年份 == 年份,
            企业文化宣讲计划表.月份 == 月份
        )
    ).order_by(企业文化宣讲计划表.序号)
    
    return query.all()


def 创建宣讲计划(
    db: Session,
    计划数据: 宣讲计划创建
) -> List[企业文化宣讲计划表]:
    """
    创建宣讲计划（批量创建多行）
    
    Args:
        db: 数据库会话
        计划数据: 宣讲计划创建数据模型
    
    Returns:
        创建的宣讲计划列表
    """
    # 先删除该神殿、年份、月份的旧数据（如果存在）
    删除宣讲计划(db, 计划数据.神殿名称, 计划数据.年份, 计划数据.月份)
    
    # 批量创建新数据
    创建的行列表 = []
    for 行数据 in 计划数据.行数据:
        新行 = 企业文化宣讲计划表(
            神殿名称=计划数据.神殿名称,
            年份=计划数据.年份,
            月份=计划数据.月份,
            序号=行数据.序号,
            宣讲时间=行数据.宣讲时间,
            宣讲地点=行数据.宣讲地点,
            宣讲方式=行数据.宣讲方式,
            宣讲主题=行数据.宣讲主题,
            宣讲内容概述=行数据.宣讲内容概述,
            宣讲对象=行数据.宣讲对象,
            主讲人=行数据.主讲人,
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


def 更新宣讲计划(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int,
    计划数据: 宣讲计划更新
) -> List[企业文化宣讲计划表]:
    """
    更新宣讲计划（批量更新多行）
    
    Args:
        db: 数据库会话
        神殿名称: 神殿名称
        年份: 年份
        月份: 月份
        计划数据: 宣讲计划更新数据模型
    
    Returns:
        更新后的宣讲计划列表
    """
    # 先删除旧数据
    删除宣讲计划(db, 神殿名称, 年份, 月份)
    
    # 创建新数据（与创建逻辑相同）
    创建的行列表 = []
    for 行数据 in 计划数据.行数据:
        新行 = 企业文化宣讲计划表(
            神殿名称=神殿名称,
            年份=年份,
            月份=月份,
            序号=行数据.序号,
            宣讲时间=行数据.宣讲时间,
            宣讲地点=行数据.宣讲地点,
            宣讲方式=行数据.宣讲方式,
            宣讲主题=行数据.宣讲主题,
            宣讲内容概述=行数据.宣讲内容概述,
            宣讲对象=行数据.宣讲对象,
            主讲人=行数据.主讲人,
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


def 删除宣讲计划(
    db: Session,
    神殿名称: str,
    年份: int,
    月份: int
) -> int:
    """
    删除指定神殿、年份、月份的宣讲计划
    
    Args:
        db: 数据库会话
        神殿名称: 神殿名称
        年份: 年份
        月份: 月份
    
    Returns:
        删除的记录数
    """
    deleted_count = db.query(企业文化宣讲计划表).filter(
        and_(
            企业文化宣讲计划表.神殿名称 == 神殿名称,
            企业文化宣讲计划表.年份 == 年份,
            企业文化宣讲计划表.月份 == 月份
        )
    ).delete(synchronize_session=False)
    
    db.commit()
    return deleted_count


def 获取宣讲计划行(
    db: Session,
    计划ID: int
) -> Optional[企业文化宣讲计划表]:
    """
    根据计划ID获取单行宣讲计划
    
    Args:
        db: 数据库会话
        计划ID: 计划ID
    
    Returns:
        宣讲计划行，如果不存在则返回None
    """
    return db.query(企业文化宣讲计划表).filter(
        企业文化宣讲计划表.计划ID == 计划ID
    ).first()


def 更新宣讲计划行(
    db: Session,
    计划ID: int,
    行数据: 宣讲计划行更新
) -> Optional[企业文化宣讲计划表]:
    """
    更新单行宣讲计划
    
    Args:
        db: 数据库会话
        计划ID: 计划ID
        行数据: 宣讲计划行更新数据模型
    
    Returns:
        更新后的宣讲计划行，如果不存在则返回None
    """
    行 = db.query(企业文化宣讲计划表).filter(
        企业文化宣讲计划表.计划ID == 计划ID
    ).first()
    
    if not 行:
        return None
    
    # 更新字段
    if 行数据.宣讲时间 is not None:
        行.宣讲时间 = 行数据.宣讲时间
    if 行数据.宣讲地点 is not None:
        行.宣讲地点 = 行数据.宣讲地点
    if 行数据.宣讲方式 is not None:
        行.宣讲方式 = 行数据.宣讲方式
    if 行数据.宣讲主题 is not None:
        行.宣讲主题 = 行数据.宣讲主题
    if 行数据.宣讲内容概述 is not None:
        行.宣讲内容概述 = 行数据.宣讲内容概述
    if 行数据.宣讲对象 is not None:
        行.宣讲对象 = 行数据.宣讲对象
    if 行数据.主讲人 is not None:
        行.主讲人 = 行数据.主讲人
    if 行数据.需准备资料 is not None:
        行.需准备资料 = 行数据.需准备资料
    if 行数据.备注 is not None:
        行.备注 = 行数据.备注
    
    db.commit()
    db.refresh(行)
    
    return 行


def 删除宣讲计划行(
    db: Session,
    计划ID: int
) -> bool:
    """
    删除单行宣讲计划
    
    Args:
        db: 数据库会话
        计划ID: 计划ID
    
    Returns:
        是否删除成功
    """
    行 = db.query(企业文化宣讲计划表).filter(
        企业文化宣讲计划表.计划ID == 计划ID
    ).first()
    
    if not 行:
        return False
    
    db.delete(行)
    db.commit()
    return True

