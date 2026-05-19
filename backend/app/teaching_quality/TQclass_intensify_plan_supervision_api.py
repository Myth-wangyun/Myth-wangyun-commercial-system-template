"""
教学质量模块 - 班级强化期就业计划与监督表 API（单表）
路由前缀：/api/v1/teaching-quality
端点：
- GET  /class-intensify-plan-supervision?campus=..&class=..
- POST /class-intensify-plan-supervision
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_intensify_plan_supervision_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQclass_intensify_plan_supervision_db import (
    init_class_intensify_plan_supervision_tables as init_tables,
)

router = APIRouter()


# ======== Schemas ========
class IntensifyRow(BaseModel):
    序号: int
    日期: Optional[str] = None
    星期: Optional[str] = None
    工作内容: Optional[str] = None
    形式地点: Optional[str] = Field(default=None, description="对应前端 formOrLocation/形式/地点")
    工作目标: Optional[str] = None
    如何做: Optional[str] = None
    实际工作结果: Optional[str] = None
    后期跟进目标: Optional[str] = None
    参与人: Optional[str] = None
    组织者: Optional[str] = None
    监督人: Optional[str] = None
    评价结果: Optional[str] = None


class IntensifyList(BaseModel):
    神殿名称: str
    班级名称: str
    需就业人数: Optional[int] = None
    强化周期: Optional[str] = None
    毕业时间: Optional[str] = None
    就业周期: Optional[str] = None
    目标平均薪资: Optional[int] = None
    负责班主任: Optional[str] = None
    负责教员: Optional[str] = None
    行列表: List[IntensifyRow] = Field(default_factory=list)


@router.get("/class-intensify-plan-supervision", response_model=IntensifyList, summary="获取班级强化期计划与监督表")
def get_class_intensify_plan(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass)

    header: Dict[str, Any] = {
        "神殿名称": campus,
        "班级名称": klass,
        "需就业人数": None,
        "强化周期": None,
        "毕业时间": None,
        "就业周期": None,
        "目标平均薪资": None,
        "负责班主任": None,
        "负责教员": None,
    }

    out_rows: List[IntensifyRow] = []
    for r in rows:
        if header["需就业人数"] is None:
            header.update({
                "需就业人数": r.需就业人数,
                "强化周期": r.强化周期,
                "毕业时间": r.毕业时间,
                "就业周期": r.就业周期,
                "目标平均薪资": r.目标平均薪资,
                "负责班主任": r.负责班主任,
                "负责教员": r.负责教员,
            })
        out_rows.append(
            IntensifyRow(
                序号=r.序号,
                日期=r.日期,
                星期=r.星期,
                工作内容=r.工作内容,
                形式地点=r.形式地点,
                工作目标=r.工作目标,
                如何做=r.如何做,
                实际工作结果=r.实际工作结果,
                后期跟进目标=r.后期跟进目标,
                参与人=r.参与人,
                组织者=r.组织者,
                监督人=r.监督人,
                评价结果=r.评价结果,
            )
        )

    return IntensifyList(**header, 行列表=out_rows)


class IntensifySavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    需就业人数: Optional[int] = None
    强化周期: Optional[str] = None
    毕业时间: Optional[str] = None
    就业周期: Optional[str] = None
    目标平均薪资: Optional[int] = None
    负责班主任: Optional[str] = None
    负责教员: Optional[str] = None
    行列表: List[IntensifyRow] = Field(default_factory=list)


@router.post("/class-intensify-plan-supervision", response_model=IntensifyList, summary="保存班级强化期计划与监督表（覆盖写入）")
def save_class_intensify_plan(payload: IntensifySavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        行列表=[row.model_dump() for row in payload.行列表],
        需就业人数=payload.需就业人数,
        强化周期=payload.强化周期,
        毕业时间=payload.毕业时间,
        就业周期=payload.就业周期,
        目标平均薪资=payload.目标平均薪资,
        负责班主任=payload.负责班主任,
        负责教员=payload.负责教员,
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 班级名称=payload.班级名称)
    header: Dict[str, Any] = {
        "神殿名称": payload.神殿名称,
        "班级名称": payload.班级名称,
        "需就业人数": payload.需就业人数,
        "强化周期": payload.强化周期,
        "毕业时间": payload.毕业时间,
        "就业周期": payload.就业周期,
        "目标平均薪资": payload.目标平均薪资,
        "负责班主任": payload.负责班主任,
        "负责教员": payload.负责教员,
    }
    out_rows: List[IntensifyRow] = []
    for r in rows:
        out_rows.append(
            IntensifyRow(
                序号=r.序号,
                日期=r.日期,
                星期=r.星期,
                工作内容=r.工作内容,
                形式地点=r.形式地点,
                工作目标=r.工作目标,
                如何做=r.如何做,
                实际工作结果=r.实际工作结果,
                后期跟进目标=r.后期跟进目标,
                参与人=r.参与人,
                组织者=r.组织者,
                监督人=r.监督人,
                评价结果=r.评价结果,
            )
        )

    return IntensifyList(**header, 行列表=out_rows)

