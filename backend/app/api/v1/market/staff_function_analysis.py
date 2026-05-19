"""市场部员工功能分析表 - API路由

包含四个功能分析表的API：
1. 中层功能分析 - /staff-function/middle-management
2. 网推功能分析 - /staff-function/web-promotion
3. 网聊功能分析 - /staff-function/web-chat
4. AI研发功能分析 - /staff-function/ai-research
"""

from app.core.database import get_db
from app.schemas.market.staff_function_analysis import (
    MiddleManagementDataResponse,
    MiddleManagementSaveRequest,
    SaveResponse,
    StaffFunctionDataResponse,
    StaffFunctionSaveRequest,
)
from app.services.market.staff_function_analysis import (
    get_ai_research_data,
    get_middle_management_data,
    get_web_chat_data,
    get_web_promotion_data,
    save_ai_research_data,
    save_middle_management_data,
    save_web_chat_data,
    save_web_promotion_data,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix='/staff-function', tags=['市场部员工功能分析'])


# ============================================================
# 中层功能分析 API
# ============================================================

@router.get(
    '/middle-management',
    response_model=MiddleManagementDataResponse,
    summary='获取中层功能分析数据',
)
def get_middle_management(
    year: str = Query(..., description='年份，如：2025'),
    db: Session = Depends(get_db),
):
    """获取指定年份的中层功能分析数据"""
    return get_middle_management_data(db, year)


@router.post(
    '/middle-management/save',
    response_model=SaveResponse,
    summary='保存中层功能分析数据',
)
def save_middle_management(
    payload: MiddleManagementSaveRequest,
    db: Session = Depends(get_db),
):
    """保存中层功能分析数据（整表覆盖）"""
    saved_count = save_middle_management_data(
        db,
        payload.year,
        payload.employees,
        payload.weights,
    )
    return SaveResponse(
        success=True,
        message='保存成功',
        saved_count=saved_count,
    )


# ============================================================
# 网推功能分析 API
# ============================================================

@router.get(
    '/web-promotion',
    response_model=StaffFunctionDataResponse,
    summary='获取网推功能分析数据',
)
def get_web_promotion(
    year: str = Query(..., description='年份，如：2025'),
    db: Session = Depends(get_db),
):
    """获取指定年份的网推功能分析数据"""
    return get_web_promotion_data(db, year)


@router.post(
    '/web-promotion/save',
    response_model=SaveResponse,
    summary='保存网推功能分析数据',
)
def save_web_promotion(
    payload: StaffFunctionSaveRequest,
    db: Session = Depends(get_db),
):
    """保存网推功能分析数据（整表覆盖）"""
    saved_count = save_web_promotion_data(
        db,
        payload.year,
        payload.employees,
    )
    return SaveResponse(
        success=True,
        message='保存成功',
        saved_count=saved_count,
    )


# ============================================================
# 网聊功能分析 API
# ============================================================

@router.get(
    '/web-chat',
    response_model=StaffFunctionDataResponse,
    summary='获取网聊功能分析数据',
)
def get_web_chat(
    year: str = Query(..., description='年份，如：2025'),
    db: Session = Depends(get_db),
):
    """获取指定年份的网聊功能分析数据"""
    return get_web_chat_data(db, year)


@router.post(
    '/web-chat/save',
    response_model=SaveResponse,
    summary='保存网聊功能分析数据',
)
def save_web_chat(
    payload: StaffFunctionSaveRequest,
    db: Session = Depends(get_db),
):
    """保存网聊功能分析数据（整表覆盖）"""
    saved_count = save_web_chat_data(
        db,
        payload.year,
        payload.employees,
    )
    return SaveResponse(
        success=True,
        message='保存成功',
        saved_count=saved_count,
    )


# ============================================================
# AI研发功能分析 API
# ============================================================

@router.get(
    '/ai-research',
    response_model=StaffFunctionDataResponse,
    summary='获取AI研发功能分析数据',
)
def get_ai_research(
    year: str = Query(..., description='年份，如：2025'),
    db: Session = Depends(get_db),
):
    """获取指定年份的AI研发功能分析数据"""
    return get_ai_research_data(db, year)


@router.post(
    '/ai-research/save',
    response_model=SaveResponse,
    summary='保存AI研发功能分析数据',
)
def save_ai_research(
    payload: StaffFunctionSaveRequest,
    db: Session = Depends(get_db),
):
    """保存AI研发功能分析数据（整表覆盖）"""
    saved_count = save_ai_research_data(
        db,
        payload.year,
        payload.employees,
    )
    return SaveResponse(
        success=True,
        message='保存成功',
        saved_count=saved_count,
    )

