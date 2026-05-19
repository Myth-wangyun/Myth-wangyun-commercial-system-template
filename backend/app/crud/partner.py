"""
合作方联系方式模块CRUD操作
"""

from typing import Optional

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from app.models.partner import 合作方联系方式表
from app.schemas.partner import 合作方联系方式创建, 合作方联系方式更新


def 获取合作方列表(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    公司名称: Optional[str] = None,
    合作方类型: Optional[str] = None,
    搜索关键词: Optional[str] = None
) -> dict:
    """
    获取合作方列表
    
    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的记录数
        公司名称: 筛选公司名称
        合作方类型: 筛选合作方类型
        搜索关键词: 搜索关键词（名称、联系人、电话）
    
    Returns:
        合作方列表及统计信息
    """
    query = db.query(合作方联系方式表)
    
    # 构建筛选条件
    filters = []
    
    if 公司名称:
        filters.append(合作方联系方式表.公司名称.like(f"%{公司名称}%"))
    
    if 合作方类型:
        filters.append(合作方联系方式表.合作方类型 == 合作方类型)
    
    if 搜索关键词:
        # 在多个字段中搜索
        search_filters = [
            合作方联系方式表.公司名称.like(f"%{搜索关键词}%"),
            合作方联系方式表.联系人.like(f"%{搜索关键词}%"),
            合作方联系方式表.电话.like(f"%{搜索关键词}%"),
            合作方联系方式表.联系人手机.like(f"%{搜索关键词}%")
        ]
        filters.append(or_(*search_filters))
    
    # 应用筛选条件
    if filters:
        query = query.filter(and_(*filters))
    
    # 计算总数
    total = query.count()
    
    # 排序和分页
    items = query.order_by(desc(合作方联系方式表.创建时间)).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": items
    }


def 获取合作方(db: Session, 合作方ID: int) -> Optional[合作方联系方式表]:
    """
    根据ID获取单个合作方
    
    Args:
        db: 数据库会话
        合作方ID: 合作方ID
    
    Returns:
        合作方对象或None
    """
    return db.query(合作方联系方式表).filter(合作方联系方式表.合作方ID == 合作方ID).first()


def 创建合作方(db: Session, data: 合作方联系方式创建) -> 合作方联系方式表:
    """
    创建新的合作方记录
    
    Args:
        db: 数据库会话
        data: 合作方联系方式创建对象
    
    Returns:
        创建的合作方对象
    """
    # 检查是否已存在相同名称的合作方
    existing = db.query(合作方联系方式表).filter(
        合作方联系方式表.公司名称 == data.公司名称
    ).first()
    
    if existing:
        raise ValueError(f"公司 '{data.公司名称}' 已存在")
    
    # 创建新记录
    db_data = 合作方联系方式表(**data.model_dump())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data


def 更新合作方(db: Session, 合作方ID: int, data: 合作方联系方式更新) -> Optional[合作方联系方式表]:
    """
    更新合作方记录
    
    Args:
        db: 数据库会话
        合作方ID: 合作方ID
        data: 合作方联系方式更新对象
    
    Returns:
        更新后的合作方对象或None
    """
    db_data = db.query(合作方联系方式表).filter(合作方联系方式表.合作方ID == 合作方ID).first()
    
    if not db_data:
        return None
    
    # 检查更新后的名称是否与其他记录冲突
    update_data = data.model_dump(exclude_unset=True)
    if '公司名称' in update_data:
        existing = db.query(合作方联系方式表).filter(
            and_(
                合作方联系方式表.公司名称 == update_data['公司名称'],
                合作方联系方式表.合作方ID != 合作方ID
            )
        ).first()
        
        if existing:
            raise ValueError(f"公司 '{update_data['公司名称']}' 已存在")
    
    # 更新字段
    for field, value in update_data.items():
        setattr(db_data, field, value)
    
    db.commit()
    db.refresh(db_data)
    return db_data


def 删除合作方(db: Session, 合作方ID: int) -> bool:
    """
    删除合作方记录
    
    Args:
        db: 数据库会话
        合作方ID: 合作方ID
    
    Returns:
        是否删除成功
    """
    db_data = db.query(合作方联系方式表).filter(合作方联系方式表.合作方ID == 合作方ID).first()
    
    if not db_data:
        return False
    
    db.delete(db_data)
    db.commit()
    return True


def 获取合作方统计(db: Session) -> dict:
    """
    获取合作方统计信息
    
    Args:
        db: 数据库会话
    
    Returns:
        统计信息字典
    """
    # 总数
    总数 = db.query(合作方联系方式表).count()
    
    # 按类型统计
    类型统计 = {}
    types = ["广告代理", "网络", "平媒", "招生合作伙伴", "网络服务", "人才服务", "通话服务", "物业服务"]
    for t in types:
        count = db.query(合作方联系方式表).filter(合作方联系方式表.合作方类型 == t).count()
        类型统计[t] = count
    
    return {
        "总数": 总数,
        "类型统计": 类型统计
    }
