"""
教学质量模块 - 神殿教化司培训计划与成绩汇总表 API（按月汇总）
前缀：/api/v1/teaching-quality
GET /campus-training-plan-performance?campus=..&year=YYYY
POST /campus-training-plan-performance (保存数据)
说明：从 teaching_quality."教化司培训计划与成绩汇总表" 读取和写入
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_training_plan_performance_db import (
    fetch_rows,
    update_or_create_row,
)
from app.teaching_quality.TQcampus_training_plan_performance_db import (
    init_campus_training_plan_performance_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    targetTrainingPlanCount: Optional[int] = None
    actualTrainingPlanCount: Optional[int] = None
    targetCompletionCount: Optional[int] = None
    actualCompletionCount: Optional[int] = None
    targetAverageScore: Optional[float] = None
    actualAverageScore: Optional[float] = None
    targetParticipantCount: Optional[int] = None
    actualParticipantCount: Optional[int] = None
    targetPassRate: Optional[float] = None
    actualPassRate: Optional[float] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SaveRequest(BaseModel):
    campus: str
    year: int
    month: int
    data: dict


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化教化司培训计划与成绩汇总表失败: {e}")


@router.get(
    "/campus-training-plan-performance",
    response_model=ListOutput,
)
def get_campus_training_plan_performance(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(None, description="年份，默认当前年"),
    db: Session = Depends(get_db),
):
    """获取神殿教化司培训计划与成绩汇总表数据"""
    if not campus:
        return ListOutput(神殿名称=campus, 年份=year or 0, 行列表=[])

    if not year:
        from datetime import datetime
        year = datetime.now().year

    try:
        rows = fetch_rows(db, 神殿名称=campus, 年份=year)
        return ListOutput(
            神殿名称=campus,
            年份=year,
            行列表=[
                Row(
                    month=row.月份,
                    targetTrainingPlanCount=row.目标培训计划数,
                    actualTrainingPlanCount=row.实际培训计划数,
                    targetCompletionCount=row.目标完成数,
                    actualCompletionCount=row.实际完成数,
                    targetAverageScore=row.目标平均成绩,
                    actualAverageScore=row.实际平均成绩,
                    targetParticipantCount=row.目标参与人数,
                    actualParticipantCount=row.实际参与人数,
                    targetPassRate=row.目标合格率,
                    actualPassRate=row.实际合格率,
                )
                for row in rows
            ],
        )
    except Exception as e:
        print(f"[teaching-quality] 获取教化司培训计划与成绩汇总表失败: {e}")
        return ListOutput(神殿名称=campus, 年份=year, 行列表=[])


@router.post("/campus-training-plan-performance")
def save_campus_training_plan_performance(
    request: SaveRequest,
    db: Session = Depends(get_db),
):
    """保存神殿教化司培训计划与成绩汇总表数据"""
    try:
        update_or_create_row(
            db,
            神殿名称=request.campus,
            年份=request.year,
            月份=request.month,
            data=request.data,
        )
        db.commit()
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        print(f"[teaching-quality] 保存教化司培训计划与成绩汇总表失败: {e}")
        return {"success": False, "message": f"保存失败: {str(e)}"}

