"""
教学质量模块 - 神殿教化司口碑招生月度个人目标与结果汇总表 API（单表，年维度保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-personal-reputation-enrollment-goals-results?campus=..&year=YYYY
POST /campus-monthly-personal-reputation-enrollment-goals-results  { 神殿名称, 年份, 行列表 }
说明：仅持久化“明细行”，前端合计行自行计算。
"""
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.logs.context import get_audit_logger


def _canon_campus(name: str) -> str:
    s = str(name or '').strip()
    return s[:-2] if s.endswith('神殿') else s

from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_db import (
    init_monthly_personal_reputation_enrollment_tables as init_tables,
)
from app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_db import (
    init_campus_personal_reputation_enrollment_tables as init_personal_tables,
)
from app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_db import (
    replace_rows as replace_personal_rows,
)
from app.teaching_quality.TQcampus_reputation_enrollment_goals_results_db import (
    init_campus_reputation_enrollment_goals_results_tables as init_campus_month_tables,
)
from app.teaching_quality.TQcampus_reputation_enrollment_goals_results_db import (
    replace_rows as replace_campus_month_rows,
)
from app.teaching_quality.TQreputation_registration_detail_db import (
    init_reputation_registration_tables as init_detail_tables,
)
from app.teaching_quality.TQreputation_registration_detail_db import (
    口碑报名登记明细表 as detail_model,
)

router = APIRouter()


class Row(BaseModel):
    month: int
    name: str
    targetReputation: Optional[int] = None
    actualReputation: Optional[int] = None
    targetVisits: Optional[int] = None
    actualVisits: Optional[int] = None
    targetStudents: Optional[int] = None
    actualStudents: Optional[int] = None
    targetRevenue: Optional[int] = None
    actualRevenue: Optional[int] = None
    remark: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def trigger_reputation_enrollment_summary_update(db: Session, *, 神殿名称: str, 年份: int):
    """从报名明细表开始，级联更新所有相关的口碑招生汇总表"""
    try:
        # 确保所有相关表都已初始化
        init_tables()
        init_personal_tables()
        init_campus_month_tables()

        # 1. 从报名明细表聚合最新的实际值
        actual_map = _compute_actuals_map(db, 神殿名称=神殿名称, 年份=年份)

        # 2. 读取或创建月度个人表的目标值行
        monthly_rows = fetch_rows(db, 神殿名称=神殿名称, 年份=年份)

        # 3. 合并目标与实际值，并更新月度个人表
        combined_rows = []
        for r in monthly_rows:
            m = int(getattr(r, "月份", 0) or 0)
            n = str(getattr(r, "姓名", "") or "")
            am = actual_map.get((m, n), {})
            combined_rows.append({
                "month": m,
                "name": n,
                "targetReputation": getattr(r, "目标口碑量", 0),
                "targetVisits": getattr(r, "目标上门量", 0),
                "targetStudents": getattr(r, "目标招生人数", 0),
                "targetRevenue": getattr(r, "目标收入", 0),
                "actualReputation": int(am.get("actualReputation", 0)),
                "actualVisits": int(am.get("actualVisits", 0)),
                "actualStudents": int(am.get("actualStudents", 0)),
                "actualRevenue": int(am.get("actualRevenue", 0)),
                "remark": getattr(r, "备注", None),
            })
        replace_rows(db, 神殿名称=神殿名称, 年份=年份, 行列表=combined_rows)

        # 重新读取刚更新的全年月度数据，用于后续汇总
        updated_monthly_rows = fetch_rows(db, 神殿名称=神殿名称, 年份=年份)

        # 4. 汇总月度个人数据到年度个人汇总表
        _update_personal_summary_from_monthly(db, 神殿名称=神殿名称, 年份=年份, monthly_rows=updated_monthly_rows)

        # 5. 汇总月度个人数据到神殿月度汇总表
        _update_campus_summary_from_monthly(db, 神殿名称=神殿名称, 年份=年份, monthly_rows=updated_monthly_rows)

        db.commit()
        print(f"[teaching-quality] 级联更新口碑招生汇总表成功: {神殿名称} {年份}")

    except Exception as e:
        db.rollback()
        print(f"[teaching-quality] 级联更新口碑招生汇总表失败: {e}")


