"""
教学质量模块 - 神殿教化司每月个人宿舍管理统计表 API（单表，年维度保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-personal-dormitory-mgmt?campus=..&year=YYYY
POST /campus-monthly-personal-dormitory-mgmt  { 神殿名称, 年份, 行列表 }
说明：仅持久化“明细行”，前端合计行自行计算。
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
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
from app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_db import (
    init_campus_monthly_personal_dorm_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    name: str
    classStudentCount: Optional[int] = None
    dormManageCount: Optional[int] = None
    dormResidentCount: Optional[int] = None

    maleDormCount: Optional[int] = None
    maleDormResidentCount: Optional[int] = None
    maleEmptyBedCount: Optional[int] = None
    maleNewStudentBedCount: Optional[int] = None

    femaleDormCount: Optional[int] = None
    femaleDormResidentCount: Optional[int] = None
    femaleEmptyBedCount: Optional[int] = None
    femaleNewStudentBedCount: Optional[int] = None

    planRentDormCount: Optional[int] = None
    actualRentDormCount: Optional[int] = None
    planQuitDormCount: Optional[int] = None
    actualQuitDormCount: Optional[int] = None

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
        init_tables()
        init_sum_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化每月个人宿舍管理统计表/宿舍统计汇总失败: {e}")


def _sum_monthly(rows: List) -> Dict[int, Dict[str, int]]:
    """将明细行按月汇总为现有宿舍统计口径。"""
    out: Dict[int, Dict[str, int]] = {}
    keys = [
        ("带班人数", "inSchoolCount"),
        ("宿舍管理总数量", "dormTotalCount"),
        ("住宿总人数", "dormResidentCount"),
        ("男宿总数量", "maleDormCount"),
        ("男宿总人数", "maleDormResidentCount"),
        ("男宿空床位总数量", "maleEmptyBedCount"),
        ("适合男新生床位数", "maleNewStudentBedCount"),
        ("女宿总数量", "femaleDormCount"),
        ("女宿总人数", "femaleDormResidentCount"),
        ("女宿空床位总数量", "femaleEmptyBedCount"),
        ("适合女新生住宿床位", "femaleNewStudentBedCount"),
        ("计划租宿舍数量", "planRentDormCount"),
        ("实际租宿舍数量", "actualRentDormCount"),
        ("计划退宿舍数量", "planQuitDormCount"),
        ("实际退宿舍数量", "actualQuitDormCount"),
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
            v = getattr(r, src, 0) or 0
            data[dst] += int(v)
    return out


@router.get("/campus-monthly-personal-dormitory-mgmt", response_model=ListOutput, summary="获取神殿教化司每月个人宿舍管理统计表（全年明细）")
def get_dorm_mgmt(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = []
    for v in campus_variants(campus):
        rows = fetch_rows(db, 神殿名称=v, 年份=year)
        if rows:
            break
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                classStudentCount=r.带班人数,
                dormManageCount=r.宿舍管理总数量,
                dormResidentCount=r.住宿总人数,
                maleDormCount=r.男宿总数量,
                maleDormResidentCount=r.男宿总人数,
                maleEmptyBedCount=r.男宿空床位总数量,
                maleNewStudentBedCount=r.适合男新生床位数,
                femaleDormCount=r.女宿总数量,
                femaleDormResidentCount=r.女宿总人数,
                femaleEmptyBedCount=r.女宿空床位总数量,
                femaleNewStudentBedCount=r.适合女新生住宿床位,
                planRentDormCount=r.计划租宿舍数量,
                actualRentDormCount=r.实际租宿舍数量,
                planQuitDormCount=r.计划退宿舍数量,
                actualQuitDormCount=r.实际退宿舍数量,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post("/campus-monthly-personal-dormitory-mgmt", summary="保存神殿教化司每月个人宿舍管理统计表（覆盖写入全年，并自动刷新汇总）")
def save_dorm_mgmt(payload: SavePayload, db: Session = Depends(get_db)):
    try:
        init_tables()
        init_sum_tables()

        print(f"[保存] 开始保存 {payload.神殿名称} {payload.年份}年数据，共{len(payload.行列表)}条记录")

        # 1) 保存个人明细
        replace_rows(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=[row.model_dump() for row in payload.行列表],
        )
        print("[保存] 个人明细保存完成")

        # 2) 基于最新明细计算全年12个月汇总，并保留原有备注
        print("[保存] 开始读取个人明细...")
        personals = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
        print(f"[保存] 读取到{len(personals)}条个人明细")
        
        sums = _sum_monthly(personals)
        print(f"[保存] 计算月度汇总完成，共{len(sums)}个月")

        # 读取历史备注
        print("[保存] 开始读取历史汇总备注...")
        saved_summary = fetch_sum_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
        print(f"[保存] 读取到{len(saved_summary)}条历史汇总")
        remark_map: Dict[int, Optional[str]] = {int(r.月份): (r.备注 or None) for r in saved_summary}

        rows_to_save: List[Dict[str, Any]] = []
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

        print(f"[保存] 开始保存月度汇总，共{len(rows_to_save)}条记录")
        replace_sum_rows(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=rows_to_save,
        )
        print("[保存] 月度汇总保存完成")

        db.commit()
        print("[保存] 事务提交成功")
    except Exception as e:
        print(f"[保存] 发生错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise

    # 3) 回读明细
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                classStudentCount=r.带班人数,
                dormManageCount=r.宿舍管理总数量,
                dormResidentCount=r.住宿总人数,
                maleDormCount=r.男宿总数量,
                maleDormResidentCount=r.男宿总人数,
                maleEmptyBedCount=r.男宿空床位总数量,
                maleNewStudentBedCount=r.适合男新生床位数,
                femaleDormCount=r.女宿总数量,
                femaleDormResidentCount=r.女宿总人数,
                femaleEmptyBedCount=r.女宿空床位总数量,
                femaleNewStudentBedCount=r.适合女新生住宿床位,
                planRentDormCount=r.计划租宿舍数量,
                actualRentDormCount=r.实际租宿舍数量,
                planQuitDormCount=r.计划退宿舍数量,
                actualQuitDormCount=r.实际退宿舍数量,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)
