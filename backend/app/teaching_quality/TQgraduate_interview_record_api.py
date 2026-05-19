"""
教学质量模块 - 毕业生访谈记录表 API
路由：/api/v1/teaching-quality/graduate-interview-record
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.teaching_quality.TQgraduate_interview_record_db import (
    fetch_interview_rows,
    init_graduate_interview_tables,
    replace_interview_rows,
)

router = APIRouter()


# ===== Schemas =====
class InterviewRow(BaseModel):
    序号: int
    姓名: Optional[str] = None
    班级: Optional[str] = None
    咨询师: Optional[str] = None
    学历: Optional[str] = None
    籍贯: Optional[str] = None
    入学时间: Optional[str] = None  # YYYY-MM-DD
    访谈时间: Optional[str] = None  # YYYY-MM-DD
    访谈记录: Optional[str] = None
    班主任: Optional[str] = None


class InterviewList(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[InterviewRow] = Field(default_factory=list)


@router.get("/graduate-interview-record", response_model=InterviewList, summary="获取毕业生访谈记录表")
def get_interview_records(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    type: Optional[str] = Query(None, alias="type"),  # 添加可选参数 type
    homeroom_teacher: Optional[str] = Query(None, alias="homeroom_teacher"),  # 添加可选参数 homeroom_teacher
    db: Session = Depends(get_db),
):
    init_graduate_interview_tables()
    rows = fetch_interview_rows(db, 神殿名称=campus, 年份=year, 月份=month, 班主任=homeroom_teacher)
    out = [
        InterviewRow(
            序号=r.序号,
            姓名=r.姓名,
            班级=r.班级,
            咨询师=r.咨询师,
            学历=r.学历,
            籍贯=r.籍贯,
            入学时间=r.入学时间.isoformat() if r.入学时间 else None,
            访谈时间=r.访谈时间.isoformat() if getattr(r, '访谈时间', None) else None,
            访谈记录=r.访谈记录,
            班主任=getattr(r, '班主任', None),
        )
        for r in rows
    ]
    return InterviewList(神殿名称=campus, 年份=year, 月份=month, 行列表=out)


class InterviewSavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[InterviewRow] = Field(default_factory=list)


@router.post("/graduate-interview-record", response_model=InterviewList, summary="保存毕业生访谈记录表（按维度覆盖写入）")
def save_interview_records(payload: InterviewSavePayload, db: Session = Depends(get_db)):
    init_graduate_interview_tables()
    replace_interview_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 读取并返回刚保存的数据
    rows = fetch_interview_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任=None,
    )
    out = [
        InterviewRow(
            序号=r.序号,
            姓名=r.姓名,
            班级=r.班级,
            咨询师=r.咨询师,
            学历=r.学历,
            籍贯=r.籍贯,
            入学时间=r.入学时间.isoformat() if r.入学时间 else None,
            访谈时间=r.访谈时间.isoformat() if getattr(r, '访谈时间', None) else None,
            访谈记录=r.访谈记录,
            班主任=getattr(r, '班主任', None),
        )
        for r in rows
    ]
    return InterviewList(
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )

