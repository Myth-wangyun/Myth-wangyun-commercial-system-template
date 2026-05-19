"""
教学质量模块 - 每日新生安排表 API
路由：/api/v1/teaching-quality/daily-new-student-schedule
"""
from datetime import date as pydate
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.teaching_quality.TQdaily_new_student_schedule_db import (
    fetch_daily_rows,
    init_daily_new_student_tables,
    replace_daily_rows,
)

router = APIRouter()


class DailyRow(BaseModel):
    序号: int
    姓名: str | None = None
    年龄: int | None = None
    性别: str | None = None
    所报专业: str | None = None
    学制: str | None = None
    抗拒点关注点: str | None = None
    应收金额: float | None = None
    已收金额: float | None = None
    欠费金额: float | None = None
    预计回款时间: str | None = None
    授课内容: str | None = None
    授课地点: str | None = None
    入学日期: str | None = None
    上课天数: int | None = None
    规划师: str | None = None
    班主任: str | None = None
    教员: str | None = None
    备注: str | None = None
    填表人: str | None = None
    填表时间: str | None = None


class DailyList(BaseModel):
    神殿名称: str
    记录日期: str
    行列表: List[DailyRow] = Field(default_factory=list)


@router.get("/daily-new-student-schedule", response_model=DailyList, summary="获取每日新生安排表")
def get_daily_new_student_schedule(
    campus: str = Query(...),
    date: str = Query(...),
    db: Session = Depends(get_db),
):
    print(f"[DEBUG] GET /daily-new-student-schedule - campus={campus}, date={date}")
    init_daily_new_student_tables()
    the_date = pydate.fromisoformat(date)
    rows = fetch_daily_rows(db, 神殿名称=campus, 记录日期=the_date)
    print(f"[DEBUG] Fetched {len(rows)} rows from database")
    out = [
        DailyRow(
            序号=r.序号,
            姓名=r.姓名,
            年龄=r.年龄,
            性别=r.性别,
            所报专业=r.所报专业,
            学制=r.学制,
            抗拒点关注点=r.抗拒点关注点,
            应收金额=r.应收金额,
            已收金额=r.已收金额,
            欠费金额=r.欠费金额,
            预计回款时间=r.预计回款时间.isoformat() if r.预计回款时间 else None,
            授课内容=r.授课内容,
            授课地点=r.授课地点,
            入学日期=r.入学日期.isoformat() if r.入学日期 else None,
            上课天数=r.上课天数,
            规划师=r.规划师,
            班主任=r.班主任,
            教员=r.教员,
            备注=r.备注,
            填表人=r.填表人,
            填表时间=r.填表时间.isoformat() if r.填表时间 else None,
        )
        for r in rows
    ]
    return DailyList(神殿名称=campus, 记录日期=the_date.isoformat(), 行列表=out)


class DailySavePayload(BaseModel):
    神殿名称: str
    记录日期: str
    行列表: List[DailyRow] = Field(default_factory=list)


@router.post("/daily-new-student-schedule", response_model=DailyList, summary="保存每日新生安排表（按神殿+日期覆盖写入）")
def save_daily_new_student_schedule(payload: DailySavePayload, db: Session = Depends(get_db)):
    print(f"[DEBUG] POST /daily-new-student-schedule - campus={payload.神殿名称}, date={payload.记录日期}, rows={len(payload.行列表)}")
    init_daily_new_student_tables()
    the_date = pydate.fromisoformat(payload.记录日期)
    replace_daily_rows(
        db,
        神殿名称=payload.神殿名称,
        记录日期=the_date,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    print(f"[DEBUG] Saved {len(payload.行列表)} rows to database")
    rows = fetch_daily_rows(db, 神殿名称=payload.神殿名称, 记录日期=the_date)
    out = [
        DailyRow(
            序号=r.序号,
            姓名=r.姓名,
            年龄=r.年龄,
            性别=r.性别,
            所报专业=r.所报专业,
            学制=r.学制,
            抗拒点关注点=r.抗拒点关注点,
            应收金额=r.应收金额,
            已收金额=r.已收金额,
            欠费金额=r.欠费金额,
            预计回款时间=r.预计回款时间.isoformat() if r.预计回款时间 else None,
            授课内容=r.授课内容,
            授课地点=r.授课地点,
            入学日期=r.入学日期.isoformat() if r.入学日期 else None,
            上课天数=r.上课天数,
            规划师=r.规划师,
            班主任=r.班主任,
            教员=r.教员,
            备注=r.备注,
            填表人=r.填表人,
            填表时间=r.填表时间.isoformat() if r.填表时间 else None,
        )
        for r in rows
    ]
    return DailyList(神殿名称=payload.神殿名称, 记录日期=the_date.isoformat(), 行列表=out)

