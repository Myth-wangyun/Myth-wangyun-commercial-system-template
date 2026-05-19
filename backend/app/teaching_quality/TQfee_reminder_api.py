"""
教学质量模块 - 新生班催费记录表 API
路由：/api/v1/teaching-quality/fee-reminder
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQfee_reminder_db import (
    fetch_fee_reminder_rows,
    init_fee_reminder_tables,
    replace_fee_reminder_rows,
)

router = APIRouter()


class Row(BaseModel):
    序号: int
    学生姓名: Optional[str] = None
    专业: Optional[str] = None
    学制: Optional[str] = None
    学费应收: Optional[int] = None
    已收: Optional[int] = None
    欠费金额: Optional[int] = None
    报名时间: Optional[str] = None
    预计报到时间: Optional[str] = None
    预计回款时间: Optional[str] = None
    实际回款时间: Optional[str] = None
    实际回款金额: Optional[str] = None
    剩余回款: Optional[int] = None
    催费记录: Optional[str] = None
    咨询师: Optional[str] = None
    班主任: Optional[str] = None
    教员: Optional[str] = None
    备注: Optional[str] = None


class ListOut(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get("/fee-reminder", response_model=ListOut, summary="获取新生班催费记录表（按班级+年月）")
def get_fee_reminder(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_fee_reminder_tables()
    rows = fetch_fee_reminder_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)
    out = [
        Row(
            序号=r.序号,
            学生姓名=r.学生姓名,
            专业=r.专业,
            学制=r.学制,
            学费应收=r.学费应收,
            已收=r.已收,
            欠费金额=r.欠费金额,
            报名时间=r.报名时间,
            预计报到时间=r.预计报到时间,
            预计回款时间=r.预计回款时间,
            实际回款时间=r.实际回款时间,
            实际回款金额=r.实际回款金额,
            剩余回款=r.剩余回款,
            催费记录=r.催费记录,
            咨询师=r.咨询师,
            班主任=r.班主任,
            教员=r.教员,
            备注=r.备注,
        )
        for r in rows
    ]
    return ListOut(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=out)


class SavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


@router.post("/fee-reminder", response_model=ListOut, summary="保存新生班催费记录表（按维度覆盖写入）")
def save_fee_reminder(payload: SavePayload, db: Session = Depends(get_db)):
    init_fee_reminder_tables()
    replace_fee_reminder_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 回读
    rows = fetch_fee_reminder_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
    )
    out = [
        Row(
            序号=r.序号,
            学生姓名=r.学生姓名,
            专业=r.专业,
            学制=r.学制,
            学费应收=r.学费应收,
            已收=r.已收,
            欠费金额=r.欠费金额,
            报名时间=r.报名时间,
            预计报到时间=r.预计报到时间,
            预计回款时间=r.预计回款时间,
            实际回款时间=r.实际回款时间,
            实际回款金额=r.实际回款金额,
            剩余回款=r.剩余回款,
            催费记录=r.催费记录,
            咨询师=r.咨询师,
            班主任=r.班主任,
            教员=r.教员,
            备注=r.备注,
        )
        for r in rows
    ]
    return ListOut(
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=out,
    )

