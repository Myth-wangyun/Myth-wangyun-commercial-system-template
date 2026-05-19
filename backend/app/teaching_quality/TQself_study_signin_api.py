"""
教学质量模块 - 自习签到表 API
路由：/api/v1/teaching-quality/self-study-signin
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQself_study_signin_db import (
    fetch_self_study_signin_rows as fetch_rows,
)
from app.teaching_quality.TQself_study_signin_db import (
    init_self_study_signin_tables as init_tables,
)
from app.teaching_quality.TQself_study_signin_db import (
    replace_self_study_signin_rows as replace_rows,
)

router = APIRouter()


class RowPayload(BaseModel):
    序号: int
    姓名: str
    slots: Dict[str, Optional[str]] = Field(default_factory=dict)


class SigninList(BaseModel):
    神殿名称: Optional[str] = None
    班级名称: str
    年份: int
    月份: int
    行列表: List[RowPayload] = Field(default_factory=list)


def _slot_key(idx: int, typ: str) -> str:
    return f"slot-{idx}-{typ}"


@router.get("/self-study-signin", response_model=SigninList, summary="获取自习签到表（按班级+年+月）")
def get_signin(
    campus: Optional[str] = Query(None, alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    recs = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)

    rows_map: Dict[tuple, RowPayload] = {}
    for r in recs:
        key = (r.序号, r.学员姓名)
        if key not in rows_map:
            rows_map[key] = RowPayload(序号=r.序号, 姓名=r.学员姓名, slots={})
        sk = _slot_key(r.槽序号, r.到退)
        rows_map[key].slots[sk] = r.值

    rows = [rows_map[k] for k in sorted(rows_map.keys(), key=lambda x: (x[0], x[1]))]
    return SigninList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 行列表=rows)


class SavePayload(BaseModel):
    神殿名称: Optional[str] = None
    班级名称: str
    年份: int
    月份: int
    行列表: List[RowPayload] = Field(default_factory=list)


@router.post("/self-study-signin", response_model=SigninList, summary="保存自习签到表（覆盖写入当月）")
def save_signin(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    return get_signin(
        campus=payload.神殿名称,
        klass=payload.班级名称,
        year=payload.年份,
        month=payload.月份,
        db=db,
    )

