"""
教学质量模块 - 最高议事厅教化司新生维稳统计表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-new-stu-stability-summary?year=YYYY
说明：从所有神殿的"新生维稳月度统计表"汇总得到
"""
from typing import Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile
from app.teaching_quality.TQcampus_monthly_personal_new_stu_stability_db import (
    每月个人新生维稳统计表 as DetailModel,
)

router = APIRouter()


class Row(BaseModel):
    campus: str
    handoverCount: int = 0
    reportedCount: int = 0
    stableCount: int = 0
    unstableCount: int = 0
    fullRefundCount: int = 0
    arrearsCount: int = 0
    arrearsAmount: int = 0
    refundCount: int = 0
    refundRate: float = 0.0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-new-stu-stability-summary",
    response_model=ListOutput,
    summary="获取最高议事厅教化司新生维稳统计表（汇总所有神殿）",
)
def get_mgnt_new_stu_stability_summary(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """
    获取最高议事厅教化司新生维稳统计表
    汇总所有神殿的新生维稳数据
    """
    # 获取所有神殿
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 初始化每个神殿的汇总容器
    agg: Dict[str, Dict[str, int]] = {}
    for campus in campus_names:
        agg[campus] = {
            "handoverCount": 0,
            "reportedCount": 0,
            "stableCount": 0,
            "unstableCount": 0,
            "fullRefundCount": 0,
            "arrearsCount": 0,
            "arrearsAmount": 0,
            "refundCount": 0,
        }

    # 查询所有神殿的全年数据
    personal_rows = (
        db.query(DetailModel)
        .filter(DetailModel.年份 == year)
        .all()
    )

    # 按神殿聚合
    for r in personal_rows:
        campus = str(r.神殿名称 or "").strip()
        if not campus or campus not in agg:
            continue

        a = agg[campus]

        # DetailModel=每月个人新生维稳统计表（按 人员/月 存储），这里汇总到“神殿/年度”层级
        a["handoverCount"] += int(getattr(r, "交接人数", 0) or 0)
        a["reportedCount"] += int(getattr(r, "报到人数", 0) or 0)
        a["stableCount"] += int(getattr(r, "稳定过课时人数", 0) or 0)
        a["unstableCount"] += int(getattr(r, "未过课时人数", 0) or 0)
        a["fullRefundCount"] += int(getattr(r, "回全款人数", 0) or 0)
        a["arrearsCount"] += int(getattr(r, "仍欠费人数", 0) or 0)
        a["arrearsAmount"] += int(getattr(r, "欠费总金额", 0) or 0)
        a["refundCount"] += int(getattr(r, "退费人数", 0) or 0)

    # 构建输出行
    out_rows: List[Row] = []
    total_handover = 0
    total_reported = 0
    total_stable = 0
    total_unstable = 0
    total_full_refund = 0
    total_arrears = 0
    total_arrears_amount = 0
    total_refund = 0

    for campus in campus_names:
        a = agg[campus]
        reported = a["reportedCount"]
        refund = a["refundCount"]
        refund_rate = (refund / reported * 100) if reported > 0 else 0.0

        out_rows.append(Row(
            campus=campus,
            handoverCount=a["handoverCount"],
            reportedCount=reported,
            stableCount=a["stableCount"],
            unstableCount=a["unstableCount"],
            fullRefundCount=a["fullRefundCount"],
            arrearsCount=a["arrearsCount"],
            arrearsAmount=a["arrearsAmount"],
            refundCount=refund,
            refundRate=round(refund_rate, 1),
        ))

        total_handover += a["handoverCount"]
        total_reported += reported
        total_stable += a["stableCount"]
        total_unstable += a["unstableCount"]
        total_full_refund += a["fullRefundCount"]
        total_arrears += a["arrearsCount"]
        total_arrears_amount += a["arrearsAmount"]
        total_refund += refund

    # 合计行
    total_refund_rate = (total_refund / total_reported * 100) if total_reported > 0 else 0.0
    out_rows.append(Row(
        campus="合计",
        handoverCount=total_handover,
        reportedCount=total_reported,
        stableCount=total_stable,
        unstableCount=total_unstable,
        fullRefundCount=total_full_refund,
        arrearsCount=total_arrears,
        arrearsAmount=total_arrears_amount,
        refundCount=total_refund,
        refundRate=round(total_refund_rate, 1),
    ))

    return ListOutput(年份=year, 行列表=out_rows)

