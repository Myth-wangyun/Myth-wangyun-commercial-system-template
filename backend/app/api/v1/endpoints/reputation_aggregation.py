"""
口碑招生数据聚合 API
路由：/api/v1/reputation-aggregation
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_aggregation as crud

router = APIRouter()


@router.post(
    "/auto-fill",
    summary="自动填充所有汇总表"
)
def auto_fill_all_summaries(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """
    自动填充所有汇总表：
    1. 从月度个人表汇总到个人表
    2. 从月度个人表汇总到神殿汇总表
    3. 从神殿汇总表汇总到目标结果表
    """
    try:
        result = crud.自动填充所有汇总表(db, 神殿名称=campus, 年份=year)
        return {
            "success": True,
            "message": "自动填充成功",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动填充失败: {str(e)}")


@router.post(
    "/auto-fill-from-registration",
    summary="从口碑报名明细表自动填充到月度个人目标与结果汇总表"
)
def auto_fill_monthly_personal_from_registration(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """
    从口碑报名明细表（TAB2口碑报名明细）自动填充到月度个人目标与结果汇总表
    
    自动计算：
    - 实际口碑量 = 该教员该月的报名记录总数
    - 实际招生人数 = 该教员该月的报名记录数
    - 实际口碑收入 = 该教员该月的实交学费总和
    - 实际上门量 = 该教员该月的报名记录数
    
    注意：此操作会保留已有的目标值，只更新实际值
    """
    try:
        result = crud.从口碑报名明细表填充到月度个人表(db, 神殿名称=campus, 年份=year)
        return {
            "success": True,
            "message": "从口碑报名明细表自动填充成功",
            "data": {
                "记录数": len(result),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动填充失败: {str(e)}")

