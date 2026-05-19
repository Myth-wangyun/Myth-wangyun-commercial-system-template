"""
教学质量模块 - 入职计划与监督表 API（单表，动态日记录）
路由前缀：/api/v1/teaching-quality
端点：
- GET  /class-onboarding-plan-supervision?campus=..&class=..&year=YYYY&month=MM
- POST /class-onboarding-plan-supervision
"""
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_file_record_db import (
    fetch_class_file_rows,
)
from app.teaching_quality.TQclass_onboarding_plan_supervision_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQclass_onboarding_plan_supervision_db import (
    init_class_onboarding_plan_supervision_tables as init_tables,
)

router = APIRouter()


class OnboardingRow(BaseModel):
    序号: int
    姓名: Optional[str] = None
    性别: Optional[str] = None
    目前年龄: Optional[str] = None
    现有学历: Optional[str] = None
    预计就业地区: Optional[str] = None
    目标岗位: Optional[str] = None
    目标薪资: Optional[str] = None
    负责班主任: Optional[str] = None
    负责教员: Optional[str] = None
    # 动态日期/周总结键值，使用任意键，保持开放
    其他: Dict[str, Any] = Field(default_factory=dict, description="前端动态日键将并入这里，仅用于说明")


class OnboardingList(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    描述: Optional[str] = None
    行列表: List[Dict[str, Any]] = Field(default_factory=list)


def _norm_campus(c: str) -> str:
    return (c or "").replace("神殿", "").strip()


@router.get("/class-onboarding-plan-supervision", response_model=OnboardingList, summary="获取入职计划与监督表")
def get_onboarding_plan(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    # 读取已保存的数据
    saved_rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass, 年份=year, 月份=month)

    # 读取班级档案清单（姓名+性别+序号），容错：尝试 神殿、去后缀、加后缀 三种
    campus_norm = _norm_campus(campus)
    roster = fetch_class_file_rows(db, 神殿名称=campus, 班级名称=klass)
    if not roster:
        roster = fetch_class_file_rows(db, 神殿名称=campus_norm, 班级名称=klass)
    if not roster and not campus_norm.endswith("神殿"):
        roster = fetch_class_file_rows(db, 神殿名称=f"{campus_norm}神殿", 班级名称=klass)

    roster_list: List[Tuple[int, str, Optional[str]]] = [
        (int(r.序号 or 0), (r.姓名 or "").strip(), (r.性别 or None)) for r in roster
    ]
    roster_list = [(sn, nm, gd) for sn, nm, gd in roster_list if nm]

    # 组装输出：以班档案为准对齐姓名，如无档案则返回已保存的数据
    desc: Optional[str] = None
    out_rows: List[Dict[str, Any]] = []

    # 建索引：按(序号, 姓名)找已保存行
    saved_index: Dict[Tuple[int, str], Any] = {}
    for r in saved_rows:
        key = (int(r.序号 or 0), (r.姓名 or "").strip())
        saved_index[key] = r
        if desc is None:
            desc = r.描述

    if roster_list:
        for sn, nm, gd in sorted(roster_list, key=lambda x: x[0]):
            sr = saved_index.get((sn, nm))
            base = {
                "序号": sn,
                "姓名": nm,
                "性别": (sr.性别 if sr and sr.性别 else gd),
                "目前年龄": sr.目前年龄 if sr else None,
                "现有学历": sr.现有学历 if sr else None,
                "预计就业地区": sr.预计就业地区 if sr else None,
                "目标岗位": sr.目标岗位 if sr else None,
                "目标薪资": sr.目标薪资 if sr else None,
                "负责班主任": sr.负责班主任 if sr else None,
                "负责教员": sr.负责教员 if sr else None,
            }
            daylog = (sr.日记录 if sr else None) or {}
            base.update(daylog)
            out_rows.append(base)
    else:
        # 无班档案时，回退到已保存的数据
        for r in saved_rows:
            base = {
                "序号": r.序号,
                "姓名": r.姓名,
                "性别": r.性别,
                "目前年龄": r.目前年龄,
                "现有学历": r.现有学历,
                "预计就业地区": r.预计就业地区,
                "目标岗位": r.目标岗位,
                "目标薪资": r.目标薪资,
                "负责班主任": r.负责班主任,
                "负责教员": r.负责教员,
            }
            daylog = r.日记录 or {}
            base.update(daylog)
            out_rows.append(base)

    return OnboardingList(神殿名称=campus, 班级名称=klass, 年份=year, 月份=month, 描述=desc, 行列表=out_rows)


class OnboardingSavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    年份: int
    月份: int
    描述: Optional[str] = None
    行列表: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/class-onboarding-plan-supervision", response_model=OnboardingList, summary="保存入职计划与监督表（覆盖写入）")
def save_onboarding_plan(payload: OnboardingSavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=payload.行列表,
        描述=payload.描述,
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份)
    desc: Optional[str] = payload.描述
    out_rows: List[Dict[str, Any]] = []
    for r in rows:
        base = {
            "序号": r.序号,
            "姓名": r.姓名,
            "性别": r.性别,
            "目前年龄": r.目前年龄,
            "现有学历": r.现有学历,
            "预计就业地区": r.预计就业地区,
            "目标岗位": r.目标岗位,
            "目标薪资": r.目标薪资,
            "负责班主任": r.负责班主任,
            "负责教员": r.负责教员,
        }
        daylog = r.日记录 or {}
        base.update(daylog)
        out_rows.append(base)

    return OnboardingList(神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 年份=payload.年份, 月份=payload.月份, 描述=desc, 行列表=out_rows)
