"""
教学质量模块 - 神殿教化司新生当月维稳统计表 API（派生自"新生维稳月度个人统计表"）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-new-stu-stability-summary?campus=..&year=YYYY
说明：不落库，从 teaching_quality.每月个人新生维稳统计表 按月聚合得到（1-12月）。
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_personal_new_stu_stability_db import (
    每月个人新生维稳统计表 as PersonalModel,
)

# 不再依赖视图，直接按月聚合个人统计
ensure_view = None

router = APIRouter()

def _startup_init():
    try:
        if ensure_view:
            ensure_view()
    except Exception as e:
        print(f"[teaching-quality] 初始化每月新生维稳神殿汇总视图失败: {e}")


class Row(BaseModel):
    month: int
    transferCount: int = 0
    reportedCount: int = 0
    stableCount: int = 0
    unstableCount: int = 0
    fullRefundCount: int = 0
    arrearsCount: int = 0
    arrearsAmount: int = 0
    refundCount: int = 0
    refundNote: Optional[str] = ""


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/campus-monthly-new-stu-stability-summary",
    response_model=ListOutput,
    summary="获取神殿教化司新生当月维稳统计表（整年每月合计）",
)
def get_monthly_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    # 读取全年"每月个人新生维稳统计表"原始行，并按月聚合（保持表格结构不变）
    # 神殿兼容：等值/去"神殿"后缀/前缀 ILIKE
    norm = (campus or "").strip()
    norm2 = norm[:-2] if norm.endswith("神殿") else norm
    from sqlalchemy import or_ as _or

    personal_rows = (
        db.query(PersonalModel)
        .filter(
            _or(
                PersonalModel.神殿名称 == norm,
                PersonalModel.神殿名称 == norm2,
                PersonalModel.神殿名称.ilike(f"{norm}%"),
                PersonalModel.神殿名称.ilike(f"{norm2}%"),
            ),
            PersonalModel.年份 == year,
        )
        .all()
    )

    # 初始化每月汇总容器
    agg: Dict[int, Dict[str, int]] = {m: {
        "transferCount": 0,
        "reportedCount": 0,
        "stableCount": 0,
        "unstableCount": 0,
        "fullRefundCount": 0,
        "arrearsCount": 0,
        "arrearsAmount": 0,
        "refundCount": 0,
    } for m in range(1, 13)}
    notes: Dict[int, List[str]] = {m: [] for m in range(1, 13)}

    # 从每月个人统计表直接聚合
    for r in personal_rows:
        m = int(r.月份 or 0)
        if m < 1 or m > 12:
            continue
        a = agg[m]
        
        # 直接从个人统计表的字段累加
        a["transferCount"] += int(r.交接人数 or 0)
        a["reportedCount"] += int(r.报到人数 or 0)
        a["stableCount"] += int(r.稳定过课时人数 or 0)
        a["unstableCount"] += int(r.未过课时人数 or 0)
        a["fullRefundCount"] += int(r.回全款人数 or 0)
        a["arrearsCount"] += int(r.仍欠费人数 or 0)
        a["arrearsAmount"] += int(r.欠费总金额 or 0)
        a["refundCount"] += int(r.退费人数 or 0)
        
        if r.退费情况说明:
            txt = str(r.退费情况说明).strip()
            if txt:
                notes[m].append(txt)

    out_rows: List[Row] = []
    for m in range(1, 13):
        joined_note = "；".join(dict.fromkeys(notes[m]))  # 去重并按首次出现顺序拼接
        a = agg[m]
        out_rows.append(Row(
            month=m,
            transferCount=a["transferCount"],
            reportedCount=a["reportedCount"],
            stableCount=a["stableCount"],
            unstableCount=a["unstableCount"],
            fullRefundCount=a["fullRefundCount"],
            arrearsCount=a["arrearsCount"],
            arrearsAmount=a["arrearsAmount"],
            refundCount=a["refundCount"],
            refundNote=joined_note,
        ))

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)
