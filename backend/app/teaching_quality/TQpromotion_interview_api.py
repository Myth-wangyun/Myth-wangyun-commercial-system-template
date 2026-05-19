"""
教学质量模块 - 升学访谈表 API（FastAPI Router，支持年/月维度）
路由前缀：/api/v1/teaching-quality
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQpromotion_interview_db import (
    fetch_interview_rows,
    init_promotion_interview_tables,
    replace_interview_rows,
)

router = APIRouter()


# ===== Schemas =====
class PromotionInterviewRow(BaseModel):
    序号: int
    姓名: Optional[str] = None
    访谈内容: Optional[str] = None
    抗拒点: Optional[str] = None
    是否明确升学: Optional[str] = None  # 是/否/待定


class PromotionInterviewList(BaseModel):
    神殿名称: str
    班级名称: Optional[str] = None
    年份: Optional[int] = None
    月份: Optional[int] = None
    行列表: List[PromotionInterviewRow] = Field(default_factory=list)


@router.get("/promotion-interview", response_model=PromotionInterviewList, summary="获取升学访谈表（支持年/月）")
def get_interview(
    campus: str = Query(..., alias="campus"),
    klass: Optional[str] = Query(None, alias="class"),
    year: Optional[int] = Query(None, alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_promotion_interview_tables()
    rows = fetch_interview_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out: List[PromotionInterviewRow] = [
        PromotionInterviewRow(
            序号=r.序号,
            姓名=r.姓名,
            访谈内容=r.访谈内容,
            抗拒点=r.抗拒点,
            是否明确升学=r.是否明确升学,
        )
        for r in rows
    ]
    return PromotionInterviewList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


class PromotionInterviewSavePayload(BaseModel):
    神殿名称: str
    班级名称: Optional[str] = None
    年份: Optional[int] = None
    月份: Optional[int] = None
    行列表: List[PromotionInterviewRow] = Field(default_factory=list)


@router.post("/promotion-interview", response_model=PromotionInterviewList, summary="保存升学访谈表（按神殿/班级/年/月覆盖写入）")
def save_interview(payload: PromotionInterviewSavePayload, db: Session = Depends(get_db)):
    init_promotion_interview_tables()
    replace_interview_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    rows = fetch_interview_rows(db, 神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份)
    out: List[PromotionInterviewRow] = [
        PromotionInterviewRow(
            序号=r.序号,
            姓名=r.姓名,
            访谈内容=r.访谈内容,
            抗拒点=r.抗拒点,
            是否明确升学=r.是否明确升学,
        )
        for r in rows
    ]
    return PromotionInterviewList(神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份, 行列表=out)
