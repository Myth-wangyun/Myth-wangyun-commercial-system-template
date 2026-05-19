"""
教学质量模块 - 神殿教化司新生维稳月度个人统计表 API（单表，年维度保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-personal-new-stu-stability?campus=..&year=YYYY
POST /campus-monthly-personal-new-stu-stability  { 神殿名称, 年份, 行列表 }
说明：仅持久化“明细行”，前端合计行自行计算。
"""
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_db import (
    fetch_rows_by_year as detail_fetch_rows_by_year,
)
from app.teaching_quality.TQcampus_monthly_personal_new_stu_stability_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_monthly_personal_new_stu_stability_db import (
    init_monthly_personal_new_stu_stability_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    name: str
    transferCount: Optional[int] = None
    reportedCount: Optional[int] = None
    stableCount: Optional[int] = None
    unstableCount: Optional[int] = None
    fullRefundCount: Optional[int] = None
    arrearsCount: Optional[int] = None
    arrearsAmount: Optional[int] = None
    refundCount: Optional[int] = None
    refundNote: Optional[str] = None


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
    except Exception as e:
        print(f"[teaching-quality] 初始化每月个人新生维稳统计失败: {e}")


def _norm_yes(v: Optional[str]) -> bool:
    if v is None:
        return False
    s = str(v).strip().lower()
    return s in {"是", "yes", "y", "true", "1"}


from collections import defaultdict


def _aggregate_from_details_list(details: List[Any]) -> Dict[str, Dict[str, Optional[int]]]:
    """从当月新生维稳明细表 *列表* 汇总得到：按班主任姓名聚合的统计指标。"""
    # name -> counters
    agg: Dict[str, Dict[str, Optional[int]]] = defaultdict(lambda: {
        "reportedCount": 0,
        "stableCount": 0,
        "unstableCount": 0,
        "fullRefundCount": 0,
        "arrearsCount": 0,
        "arrearsAmount": 0,
        "refundCount": 0,
    })

    for d in details:
        teacher = (d.班主任姓名 or "").strip()
        if not teacher:
            continue
        c = agg[teacher]

        # 报到人数：统计所有有报道时间的学生
        if d.报道时间 and str(d.报道时间).strip():
            c["reportedCount"] = int(c.get("reportedCount", 0) or 0) + 1

        # 稳定过课时人数：是否过课时==是
        if _norm_yes(d.是否过课时):
            c["stableCount"] = int(c.get("stableCount", 0) or 0) + 1

        # 未过课时人数：依据 是否过课时
        if not _norm_yes(d.是否过课时):
            c["unstableCount"] = int(c.get("unstableCount", 0) or 0) + 1

        # 回全款人数：是否全款==是
        if _norm_yes(d.是否全款):
            c["fullRefundCount"] = int(c.get("fullRefundCount", 0) or 0) + 1

        # 仍欠费人数/欠费总金额：仍欠费金额>0
        arrears = d.仍欠费金额
        if arrears is not None and int(arrears) > 0:
            c["arrearsCount"] = int(c.get("arrearsCount", 0) or 0) + 1
            c["arrearsAmount"] = int(c.get("arrearsAmount", 0) or 0) + int(arrears)

        # 退费人数：是否退费==是
        if _norm_yes(d.是否退费):
            c["refundCount"] = int(c.get("refundCount", 0) or 0) + 1

    return dict(agg)


@router.get(
    "/campus-monthly-personal-new-stu-stability",
    response_model=ListOutput,
    summary="获取教化司新生维稳月度个人统计表（全年明细）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    teacher_names: Optional[str] = Query(None, alias="teacher_names"),
    db: Session = Depends(get_db),
):
    """返回全年个人统计。

    若某月某人统计表里对应字段为空，则尝试从“当月新生维稳明细表”汇总补全：
    报到人数、稳定过课时人数、未过课时人数、回全款人数、仍欠费人数、欠费总金额、退费人数。
    """
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)

    # 若统计表为空：允许前端传入 teacher_names，用于生成基础行（避免返回空列表）
    # teacher_names 格式："张三,李四" 或 "张三|李四"，后端做兼容拆分
    extra_teachers: List[str] = []
    if teacher_names:
        raw = str(teacher_names).strip()
        try:
            # 支持前端传 JSON 数组字符串：["张三","李四"]
            if raw.startswith('[') and raw.endswith(']'):
                arr = json.loads(raw)
                if isinstance(arr, list):
                    extra_teachers = [str(x).strip() for x in arr if str(x).strip()]
                else:
                    extra_teachers = []
            else:
                parts = [p.strip() for p in raw.replace('|', ',').split(',') if p.strip()]
                extra_teachers = parts
        except Exception:
            parts = [p.strip() for p in raw.replace('|', ',').split(',') if p.strip()]
            extra_teachers = parts
        extra_teachers = list(dict.fromkeys(extra_teachers))

    out_rows: List[Row] = []

    # 方案 A：强制从明细表汇总，覆盖统计表中的手填值
    # 1. 获取所有需要展示的月份
    all_months = {int(r.月份) for r in rows if r.月份 is not None}
    if not all_months:
        all_months = set(range(1, 13))

    # 2. 一次性获取全年明细数据，在内存中按月、按班主任分组汇总，避免12次DB查询
    all_details = detail_fetch_rows_by_year(db, 神殿名称=campus, 年份=year)

    # month -> teacher -> agg_data
    # 性能优化：一次遍历直接累计（避免对 all_details 做重复过滤，防止卡顿）
    month_cache: Dict[int, Dict[str, Dict[str, Optional[int]]]] = defaultdict(lambda: defaultdict(lambda: {
        "reportedCount": 0,
        "stableCount": 0,
        "unstableCount": 0,
        "fullRefundCount": 0,
        "arrearsCount": 0,
        "arrearsAmount": 0,
        "refundCount": 0,
    }))

    for d in all_details:
        m = int(d.月份 or 0)
        if m not in all_months:
            continue
        teacher = (d.班主任姓名 or "").strip()
        if not teacher:
            continue

        c = month_cache[m][teacher]

        # 报到人数：统计所有有报道时间的学生
        if d.报道时间 and str(d.报道时间).strip():
            c["reportedCount"] = int((c.get("reportedCount") or 0) + 1)

        # 稳定过课时人数：是否过课时 == 是
        if _norm_yes(d.是否过课时):
            c["stableCount"] = int((c.get("stableCount") or 0) + 1)

        # 未过课时人数：是否过课时 != 是
        if not _norm_yes(d.是否过课时):
            c["unstableCount"] = int((c.get("unstableCount") or 0) + 1)

        # 回全款人数：是否全款 == 是
        if _norm_yes(d.是否全款):
            c["fullRefundCount"] = int((c.get("fullRefundCount") or 0) + 1)

        # 仍欠费人数/欠费总金额：仍欠费金额 > 0
        arrears = d.仍欠费金额
        if arrears is not None and int(arrears) > 0:
            c["arrearsCount"] = int((c.get("arrearsCount") or 0) + 1)
            c["arrearsAmount"] = int((c.get("arrearsAmount") or 0) + int(arrears))

        # 退费人数：是否退费 == 是
        if _norm_yes(d.是否退费):
            c["refundCount"] = int((c.get("refundCount") or 0) + 1)

    # 3. 组装返回数据，强制使用汇总值覆盖
    # 3.1 先把数据库已有的行输出（并覆盖统计字段）
    seen_keys: set = set()
    for r in rows:
        m = int(r.月份 or 0)
        name = (r.姓名 or '').strip()
        agg = month_cache.get(m, {}).get(name, {})

        seen_keys.add((m, name))
        out_rows.append(
            Row(
                month=m,
                name=name,
                # 交接人数、退费说明是个人统计表里手填的，保留原值
                transferCount=r.交接人数,
                refundNote=r.退费情况说明,

                # 以下字段全部强制使用明细表汇总值（包括报到人数、稳定过课时人数）
                reportedCount=agg.get("reportedCount", 0),
                stableCount=agg.get("stableCount", 0),
                unstableCount=agg.get("unstableCount", 0),
                fullRefundCount=agg.get("fullRefundCount", 0),
                arrearsCount=agg.get("arrearsCount", 0),
                arrearsAmount=agg.get("arrearsAmount", 0),
                refundCount=agg.get("refundCount", 0),
            )
        )

    # 3.2 如果数据库没有任何行（或缺少部分班主任），用 teacher_names 补齐空行
    for m in sorted(all_months):
        for t in extra_teachers:
            key = (m, t)
            if key in seen_keys:
                continue
            agg = month_cache.get(m, {}).get(t, {})
            out_rows.append(
                Row(
                    month=m,
                    name=t,
                    transferCount=0,
                    refundNote='',
                    reportedCount=agg.get("reportedCount", 0),
                    stableCount=agg.get("stableCount", 0),
                    unstableCount=agg.get("unstableCount", 0),
                    fullRefundCount=agg.get("fullRefundCount", 0),
                    arrearsCount=agg.get("arrearsCount", 0),
                    arrearsAmount=agg.get("arrearsAmount", 0),
                    refundCount=agg.get("refundCount", 0),
                )
            )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post(
    "/campus-monthly-personal-new-stu-stability",
    response_model=ListOutput,
    summary="保存教化司新生维稳月度个人统计表（覆盖写入全年）",
)
def save_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=[row.model_dump() for row in payload.行列表],
    )

    db.commit()

    # 回读
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                transferCount=r.交接人数,
                reportedCount=r.报到人数,
                stableCount=r.稳定过课时人数,
                unstableCount=r.未过课时人数,
                fullRefundCount=r.回全款人数,
                arrearsCount=r.仍欠费人数,
                arrearsAmount=r.欠费总金额,
                refundCount=r.退费人数,
                refundNote=r.退费情况说明,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)