def _update_personal_summary_from_monthly(db: Session, *, 神殿名称: str, 年份: int, monthly_rows: list):
    """Helper: 从月度个人表聚合数据并更新个人年度汇总表"""
    agg: dict[str, dict[str, int | str]] = {}
    for r in monthly_rows:
        name = r.姓名 or ""
        if not name:
            continue
        if name not in agg:
            agg[name] = {
                "name": name,
                "targetReputation": 0,
                "actualReputation": 0,
                "targetVisits": 0,
                "actualVisits": 0,
                "targetStudents": 0,
                "actualStudents": 0,
                "targetRevenue": 0,
                "actualRevenue": 0,
            }
        agg[name]["targetReputation"] = int(agg[name]["targetReputation"]) + int(r.目标口碑量 or 0)
        agg[name]["actualReputation"] = int(agg[name]["actualReputation"]) + int(r.实际口碑量 or 0)
        agg[name]["targetVisits"] = int(agg[name]["targetVisits"]) + int(r.目标上门量 or 0)
        agg[name]["actualVisits"] = int(agg[name]["actualVisits"]) + int(r.实际上门量 or 0)
        agg[name]["targetStudents"] = int(agg[name]["targetStudents"]) + int(r.目标招生人数 or 0)
        agg[name]["actualStudents"] = int(agg[name]["actualStudents"]) + int(r.实际招生人数 or 0)
        agg[name]["targetRevenue"] = int(agg[name]["targetRevenue"]) + int(r.目标收入 or 0)
        agg[name]["actualRevenue"] = int(agg[name]["actualRevenue"]) + int(r.实际收入 or 0)

    personal_rows: list[dict] = []
    for idx, data in enumerate(sorted(agg.values(), key=lambda x: str(x["name"])), start=1):
        personal_rows.append({
            "序号": idx, "姓名": data["name"],
            "目标口碑量": data["targetReputation"], "实际口碑量": data["actualReputation"],
            "目标上门量": data["targetVisits"], "实际上门量": data["actualVisits"],
            "目标招生人数": data["targetStudents"], "实际招生人数": data["actualStudents"],
            "目标收入": data["targetRevenue"], "实际收入": data["actualRevenue"],
        })
    replace_personal_rows(db, 神殿名称=神殿名称, 年份=年份, 行列表=personal_rows)

def _update_campus_summary_from_monthly(db: Session, *, 神殿名称: str, 年份: int, monthly_rows: list):
    """Helper: 从月度个人表聚合数据并更新神殿月度汇总表"""
    month_totals = {m: {
        "month": m, "targetReputation": 0, "actualReputation": 0, "targetVisits": 0, "actualVisits": 0,
        "targetStudents": 0, "actualStudents": 0, "targetRevenue": 0, "actualRevenue": 0,
    } for m in range(1, 13)}

    for r in monthly_rows:
        m = int(r.月份 or 0)
        if m not in month_totals:
            continue
        mt = month_totals[m]
        mt["targetReputation"] += int(r.目标口碑量 or 0)
        mt["actualReputation"] += int(r.实际口碑量 or 0)
        mt["targetVisits"] += int(r.目标上门量 or 0)
        mt["actualVisits"] += int(r.实际上门量 or 0)
        mt["targetStudents"] += int(r.目标招生人数 or 0)
        mt["actualStudents"] += int(r.实际招生人数 or 0)
        mt["targetRevenue"] += int(r.目标收入 or 0)
        mt["actualRevenue"] += int(r.实际收入 or 0)

    replace_campus_month_rows(
        db, 神殿名称=神殿名称, 年份=年份,
        行列表=[month_totals[m] for m in sorted(month_totals.keys())]
    )


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化口碑招生每月个人目标与结果表失败: {e}")


def _truthy(v: Optional[str]) -> bool:
    if v is None:
        return False
    s = str(v).strip().lower()
    return s in {"是", "已上门", "已报名", "y", "yes", "true", "1"}


