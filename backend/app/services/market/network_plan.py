"""
市场部网络计划表 Service
"""

from typing import Any, Dict, List, Optional, Tuple

from app.models.market.network_plan import MarketNetworkPlan
from sqlalchemy import and_, func
from sqlalchemy.orm import Session


def list_rows(db: Session, year: str, campus: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    获取指定年份和神殿的网络计划表数据
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        campus: 神殿名称，None或空字符串表示总计划
        
    Returns:
        数据列表
    """
    campus_filter = campus if campus else ''
    
    rows = db.query(MarketNetworkPlan).filter(
        and_(
            MarketNetworkPlan.year == year,
            MarketNetworkPlan.campus == campus_filter
        )
    ).order_by(MarketNetworkPlan.month).all()
    
    return [row.to_dict() for row in rows]


def get_summary_data(db: Session, year: str) -> List[Dict[str, Any]]:
    """
    获取指定年份所有神殿数据的汇总（市场部-总计划）
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        
    Returns:
        按月份汇总的数据列表（0=总计，1-12=各月）
    """
    # 查询所有神殿的数据（排除空神殿，即旧的总计划数据）
    # 按月份分组汇总基础字段
    summary_query = db.query(
        MarketNetworkPlan.month,
        func.sum(MarketNetworkPlan.sem_plan_income).label('sem_plan_income'),
        func.sum(MarketNetworkPlan.newmedia_plan_income).label('newmedia_plan_income'),
        func.sum(MarketNetworkPlan.sem_plan_signup).label('sem_plan_signup'),
        func.sum(MarketNetworkPlan.newmedia_plan_signup).label('newmedia_plan_signup'),
        func.sum(MarketNetworkPlan.newmedia_plan_consult).label('newmedia_plan_consult'),
        func.sum(MarketNetworkPlan.sem_plan_consult).label('sem_plan_consult'),
        func.sum(MarketNetworkPlan.newmedia_plan_cost).label('newmedia_plan_cost'),
        func.sum(MarketNetworkPlan.sem_plan_cost).label('sem_plan_cost'),
    ).filter(
        and_(
            MarketNetworkPlan.year == year,
            MarketNetworkPlan.campus != ''  # 只汇总各神殿数据
        )
    ).group_by(MarketNetworkPlan.month).order_by(MarketNetworkPlan.month).all()
    
    # 转换为字典列表
    result = []
    for row in summary_query:
        month = row.month
        
        # 基础字段（从数据库汇总）
        sem_plan_income = float(row.sem_plan_income or 0)
        newmedia_plan_income = float(row.newmedia_plan_income or 0)
        sem_plan_signup = int(row.sem_plan_signup or 0)
        newmedia_plan_signup = int(row.newmedia_plan_signup or 0)
        newmedia_plan_consult = int(row.newmedia_plan_consult or 0)
        sem_plan_consult = int(row.sem_plan_consult or 0)
        newmedia_plan_cost = float(row.newmedia_plan_cost or 0)
        sem_plan_cost = float(row.sem_plan_cost or 0)
        
        # 根据函数关系计算派生字段
        # 1. 网络计划收入 = SEM计划收入 + 新媒体计划收入
        network_plan_income = sem_plan_income + newmedia_plan_income
        
        # 2. 网络计划报名 = SEM计划报名 + 新媒体计划报名
        network_plan_signup = sem_plan_signup + newmedia_plan_signup
        
        # 3. 网络计划总量 = 新媒体计划咨询量 + SEM计划咨询量
        network_plan_total = newmedia_plan_consult + sem_plan_consult
        
        # 4. 网络计划消费 = 新媒体计划消费 + SEM计划消费
        network_plan_cost = newmedia_plan_cost + sem_plan_cost
        
        # 5. 转化率目标 = 网络计划报名 / 网络计划总量
        conversion_rate = 0.0
        if network_plan_total > 0:
            conversion_rate = network_plan_signup / network_plan_total
        
        # 6. 咨询量成本 = 网络计划消费 / 网络计划总量
        consult_cost = 0.0
        if network_plan_total > 0:
            consult_cost = network_plan_cost / network_plan_total
        
        # 7. 招生实际成本 = 网络计划消费 / 网络计划报名
        actual_enrollment_cost = 0.0
        if network_plan_signup > 0:
            actual_enrollment_cost = network_plan_cost / network_plan_signup
        
        result.append({
            'id': -(month + 1),  # 使用负数作为虚拟ID，避免与真实ID冲突
            'year': year,
            'month': month,
            'campus': '',
            'network_plan_income': network_plan_income,
            'sem_plan_income': sem_plan_income,
            'newmedia_plan_income': newmedia_plan_income,
            'network_plan_signup': network_plan_signup,
            'sem_plan_signup': sem_plan_signup,
            'newmedia_plan_signup': newmedia_plan_signup,
            'conversion_rate': conversion_rate,
            'network_plan_total': network_plan_total,
            'newmedia_plan_consult': newmedia_plan_consult,
            'sem_plan_consult': sem_plan_consult,
            'consult_cost': consult_cost,
            'network_plan_cost': network_plan_cost,
            'newmedia_plan_cost': newmedia_plan_cost,
            'sem_plan_cost': sem_plan_cost,
            'actual_enrollment_cost': actual_enrollment_cost,
            'created_at': None,
            'updated_at': None,
        })
    
    return result


def bulk_save(db: Session, year: str, rows: List[Dict[str, Any]], campus: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
    """
    批量保存网络计划表数据（按年份和神殿覆盖/更新）
    
    Args:
        db: 数据库会话
        year: 年份，格式 YYYY
        rows: 行数据列表
        campus: 神殿名称，None或空字符串表示总计划
        
    Returns:
        (保存后的数据列表, 保存的记录数)
    """
    saved_items = []
    campus_value = campus if campus else ''
    
    for row_data in rows:
        month = row_data.get('month', 0)
        
        # 查找是否已存在
        existing = db.query(MarketNetworkPlan).filter(
            and_(
                MarketNetworkPlan.year == year,
                MarketNetworkPlan.month == month,
                MarketNetworkPlan.campus == campus_value
            )
        ).first()
        
        if existing:
            # 更新现有记录
            for key, value in row_data.items():
                if key != 'month' and hasattr(existing, key):
                    setattr(existing, key, value)
            db.flush()
            saved_items.append(existing)
        else:
            # 创建新记录
            new_row = MarketNetworkPlan(
                year=year,
                month=month,
                campus=campus_value,
                network_plan_income=row_data.get('network_plan_income', 0),
                sem_plan_income=row_data.get('sem_plan_income', 0),
                newmedia_plan_income=row_data.get('newmedia_plan_income', 0),
                network_plan_signup=row_data.get('network_plan_signup', 0),
                sem_plan_signup=row_data.get('sem_plan_signup', 0),
                newmedia_plan_signup=row_data.get('newmedia_plan_signup', 0),
                conversion_rate=row_data.get('conversion_rate', 0),
                network_plan_total=row_data.get('network_plan_total', 0),
                newmedia_plan_consult=row_data.get('newmedia_plan_consult', 0),
                sem_plan_consult=row_data.get('sem_plan_consult', 0),
                consult_cost=row_data.get('consult_cost', 0),
                network_plan_cost=row_data.get('network_plan_cost', 0),
                newmedia_plan_cost=row_data.get('newmedia_plan_cost', 0),
                sem_plan_cost=row_data.get('sem_plan_cost', 0),
                actual_enrollment_cost=row_data.get('actual_enrollment_cost', 0),
            )
            db.add(new_row)
            db.flush()
            saved_items.append(new_row)
    
    db.commit()
    
    return [item.to_dict() for item in saved_items], len(saved_items)


def delete_row(db: Session, record_id: int) -> bool:
    """
    删除单条记录
    
    Args:
        db: 数据库会话
        record_id: 记录ID
        
    Returns:
        是否删除成功
    """
    row = db.query(MarketNetworkPlan).filter(MarketNetworkPlan.id == record_id).first()
    if not row:
        return False
    
    db.delete(row)
    db.commit()
    return True

