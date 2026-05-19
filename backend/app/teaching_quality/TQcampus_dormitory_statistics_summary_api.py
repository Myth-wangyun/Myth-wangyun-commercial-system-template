"""
教学质量模块 - 神殿教化司现有宿舍统计表（月汇总）API
前缀：/api/v1/teaching-quality
GET  /campus-dormitory-statistics-summary?campus=..&year=YYYY  -> 按月返回12行，数值由“每月个人宿舍管理统计表”汇总得到，备注来自本表
POST /campus-dormitory-statistics-summary { 神殿名称, 年份, 行列表:[{month, remark}] } -> 仅保存备注
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import Path as FPath
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality._utils import campus_variants
from app.teaching_quality.TQcampus_dormitory_statistics_summary_db import (
    fetch_rows as fetch_sum_rows,
)
from app.teaching_quality.TQcampus_dormitory_statistics_summary_db import (
    init_campus_dormitory_statistics_summary_tables as init_sum_tables,
)
from app.teaching_quality.TQcampus_dormitory_statistics_summary_db import (
    replace_rows as replace_sum_rows,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    fetch_rows as ma_fetch_rows,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    init_campus_manager_analysis_tables as init_ma_tables,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    replace_rows as ma_replace_rows,
)
from app.teaching_quality.TQcampus_manager_analysis_db import (
    upsert_row as ma_upsert_row,
)
from app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_db import (
    fetch_rows as fetch_personal_rows,
)
from app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_db import (
    init_campus_monthly_personal_dorm_tables as init_personal_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    campus: Optional[str] = None
    inSchoolCount: int = 0
    dormTotalCount: int = 0
    dormResidentCount: int = 0
    maleDormCount: int = 0
    maleDormResidentCount: int = 0
    maleEmptyBedCount: int = 0
    maleNewStudentBedCount: int = 0
    femaleDormCount: int = 0
    femaleDormResidentCount: int = 0
    femaleEmptyBedCount: int = 0
    femaleNewStudentBedCount: int = 0
    planRentDormCount: int = 0
    actualRentDormCount: int = 0
    planQuitDormCount: int = 0
    actualQuitDormCount: int = 0
    remark: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_sum_tables()
        init_personal_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化宿舍统计汇总/个人明细表失败: {e}")


def _sum_monthly(rows: List) -> Dict[int, Dict[str, int]]:
    # rows: 每月个人宿管明细行
    out: Dict[int, Dict[str, int]] = {}
    # 直接累加以下来源字段 -> 目标字段
    keys = [
        ("classStudentCount", "inSchoolCount"),           # 带班人数 -> 在校生数
        ("dormManageCount", "dormTotalCount"),            # 宿舍管理总数量 -> 宿舍总数量
        ("dormResidentCount", "dormResidentCount"),       # 住宿总人数 -> 住宿总人数
        ("maleDormCount", "maleDormCount"),
        ("maleDormResidentCount", "maleDormResidentCount"),
        ("maleEmptyBedCount", "maleEmptyBedCount"),
        ("maleNewStudentBedCount", "maleNewStudentBedCount"),
        ("femaleDormCount", "femaleDormCount"),
        ("femaleDormResidentCount", "femaleDormResidentCount"),
        ("femaleEmptyBedCount", "femaleEmptyBedCount"),
        ("femaleNewStudentBedCount", "femaleNewStudentBedCount"),
        ("planRentDormCount", "planRentDormCount"),
        ("actualRentDormCount", "actualRentDormCount"),
        ("planQuitDormCount", "planQuitDormCount"),
        ("actualQuitDormCount", "actualQuitDormCount"),
    ]
    for r in rows:
        m = int(getattr(r, "月份") or 0)
        data = out.setdefault(m, {
            "inSchoolCount": 0,
            "dormTotalCount": 0,
            "dormResidentCount": 0,
            "maleDormCount": 0,
            "maleDormResidentCount": 0,
            "maleEmptyBedCount": 0,
            "maleNewStudentBedCount": 0,
            "femaleDormCount": 0,
            "femaleDormResidentCount": 0,
            "femaleEmptyBedCount": 0,
            "femaleNewStudentBedCount": 0,
            "planRentDormCount": 0,
            "actualRentDormCount": 0,
            "planQuitDormCount": 0,
            "actualQuitDormCount": 0,
        })
        for src, dst in keys:
            attr_map = {
                "classStudentCount": "带班人数",
                "dormManageCount": "宿舍管理总数量",
                "dormResidentCount": "住宿总人数",
                "maleDormCount": "男宿总数量",
                "maleDormResidentCount": "男宿总人数",
                "maleEmptyBedCount": "男宿空床位总数量",
                "maleNewStudentBedCount": "适合男新生床位数",
                "femaleDormCount": "女宿总数量",
                "femaleDormResidentCount": "女宿总人数",
                "femaleEmptyBedCount": "女宿空床位总数量",
                "femaleNewStudentBedCount": "适合女新生住宿床位",
                "planRentDormCount": "计划租宿舍数量",
                "actualRentDormCount": "实际租宿舍数量",
                "planQuitDormCount": "计划退宿舍数量",
                "actualQuitDormCount": "实际退宿舍数量",
            }
            v = getattr(r, attr_map[src], 0) or 0
            data[dst] += int(v)
    return out


@router.get("/campus-dormitory-statistics-summary", response_model=ListOutput, summary="获取神殿现有宿舍统计表（按年，来源于个人明细月汇总）")
def get_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_sum_tables()
    init_personal_tables()
    # 汇总个人明细（容错神殿匹配）
    personals = []
    for v in campus_variants(campus):
        personals = fetch_personal_rows(db, 神殿名称=v, 年份=year)
        if personals:
            break
    sums = _sum_monthly(personals)
    # 读取已保存汇总（备注）
    saved = []
    for v in campus_variants(campus):
        saved = fetch_sum_rows(db, 神殿名称=v, 年份=year)
        if saved:
            break
    remark_map = {int(r.月份): (r.备注 or None) for r in saved}

    out_rows: List[Row] = []
    for m in range(1, 13):
        v_sum = sums.get(m, {})
        # 若个人明细无对应月份数据，尝试用已保存汇总（数据库中的宿舍统计月汇总表）回填
        if not v_sum:
            r_saved = next((r for r in saved if int(getattr(r, "月份") or 0) == m), None)
            if r_saved is not None:
                v_sum = {
                    "inSchoolCount": int(getattr(r_saved, "在校生数", 0) or 0),
                    "dormTotalCount": int(getattr(r_saved, "宿舍总数量", 0) or 0),
                    "dormResidentCount": int(getattr(r_saved, "住宿总人数", 0) or 0),
                    "maleDormCount": int(getattr(r_saved, "男宿总数量", 0) or 0),
                    "maleDormResidentCount": int(getattr(r_saved, "男宿总人数", 0) or 0),
                    "maleEmptyBedCount": int(getattr(r_saved, "男宿空床位总数量", 0) or 0),
                    "maleNewStudentBedCount": int(getattr(r_saved, "适合男新生床位数", 0) or 0),
                    "femaleDormCount": int(getattr(r_saved, "女宿总数量", 0) or 0),
                    "femaleDormResidentCount": int(getattr(r_saved, "女宿总人数", 0) or 0),
                    "femaleEmptyBedCount": int(getattr(r_saved, "女宿空床位总数量", 0) or 0),
                    "femaleNewStudentBedCount": int(getattr(r_saved, "适合女新生住宿床位", 0) or 0),
                    "planRentDormCount": int(getattr(r_saved, "计划租宿舍数量", 0) or 0),
                    "actualRentDormCount": int(getattr(r_saved, "实际租宿舍数量", 0) or 0),
                    "planQuitDormCount": int(getattr(r_saved, "计划退宿舍数量", 0) or 0),
                    "actualQuitDormCount": int(getattr(r_saved, "实际退宿舍数量", 0) or 0),
                }
        out_rows.append(
            Row(
                month=m,
                campus=campus,
                inSchoolCount=int(v_sum.get("inSchoolCount", 0)),
                dormTotalCount=int(v_sum.get("dormTotalCount", 0)),
                dormResidentCount=int(v_sum.get("dormResidentCount", 0)),
                maleDormCount=int(v_sum.get("maleDormCount", 0)),
                maleDormResidentCount=int(v_sum.get("maleDormResidentCount", 0)),
                maleEmptyBedCount=int(v_sum.get("maleEmptyBedCount", 0)),
                maleNewStudentBedCount=int(v_sum.get("maleNewStudentBedCount", 0)),
                femaleDormCount=int(v_sum.get("femaleDormCount", 0)),
                femaleDormResidentCount=int(v_sum.get("femaleDormResidentCount", 0)),
                femaleEmptyBedCount=int(v_sum.get("femaleEmptyBedCount", 0)),
                femaleNewStudentBedCount=int(v_sum.get("femaleNewStudentBedCount", 0)),
                planRentDormCount=int(v_sum.get("planRentDormCount", 0)),
                actualRentDormCount=int(v_sum.get("actualRentDormCount", 0)),
                planQuitDormCount=int(v_sum.get("planQuitDormCount", 0)),
                actualQuitDormCount=int(v_sum.get("actualQuitDormCount", 0)),
                remark=remark_map.get(m),
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post("/campus-dormitory-statistics-summary", response_model=ListOutput, summary="保存神殿现有宿舍统计表（仅保存备注，数值由明细汇总）")
def save_summary(payload: SavePayload, db: Session = Depends(get_db)):
    init_sum_tables()
    init_personal_tables()
    # 先基于个人明细计算当年所有月份的数值
    personals = fetch_personal_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    sums = _sum_monthly(personals)
    # 仅写入备注
    remark_map: Dict[int, Optional[str]] = {int(r.get("month") or r.get("月份") or 0): (r.get("remark") or r.get("备注") or None) for r in [x.model_dump() if hasattr(x, "model_dump") else x for x in payload.行列表]}

    rows_to_save: List[Dict[str, Any]] = []  # type: ignore[name-defined]
    for m in range(1, 13):
        v = sums.get(m, {})
        rows_to_save.append({
            "month": m,
            "inSchoolCount": int(v.get("inSchoolCount", 0)),
            "dormTotalCount": int(v.get("dormTotalCount", 0)),
            "dormResidentCount": int(v.get("dormResidentCount", 0)),
            "maleDormCount": int(v.get("maleDormCount", 0)),
            "maleDormResidentCount": int(v.get("maleDormResidentCount", 0)),
            "maleEmptyBedCount": int(v.get("maleEmptyBedCount", 0)),
            "maleNewStudentBedCount": int(v.get("maleNewStudentBedCount", 0)),
            "femaleDormCount": int(v.get("femaleDormCount", 0)),
            "femaleDormResidentCount": int(v.get("femaleDormResidentCount", 0)),
            "femaleEmptyBedCount": int(v.get("femaleEmptyBedCount", 0)),
            "femaleNewStudentBedCount": int(v.get("femaleNewStudentBedCount", 0)),
            "planRentDormCount": int(v.get("planRentDormCount", 0)),
            "actualRentDormCount": int(v.get("actualRentDormCount", 0)),
            "planQuitDormCount": int(v.get("planQuitDormCount", 0)),
            "actualQuitDormCount": int(v.get("actualQuitDormCount", 0)),
            "remark": remark_map.get(m),
        })

    replace_sum_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=rows_to_save,
    )
    db.commit()

    # 回读（GET 逻辑）
    return get_summary(campus=payload.神殿名称, year=payload.年份, db=db)


# ====== 追加：神殿教化司经理、副经理功能分析 API（与本文件同 router，共享前缀）======
from pydantic import BaseModel as _BaseModel


class MA_Row(_BaseModel):
    month: int
    campus: Optional[str] = None
    name: Optional[str] = None
    values: int = 0
    responsibility: int = 0
    execution: int = 0
    planning: int = 0
    organization: int = 0
    leadership: int = 0
    control: int = 0
    studentEmployment: int = 0
    reputationEnrollment: int = 0
    studentAttrition: int = 0
    furtherEducation: int = 0
    academicManagement: int = 0
    dormitoryManagement: int = 0
    remark: Optional[str] = None

class MA_ListOutput(_BaseModel):
    campus: str
    year: int
    rows: List[MA_Row] = Field(default_factory=list)

class MA_SavePayload(_BaseModel):
    神殿名称: str
    年份: int
    行列表: List[MA_Row] = Field(default_factory=list)


def _to_ma_row(campus: str, r) -> MA_Row:
    if not r:
        return MA_Row(month=0, campus=campus)
    return MA_Row(
        month=int(getattr(r, "月份") or 0),
        campus=campus,
        name=getattr(r, "姓名", None),
        values=int(getattr(r, "价值观", 0) or 0),
        responsibility=int(getattr(r, "责任感", 0) or 0),
        execution=int(getattr(r, "执行力", 0) or 0),
        planning=int(getattr(r, "计划", 0) or 0),
        organization=int(getattr(r, "组织", 0) or 0),
        leadership=int(getattr(r, "领导", 0) or 0),
        control=int(getattr(r, "控制", 0) or 0),
        studentEmployment=int(getattr(r, "学员就业", 0) or 0),
        reputationEnrollment=int(getattr(r, "口碑招生", 0) or 0),
        studentAttrition=int(getattr(r, "学员流失", 0) or 0),
        furtherEducation=int(getattr(r, "升学", 0) or 0),
        academicManagement=int(getattr(r, "教务管理能力", 0) or 0),
        dormitoryManagement=int(getattr(r, "宿舍管理能力", 0) or 0),
        remark=getattr(r, "备注", None),
    )


@router.get("/dormitory-campus-manager-analysis", response_model=MA_ListOutput, summary="[宿舍模块]获取神殿经理功能分析（按年）")
def get_manager_analysis(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    # 确保表存在
    init_ma_tables()
    rows = []
    for v in campus_variants(campus):
        rows = ma_fetch_rows(db, 神殿名称=v, 年份=year)
        if rows:
            break

    row_map = {int(getattr(r, "月份") or 0): r for r in rows}
    out_rows: List[MA_Row] = []
    for m in range(1, 13):
        out_rows.append(_to_ma_row(campus, row_map.get(m)))

    return MA_ListOutput(campus=campus, year=year, rows=out_rows)


@router.put("/dormitory-campus-manager-analysis/{year}/{month}", response_model=MA_Row, summary="[宿舍模块]更新或新增指定月份记录")
def update_manager_analysis(
    year: int = FPath(...),
    month: int = FPath(...),
    payload: MA_Row = None,  # type: ignore[assignment]
    db: Session = Depends(get_db),
):
    init_ma_tables()
    if not payload or not payload.campus:
        raise HTTPException(status_code=400, detail="缺少神殿")

    row = ma_upsert_row(
        db,
        神殿名称=payload.campus,
        年份=year,
        月份=month,
        姓名=payload.name or "",
        价值观=payload.values,
        责任感=payload.responsibility,
        执行力=payload.execution,
        计划=payload.planning,
        组织=payload.organization,
        领导=payload.leadership,
        控制=payload.control,
        学员就业=payload.studentEmployment,
        口碑招生=payload.reputationEnrollment,
        学员流失=payload.studentAttrition,
        升学=payload.furtherEducation,
        教务管理能力=payload.academicManagement,
        宿舍管理能力=payload.dormitoryManagement,
        备注=payload.remark,
    )
    db.commit()

    return _to_ma_row(payload.campus, row)


@router.post("/dormitory-campus-manager-analysis", response_model=MA_ListOutput, summary="[宿舍模块]批量替换当年所有月份记录")
def replace_manager_analysis(payload: MA_SavePayload, db: Session = Depends(get_db)):
    init_ma_tables()
    rows_to_save: List[Dict[str, Any]] = []
    for r in payload.行列表:
        d = r.model_dump() if hasattr(r, "model_dump") else dict(r)
        rows_to_save.append(d)

    ma_replace_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=rows_to_save)
    db.commit()

    return get_manager_analysis(campus=payload.神殿名称, year=payload.年份, db=db)

