"""市场部员工功能分析表 - CRUD操作"""

from __future__ import annotations

from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.market.staff_function_analysis import (
    市场部AI研发功能分析表,
    市场部中层功能分析权重表,
    市场部中层功能分析表,
    市场部功能分析员工表,
    市场部网推功能分析表,
    市场部网聊功能分析表,
)

# ============================================================
# 员工 CRUD
# ============================================================

def get_employees_by_category(db: Session, year: str, category: str) -> List[市场部功能分析员工表]:
    """获取指定类别的员工列表"""
    return (
        db.query(市场部功能分析员工表)
        .filter(市场部功能分析员工表.year == year)
        .filter(市场部功能分析员工表.category == category)
        .order_by(市场部功能分析员工表.sort_order.asc())
        .all()
    )


def replace_employees(
    db: Session,
    year: str,
    category: str,
    employees: List[dict],
) -> List[市场部功能分析员工表]:
    """替换指定类别的员工列表"""
    # 删除旧数据
    db.query(市场部功能分析员工表).filter(
        市场部功能分析员工表.year == year,
        市场部功能分析员工表.category == category,
    ).delete(synchronize_session=False)

    # 插入新数据
    entities = []
    for idx, emp in enumerate(employees):
        entities.append(
            市场部功能分析员工表(
                year=year,
                category=category,
                employee_key=emp['employee_key'],
                employee_name=emp['employee_name'],
                position=emp.get('position', ''),
                sort_order=idx,
            )
        )

    if entities:
        db.add_all(entities)

    return entities


# ============================================================
# 中层功能分析 CRUD
# ============================================================

def get_middle_management_ratings(db: Session, year: str) -> Dict[str, Dict[int, float]]:
    """获取中层评分数据 {employee_key: {row_id: rating}}"""
    rows = (
        db.query(市场部中层功能分析表)
        .filter(市场部中层功能分析表.year == year)
        .all()
    )
    result: Dict[str, Dict[int, float]] = {}
    for row in rows:
        if row.employee_key not in result:
            result[row.employee_key] = {}
        result[row.employee_key][row.row_id] = row.rating
    return result


def get_middle_management_weights(db: Session, year: str) -> Dict[int, float]:
    """获取中层权重数据 {row_id: weight}"""
    rows = (
        db.query(市场部中层功能分析权重表)
        .filter(市场部中层功能分析权重表.year == year)
        .all()
    )
    return {row.row_id: row.weight for row in rows}


def replace_middle_management_data(
    db: Session,
    year: str,
    employees: List[dict],
    weights: Dict[int, float],
) -> int:
    """替换中层功能分析数据"""
    # 删除旧的员工数据
    replace_employees(db, year, '中层', employees)

    # 删除旧的评分数据
    db.query(市场部中层功能分析表).filter(
        市场部中层功能分析表.year == year
    ).delete(synchronize_session=False)

    # 删除旧的权重数据
    db.query(市场部中层功能分析权重表).filter(
        市场部中层功能分析权重表.year == year
    ).delete(synchronize_session=False)

    # 插入新的评分数据
    rating_entities = []
    for emp in employees:
        for row_id, rating in emp.get('ratings', {}).items():
            rating_entities.append(
                市场部中层功能分析表(
                    year=year,
                    employee_key=emp['employee_key'],
                    row_id=int(row_id),
                    rating=rating,
                )
            )

    if rating_entities:
        db.add_all(rating_entities)

    # 插入新的权重数据
    weight_entities = []
    for row_id, weight in weights.items():
        weight_entities.append(
            市场部中层功能分析权重表(
                year=year,
                row_id=int(row_id),
                weight=weight,
            )
        )

    if weight_entities:
        db.add_all(weight_entities)

    db.commit()
    return len(rating_entities) + len(weight_entities)


# ============================================================
# 网推功能分析 CRUD
# ============================================================

