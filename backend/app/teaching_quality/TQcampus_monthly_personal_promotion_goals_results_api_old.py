"""
教学质量模块 - 神殿教化司月度个人升学目标与结果汇总表 API（单表，年+月维度保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-personal-promotion-goals-results?campus=..&year=YYYY&month=MM
POST /campus-monthly-personal-promotion-goals-results  { 神殿名称, 年份, 月份, 行列表 }
说明：仅持久化“明细行”，前端合计行自行计算。
"""
# 动态加载 DB
import importlib.util
import sys
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db

_tq_dir = Path(__file__).resolve().parent
_db_file = _tq_dir / "TQcampus_monthly_personal_promotion_goals_results_db.py"
_mod_name = "app.teaching_quality.campus_monthly_personal_promotion_goals_results_db_dynamic"
if _mod_name in sys.modules:
    _db_module = sys.modules[_mod_name]
else:
    _spec = importlib.util.spec_from_file_location(_mod_name, str(_db_file))
    _db_module = importlib.util.module_from_spec(_spec)  # type: ignore
    assert _spec and _spec.loader
    _spec.loader.exec_module(_db_module)  # type: ignore
    sys.modules[_mod_name] = _db_module

init_tables = _db_module.init_monthly_personal_promotion_tables
fetch_rows = _db_module.fetch_rows
replace_rows = _db_module.replace_rows

# 导入神殿升学计划汇总表的函数
_class_db_file = _tq_dir / "TQcampus_monthly_class_promotion_goals_results_db.py"
_class_mod_name = "app.teaching_quality.campus_monthly_class_promotion_goals_results_db_dynamic"
if _class_mod_name in sys.modules:
    _class_db_module = sys.modules[_class_mod_name]
else:
    _class_spec = importlib.util.spec_from_file_location(_class_mod_name, str(_class_db_file))
    _class_db_module = importlib.util.module_from_spec(_class_spec)  # type: ignore
    assert _class_spec and _class_spec.loader
    _class_spec.loader.exec_module(_class_db_module)  # type: ignore
    sys.modules[_class_mod_name] = _class_db_module

fetch_teacher_summary_from_promotion_plan = _class_db_module.fetch_teacher_summary_from_promotion_plan

router = APIRouter()

# 导入 campus_variants（支持动态加载）
try:
    from ._utils import campus_variants  # type: ignore[reportMissingImports]
except Exception:
    import importlib.util as _il_util
    from pathlib import Path as _Path
    _utils_path = _Path(__file__).resolve().parent / "_utils.py"
    _umod_name = "teaching_quality_utils_dynamic"
    _uspec = _il_util.spec_from_file_location(_umod_name, str(_utils_path))
    _umod = _il_util.module_from_spec(_uspec)  # type: ignore
    assert _uspec and _uspec.loader
    _uspec.loader.exec_module(_umod)  # type: ignore
    campus_variants = getattr(_umod, "campus_variants")


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


@router.on_event("startup")
def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化每月个人升学目标与结果表失败: {e}")


@router.get(
    "/campus-monthly-personal-promotion-goals-results",
    response_model=ListOutput,
    summary="获取神殿教化司月度个人升学目标与结果汇总表（指定年月，或全年）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    out_rows: List[Row] = []

    # 兼容“盛邦/主神殿”两种写法
    campus_used = campus
    # 如果提供了月份：按月读取
    if month is not None:
        for v in campus_variants(campus):
            rows = fetch_rows(db, 神殿名称=v, 年份=year, 月份=int(month))
            if rows:
                campus_used = v
                break
        for r in rows:
            out_rows.append(
                Row(
                    serialNumber=r.序号,
                    month=int(month),
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
        return ListOutput(神殿名称=campus_used, 年份=year, 月份=int(month), 行列表=out_rows)

    # 未提供月份：返回全年（行内带 month 字段）
    for v in campus_variants(campus):
        campus_used = v
        for m in range(1, 13):
            rows = fetch_rows(db, 神殿名称=v, 年份=year, 月份=m)
            for r in rows:
                out_rows.append(
                    Row(
                        serialNumber=r.序号,
                        month=m,
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
        # 如果已经找到了数据，就用这个神殿名称并停止尝试其他变体
        if out_rows:
            break

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

