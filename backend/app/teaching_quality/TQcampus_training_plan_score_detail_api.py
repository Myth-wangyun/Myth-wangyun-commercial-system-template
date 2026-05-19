"""
教学质量模块 - 教化司培训计划与成绩明细表 API（FastAPI Router）

挂载前缀：/api/v1/teaching-quality

最新需求：按“场次”管理（跨多天算一次）。
- 场次命名：1月第一次、1月第二次...

接口：
1) 获取神殿场次列表
   GET  /training-plan-score-sessions?campus=xxx

2) 获取某场次详情
   GET  /training-plan-score-detail?campus=xxx&session_name=1月第一次

3) 保存某场次（按 神殿+场次名称 覆盖写入）
   POST /training-plan-score-detail

说明：
- 新建场次时，前端可以不传场次名称或传空串，后端会根据开始日期自动生成“X月第N次”。
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_training_plan_score_detail_db import (
    generate_session_name,
    get_plan_with_scores,
    init_training_plan_score_tables,
    list_sessions,
    upsert_plan_with_scores,
)

router = APIRouter()


class TrainingScoreRow(BaseModel):
    培训人: str = ""
    成绩: Optional[float] = None


class TrainingSessionItem(BaseModel):
    场次名称: str
    开始日期: str
    结束日期: str


class TrainingPlanScoreDetailOutput(BaseModel):
    神殿名称: str
    场次名称: str
    开始日期: str
    结束日期: str
    培训目标: str = ""
    主要内容: str = ""
    培训方式: str = ""
    负责人: str = ""
    成绩明细: List[TrainingScoreRow] = Field(default_factory=list)


class TrainingPlanScoreDetailSavePayload(BaseModel):
    神殿名称: str
    场次名称: str = ""  # 允许空；后端可自动生成
    开始日期: str
    结束日期: str
    培训目标: str = ""
    主要内容: str = ""
    培训方式: str = ""
    负责人: str = ""
    成绩明细: List[TrainingScoreRow] = Field(default_factory=list)


@router.get(
    "/training-plan-score-sessions",
    response_model=List[TrainingSessionItem],
    summary="获取神殿教化司培训场次列表",
)
def get_training_sessions(campus: str = Query(..., alias="campus"), db: Session = Depends(get_db)):
    init_training_plan_score_tables()
    plans = list_sessions(db, 神殿名称=campus)
    return [
        TrainingSessionItem(场次名称=p.场次名称, 开始日期=p.开始日期, 结束日期=p.结束日期)
        for p in plans
    ]


@router.get(
    "/training-plan-score-detail",
    response_model=TrainingPlanScoreDetailOutput,
    summary="按神殿+场次名称获取教化司培训计划与成绩明细",
)
def get_training_plan_score_detail(
    campus: str = Query(..., alias="campus"),
    session_name: str = Query(..., alias="session_name"),
    db: Session = Depends(get_db),
):
    init_training_plan_score_tables()
    plan, details = get_plan_with_scores(db, 神殿名称=campus, 场次名称=session_name)

    if not plan:
        raise HTTPException(status_code=404, detail="未找到该场次")

    return TrainingPlanScoreDetailOutput(
        神殿名称=campus,
        场次名称=plan.场次名称,
        开始日期=plan.开始日期,
        结束日期=plan.结束日期,
        培训目标=plan.培训目标 or "",
        主要内容=plan.主要内容 or "",
        培训方式=plan.培训方式 or "",
        负责人=plan.负责人 or "",
        成绩明细=[
            TrainingScoreRow(
                培训人=d.培训人 or "",
                成绩=float(d.成绩) if d.成绩 is not None else None,
            )
            for d in details
        ],
    )


@router.post(
    "/training-plan-score-detail",
    response_model=TrainingPlanScoreDetailOutput,
    summary="保存教化司培训计划与成绩明细（按神殿+场次覆盖写入）",
)
def save_training_plan_score_detail(payload: TrainingPlanScoreDetailSavePayload, db: Session = Depends(get_db)):
    init_training_plan_score_tables()

    campus = (payload.神殿名称 or "").strip()
    if not campus:
        raise HTTPException(status_code=400, detail="神殿名称不能为空")

    if not (payload.开始日期 or "").strip() or not (payload.结束日期 or "").strip():
        raise HTTPException(status_code=400, detail="开始日期/结束日期不能为空")

    session_name = (payload.场次名称 or "").strip()
    if not session_name:
        # 自动生成：X月第N次
        session_name = generate_session_name(db, 神殿名称=campus, 开始日期=payload.开始日期)

    upsert_plan_with_scores(
        db,
        神殿名称=campus,
        场次名称=session_name,
        开始日期=payload.开始日期,
        结束日期=payload.结束日期,
        培训目标=payload.培训目标 or "",
        主要内容=payload.主要内容 or "",
        培训方式=payload.培训方式 or "",
        负责人=payload.负责人 or "",
        明细列表=[row.model_dump() for row in payload.成绩明细],
    )
    db.commit()

    plan, details = get_plan_with_scores(db, 神殿名称=campus, 场次名称=session_name)
    if not plan:
        raise HTTPException(status_code=500, detail="保存失败")

    return TrainingPlanScoreDetailOutput(
        神殿名称=campus,
        场次名称=plan.场次名称,
        开始日期=plan.开始日期,
        结束日期=plan.结束日期,
        培训目标=plan.培训目标 or "",
        主要内容=plan.主要内容 or "",
        培训方式=plan.培训方式 or "",
        负责人=plan.负责人 or "",
        成绩明细=[
            TrainingScoreRow(
                培训人=d.培训人 or "",
                成绩=float(d.成绩) if d.成绩 is not None else None,
            )
            for d in details
        ],
    )
