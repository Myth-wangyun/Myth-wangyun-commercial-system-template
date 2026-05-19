"""
教学质量模块 - 晚自习出勤表 API
路由：/api/v1/teaching-quality/evening-self-study-attendance
"""
import datetime as dt
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQevening_self_study_attendance_db import (
    fetch_evening_attendance_rows as fetch_rows,
)
from app.teaching_quality.TQevening_self_study_attendance_db import (
    init_evening_attendance_tables as init_tables,
)
from app.teaching_quality.TQevening_self_study_attendance_db import (
    replace_evening_attendance_rows as replace_rows,
)

router = APIRouter()


class RowPayload(BaseModel):
    序号: int
    姓名: str
    日期备注: Optional[str] = None
    slots: Dict[str, Optional[str]] = Field(default_factory=dict)


class AttendanceList(BaseModel):
    神殿名称: Optional[str] = None
    班级名称: str
    年份: int
    月份: int
    行列表: List[RowPayload] = Field(default_factory=list)


def _slot_key_m_d(y: int, m: int, d: int, half: str) -> str:
    # 返回 "M.DD-half"，例如 1.06-am
    return f"{m}.{d:02d}-{half}"


@router.get("/evening-self-study-attendance", response_model=AttendanceList, summary="获取晚自习出勤表（按班级+年+月）")
def get_attendance(
    campus: Optional[str] = Query(None, alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    m = month or dt.date.today().month
    recs = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year)

    # 聚合同一学生当月的 slots
    rows_map: Dict[tuple, RowPayload] = {}
    for r in recs:
        if r.日期.month != m:
            continue
        key = (r.序号, r.学员姓名)
        if key not in rows_map:
            rows_map[key] = RowPayload(序号=r.序号, 姓名=r.学员姓名, 日期备注=r.日期备注 or "", slots={})
        sk = _slot_key_m_d(r.日期.year, r.日期.month, r.日期.day, r.上下半天)
        rows_map[key].slots[sk] = r.值
        # 若备注为空而当前记录有备注，则补上
        if not rows_map[key].日期备注 and r.日期备注:
            rows_map[key].日期备注 = r.日期备注

    rows = [rows_map[k] for k in sorted(rows_map.keys(), key=lambda x: (x[0], x[1]))]
    return AttendanceList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=m, 行列表=rows)


class SavePayload(BaseModel):
    神殿名称: Optional[str] = None
    班级名称: str
    年份: int
    月份: int
    行列表: List[RowPayload] = Field(default_factory=list)


@router.post("/evening-self-study-attendance", response_model=AttendanceList, summary="保存晚自习出勤表（覆盖写入当月）")
def save_attendance(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    # 过滤仅当月 slots
    month_prefix1 = f"{payload.月份}."  # 形如 "1."
    month_prefix2 = f"{payload.年份}-{payload.月份:02d}-"  # 形如 "2025-01-"

    filtered_rows: List[Dict[str, object]] = []
    for row in payload.行列表:
        slots = {}
        for k, v in (row.slots or {}).items():
            if str(k).startswith(month_prefix1) or str(k).startswith(month_prefix2):
                slots[k] = v
        filtered_rows.append({
            "序号": row.序号,
            "姓名": row.姓名,
            "日期备注": row.日期备注,
            "slots": slots,
        })

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=filtered_rows,
    )
    db.commit()

    # 回读
    return get_attendance(
        campus=payload.神殿名称,
        klass=payload.班级名称,
        year=payload.年份,
        month=payload.月份,
        db=db,
    )

