"""
教学质量模块 - 神殿教化司口碑报名登记明细表 API（按月保存明细行）
前缀：/api/v1/teaching-quality
GET  /reputation-registration-detail?campus=..&year=YYYY&month=MM
POST /reputation-registration-detail { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQreputation_registration_detail_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQreputation_registration_detail_db import (
    init_reputation_registration_tables as init_tables,
)
from app.teaching_quality.TQreputation_registration_detail_db import (
    口碑报名登记明细表 as detail_model,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    instructorName: Optional[str] = None
    reputationName: Optional[str] = None
    reputationPhone: Optional[str] = None
    isVisit: Optional[str] = None
    isEnroll: Optional[str] = None
    enrollmentTime: Optional[str] = None
    enrollmentMajor: Optional[str] = None
    enrollmentDuration: Optional[str] = None
    receivableTuition: Optional[int] = None
    actualTuition: Optional[int] = None
    isExceededClassHours: Optional[str] = None
    isStable: Optional[str] = None
    isRefund: Optional[str] = None
    consultant: Optional[str] = None
    introducerName: Optional[str] = None
    reputationRelationship: Optional[str] = None
    reputationSource: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化口碑报名登记明细表失败: {e}")


@router.get(
    "/reputation-registration-detail",
    response_model=ListOutput,
    summary="获取神殿教化司口碑报名登记明细表（指定年月）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    # 支持“盛邦/主神殿”两种写法
    campus_variants = {str(campus).strip()}
    if str(campus).endswith("神殿"):
        campus_variants.add(str(campus)[:-2])
    else:
        campus_variants.add(str(campus) + "神殿")

    # 直接在此查询，避免 DB 层的等值过滤导致查不到
    try:
        db_rows = (
            db.query(detail_model)
            .filter(
                detail_model.神殿名称.in_(list(campus_variants)),
                detail_model.年份 == year,
                detail_model.月份 == month,
            )
            .order_by(detail_model.序号.asc().nullsfirst(), detail_model.创建时间.asc())
            .all()
        )
    except Exception:
        db_rows = []

    out_rows: List[Row] = []
    for r in db_rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                instructorName=r.班主任姓名,
                reputationName=r.口碑量姓名,
                reputationPhone=r.口碑量电话,
                isVisit=r.是否上门,
                isEnroll=r.是否报名,
                enrollmentTime=r.报名时间,
                enrollmentMajor=r.报名专业,
                enrollmentDuration=r.报名学制,
                receivableTuition=r.应收学费,
                actualTuition=r.实交学费,
                isExceededClassHours=r.是否过课时,
                isStable=r.是否稳定,
                isRefund=r.是否退费,
                consultant=r.咨询师,
                introducerName=r.介绍人姓名,
                reputationRelationship=r.口碑介绍关系,
                reputationSource=r.口碑来源,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post(
    "/reputation-registration-detail",
    response_model=ListOutput,
    summary="保存神殿教化司口碑报名登记明细表（覆盖写入指定年月）",
)
def save_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )

    db.commit()

    # 保存明细后，级联更新：月度个人表 -> 个人汇总表 -> 神殿月汇总表
    try:
        from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_api import (
            trigger_reputation_enrollment_summary_update,
        )
        trigger_reputation_enrollment_summary_update(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    except Exception as e:
        # 不阻断主流程，但记录日志
        print(f"[teaching-quality] 明细保存后触发口碑招生汇总更新失败: {e}")

    # 回读
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                instructorName=r.班主任姓名,
                reputationName=r.口碑量姓名,
                reputationPhone=r.口碑量电话,
                isVisit=r.是否上门,
                isEnroll=r.是否报名,
                enrollmentTime=r.报名时间,
                enrollmentMajor=r.报名专业,
                enrollmentDuration=r.报名学制,
                receivableTuition=r.应收学费,
                actualTuition=r.实交学费,
                isExceededClassHours=r.是否过课时,
                isStable=r.是否稳定,
                isRefund=r.是否退费,
                consultant=r.咨询师,
                introducerName=r.介绍人姓名,
                reputationRelationship=r.口碑介绍关系,
                reputationSource=r.口碑来源,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

