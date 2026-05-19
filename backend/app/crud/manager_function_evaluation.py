"""
CRUD operations for manager function evaluation
最高议事厅智慧司学术经理功能评价表
"""

import copy

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.manager_function_evaluation import 最高议事厅学术经理功能评价表
from app.models.user import User, UserStatus
from app.schemas.manager_function_evaluation import (
    ManagerFunctionEvaluationCreate,
    ManagerFunctionEvaluationUpdate,
)


def list_records(
    db: Session,
    神殿: str | None = None,
    年份: int | None = None,
    月份: str | None = None,
    filter_by_position: bool = False,
):
    """
    列表查询
    
    参数:
        filter_by_position: 是否按用户职位过滤（仅保留学术经理和学术副经理）
                           最高议事厅汇总页面应设为 False 以显示所有数据
    """
    query = db.query(最高议事厅学术经理功能评价表)
    if 神殿:
        query = query.filter(最高议事厅学术经理功能评价表.神殿 == 神殿)
    if 年份:
        query = query.filter(最高议事厅学术经理功能评价表.年份 == 年份)
    if 月份:
        query = query.filter(最高议事厅学术经理功能评价表.月份 == 月份)
    records = query.order_by(最高议事厅学术经理功能评价表.神殿, 最高议事厅学术经理功能评价表.月份).all()
    
    # 如果不需要按职位过滤，直接返回所有记录
    if not filter_by_position:
        return records
    
    # 获取所有学术经理和学术副经理的姓名列表
    academic_managers = db.query(User.real_name).filter(
        User.position.in_(['学术经理', '学术副经理']),
        User.status == UserStatus.ACTIVE
    ).all()
    manager_names = {user.real_name for user in academic_managers if user.real_name}
    
    # 过滤每条记录的 evaluators，只保留学术经理和学术副经理
    filtered_records = []
    for record in records:
        if not record.数据 or not isinstance(record.数据, dict):
            continue
        
        # 获取数据字典（JSONB字段在SQLAlchemy中返回的是字典）
        data = record.数据
        
        # 过滤 evaluators 数组
        if 'evaluators' in data and isinstance(data['evaluators'], list):
            original_evaluators = data['evaluators']
            filtered_evaluators = [
                evaluator for evaluator in original_evaluators
                if isinstance(evaluator, dict) and evaluator.get('name') in manager_names
            ]
            
            # 如果有过滤后的evaluators，修改数据（JSONB字段是可变的）
            if filtered_evaluators:
                # 创建数据字典的副本（避免修改原始数据）
                new_data = copy.deepcopy(data)
                new_data['evaluators'] = filtered_evaluators
                record.数据 = new_data
                filtered_records.append(record)
    
    return filtered_records


def get_by_id(db: Session, record_id: int):
    """根据ID获取"""
    return db.query(最高议事厅学术经理功能评价表).filter(最高议事厅学术经理功能评价表.id == record_id).first()


def get_by_campus_month(db: Session, 神殿: str, 月份: str):
    """根据神殿和月份获取唯一记录"""
    return db.query(最高议事厅学术经理功能评价表).filter(
        and_(
            最高议事厅学术经理功能评价表.神殿 == 神殿,
            最高议事厅学术经理功能评价表.月份 == 月份,
        )
    ).first()


def upsert(db: Session, payload: ManagerFunctionEvaluationCreate):
    """创建或更新（同神殿+月份唯一）"""
    existing = get_by_campus_month(db, payload.神殿, payload.月份)
    if existing:
        # 更新
        existing.数据 = payload.数据.model_dump() if hasattr(payload.数据, 'model_dump') else payload.数据
        existing.年份 = payload.年份
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # 创建
        obj = 最高议事厅学术经理功能评价表(
            神殿=payload.神殿,
            年份=payload.年份,
            月份=payload.月份,
            数据=payload.数据.model_dump() if hasattr(payload.数据, 'model_dump') else payload.数据,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj


def update(db: Session, record_id: int, payload: ManagerFunctionEvaluationUpdate):
    """更新记录"""
    obj = get_by_id(db, record_id)
    if not obj:
        return None
    if payload.数据 is not None:
        obj.数据 = payload.数据.model_dump() if hasattr(payload.数据, 'model_dump') else payload.数据
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, record_id: int) -> bool:
    """删除记录"""
    obj = get_by_id(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
