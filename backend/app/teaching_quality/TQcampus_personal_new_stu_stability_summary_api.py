"""
教学质量模块 - 神殿教化司新生维稳个人统计表 API（派生自“新生维稳月度个人统计表”）
前缀：/api/v1/teaching-quality
GET  /campus-personal-new-stu-stability-summary?campus=..&year=YYYY
说明：不落库，仅从 teaching_quality.每月个人新生维稳统计表 聚合得到整年个人汇总。
"""
# 动态加载 “每月个人新生维稳统计表” DB 模块
import importlib.util
import sys
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db

_tq_dir = Path(__file__).resolve().parent
_db_file = _tq_dir / "TQcampus_monthly_personal_new_stu_stability_db.py"
_mod_name = "app.teaching_quality.campus_monthly_personal_new_stu_stability_db_for_personal_summary"
if _mod_name in sys.modules:
    _db_module = sys.modules[_mod_name]
else:
    _spec = importlib.util.spec_from_file_location(_mod_name, str(_db_file))
    _db_module = importlib.util.module_from_spec(_spec)  # type: ignore
    assert _spec and _spec.loader
    _spec.loader.exec_module(_db_module)  # type: ignore
    sys.modules[_mod_name] = _db_module

fetch_monthly_rows = _db_module.fetch_rows

# 加载并确保视图（可用于报表场景；本API不直接依赖该视图）
_view_file = _tq_dir / "TQcampus_personal_new_stu_stability_summary_db.py"
_view_mod_name = "app.teaching_quality.campus_personal_new_stu_stability_summary_view_dynamic"
if _view_mod_name in sys.modules:
    _view_module = sys.modules[_view_mod_name]
else:
    _spec_v = importlib.util.spec_from_file_location(_view_mod_name, str(_view_file))
    _view_module = importlib.util.module_from_spec(_spec_v)  # type: ignore
    assert _spec_v and _spec_v.loader
    _spec_v.loader.exec_module(_view_module)  # type: ignore
    sys.modules[_view_mod_name] = _view_module

ensure_view = getattr(_view_module, "ensure_personal_new_stu_stability_view", None)

router = APIRouter()

def _startup_init():
    try:
        if ensure_view:
            ensure_view()
    except Exception as e:
        print(f"[teaching-quality] 初始化个人新生维稳视图失败: {e}")


class Row(BaseModel):
    serialNumber: int
    name: str
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
    "/campus-personal-new-stu-stability-summary",
    response_model=ListOutput,
    summary="获取教化司新生维稳个人统计表（整年按姓名汇总）",
)
def get_personal_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    # 读取全年明细
    monthly_rows = fetch_monthly_rows(db, 神殿名称=campus, 年份=year)

    # 按姓名聚合全年数据
    agg: Dict[str, Dict[str, int]] = {}
    notes: Dict[str, List[str]] = {}

    for r in monthly_rows:
        name = (r.姓名 or "").strip()
        if not name:
            continue
        if name not in agg:
            agg[name] = {
                "transferCount": 0,
                "reportedCount": 0,
                "stableCount": 0,
                "unstableCount": 0,
                "fullRefundCount": 0,
                "arrearsCount": 0,
                "arrearsAmount": 0,
                "refundCount": 0,
            }
            notes[name] = []
        a = agg[name]
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
                notes[name].append(txt)

    # 输出排序
    names = sorted(agg.keys())
    out_rows: List[Row] = []
    for idx, nm in enumerate(names, start=1):
        joined_note = "；".join(dict.fromkeys(notes.get(nm, [])))  # 去重并按首次出现顺序拼接
        a = agg[nm]
        out_rows.append(
            Row(
                serialNumber=idx,
                name=nm,
                transferCount=a["transferCount"],
                reportedCount=a["reportedCount"],
                stableCount=a["stableCount"],
                unstableCount=a["unstableCount"],
                fullRefundCount=a["fullRefundCount"],
                arrearsCount=a["arrearsCount"],
                arrearsAmount=a["arrearsAmount"],
                refundCount=a["refundCount"],
                refundNote=joined_note,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)
