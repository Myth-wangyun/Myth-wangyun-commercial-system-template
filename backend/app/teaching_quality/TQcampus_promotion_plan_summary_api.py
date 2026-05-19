"""
教学质量模块 - 神殿教化司升学计划汇总表 API (只读)
此接口的数据来源于`神殿升学计划汇总表`的月度汇总，通过数据库视图实现。
前缀：/api/v1/teaching-quality
GET  /campus-promotion-plan-summary?campus=..&year=YYYY
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import (
    每月班级升学目标与结果表,
)
from app.teaching_quality.TQcampus_promotion_plan_summary_db import (
    init_campus_promotion_plan_summary_tables as init_tables,
)

router = APIRouter()

class Row(BaseModel):
    month: int
    classCount: Optional[int] = None
    fileCount: Optional[int] = None
    expectedPromotionCount: Optional[int] = None
    actualPromotionCount: Optional[int] = None
    receivablePromotionRevenue: Optional[int] = None
    expectedPromotionRevenue: Optional[int] = None
    actualPromotionRevenue: Optional[int] = None

class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)

def _startup_init():
    try:
        init_tables() # 这会创建或更新视图
    except Exception as e:
        print(f"[teaching-quality] 初始化神殿升学计划汇总视图失败: {e}")

@router.get(
    "/campus-promotion-plan-summary",
    response_model=ListOutput,
    summary="获取神殿升学计划汇总表（实时从06-3月度班级表按月汇总）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    
    # 实时从06-3月度班级表按月汇总
    out_rows: List[Row] = []
    campus_used = campus
    
    # 尝试不同的神殿名称变体
    from sqlalchemy import or_ as _or
    norm = campus.strip()
    norm2 = norm[:-2] if norm.endswith("神殿") else norm
    
    for month in range(1, 13):
        # 查询该神殿该年该月的所有班级数据
        monthly_records = (
            db.query(每月班级升学目标与结果表)
            .filter(
                _or(
                    每月班级升学目标与结果表.神殿名称 == norm,
                    每月班级升学目标与结果表.神殿名称 == norm2,
                    每月班级升学目标与结果表.神殿名称.ilike(f"{norm}%"),
                    每月班级升学目标与结果表.神殿名称.ilike(f"{norm2}%"),
                ),
                每月班级升学目标与结果表.年份 == year,
                每月班级升学目标与结果表.月份 == month,
            )
            .all()
        )
        
        # 汇总该月数据
        classCount = len([r for r in monthly_records if r.升学班级名称])
        fileCount = sum(r.在档总人数 or 0 for r in monthly_records)
        expectedPromotionCount = sum(r.预计升学总人数 or 0 for r in monthly_records)
        actualPromotionCount = sum(r.实际升学总人数 or 0 for r in monthly_records)
        receivablePromotionRevenue = sum(r.应收 or 0 for r in monthly_records)
        expectedPromotionRevenue = sum(r.预计升学收入 or 0 for r in monthly_records)
        actualPromotionRevenue = sum(r.实际升学收入 or 0 for r in monthly_records)
        
        out_rows.append(
            Row(
                month=month,
                classCount=classCount,
                fileCount=fileCount,
                expectedPromotionCount=expectedPromotionCount,
                actualPromotionCount=actualPromotionCount,
                receivablePromotionRevenue=receivablePromotionRevenue,
                expectedPromotionRevenue=expectedPromotionRevenue,
                actualPromotionRevenue=actualPromotionRevenue,
            )
        )
    
    return ListOutput(神殿名称=campus_used, 年份=year, 行列表=out_rows)

# POST接口已移除，因为此表为只读视图
