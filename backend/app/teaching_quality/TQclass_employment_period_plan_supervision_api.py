"""
教学质量模块 - 就业期/入职 计划与监督表 API（单表）
路由前缀：/api/v1/teaching-quality
端点：
- GET  /class-employment-period-plan-supervision?campus=..&class=..&year=YYYY&month=MM
- POST /class-employment-period-plan-supervision
"""
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_employment_period_plan_supervision_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQclass_employment_period_plan_supervision_db import (
    init_class_employment_period_plan_supervision_tables as init_tables,
)
from app.teaching_quality.TQclass_file_record_db import (
    fetch_class_file_rows,
)

router = APIRouter()


class EmploymentRow(BaseModel):
    序号: int
    日期: Optional[str] = None
    形式地点: Optional[str] = Field(default=None, description="对应 formOrLocation")
    工作内容: Optional[str] = None
    工作目标: Optional[str] = None
    如何做: Optional[str] = None
    实际工作结果: Optional[str] = None
    班主任: Optional[str] = None
    教员: Optional[str] = None
    监督人: Optional[str] = None
    备注: Optional[str] = None


class EmploymentList(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    需就业人数: Optional[int] = None
    就业周期: Optional[str] = None
    目标平均薪资: Optional[int] = None
    负责班主任: Optional[str] = None
    负责教员: Optional[str] = None
    行列表: List[EmploymentRow] = Field(default_factory=list)


def _norm_campus(c: str) -> str:
    return (c or "").replace("神殿", "").strip()


@router.get("/class-employment-period-plan-supervision", response_model=EmploymentList, summary="获取就业期/入职计划与监督表")
def get_employment_plan(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    # 读取已保存的数据
    saved_rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)

    header: Dict[str, Any] = {
        "神殿名称": campus,
        "班级名称": klass,
        "年份": year,
        "月份": month,
        "需就业人数": None,
        "就业周期": None,
        "目标平均薪资": None,
        "负责班主任": None,
        "负责教员": None,
    }

    # 读取班级档案清单（姓名+性别+序号），与已保存数据合并
    campus_norm = _norm_campus(campus)
    roster = fetch_class_file_rows(db, 神殿名称=campus, 班级名称=klass)
    if not roster:
        roster = fetch_class_file_rows(db, 神殿名称=campus_norm, 班级名称=klass)
    if not roster and not campus_norm.endswith("神殿"):
        roster = fetch_class_file_rows(db, 神殿名称=f"{campus_norm}神殿", 班级名称=klass)

    roster_list: List[Tuple[int, str]] = [
        (int(r.序号 or 0), (r.姓名 or "").strip()) for r in roster
    ]
    roster_list = [(sn, nm) for sn, nm in roster_list if nm]

    out_rows: List[EmploymentRow] = []

    # 将已保存数据索引化（按序号、姓名）
    saved_index: Dict[Tuple[int, str], Any] = {}
    for r in saved_rows:
        key = (int(r.序号 or 0), (r.工作内容 or ""))  # 临时避免键冲突，后面统一按序号+姓名处理
        # 注意：就业期表本来没有“姓名”列，这里用“工作内容”占位避免 None 键，真实合并按 roster
        saved_index[(int(r.序号 or 0), (r.备注 or "").strip())] = r  # 兼容老数据；不会命中时再按序号匹配

    # 合并逻辑：
    if roster_list:
        # 尽量把 header 从第一条已保存里带出来
        if saved_rows:
            s0 = saved_rows[0]
            header.update({
                "需就业人数": s0.需就业人数,
                "就业周期": s0.就业周期,
                "目标平均薪资": s0.目标平均薪资,
                "负责班主任": s0.负责班主任,
                "负责教员": s0.负责教员,
            })
        for sn, nm in sorted(roster_list, key=lambda x: x[0]):
            # 优先按(序号, 姓名)找保存行；否则按序号找；再否则空行
            sr = saved_index.get((sn, nm)) or next((x for x in saved_rows if int(x.序号 or 0) == sn), None)
            out_rows.append(
                EmploymentRow(
                    序号=sn,
                    日期=sr.日期 if sr else None,
                    形式地点=sr.形式地点 if sr else None,
                    工作内容=sr.工作内容 if sr else None,
                    工作目标=sr.工作目标 if sr else None,
                    如何做=sr.如何做 if sr else None,
                    实际工作结果=sr.实际工作结果 if sr else None,
                    班主任=sr.班主任 if sr else None,
                    教员=sr.教员 if sr else None,
                    监督人=sr.监督人 if sr else None,
                    备注=sr.备注 if sr else None,
                )
            )
    else:
        # 无班档案，直接返回已保存数据
        for r in saved_rows:
            if header["需就业人数"] is None:
                header.update({
                    "需就业人数": r.需就业人数,
                    "就业周期": r.就业周期,
                    "目标平均薪资": r.目标平均薪资,
                    "负责班主任": r.负责班主任,
                    "负责教员": r.负责教员,
                })
            out_rows.append(
                EmploymentRow(
                    序号=r.序号,
                    日期=r.日期,
                    形式地点=r.形式地点,
                    工作内容=r.工作内容,
                    工作目标=r.工作目标,
                    如何做=r.如何做,
                    实际工作结果=r.实际工作结果,
                    班主任=r.班主任,
                    教员=r.教员,
                    监督人=r.监督人,
                    备注=r.备注,
                )
            )

    return EmploymentList(**header, 行列表=out_rows)


class EmploymentSavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    需就业人数: Optional[int] = None
    就业周期: Optional[str] = None
    目标平均薪资: Optional[int] = None
    负责班主任: Optional[str] = None
    负责教员: Optional[str] = None
    行列表: List[EmploymentRow] = Field(default_factory=list)


@router.post("/class-employment-period-plan-supervision", response_model=EmploymentList, summary="保存就业期/入职计划与监督表（覆盖写入）")
def save_employment_plan(payload: EmploymentSavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
        需就业人数=payload.需就业人数,
        就业周期=payload.就业周期,
        目标平均薪资=payload.目标平均薪资,
        负责班主任=payload.负责班主任,
        负责教员=payload.负责教员,
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份)
    header: Dict[str, Any] = {
        "神殿名称": payload.神殿名称,
        "班级名称": payload.班级名称,
        "年份": payload.年份,
        "月份": payload.月份,
        "需就业人数": payload.需就业人数,
        "就业周期": payload.就业周期,
        "目标平均薪资": payload.目标平均薪资,
        "负责班主任": payload.负责班主任,
        "负责教员": payload.负责教员,
    }
    out_rows: List[EmploymentRow] = []
    for r in rows:
        out_rows.append(
            EmploymentRow(
                序号=r.序号,
                日期=r.日期,
                形式地点=r.形式地点,
                工作内容=r.工作内容,
                工作目标=r.工作目标,
                如何做=r.如何做,
                实际工作结果=r.实际工作结果,
                班主任=r.班主任,
                教员=r.教员,
                监督人=r.监督人,
                备注=r.备注,
            )
        )

    return EmploymentList(**header, 行列表=out_rows)