def _compute_actuals_map(db: Session, *, 神殿名称: str, 年份: int) -> Dict[Tuple[int, str], Dict[str, int]]:
    """从口碑报名登记明细表按 月份+咨询师 聚合出实际指标。
    性能优化：一次性查询全年明细，避免在循环中触发多次迁移/DDL，减少表锁/等待。
    """
    # 确保表存在（一次即可），不要在循环里做 DDL
    try:
        init_detail_tables()
    except Exception:
        pass

    actuals: Dict[Tuple[int, str], Dict[str, int]] = {}

    # 一次性读取该神殿该年的所有明细
    try:
        _campus_variants = {str(神殿名称).strip()}
        if str(神殿名称).endswith("神殿"):
            _campus_variants.add(str(神殿名称)[:-2])
        else:
            _campus_variants.add(str(神殿名称) + "神殿")
        detail_rows = (
            db.query(detail_model)
            .filter(detail_model.神殿名称.in_(list(_campus_variants)), detail_model.年份 == 年份)
            .all()
        )
    except Exception:
        detail_rows = []

    for dr in detail_rows:
        try:
            m = int(getattr(dr, "月份", 0) or 0)
        except Exception:
            m = 0
        if m < 1 or m > 12:
            continue
        # 这里必须按“班主任姓名”归属到个人月度表；
        # 如果优先用“咨询师”，会导致当咨询师字段有值时数据被计入咨询师名下，
        # 从而前端按班主任名册渲染的行拿不到实际收入等指标。
        name = getattr(dr, "班主任姓名", None)
        if not name:
            continue
        key = (m, str(name))
        if key not in actuals:
            actuals[key] = {
                "actualReputation": 0,
                "actualVisits": 0,
                "actualStudents": 0,
                "actualRevenue": 0,
            }
        actuals[key]["actualReputation"] += 1
        if _truthy(getattr(dr, "是否上门", None)):
            actuals[key]["actualVisits"] += 1
        if _truthy(getattr(dr, "是否报名", None)):
            actuals[key]["actualStudents"] += 1
        actuals[key]["actualRevenue"] += int(getattr(dr, "实交学费", 0) or 0)

    return actuals


