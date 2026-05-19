"""
教学质量模块 - 神殿教化司口碑工作自查表 API
路由：/api/v1/teaching-quality/reputation-self-check
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQreputation_self_check_db import (
    fetch_reputation_self_check_rows,
    init_reputation_self_check_tables,
    replace_reputation_self_check,
    rows_to_matrix,
)

router = APIRouter()


# ===== Schemas =====
class SelfCheckRow(BaseModel):
    事件: str
    详细内容: str
    日填报: Dict[str, Optional[str]] = Field(default_factory=dict)


class SelfCheckList(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    班主任姓名: str
    行列表: List[SelfCheckRow] = Field(default_factory=list)


@router.get("/reputation-self-check", response_model=SelfCheckList, summary="获取神殿教化司口碑工作自查表")
def get_self_check(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    teacher: str = Query(..., alias="teacher"),
    db: Session = Depends(get_db),
):
    init_reputation_self_check_tables()
    recs = fetch_reputation_self_check_rows(
        db, 神殿名称=campus, 年份=year, 月份=month, 班主任姓名=teacher
    )
    matrix = rows_to_matrix(recs)
    rows = [SelfCheckRow(事件=r["事件"], 详细内容=r["详细内容"], 日填报=r.get("日填报", {})) for r in matrix]
    return SelfCheckList(神殿名称=campus, 年份=year, 月份=month, 班主任姓名=teacher, 行列表=rows)


class SelfCheckSavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    班主任姓名: str
    行列表: List[SelfCheckRow] = Field(default_factory=list)


@router.post("/reputation-self-check", response_model=SelfCheckList, summary="保存神殿教化司口碑工作自查表（覆盖写入）")
def save_self_check(payload: SelfCheckSavePayload, db: Session = Depends(get_db)):
    init_reputation_self_check_tables()
    # 将行列表转换为 DB 写入结构
    def _row_to_db(r: SelfCheckRow):
        return {
            "事件": r.事件,
            "详细内容": r.详细内容,
            "日填报": r.日填报,
        }

    replace_reputation_self_check(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任姓名=payload.班主任姓名,
        行列表=[_row_to_db(r) for r in payload.行列表],
    )
    db.commit()

    # 保存后回读
    recs = fetch_reputation_self_check_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任姓名=payload.班主任姓名,
    )
    matrix = rows_to_matrix(recs)
    rows = [SelfCheckRow(事件=r["事件"], 详细内容=r["详细内容"], 日填报=r.get("日填报", {})) for r in matrix]
    return SelfCheckList(
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任姓名=payload.班主任姓名,
        行列表=rows,
    )