def get_web_promotion_scores(db: Session, year: str) -> Dict[str, Dict[int, float]]:
    """获取网推评分数据 {employee_key: {row_id: score}}"""
    rows = (
        db.query(市场部网推功能分析表)
        .filter(市场部网推功能分析表.year == year)
        .all()
    )
    result: Dict[str, Dict[int, float]] = {}
    for row in rows:
        if row.employee_key not in result:
            result[row.employee_key] = {}
        result[row.employee_key][row.row_id] = row.score
    return result


def replace_web_promotion_data(
    db: Session,
    year: str,
    employees: List[dict],
) -> int:
    """替换网推功能分析数据"""
    # 删除旧的员工数据
    replace_employees(db, year, '网推', employees)

    # 删除旧的评分数据
    db.query(市场部网推功能分析表).filter(
        市场部网推功能分析表.year == year
    ).delete(synchronize_session=False)

    # 插入新的评分数据
    entities = []
    for emp in employees:
        for row_id, score in emp.get('scores', {}).items():
            entities.append(
                市场部网推功能分析表(
                    year=year,
                    employee_key=emp['employee_key'],
                    row_id=int(row_id),
                    score=score,
                )
            )

    if entities:
        db.add_all(entities)

    db.commit()
    return len(entities)


# ============================================================
# 网聊功能分析 CRUD
# ============================================================

def get_web_chat_scores(db: Session, year: str) -> Dict[str, Dict[int, float]]:
    """获取网聊评分数据 {employee_key: {row_id: score}}"""
    rows = (
        db.query(市场部网聊功能分析表)
        .filter(市场部网聊功能分析表.year == year)
        .all()
    )
    result: Dict[str, Dict[int, float]] = {}
    for row in rows:
        if row.employee_key not in result:
            result[row.employee_key] = {}
        result[row.employee_key][row.row_id] = row.score
    return result


def replace_web_chat_data(
    db: Session,
    year: str,
    employees: List[dict],
) -> int:
    """替换网聊功能分析数据"""
    # 删除旧的员工数据
    replace_employees(db, year, '网聊', employees)

    # 删除旧的评分数据
    db.query(市场部网聊功能分析表).filter(
        市场部网聊功能分析表.year == year
    ).delete(synchronize_session=False)

    # 插入新的评分数据
    entities = []
    for emp in employees:
        for row_id, score in emp.get('scores', {}).items():
            entities.append(
                市场部网聊功能分析表(
                    year=year,
                    employee_key=emp['employee_key'],
                    row_id=int(row_id),
                    score=score,
                )
            )

    if entities:
        db.add_all(entities)

    db.commit()
    return len(entities)


# ============================================================
# AI研发功能分析 CRUD
# ============================================================

def get_ai_research_scores(db: Session, year: str) -> Dict[str, Dict[int, float]]:
    """获取AI研发评分数据 {employee_key: {row_id: score}}"""
    rows = (
        db.query(市场部AI研发功能分析表)
        .filter(市场部AI研发功能分析表.year == year)
        .all()
    )
    result: Dict[str, Dict[int, float]] = {}
    for row in rows:
        if row.employee_key not in result:
            result[row.employee_key] = {}
        result[row.employee_key][row.row_id] = row.score
    return result


def replace_ai_research_data(
    db: Session,
    year: str,
    employees: List[dict],
) -> int:
    """替换AI研发功能分析数据"""
    # 删除旧的员工数据
    replace_employees(db, year, 'AI研发', employees)

    # 删除旧的评分数据
    db.query(市场部AI研发功能分析表).filter(
        市场部AI研发功能分析表.year == year
    ).delete(synchronize_session=False)

    # 插入新的评分数据
    entities = []
    for emp in employees:
        for row_id, score in emp.get('scores', {}).items():
            entities.append(
                市场部AI研发功能分析表(
                    year=year,
                    employee_key=emp['employee_key'],
                    row_id=int(row_id),
                    score=score,
                )
            )

    if entities:
        db.add_all(entities)

    db.commit()
    return len(entities)