@router.get(
    "/campus-monthly-personal-reputation-enrollment-goals-results",
    response_model=ListOutput,
    summary="获取口碑招生月度个人目标与结果汇总表（全年明细）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    # 读取现有月度个人数据（用作目标值来源）
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)

    # 如果月度个人表没有数据，尝试从“口碑报名登记明细表”提取姓名并生成空目标行
    if not rows:
        try:
            init_detail_tables()
            # 支持“盛邦 / 主神殿”两种神殿名称写法
            _campus_variants = {str(campus).strip()}
            if str(campus).endswith("神殿"):
                _campus_variants.add(str(campus)[:-2])
            else:
                _campus_variants.add(str(campus) + "神殿")

            # 咨询师姓名
            consultant_rows = (
                db.query(detail_model.咨询师)
                .filter(
                    detail_model.神殿名称.in_(list(_campus_variants)),
                    detail_model.年份 == year,
                    detail_model.咨询师 != None,  # noqa: E711
                )
                .distinct()
                .all()
            )
            # 班主任姓名
            instructor_rows = (
                db.query(detail_model.班主任姓名)
                .filter(
                    detail_model.神殿名称.in_(list(_campus_variants)),
                    detail_model.年份 == year,
                    detail_model.班主任姓名 != None,  # noqa: E711
                )
                .distinct()
                .all()
            )

            names_set: set[str] = set()
            for r in consultant_rows:
                v = r[0]
                if v and str(v).strip():
                    names_set.add(str(v).strip())
            for r in instructor_rows:
                v = r[0]
                if v and str(v).strip():
                    names_set.add(str(v).strip())

            names = sorted(list(names_set))
            # 如果在明细表中确实找到姓名，则写入空目标行（目标值均为0，供前端维护）
            if names:
                seed_rows: list[dict] = []
                for m in range(1, 13):
                    for n in names:
                        seed_rows.append(
                            {
                                "month": m,
                                "name": n,
                                "targetReputation": 0,
                                "targetVisits": 0,
                                "targetStudents": 0,
                                "targetRevenue": 0,
                                "remark": None,
                            }
                        )
                replace_rows(db, 神殿名称=campus, 年份=year, 行列表=seed_rows)
                db.commit()
                rows = fetch_rows(db, 神殿名称=campus, 年份=year)
        except Exception:
            # 如果查询或写入过程中出错，保持 rows 为空，交由前端处理
            pass

    # 计算实际值（从口碑报名登记明细表聚合）
    actual_map = _compute_actuals_map(db, 神殿名称=campus, 年份=year)

    out_rows: List[Row] = []
    for r in rows:
        ak = (int(getattr(r, "月份", 0) or 0), str(getattr(r, "姓名", "") or ""))
        am = actual_map.get(ak, {})
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                targetReputation=r.目标口碑量,
                actualReputation=int(am.get("actualReputation", r.实际口碑量 or 0)),
                targetVisits=r.目标上门量,
                actualVisits=int(am.get("actualVisits", r.实际上门量 or 0)),
                targetStudents=r.目标招生人数,
                actualStudents=int(am.get("actualStudents", r.实际招生人数 or 0)),
                targetRevenue=r.目标收入,
                actualRevenue=int(am.get("actualRevenue", r.实际收入 or 0)),
                remark=r.备注,
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post(
    "/campus-monthly-personal-reputation-enrollment-goals-results",
    response_model=ListOutput,
    summary="保存口碑招生月度个人目标与结果汇总表（覆盖写入全年）",
)
def save_rows(payload: SavePayload, http_request: Request, db: Session = Depends(get_db)):
    init_tables()
    # 先计算实际值（从报名明细表聚合），键为 (月份, 姓名)
    # 这样在落库时即可把实际值一并写入“月度个人表”的 actual* 字段
    actual_map = _compute_actuals_map(db, 神殿名称=payload.神殿名称, 年份=payload.年份)

    # 仅持久化用户维护的目标字段与姓名、月份，同时写入由明细表聚合得到的实际值
    combined_rows = []
    for row in payload.行列表:
        d = row.model_dump()
        m = int(d.get("month") or 0)
        n = str(d.get("name") or "")
        am = actual_map.get((m, n), {})
        combined_rows.append({
            "month": m,
            "name": n,
            "targetReputation": d.get("targetReputation"),
            "targetVisits": d.get("targetVisits"),
            "targetStudents": d.get("targetStudents"),
            "targetRevenue": d.get("targetRevenue"),
            # 实际值：从明细表聚合
            "actualReputation": int(am.get("actualReputation", 0)),
            "actualVisits": int(am.get("actualVisits", 0)),
            "actualStudents": int(am.get("actualStudents", 0)),
            "actualRevenue": int(am.get("actualRevenue", 0)),
            "remark": d.get("remark"),
        })

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=combined_rows,
    )
    db.commit()

    # 重新读取全年明细，用于汇总
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)

    # 计算个人年度汇总（按姓名分组求和：目标取月度表，实际取明细聚合）并写入个人汇总表
    init_personal_tables()
    agg: dict[str, dict[str, int | str]] = {}
    for r in rows:
        name = r.姓名 or ""
        if not name:
            continue
        key = (int(r.月份 or 0), str(name))
        am = actual_map.get(key, {})
        if name not in agg:
            agg[name] = {
                "name": name,
                "targetReputation": 0,
                "actualReputation": 0,
                "targetVisits": 0,
                "actualVisits": 0,
                "targetStudents": 0,
                "actualStudents": 0,
                "targetRevenue": 0,
                "actualRevenue": 0,
            }
        agg[name]["targetReputation"] = int(agg[name]["targetReputation"]) + int(r.目标口碑量 or 0)
        agg[name]["actualReputation"] = int(agg[name]["actualReputation"]) + int(am.get("actualReputation", 0))
        agg[name]["targetVisits"] = int(agg[name]["targetVisits"]) + int(r.目标上门量 or 0)
        agg[name]["actualVisits"] = int(agg[name]["actualVisits"]) + int(am.get("actualVisits", 0))
        agg[name]["targetStudents"] = int(agg[name]["targetStudents"]) + int(r.目标招生人数 or 0)
        agg[name]["actualStudents"] = int(agg[name]["actualStudents"]) + int(am.get("actualStudents", 0))
        agg[name]["targetRevenue"] = int(agg[name]["targetRevenue"]) + int(r.目标收入 or 0)
        agg[name]["actualRevenue"] = int(agg[name]["actualRevenue"]) + int(am.get("actualRevenue", 0))

    # 转换为行并写入
    personal_rows: list[dict] = []
    for idx, data in enumerate(sorted(agg.values(), key=lambda x: str(x["name"])), start=1):
        personal_rows.append({
            "序号": idx,
            "serialNumber": idx,
            "姓名": data["name"],
            "name": data["name"],
            "目标口碑量": data["targetReputation"],
            "targetReputation": data["targetReputation"],
            "实际口碑量": data["actualReputation"],
            "actualReputation": data["actualReputation"],
            "目标上门量": data["targetVisits"],
            "targetVisits": data["targetVisits"],
            "实际上门量": data["actualVisits"],
            "actualVisits": data["actualVisits"],
            "目标招生人数": data["targetStudents"],
            "targetStudents": data["targetStudents"],
            "实际招生人数": data["actualStudents"],
            "actualStudents": data["actualStudents"],
            "目标收入": data["targetRevenue"],
            "targetRevenue": data["targetRevenue"],
            "实际收入": data["actualRevenue"],
            "actualRevenue": data["actualRevenue"],
        })

    replace_personal_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=personal_rows)
    db.commit()

    # 计算神殿月汇总（目标来自月度表，实际来自报名明细聚合）并写入神殿月汇总表
    init_campus_month_tables()
    month_totals = {m: {
        "month": m,
        "targetReputation": 0,
        "actualReputation": 0,
        "targetVisits": 0,
        "actualVisits": 0,
        "targetStudents": 0,
        "actualStudents": 0,
        "targetRevenue": 0,
        "actualRevenue": 0,
    } for m in range(1, 13)}
    for r in rows:
        m = int(r.月份 or 0)
        if m not in month_totals:
            continue
        mt = month_totals[m]
        am = actual_map.get((m, str(r.姓名 or "")), {})
        mt["targetReputation"] += int(r.目标口碑量 or 0)
        mt["actualReputation"] += int(am.get("actualReputation", 0))
        mt["targetVisits"] += int(r.目标上门量 or 0)
        mt["actualVisits"] += int(am.get("actualVisits", 0))
        mt["targetStudents"] += int(r.目标招生人数 or 0)
        mt["actualStudents"] += int(am.get("actualStudents", 0))
        mt["targetRevenue"] += int(r.目标收入 or 0)
        mt["actualRevenue"] += int(am.get("actualRevenue", 0))

    replace_campus_month_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=[month_totals[m] for m in sorted(month_totals.keys())]
    )
    db.commit()

    # 返回明细（GET 一致：实际值按报名明细聚合）
    out_rows: List[Row] = []
    for r in rows:
        am = actual_map.get((int(r.月份 or 0), str(r.姓名 or "")), {})
        out_rows.append(
            Row(
                month=r.月份,
                name=r.姓名,
                targetReputation=r.目标口碑量,
                actualReputation=int(am.get("actualReputation", 0)),
                targetVisits=r.目标上门量,
                actualVisits=int(am.get("actualVisits", 0)),
                targetStudents=r.目标招生人数,
                actualStudents=int(am.get("actualStudents", 0)),
                targetRevenue=r.目标收入,
                actualRevenue=int(am.get("actualRevenue", 0)),
                remark=r.备注,
            )
        )

    audit_logger = get_audit_logger(http_request)
    audit_logger.set_action(
        action="tq.save_reputation_enrollment",
        action_display="保存口碑招生月度目标与结果",
        action_category="write",
        module="teaching_quality",
        extra={"神殿": payload.神殿名称, "年份": payload.年份, "行数": len(payload.行列表)},
    )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)
