"""
网络咨询师报表 - A组和B组聊出率 CRUD 操作
"""

from datetime import date
from typing import Any, Dict, List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.market.network_consultant_chat_rate import (
    网络咨询师A组聊出率表,
    网络咨询师B组聊出率表,
)

# ==================== A组聊出率 CRUD ====================

def get_group_a_chat_rate_by_id(db: Session, record_id: int) -> Optional[网络咨询师A组聊出率表]:
    """根据ID获取A组聊出率记录"""
    return db.query(网络咨询师A组聊出率表).filter(网络咨询师A组聊出率表.id == record_id).first()


def get_group_a_chat_rate_list(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None,
    employee_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_summary: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[网络咨询师A组聊出率表]:
    """获取A组聊出率记录列表"""
    query = db.query(网络咨询师A组聊出率表)
    
    if year is not None:
        query = query.filter(网络咨询师A组聊出率表.年份 == year)
    
    if month is not None:
        query = query.filter(网络咨询师A组聊出率表.月份 == month)
    
    if employee_name:
        query = query.filter(网络咨询师A组聊出率表.网聊姓名.like(f"%{employee_name}%"))
    
    if start_date:
        query = query.filter(网络咨询师A组聊出率表.日期 >= start_date)
    
    if end_date:
        query = query.filter(网络咨询师A组聊出率表.日期 <= end_date)
    
    if is_summary is not None:
        query = query.filter(网络咨询师A组聊出率表.是否汇总 == (1 if is_summary else 0))
    
    query = query.order_by(网络咨询师A组聊出率表.日期.desc(), 网络咨询师A组聊出率表.网聊姓名)
    
    return query.offset(skip).limit(limit).all()


def get_group_a_chat_rate_by_month(
    db: Session,
    year: int,
    month: int,
) -> List[网络咨询师A组聊出率表]:
    """获取指定年月的A组聊出率记录（包括汇总）"""
    return db.query(网络咨询师A组聊出率表).filter(
        and_(
            网络咨询师A组聊出率表.年份 == year,
            网络咨询师A组聊出率表.月份 == month,
        )
    ).order_by(
        网络咨询师A组聊出率表.是否汇总.desc(),  # 汇总行在前
        网络咨询师A组聊出率表.日期,
        网络咨询师A组聊出率表.网聊姓名
    ).all()


def create_group_a_chat_rate(db: Session, data: Dict[str, Any]) -> 网络咨询师A组聊出率表:
    """创建A组聊出率记录"""
    # 计算有效对话量
    total_dialogs = data.get('总对话', 0)
    invalid_dialogs = data.get('无效对话量', 0)
    valid_dialogs = total_dialogs - invalid_dialogs
    
    # 计算有效对话率
    valid_dialog_rate = None
    if total_dialogs > 0:
        valid_dialog_rate = round((valid_dialogs / total_dialogs) * 100, 2)
    
    # 计算干预对话率
    intervention_dialog_rate = None
    valid_intervention_dialogs = data.get('有效干预对话量', 0)
    if valid_dialogs > 0:
        intervention_dialog_rate = round((valid_intervention_dialogs / valid_dialogs) * 100, 2)
    
    # 计算聊出率
    chat_output_rate = None
    chat_output = data.get('聊出量', 0)
    if valid_intervention_dialogs > 0:
        chat_output_rate = round((chat_output / valid_intervention_dialogs) * 100, 2)
    
    record = 网络咨询师A组聊出率表(
        年份=data['年份'],
        月份=data['月份'],
        日期=data['日期'],
        星期=data.get('星期'),
        班次=data.get('班次'),
        网聊姓名=data['网聊姓名'],
        进线量=data.get('进线量', 0),
        总对话=total_dialogs,
        无效对话量=invalid_dialogs,
        有效对话量=valid_dialogs,
        有效对话率=valid_dialog_rate,
        有效干预对话量=valid_intervention_dialogs,
        干预对话率=intervention_dialog_rate,
        聊出量=chat_output,
        聊出率=chat_output_rate,
        是否汇总=data.get('是否汇总', 0),
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_group_a_chat_rate(
    db: Session,
    record_id: int,
    data: Dict[str, Any]
) -> Optional[网络咨询师A组聊出率表]:
    """更新A组聊出率记录"""
    record = get_group_a_chat_rate_by_id(db, record_id)
    if not record:
        return None
    
    # 更新基本字段
    for key, value in data.items():
        if hasattr(record, key) and key not in ['id', '创建时间', '更新时间']:
            setattr(record, key, value)
    
    # 重新计算有效对话量
    record.有效对话量 = record.总对话 - record.无效对话量
    
    # 重新计算有效对话率
    if record.总对话 > 0:
        record.有效对话率 = round((record.有效对话量 / record.总对话) * 100, 2)
    else:
        record.有效对话率 = None
    
    # 重新计算干预对话率
    if record.有效对话量 > 0:
        record.干预对话率 = round((record.有效干预对话量 / record.有效对话量) * 100, 2)
    else:
        record.干预对话率 = None
    
    # 重新计算聊出率
    if record.有效干预对话量 > 0:
        record.聊出率 = round((record.聊出量 / record.有效干预对话量) * 100, 2)
    else:
        record.聊出率 = None
    
    db.commit()
    db.refresh(record)
    return record


def delete_group_a_chat_rate(db: Session, record_id: int) -> bool:
    """删除A组聊出率记录"""
    record = get_group_a_chat_rate_by_id(db, record_id)
    if not record:
        return False
    
    db.delete(record)
    db.commit()
    return True


def batch_create_or_update_group_a(
    db: Session,
    year: int,
    month: int,
    records: List[Dict[str, Any]]
) -> List[网络咨询师A组聊出率表]:
    """批量创建或更新A组聊出率记录"""
    result = []
    
    for data in records:
        # 同一天同一人只有一个班次，所以只根据年份、月份、日期、姓名查询
        # 注意：排除汇总行（是否汇总=1）
        existing = db.query(网络咨询师A组聊出率表).filter(
            and_(
                网络咨询师A组聊出率表.年份 == year,
                网络咨询师A组聊出率表.月份 == month,
                网络咨询师A组聊出率表.日期 == data['日期'],
                网络咨询师A组聊出率表.网聊姓名 == data['网聊姓名'],
                网络咨询师A组聊出率表.是否汇总 == 0,  # 排除汇总行
            )
        ).first()
        
        if existing:
            # 更新现有记录（包括可能修改班次）
            # 先删除旧记录，再创建新记录，避免唯一约束冲突
            db.delete(existing)
            db.flush()  # 立即执行删除
            
            # 创建新记录
            data['年份'] = year
            data['月份'] = month
            record = create_group_a_chat_rate(db, data)
        else:
            # 创建新记录
            data['年份'] = year
            data['月份'] = month
            record = create_group_a_chat_rate(db, data)
        
        if record:
            result.append(record)
    
    return result


# ==================== B组聊出率 CRUD ====================

def get_group_b_chat_rate_by_id(db: Session, record_id: int) -> Optional[网络咨询师B组聊出率表]:
    """根据ID获取B组聊出率记录"""
    return db.query(网络咨询师B组聊出率表).filter(网络咨询师B组聊出率表.id == record_id).first()


def get_group_b_chat_rate_list(
    db: Session,
    year: Optional[int] = None,
    month: Optional[int] = None,
    employee_name: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_summary: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[网络咨询师B组聊出率表]:
    """获取B组聊出率记录列表"""
    query = db.query(网络咨询师B组聊出率表)
    
    if year is not None:
        query = query.filter(网络咨询师B组聊出率表.年份 == year)
    
    if month is not None:
        query = query.filter(网络咨询师B组聊出率表.月份 == month)
    
    if employee_name:
        query = query.filter(网络咨询师B组聊出率表.网聊姓名.like(f"%{employee_name}%"))
    
    if start_date:
        query = query.filter(网络咨询师B组聊出率表.日期 >= start_date)
    
    if end_date:
        query = query.filter(网络咨询师B组聊出率表.日期 <= end_date)
    
    if is_summary is not None:
        query = query.filter(网络咨询师B组聊出率表.是否汇总 == (1 if is_summary else 0))
    
    query = query.order_by(网络咨询师B组聊出率表.日期.desc(), 网络咨询师B组聊出率表.网聊姓名)
    
    return query.offset(skip).limit(limit).all()


def get_group_b_chat_rate_by_month(
    db: Session,
    year: int,
    month: int,
) -> List[网络咨询师B组聊出率表]:
    """获取指定年月的B组聊出率记录（包括汇总）"""
    return db.query(网络咨询师B组聊出率表).filter(
        and_(
            网络咨询师B组聊出率表.年份 == year,
            网络咨询师B组聊出率表.月份 == month,
        )
    ).order_by(
        网络咨询师B组聊出率表.是否汇总.desc(),  # 汇总行在前
        网络咨询师B组聊出率表.日期,
        网络咨询师B组聊出率表.网聊姓名
    ).all()


def create_group_b_chat_rate(db: Session, data: Dict[str, Any]) -> 网络咨询师B组聊出率表:
    """创建B组聊出率记录"""
    # 计算有效对话量
    total_dialogs = data.get('总对话', 0)
    invalid_dialogs = data.get('无效对话量', 0)
    valid_dialogs = total_dialogs - invalid_dialogs
    
    # 计算有效对话率
    valid_dialog_rate = None
    if total_dialogs > 0:
        valid_dialog_rate = round((valid_dialogs / total_dialogs) * 100, 2)
    
    # 计算干预对话率
    intervention_dialog_rate = None
    valid_intervention_dialogs = data.get('有效干预对话量', 0)
    if valid_dialogs > 0:
        intervention_dialog_rate = round((valid_intervention_dialogs / valid_dialogs) * 100, 2)
    
    # 计算聊出率
    chat_output_rate = None
    chat_output = data.get('聊出量', 0)
    if valid_intervention_dialogs > 0:
        chat_output_rate = round((chat_output / valid_intervention_dialogs) * 100, 2)
    
    record = 网络咨询师B组聊出率表(
        年份=data['年份'],
        月份=data['月份'],
        日期=data['日期'],
        星期=data.get('星期'),
        班次=data.get('班次'),
        网聊姓名=data['网聊姓名'],
        进线量=data.get('进线量', 0),
        总对话=total_dialogs,
        无效对话量=invalid_dialogs,
        有效对话量=valid_dialogs,
        有效对话率=valid_dialog_rate,
        有效干预对话量=valid_intervention_dialogs,
        干预对话率=intervention_dialog_rate,
        聊出量=chat_output,
        聊出率=chat_output_rate,
        是否汇总=data.get('是否汇总', 0),
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_group_b_chat_rate(
    db: Session,
    record_id: int,
    data: Dict[str, Any]
) -> Optional[网络咨询师B组聊出率表]:
    """更新B组聊出率记录"""
    record = get_group_b_chat_rate_by_id(db, record_id)
    if not record:
        return None
    
    # 更新基本字段
    for key, value in data.items():
        if hasattr(record, key) and key not in ['id', '创建时间', '更新时间']:
            setattr(record, key, value)
    
    # 重新计算有效对话量
    record.有效对话量 = record.总对话 - record.无效对话量
    
    # 重新计算有效对话率
    if record.总对话 > 0:
        record.有效对话率 = round((record.有效对话量 / record.总对话) * 100, 2)
    else:
        record.有效对话率 = None
    
    # 重新计算干预对话率
    if record.有效对话量 > 0:
        record.干预对话率 = round((record.有效干预对话量 / record.有效对话量) * 100, 2)
    else:
        record.干预对话率 = None
    
    # 重新计算聊出率
    if record.有效干预对话量 > 0:
        record.聊出率 = round((record.聊出量 / record.有效干预对话量) * 100, 2)
    else:
        record.聊出率 = None
    
    db.commit()
    db.refresh(record)
    return record


def delete_group_b_chat_rate(db: Session, record_id: int) -> bool:
    """删除B组聊出率记录"""
    record = get_group_b_chat_rate_by_id(db, record_id)
    if not record:
        return False
    
    db.delete(record)
    db.commit()
    return True


def batch_create_or_update_group_b(
    db: Session,
    year: int,
    month: int,
    records: List[Dict[str, Any]]
) -> List[网络咨询师B组聊出率表]:
    """批量创建或更新B组聊出率记录"""
    result = []
    
    for data in records:
        # 同一天同一人只有一个班次，所以只根据年份、月份、日期、姓名查询
        # 注意：排除汇总行（是否汇总=1）
        existing = db.query(网络咨询师B组聊出率表).filter(
            and_(
                网络咨询师B组聊出率表.年份 == year,
                网络咨询师B组聊出率表.月份 == month,
                网络咨询师B组聊出率表.日期 == data['日期'],
                网络咨询师B组聊出率表.网聊姓名 == data['网聊姓名'],
                网络咨询师B组聊出率表.是否汇总 == 0,  # 排除汇总行
            )
        ).first()
        
        if existing:
            # 更新现有记录（包括可能修改班次）
            # 先删除旧记录，再创建新记录，避免唯一约束冲突
            db.delete(existing)
            db.flush()  # 立即执行删除
            
            # 创建新记录
            data['年份'] = year
            data['月份'] = month
            record = create_group_b_chat_rate(db, data)
        else:
            # 创建新记录
            data['年份'] = year
            data['月份'] = month
            record = create_group_b_chat_rate(db, data)
        
        if record:
            result.append(record)
    
    return result


# ==================== 统计分析 ====================

def get_group_a_monthly_summary(db: Session, year: int, month: int) -> Dict[str, Any]:
    """获取A组月度汇总统计"""
    records = db.query(网络咨询师A组聊出率表).filter(
        and_(
            网络咨询师A组聊出率表.年份 == year,
            网络咨询师A组聊出率表.月份 == month,
            网络咨询师A组聊出率表.是否汇总 == 0,  # 排除汇总行
        )
    ).all()
    
    if not records:
        return {
            'total_incoming_calls': 0,
            'total_dialogs': 0,
            'total_invalid_dialogs': 0,
            'total_valid_dialogs': 0,
            'total_valid_intervention_dialogs': 0,
            'total_chat_output': 0,
            'valid_dialog_rate': None,
            'intervention_dialog_rate': None,
            'chat_output_rate': None,
        }
    
    total_incoming_calls = sum(r.进线量 for r in records)
    total_dialogs = sum(r.总对话 for r in records)
    total_invalid_dialogs = sum(r.无效对话量 for r in records)
    total_valid_dialogs = sum(r.有效对话量 for r in records)
    total_valid_intervention_dialogs = sum(r.有效干预对话量 for r in records)
    total_chat_output = sum(r.聊出量 for r in records)
    
    valid_dialog_rate = None
    if total_dialogs > 0:
        valid_dialog_rate = round((total_valid_dialogs / total_dialogs) * 100, 2)
    
    intervention_dialog_rate = None
    if total_valid_dialogs > 0:
        intervention_dialog_rate = round((total_valid_intervention_dialogs / total_valid_dialogs) * 100, 2)
    
    chat_output_rate = None
    if total_valid_intervention_dialogs > 0:
        chat_output_rate = round((total_chat_output / total_valid_intervention_dialogs) * 100, 2)
    
    return {
        'total_incoming_calls': total_incoming_calls,
        'total_dialogs': total_dialogs,
        'total_invalid_dialogs': total_invalid_dialogs,
        'total_valid_dialogs': total_valid_dialogs,
        'total_valid_intervention_dialogs': total_valid_intervention_dialogs,
        'total_chat_output': total_chat_output,
        'valid_dialog_rate': valid_dialog_rate,
        'intervention_dialog_rate': intervention_dialog_rate,
        'chat_output_rate': chat_output_rate,
    }


def get_group_b_monthly_summary(db: Session, year: int, month: int) -> Dict[str, Any]:
    """获取B组月度汇总统计"""
    records = db.query(网络咨询师B组聊出率表).filter(
        and_(
            网络咨询师B组聊出率表.年份 == year,
            网络咨询师B组聊出率表.月份 == month,
            网络咨询师B组聊出率表.是否汇总 == 0,  # 排除汇总行
        )
    ).all()
    
    if not records:
        return {
            'total_incoming_calls': 0,
            'total_dialogs': 0,
            'total_invalid_dialogs': 0,
            'total_valid_dialogs': 0,
            'total_valid_intervention_dialogs': 0,
            'total_chat_output': 0,
            'valid_dialog_rate': None,
            'intervention_dialog_rate': None,
            'chat_output_rate': None,
        }
    
    total_incoming_calls = sum(r.进线量 for r in records)
    total_dialogs = sum(r.总对话 for r in records)
    total_invalid_dialogs = sum(r.无效对话量 for r in records)
    total_valid_dialogs = sum(r.有效对话量 for r in records)
    total_valid_intervention_dialogs = sum(r.有效干预对话量 for r in records)
    total_chat_output = sum(r.聊出量 for r in records)
    
    valid_dialog_rate = None
    if total_dialogs > 0:
        valid_dialog_rate = round((total_valid_dialogs / total_dialogs) * 100, 2)
    
    intervention_dialog_rate = None
    if total_valid_dialogs > 0:
        intervention_dialog_rate = round((total_valid_intervention_dialogs / total_valid_dialogs) * 100, 2)
    
    chat_output_rate = None
    if total_valid_intervention_dialogs > 0:
        chat_output_rate = round((total_chat_output / total_valid_intervention_dialogs) * 100, 2)
    
    return {
        'total_incoming_calls': total_incoming_calls,
        'total_dialogs': total_dialogs,
        'total_invalid_dialogs': total_invalid_dialogs,
        'total_valid_dialogs': total_valid_dialogs,
        'total_valid_intervention_dialogs': total_valid_intervention_dialogs,
        'total_chat_output': total_chat_output,
        'valid_dialog_rate': valid_dialog_rate,
        'intervention_dialog_rate': intervention_dialog_rate,
        'chat_output_rate': chat_output_rate,
    }

