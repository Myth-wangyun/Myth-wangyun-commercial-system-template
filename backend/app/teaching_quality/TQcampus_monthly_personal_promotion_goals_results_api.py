"""
教学质量模块 - 神殿教化司月度个人升学目标与结果汇总表 API（从神殿升学计划汇总表读取）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-personal-promotion-goals-results?campus=..&year=YYYY&month=MM
POST /campus-monthly-personal-promotion-goals-results  { 神殿名称, 年份, 月份, 行列表 }
说明：GET请求从神殿升学计划汇总表读取数据，POST请求仍保存到每月个人升学目标与结果表
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import (
    fetch_teacher_summary_from_monthly_class_table,
)
from app.teaching_quality.TQcampus_monthly_personal_promotion_goals_results_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_monthly_personal_promotion_goals_results_db import (
    init_monthly_personal_promotion_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    month: Optional[int] = None
    name: Optional[str] = None
    classCount: Optional[int] = None
    fileCount: Optional[int] = None
    expectedPromotionCount: Optional[int] = None
    actualPromotionCount: Optional[int] = None
    receivableAmount: Optional[int] = None
    expectedPromotionRevenue: Optional[int] = None
    actualPromotionRevenue: Optional[int] = None
    remark: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: Optional[int] = None  # 支持全年批量：缺省表示行内自带 month
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化每月个人升学目标与结果表失败: {e}")


@router.get(
    "/campus-monthly-personal-promotion-goals-results",
    response_model=ListOutput,
    summary="获取神殿教化司月度个人升学目标与结果汇总表（实时从06-3月度班级表聚合）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    out_rows: List[Row] = []
    campus_used = campus

    # 如果提供了月份：读取指定月份
    if month is not None:
        # 始终从06-3月度班级表实时聚合（确保数据实时性）
        teacher_data = fetch_teacher_summary_from_monthly_class_table(db, 神殿名称=campus, 年份=year, 月份=month)
        
        for idx, data in enumerate(teacher_data):
            out_rows.append(
                Row(
                    serialNumber=idx + 1,
                    month=month,
                    name=data["teacherName"],
                    classCount=data["classCount"],
                    fileCount=data["fileCount"],
                    expectedPromotionCount=data["expectedPromotionCount"],
                    actualPromotionCount=data["actualPromotionCount"],
                    receivableAmount=data["receivableAmount"],
                    expectedPromotionRevenue=data["expectedPromotionRevenue"],
                    actualPromotionRevenue=data["actualPromotionRevenue"],
                    remark=None,
                )
            )
        return ListOutput(神殿名称=campus_used, 年份=year, 月份=month, 行列表=out_rows)

    # 未提供月份：返回全年数据（实时从06-3聚合）
    for m in range(1, 13):
        teacher_data = fetch_teacher_summary_from_monthly_class_table(db, 神殿名称=campus, 年份=year, 月份=m)
        
        for idx, data in enumerate(teacher_data):
            out_rows.append(
                Row(
                    serialNumber=idx + 1,
                    month=m,
                    name=data["teacherName"],
                    classCount=data["classCount"],
                    fileCount=data["fileCount"],
                    expectedPromotionCount=data["expectedPromotionCount"],
                    actualPromotionCount=data["actualPromotionCount"],
                    receivableAmount=data["receivableAmount"],
                    expectedPromotionRevenue=data["expectedPromotionRevenue"],
                    actualPromotionRevenue=data["actualPromotionRevenue"],
                    remark=None,
                )
            )

    return ListOutput(神殿名称=campus_used, 年份=year, 月份=0, 行列表=out_rows)


@router.post(
    "/campus-monthly-personal-promotion-goals-results",
    response_model=ListOutput,
    summary="保存神殿教化司月度个人升学目标与结果汇总表（覆盖写入当月）",
)
@router.post(
    "/campus-monthly-personal-promotion-goals-results/",
    response_model=ListOutput,
    summary="保存神殿教化司月度个人升学目标与结果汇总表（覆盖写入当月，兼容尾斜杠）",
)
def save_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()

    # 允许 payload.月份 缺省：则按行内 month 字段分组保存
    groups: dict[int, list[dict]] = {}
    for idx, r in enumerate(payload.行列表, start=1):
        d = r.model_dump() if hasattr(r, "model_dump") else dict(r)
        m = d.get("month") or payload.月份
        if not m:
            # 无法确定月份，跳过该行
            continue
        # 自动补序号（前端可能未传）
        if d.get("serialNumber") in (None, ""):
            d["serialNumber"] = len(groups.get(int(m), [])) + 1
        groups.setdefault(int(m), []).append(d)

    # 覆盖写入各月份
    saved_month = None
    for m in sorted(groups.keys()):
        replace_rows(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            月份=int(m),
            行列表=groups[m],
        )
        saved_month = m

    db.commit()

    # 回读（若未保存任何行，则返回空）
    month_to_read = int(payload.月份 or (saved_month or 0))
    if not month_to_read:
        return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=0, 行列表=[])

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=month_to_read)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                name=r.姓名,
                classCount=r.升学班级总数,
                fileCount=r.在档总人数,
                expectedPromotionCount=r.预计升学总人数,
                actualPromotionCount=r.实际升学总人数,
                receivableAmount=r.应收,
                expectedPromotionRevenue=r.预计升学收入,
                actualPromotionRevenue=r.实际升学收入,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=month_to_read, 行列表=out_rows)
