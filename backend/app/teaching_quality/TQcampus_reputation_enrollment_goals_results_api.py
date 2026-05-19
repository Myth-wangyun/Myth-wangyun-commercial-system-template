"""
教学质量模块 - 神殿教化司口碑招生目标与结果汇总表 API（按月汇总，读库）
前缀：/api/v1/teaching-quality
GET /campus-reputation-enrollment-goals-results?campus=..&year=YYYY
说明：仅从 teaching_quality."口碑招生目标与结果汇总表" 读取；写入由“月度个人保存”时自动完成。
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_db import (
    fetch_rows as fetch_monthly_rows,
)
from app.teaching_quality.TQcampus_reputation_enrollment_goals_results_db import (
    fetch_rows,
    update_or_create_row,
)
from app.teaching_quality.TQcampus_reputation_enrollment_goals_results_db import (
    init_campus_reputation_enrollment_goals_results_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    targetReputation: Optional[int] = None
    actualReputation: Optional[int] = None
    targetVisits: Optional[int] = None
    actualVisits: Optional[int] = None
    targetStudents: Optional[int] = None
    actualStudents: Optional[int] = None
    targetRevenue: Optional[int] = None
    actualRevenue: Optional[int] = None


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
        print(f"[teaching-quality] 初始化口碑招生目标与结果汇总表失败: {e}")


@router.get(
    "/campus-reputation-enrollment-goals-results",
    response_model=ListOutput,
    summary="获取神殿口碑招生目标与结果汇总表（按月）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """
    规则调整：
    - 优先“从月度个人表聚合”得到神殿按月汇总（满足你提出的“汇总表的数据来源应为月度个人表”）。
    - 不再写回汇总表（避免GET请求中写操作导致数据库锁和性能问题）。
    - 若月度表没有数据，再退回读取既有汇总表。
    - 神殿名称同时兼容“桂美/神恩殿”两种写法。
    """
    init_tables()
    # 兼容“盛邦/主神殿”等写法
    norm = (campus or "").strip()
    norm2 = norm[:-2] if norm.endswith("神殿") else f"{norm}神殿"

    # 1) 优先从“口碑招生每月个人目标与结果表”聚合
    month_totals = {m: {
        "month": m,
        "targetReputation": 0,
        "actualReputation": 0,
        "targetVisits": 0,
        "actualVisits": 0,
        "targetStudents": 0,
        "actualStudents": 0,
        "targetRevenue": 0,
        "actualRevenue": 0,
    } for m in range(1, 13)}

    monthly_rows = []
    try:
        # 同时尝试两种神殿写法
        monthly_rows = fetch_monthly_rows(db, 神殿名称=norm, 年份=year) or []
        if not monthly_rows:
            monthly_rows = fetch_monthly_rows(db, 神殿名称=norm2, 年份=year) or []
    except Exception as e:
        print(f"[campus-reputation-enrollment-goals-results] 读取月度个人失败: {e}")
        monthly_rows = []

    if monthly_rows:
        for r in monthly_rows:
            m = int(getattr(r, '月份', 0) or 0)
            if m not in month_totals:
                continue
            mt = month_totals[m]
            mt["targetReputation"] += int(getattr(r, '目标口碑量', 0) or 0)
            mt["actualReputation"] += int(getattr(r, '实际口碑量', 0) or 0)
            mt["targetVisits"] += int(getattr(r, '目标上门量', 0) or 0)
            mt["actualVisits"] += int(getattr(r, '实际上门量', 0) or 0)
            mt["targetStudents"] += int(getattr(r, '目标招生人数', 0) or 0)
            mt["actualStudents"] += int(getattr(r, '实际招生人数', 0) or 0)
            mt["targetRevenue"] += int(getattr(r, '目标收入', 0) or 0)
            mt["actualRevenue"] += int(getattr(r, '实际收入', 0) or 0)

        # 直接按聚合结果返回（不再写回汇总表，避免读操作中的写锁导致性能问题）
        out = [
            Row(
                month=m,
                targetReputation=mt["targetReputation"],
                actualReputation=mt["actualReputation"],
                targetVisits=mt["targetVisits"],
                actualVisits=mt["actualVisits"],
                targetStudents=mt["targetStudents"],
                actualStudents=mt["actualStudents"],
                targetRevenue=mt["targetRevenue"],
                actualRevenue=mt["actualRevenue"],
            )
            for m, mt in sorted(month_totals.items())
        ]
        return ListOutput(神殿名称=norm2, 年份=year, 行列表=out)

    # 2) 若月度表没有任何记录，则退回读取“汇总表”
    rows = fetch_rows(db, 神殿名称=norm, 年份=year)
    if not rows:
        rows = fetch_rows(db, 神殿名称=norm2, 年份=year)

    out = []
    for r in rows or []:
        out.append(
            Row(
                month=r.月份,
                targetReputation=r.目标口碑量,
                actualReputation=r.实际口碑量,
                targetVisits=r.目标上门量,
                actualVisits=r.实际上门量,
                targetStudents=r.目标招生人数,
                actualStudents=r.实际招生人数,
                targetRevenue=r.目标收入,
                actualRevenue=r.实际收入,
            )
        )
    return ListOutput(神殿名称=norm2, 年份=year, 行列表=out)


@router.post("/campus-reputation-enrollment-goals-results")
def save_campus_reputation_enrollment_goals_results(
    request: SaveRequest,
    db: Session = Depends(get_db),
):
    """保存神殿口碑招生目标与结果汇总表数据"""
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
        print(f"[teaching-quality] 保存口碑招生目标与结果汇总表失败: {e}")
        return {"success": False, "message": f"保存失败: {str(e)}"}

