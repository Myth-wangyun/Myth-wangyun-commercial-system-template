"""市场部员工功能分析表 - Service层"""

from __future__ import annotations

from typing import Dict, List

from app.crud.market.staff_function_analysis import (
    get_ai_research_scores,
    get_employees_by_category,
    get_middle_management_ratings,
    get_middle_management_weights,
    get_web_chat_scores,
    get_web_promotion_scores,
    replace_ai_research_data,
    replace_middle_management_data,
    replace_web_chat_data,
    replace_web_promotion_data,
)
from app.schemas.market.staff_function_analysis import (
    MiddleManagementDataResponse,
    MiddleManagementEmployeeData,
    StaffEmployeeData,
    StaffFunctionDataResponse,
)
from sqlalchemy.orm import Session

# ============================================================
# 中层功能分析 Service
# ============================================================

def get_middle_management_data(db: Session, year: str) -> MiddleManagementDataResponse:
    """获取中层功能分析数据"""
    # 获取员工列表
    employees_db = get_employees_by_category(db, year, '中层')
    # 获取评分数据
    ratings_data = get_middle_management_ratings(db, year)
    # 获取权重数据
    weights_data = get_middle_management_weights(db, year)

    employees = []
    for emp in employees_db:
        employees.append(MiddleManagementEmployeeData(
            employee_key=emp.employee_key,
            employee_name=emp.employee_name,
            position=emp.position,
            ratings=ratings_data.get(emp.employee_key, {}),
        ))

    return MiddleManagementDataResponse(
        year=year,
        employees=employees,
        weights=weights_data,
    )


def save_middle_management_data(
    db: Session,
    year: str,
    employees: List[MiddleManagementEmployeeData],
    weights: Dict[int, float],
) -> int:
    """保存中层功能分析数据"""
    employees_dict = [
        {
            'employee_key': emp.employee_key,
            'employee_name': emp.employee_name,
            'position': emp.position,
            'ratings': emp.ratings,
        }
        for emp in employees
    ]
    return replace_middle_management_data(db, year, employees_dict, weights)


# ============================================================
# 网推功能分析 Service
# ============================================================

def get_web_promotion_data(db: Session, year: str) -> StaffFunctionDataResponse:
    """获取网推功能分析数据"""
    # 获取员工列表
    employees_db = get_employees_by_category(db, year, '网推')
    # 获取评分数据
    scores_data = get_web_promotion_scores(db, year)

    employees = []
    for emp in employees_db:
        employees.append(StaffEmployeeData(
            employee_key=emp.employee_key,
            employee_name=emp.employee_name,
            scores=scores_data.get(emp.employee_key, {}),
        ))

    return StaffFunctionDataResponse(
        year=year,
        employees=employees,
    )


def save_web_promotion_data(
    db: Session,
    year: str,
    employees: List[StaffEmployeeData],
) -> int:
    """保存网推功能分析数据"""
    employees_dict = [
        {
            'employee_key': emp.employee_key,
            'employee_name': emp.employee_name,
            'scores': emp.scores,
        }
        for emp in employees
    ]
    return replace_web_promotion_data(db, year, employees_dict)


# ============================================================
# 网聊功能分析 Service
# ============================================================

def get_web_chat_data(db: Session, year: str) -> StaffFunctionDataResponse:
    """获取网聊功能分析数据"""
    # 获取员工列表
    employees_db = get_employees_by_category(db, year, '网聊')
    # 获取评分数据
    scores_data = get_web_chat_scores(db, year)

    employees = []
    for emp in employees_db:
        employees.append(StaffEmployeeData(
            employee_key=emp.employee_key,
            employee_name=emp.employee_name,
            scores=scores_data.get(emp.employee_key, {}),
        ))

    return StaffFunctionDataResponse(
        year=year,
        employees=employees,
    )


def save_web_chat_data(
    db: Session,
    year: str,
    employees: List[StaffEmployeeData],
) -> int:
    """保存网聊功能分析数据"""
    employees_dict = [
        {
            'employee_key': emp.employee_key,
            'employee_name': emp.employee_name,
            'scores': emp.scores,
        }
        for emp in employees
    ]
    return replace_web_chat_data(db, year, employees_dict)


# ============================================================
# AI研发功能分析 Service
# ============================================================

def get_ai_research_data(db: Session, year: str) -> StaffFunctionDataResponse:
    """获取AI研发功能分析数据"""
    # 获取员工列表
    employees_db = get_employees_by_category(db, year, 'AI研发')
    # 获取评分数据
    scores_data = get_ai_research_scores(db, year)

    employees = []
    for emp in employees_db:
        employees.append(StaffEmployeeData(
            employee_key=emp.employee_key,
            employee_name=emp.employee_name,
            scores=scores_data.get(emp.employee_key, {}),
        ))

    return StaffFunctionDataResponse(
        year=year,
        employees=employees,
    )


def save_ai_research_data(
    db: Session,
    year: str,
    employees: List[StaffEmployeeData],
) -> int:
    """保存AI研发功能分析数据"""
    employees_dict = [
        {
            'employee_key': emp.employee_key,
            'employee_name': emp.employee_name,
            'scores': emp.scores,
        }
        for emp in employees
    ]
    return replace_ai_research_data(db, year, employees_dict)

