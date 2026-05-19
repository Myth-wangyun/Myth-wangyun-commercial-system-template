"""
教学质量模块 - 神殿教化司月度班级升学目标与结果汇总表 API（单表，年+月维度保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-class-promotion-goals-results?campus=..&year=YYYY&month=MM
POST /campus-monthly-class-promotion-goals-results  { 神殿名称, 年份, 月份, 行列表 }
说明：仅持久化“明细行”，前端合计行自行计算。
"""

from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import (
    fetch_class_detail_rows,
    fetch_class_detail_summary_by_campus,
    fetch_promotion_plan_summary,
    fetch_rows,
    fetch_teacher_detail_summary_by_campus,
    fetch_teacher_summary_from_promotion_plan,
    init_promotion_plan_summary_tables,
    replace_class_detail_rows,
    replace_rows,
    save_promotion_plan_summary,
)
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import (
    init_class_promotion_detail_tables as init_class_detail_tables,
)
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import (
    init_monthly_class_promotion_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: int
    teacherName: Optional[str] = None
    className: Optional[str] = None
    promotionPeriod: Optional[str] = None
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
    月份: int
    行列表: List[Row] = Field(default_factory=list)


# ====== 班升学计划明细（学生级别） ======
class ClassDetailRow(BaseModel):
    serialNumber: int
    name: Optional[str] = None
    idCard: Optional[str] = None
    enrollmentDate: Optional[str] = None
    enrollmentAge: Optional[str] = None
    receivableAmount: Optional[int] = None
    plannedPaymentAmount: Optional[int] = None
    actualPaymentAmount: Optional[int] = None
    supplementPaymentTime: Optional[str] = None
    supplementPaymentAmount: Optional[int] = None
    standardPayment: Optional[int] = None
    plannedPaymentDate: Optional[str] = None
    headTeacher: Optional[str] = None
    instructor: Optional[str] = None


class ClassDetailSavePayload(BaseModel):
    神殿名称: str
    班级: str
    行列表: List[ClassDetailRow] = Field(default_factory=list)


class ClassDetailListOutput(BaseModel):
    神殿名称: str
    班级: str
    行列表: List[ClassDetailRow] = Field(default_factory=list)


# ====== 神殿升学计划汇总表 ======
class CampusNumberMap(BaseModel):
    total: int = 0
    # 动态神殿字段通过额外的字典存储
    model_config = ConfigDict(
        extra="allow",
    )


class PromotionPlanSummaryRow(BaseModel):
    serialNumber: int = 1
    promotionMonth: str
    classId: str
    studentsOnFile: Dict[str, int]
    targetStudents: Dict[str, int]
    projectedPromotionRateByCount: float
    unitPrice: int
    receivable: Dict[str, int]
    projectedPromotionAmount: Dict[str, int]
    projectedPromotionRateByAmount: float
    actualPromotionCount: int
    actualPromotionAmount: int
    actualPromotionRateByAmount: float
    headTeacher: Optional[str] = None
    instructor: Optional[str] = None


class PromotionPlanSummarySavePayload(BaseModel):
    神殿名称: Optional[str] = Field(
        None, alias="神殿"
    )  # 支持"神殿"和"神殿名称"两个字段名
    班级ID: str
    升学月份: str
    数据: PromotionPlanSummaryRow

    model_config = ConfigDict(
        populate_by_name=True,  # 允许使用字段名或别名
    )


class PromotionPlanSummaryListOutput(BaseModel):
    班级ID: str
    升学月份: Optional[str] = None
    行列表: List[PromotionPlanSummaryRow] = Field(default_factory=list)


def _startup_init():
    init_tables()
    init_class_detail_tables()
    init_promotion_plan_summary_tables()
    print("[TQcampus_monthly_class_promotion_goals_results_api] 数据表初始化成功")


@router.get(
    "/campus-monthly-class-promotion-goals-results",
    response_model=ListOutput,
    summary="获取教化司月度班级升学目标与结果汇总表（指定年月）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    """优先从“班级升学计划明细表”聚合得到当月班级升学目标与结果；仅当当月无可用明细数据时回退存量表。"""
    init_tables()
    init_class_detail_tables()

    # 尝试从“班级升学计划明细表”聚合
    from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_db import 班级升学计划明细表 as Detail

    def _parse_ym(s: Optional[str]) -> Optional[tuple[int, int]]:
        if not s:
            return None
        ss = str(s).strip().replace("/", "-")
        try:
            # 允许 YYYY-MM 或 YYYY-MM-DD
            parts = ss.split("-")
            if len(parts) >= 2:
                y = int(parts[0])
                m = int(parts[1])
                return (y, m)
        except Exception:
            return None
        return None

    # 神殿兼容：等值/去“神殿”后缀/前缀 ILIKE
    norm = campus.strip()
    norm2 = norm[:-2] if norm.endswith("神殿") else norm
    from sqlalchemy import or_ as _or

    q = db.query(Detail).filter(
        _or(
            Detail.神殿名称 == norm,
            Detail.神殿名称 == norm2,
            Detail.神殿名称.ilike(f"{norm}%"),
            Detail.神殿名称.ilike(f"{norm2}%"),
        )
    )
    detail_rows = q.all()

    agg: dict[tuple[str, str], dict[str, int | str]] = {}

    for r in detail_rows:
        # 预计归属：计划缴费日期
        ym_plan = _parse_ym(getattr(r, "计划缴费日期", None))
        # 实际归属：补款时间；若无且实际缴费金额>0，用计划缴费日期兜底
        ym_supp = _parse_ym(getattr(r, "补款时间", None))
        actual_amt = int(getattr(r, "实际缴费金额", 0) or 0)
        supp_amt = int(getattr(r, "补款金额", 0) or 0)

        expected_hit = ym_plan == (year, month)
        actual_hit = False
        if ym_supp == (year, month):
            actual_hit = (actual_amt > 0) or (supp_amt > 0)
        elif (actual_amt > 0) and expected_hit:
            # 兜底：无补款时间但有实际缴费金额 -> 使用计划缴费日期归属月
            actual_hit = True

        # fileCount/应收以“当月计划明细”为口径
        month_hit_for_file = expected_hit

        key = (
            getattr(r, "班主任", None) or "",
            getattr(r, "班级名称", None) or getattr(r, "班级名称", None) or "",
        )
        if key not in agg:
            agg[key] = {
                "班主任": key[0],
                "升学班级名称": key[1],
                "在档总人数": 0,
                "应收": 0,
                "预计升学总人数": 0,
                "预计升学收入": 0,
                "实际升学总人数": 0,
                "实际升学收入": 0,
                "升学周期": "",
                "备注": "",
            }
        a = agg[key]
        if month_hit_for_file:
            a["在档总人数"] = int(a["在档总人数"]) + 1
            a["应收"] = int(a["应收"]) + int(getattr(r, "应收", 0) or 0)
        if expected_hit:
            a["预计升学总人数"] = int(a["预计升学总人数"]) + (
                1 if int(getattr(r, "预计缴费金额", 0) or 0) > 0 else 0
            )
            a["预计升学收入"] = int(a["预计升学收入"]) + int(
                getattr(r, "预计缴费金额", 0) or 0
            )
        if actual_hit:
            a["实际升学总人数"] = int(a["实际升学总人数"]) + 1
            a["实际升学收入"] = int(a["实际升学收入"]) + actual_amt + supp_amt

    out_rows: List[Row] = []

    # 只有当“当月”确实能从明细聚合出有效数据时，才使用明细聚合结果。
    # 否则回退到存量表（用户手工保存的数据）。
    if agg:
        # 判定是否有“当月有效数据”：任意班级在档/预计/实际/收入等任一指标 > 0
        has_effective = any(
            int(a.get("在档总人数", 0) or 0) > 0
            or int(a.get("预计升学总人数", 0) or 0) > 0
            or int(a.get("实际升学总人数", 0) or 0) > 0
            or int(a.get("应收", 0) or 0) > 0
            or int(a.get("预计升学收入", 0) or 0) > 0
            or int(a.get("实际升学收入", 0) or 0) > 0
            for a in agg.values()
        )

        if has_effective:
            sn = 1
            for (_, _), a in sorted(agg.items(), key=lambda x: (x[0][0], x[0][1])):
                out_rows.append(
                    Row(
                        serialNumber=sn,
                        teacherName=str(a["班主任"]) or None,
                        className=str(a["升学班级名称"]) or None,
                        promotionPeriod=a["升学周期"],
                        fileCount=int(a["在档总人数"]),
                        expectedPromotionCount=int(a["预计升学总人数"]),
                        actualPromotionCount=int(a["实际升学总人数"]),
                        receivableAmount=int(a["应收"]),
                        expectedPromotionRevenue=int(a["预计升学收入"]),
                        actualPromotionRevenue=int(a["实际升学收入"]),
                        remark=a["备注"],
                    )
                )
                sn += 1
            return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)

    # 回退：无当月有效明细时读取存量表（用户手工保存的数据）
    rows = fetch_rows(db, 神殿名称=campus, 年份=year, 月份=month)
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                teacherName=r.班主任,
                className=r.升学班级名称,
                promotionPeriod=r.升学周期,
                fileCount=r.在档总人数,
                expectedPromotionCount=r.预计升学总人数,
                actualPromotionCount=r.实际升学总人数,
                receivableAmount=r.应收,
                expectedPromotionRevenue=r.预计升学收入,
                actualPromotionRevenue=r.实际升学收入,
                remark=r.备注,
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post(
    "/campus-monthly-class-promotion-goals-results",
    response_model=ListOutput,
    summary="保存教化司月度班级升学目标与结果汇总表（覆盖写入当月）",
)
@router.post(
    "/campus-monthly-class-promotion-goals-results/",
    response_model=ListOutput,
    summary="保存教化司月度班级升学目标与结果汇总表（覆盖写入当月，兼容尾斜杠）",
)
def save_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    # 注意：不再校验班级是否在班级列表中存在，允许用户自由填写班级名称

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )

    db.commit()

    # 回读
    rows = fetch_rows(
        db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份
    )
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                teacherName=r.班主任,
                className=r.升学班级名称,
                promotionPeriod=r.升学周期,
                fileCount=r.在档总人数,
                expectedPromotionCount=r.预计升学总人数,
                actualPromotionCount=r.实际升学总人数,
                receivableAmount=r.应收,
                expectedPromotionRevenue=r.预计升学收入,
                actualPromotionRevenue=r.实际升学收入,
                remark=r.备注,
            )
        )

    return ListOutput(
        神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows
    )


# ====== 班升学计划明细（学生级别）保存 ======
@router.post(
    "/campus-class-promotion-detail",
    summary="保存班升学计划明细（按神殿+班级覆盖写入）",
)
@router.post(
    "/campus-class-promotion-detail/",
    summary="保存班升学计划明细（按神殿+班级覆盖写入，兼容尾斜杠）",
)
def save_class_detail(payload: ClassDetailSavePayload, db: Session = Depends(get_db)):
    init_class_detail_tables()
    # 允许空列表；若无行则表示清空该班明细
    replace_class_detail_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    return {"success": True, "saved": len(payload.行列表)}


@router.get(
    "/campus-class-promotion-detail",
    response_model=ClassDetailListOutput,
    summary="获取班升学计划明细（按神殿+班级）",
)
def get_class_detail(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    db: Session = Depends(get_db),
):
    init_class_detail_tables()
    rows = fetch_class_detail_rows(db, 神殿名称=campus, 班级名称=klass)
    out: List[ClassDetailRow] = []
    for r in rows:
        out.append(
            ClassDetailRow(
                serialNumber=r.序号,
                name=r.姓名,
                idCard=r.身份证号,
                enrollmentDate=r.入学时间,
                enrollmentAge=r.入学年龄,
                receivableAmount=r.应收,
                plannedPaymentAmount=r.预计缴费金额,
                actualPaymentAmount=r.实际缴费金额,
                supplementPaymentTime=r.补款时间,
                supplementPaymentAmount=r.补款金额,
                standardPayment=r.标准缴费,
                plannedPaymentDate=r.计划缴费日期,
                headTeacher=r.班主任,
                instructor=r.教员,
            )
        )
    return ClassDetailListOutput(神殿名称=campus, 班级=klass, 行列表=out)


# ====== 按神殿获取所有班级明细汇总（用于月度班级升学目标与结果汇总表） ======
class ClassDetailSummaryRow(BaseModel):
    className: str = ""
    teacherName: str = ""
    fileCount: int = 0
    expectedPromotionCount: int = 0
    actualPromotionCount: int = 0
    receivableAmount: int = 0
    expectedPromotionRevenue: int = 0
    actualPromotionRevenue: int = 0


class ClassDetailSummaryOutput(BaseModel):
    神殿名称: str
    行列表: List[ClassDetailSummaryRow] = []


@router.get(
    "/campus-class-detail-summary",
    response_model=ClassDetailSummaryOutput,
    summary="按神殿获取所有班级升学计划明细的汇总数据",
)
def get_class_detail_summary_by_campus(
    campus: str = Query(..., alias="campus"),
    db: Session = Depends(get_db),
):
    """
    从 班级升学计划明细表 按神殿汇总所有班级数据。
    返回每个班级的：班级名称、班主任、在档人数、预计升学人数、实际升学人数、应收、预计升学收入、实际升学收入
    """
    init_class_detail_tables()
    rows = fetch_class_detail_summary_by_campus(db, 神殿名称=campus)
    out: List[ClassDetailSummaryRow] = []
    for r in rows:
        out.append(ClassDetailSummaryRow(**r))
    return ClassDetailSummaryOutput(神殿名称=campus, 行列表=out)


# ====== 按神殿按班主任获取汇总数据（用于月度个人升学目标与结果汇总表） ======
class TeacherDetailSummaryRow(BaseModel):
    teacherName: str = ""
    classCount: int = 0
    fileCount: int = 0
    expectedPromotionCount: int = 0
    actualPromotionCount: int = 0
    receivableAmount: int = 0
    expectedPromotionRevenue: int = 0
    actualPromotionRevenue: int = 0


class TeacherDetailSummaryOutput(BaseModel):
    神殿名称: str
    行列表: List[TeacherDetailSummaryRow] = []


@router.get(
    "/campus-teacher-detail-summary",
    response_model=TeacherDetailSummaryOutput,
    summary="按神殿获取所有班主任的升学计划明细汇总数据",
)
def get_teacher_detail_summary_by_campus(
    campus: str = Query(..., alias="campus"),
    db: Session = Depends(get_db),
):
    """
    从 班级升学计划明细表 按神殿汇总所有班主任数据。
    返回每个班主任的：班主任姓名、带班量、在档人数、预计升学人数、实际升学人数、应收、预计升学收入、实际升学收入
    """
    init_class_detail_tables()
    rows = fetch_teacher_detail_summary_by_campus(db, 神殿名称=campus)
    out: List[TeacherDetailSummaryRow] = []
    for r in rows:
        out.append(TeacherDetailSummaryRow(**r))
    return TeacherDetailSummaryOutput(神殿名称=campus, 行列表=out)


@router.get(
    "/campus-teacher-summary-from-plan",
    response_model=TeacherDetailSummaryOutput,
    summary="从神殿升学计划汇总表中按班主任提取数据（用于06-2XX个人升学目标表）",
)
def get_teacher_summary_from_promotion_plan(
    promotionMonth: Optional[str] = Query(None, alias="promotionMonth"),
    db: Session = Depends(get_db),
):
    """
    从 神殿升学计划汇总表 按班主任汇总数据。
    可选择指定升学月份进行筛选。
    返回每个班主任的：班主任姓名、带班量、在档人数、预计升学人数、实际升学人数、应收、预计升学收入、实际升学收入
    """
    init_promotion_plan_summary_tables()
    rows = fetch_teacher_summary_from_promotion_plan(db, 升学月份=promotionMonth)
    out: List[TeacherDetailSummaryRow] = []
    for r in rows:
        out.append(TeacherDetailSummaryRow(**r))
    return TeacherDetailSummaryOutput(神殿名称="", 行列表=out)


# ====== 神殿班级升学计划汇总表API ======
@router.post(
    "/campus-class-promotion-summary",
    summary="保存神殿班级升学计划汇总数据（按班级）",
)
@router.post(
    "/campus-class-promotion-summary/",
    summary="保存神殿班级升学计划汇总数据（按班级，兼容尾斜杠）",
)
def save_promotion_summary(
    payload: PromotionPlanSummarySavePayload, db: Session = Depends(get_db)
):
    init_promotion_plan_summary_tables()

    # 直接使用前端传递的神殿名称
    campus_name = payload.神殿名称

    # 如果前端没有传递神殿名称，则报错（不再从数据中推断，避免错误）
    if not campus_name:
        raise HTTPException(
            status_code=400, detail="神殿名称不能为空，请在请求中提供神殿参数"
        )

    # 确保神殿名称包含"神殿"后缀（与前端保持一致）
    if not campus_name.endswith("神殿"):
        campus_name = campus_name + "神殿"

    print(
        f"[保存汇总数据] 班级ID: {payload.班级ID}, 神殿: {campus_name}, 升学月份: {payload.升学月份}"
    )

    save_promotion_plan_summary(
        db,
        神殿名称=campus_name,
        班级ID=payload.班级ID,
        升学月份=payload.升学月份,
        数据=payload.数据.model_dump(),
    )
    db.commit()
    return {
        "success": True,
        "classId": payload.班级ID,
        "promotionMonth": payload.升学月份,
        "campus": campus_name,
    }


@router.get(
    "/campus-class-promotion-summary",
    response_model=PromotionPlanSummaryListOutput,
    summary="获取神殿班级升学计划汇总数据（按班级ID查询）",
)
def get_promotion_summary(
    classId: str = Query(..., alias="classId"),
    promotionMonth: Optional[str] = Query(None, alias="promotionMonth"),
    db: Session = Depends(get_db),
):
    init_promotion_plan_summary_tables()
    rows = fetch_promotion_plan_summary(db, 班级ID=classId, 升学月份=promotionMonth)
    out: List[PromotionPlanSummaryRow] = []

    for r in rows:
        # 重建神殿数据字典
        def _rebuild_campus_map(
            total: int, campus_data: Optional[dict]
        ) -> Dict[str, int]:
            result = {"total": total or 0}
            if campus_data and isinstance(campus_data, dict):
                result.update(campus_data)
            return result

        out.append(
            PromotionPlanSummaryRow(
                serialNumber=r.序号,
                promotionMonth=r.升学月份,
                classId=r.班级ID,
                studentsOnFile=_rebuild_campus_map(
                    r.在档人数_合计, r.在档人数_神殿数据
                ),
                targetStudents=_rebuild_campus_map(
                    r.目标人数_合计, r.目标人数_神殿数据
                ),
                projectedPromotionRateByCount=(
                    r.预计升学率_人数 / 100.0 if r.预计升学率_人数 else 0.0
                ),
                unitPrice=r.单价 or 0,
                receivable=_rebuild_campus_map(r.应收_合计, r.应收_神殿数据),
                projectedPromotionAmount=_rebuild_campus_map(
                    r.预计升学金额_合计, r.预计升学金额_神殿数据
                ),
                projectedPromotionRateByAmount=(
                    r.预计升学率_金额 / 100.0 if r.预计升学率_金额 else 0.0
                ),
                actualPromotionCount=r.实际升学人数 or 0,
                actualPromotionAmount=r.实际升学金额 or 0,
                actualPromotionRateByAmount=(
                    r.实际升学率_金额 / 100.0 if r.实际升学率_金额 else 0.0
                ),
                headTeacher=r.班主任,
                instructor=r.教员,
            )
        )

    return PromotionPlanSummaryListOutput(
        班级ID=classId, 升学月份=promotionMonth, 行列表=out
    )
