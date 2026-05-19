"""
教学质量模块 - 神殿教化司当月新生维稳明细表 API（按月保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-monthly-new-stu-stability-detail?campus=..&year=YYYY&month=MM
POST /campus-monthly-new-stu-stability-detail { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_db import (
    fetch_arrears_rows,
    fetch_rows,
    fetch_rows_by_year,
    replace_rows,
)
from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_db import (
    init_monthly_new_stu_stability_detail_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    classTeacherName: Optional[str] = None
    studentName: Optional[str] = None
    signUpDate: Optional[str] = None
    reportDate: Optional[str] = None
    major: Optional[str] = None
    programLength: Optional[str] = None
    tuitionShould: Optional[int] = None
    tuitionPaid: Optional[int] = None
    additionalPayment: Optional[int] = None
    arrearsAmount: Optional[int] = None
    isFullPayment: Optional[str] = None
    isLoan: Optional[str] = None
    hasAttendedClass: Optional[str] = None
    trialPeriod: Optional[str] = None
    isRefund: Optional[str] = None
    refundTime: Optional[str] = None
    refundNote: Optional[str] = None
    consultant: Optional[str] = None
    instructor: Optional[str] = None
    hasAccommodation: Optional[str] = None
    dormName: Optional[str] = None
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


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化当月新生维稳明细表失败: {e}")


@router.get(
    "/campus-monthly-new-stu-stability-detail",
    response_model=ListOutput,
    summary="获取神殿教化司当月新生维稳明细表（指定年月）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: Optional[int] = Query(None, alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    arrears_only: bool = Query(False, alias="arrears_only"),
    all_year: bool = Query(False, alias="all_year"),
    db: Session = Depends(get_db),
):
    init_tables()
    
    # 规范化神殿名称（去掉"神殿"后缀）
    normalized_campus = campus.strip()
    if normalized_campus.endswith("神殿"):
        normalized_campus = normalized_campus[:-2]

    # arrears_only=true 时：返回该神殿跨年月的所有欠费明细（仍欠费金额 != 0）
    if arrears_only:
        if fetch_arrears_rows is None:
            return ListOutput(神殿名称=campus, 年份=year or 0, 月份=month or 0, 行列表=[])
        rows = fetch_arrears_rows(db, 神殿名称=normalized_campus)

    # all_year=true 时：返回该神殿某年全年（跨月份）
    elif all_year:
        if year is None:
            raise ValueError('year 不能为空（all_year=true）')
        if fetch_rows_by_year is None:
            return ListOutput(神殿名称=campus, 年份=year, 月份=0, 行列表=[])
        rows = fetch_rows_by_year(db, 神殿名称=normalized_campus, 年份=year)

    # 默认：指定年月
    else:
        if year is None or month is None:
            raise ValueError('year 和 month 不能为空（除非 arrears_only=true 或 all_year=true）')
        rows = fetch_rows(db, 神殿名称=normalized_campus, 年份=year, 月份=month)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                classTeacherName=r.班主任姓名,
                studentName=r.新生姓名,
                signUpDate=r.报名时间,
                reportDate=r.报道时间,
                major=r.报名专业,
                programLength=r.报名学制,
                tuitionShould=r.应收学费,
                tuitionPaid=r.报名交费金额,
                additionalPayment=r.补款金额,
                arrearsAmount=r.仍欠费金额,
                isFullPayment=r.是否全款,
                isLoan=r.是否贷款,
                hasAttendedClass=r.是否过课时,
                trialPeriod=r.试学周期,
                isRefund=r.是否退费,
                refundTime=r.退费时间,
                refundNote=r.退费情况说明,
                consultant=r.咨询师,
                instructor=getattr(r, '教员', None),
                hasAccommodation=r.是否住宿,
                dormName=r.宿舍名,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year or 0, 月份=month or 0, 行列表=out_rows)


@router.post(
    "/campus-monthly-new-stu-stability-detail",
    response_model=ListOutput,
    summary="保存神殿教化司当月新生维稳明细表（覆盖写入指定年月）",
)
def save_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()

    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )

    # 同步写入「新生仍欠费明细表」：从维稳明细中筛选仍欠费金额 != 0 的行
    try:
        from app.teaching_quality.TQcampus_new_stu_arrears_detail_db import (
            init_new_stu_arrears_detail_tables as _arrears_init_tables,
        )
        from app.teaching_quality.TQcampus_new_stu_arrears_detail_db import (
            replace_rows as _arrears_replace_rows,
        )

        _arrears_init_tables()

        def _to_int(v):
            try:
                if v in (None, ""):
                    return None
                return int(str(v))
            except Exception:
                try:
                    return int(float(v))
                except Exception:
                    return None

        arrears_rows = []
        for row in payload.行列表:
            d = row.model_dump()
            arrears_amount = _to_int(d.get("arrearsAmount"))
            if arrears_amount is None or arrears_amount == 0:
                continue
            arrears_rows.append(d)

        _arrears_replace_rows(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            月份=payload.月份,
            行列表=arrears_rows,
        )
    except Exception as e:
        # 不影响主表保存
        print(f"[teaching-quality] 同步新生仍欠费明细表失败: {e}")

    db.commit()

    # 回读
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                classTeacherName=r.班主任姓名,
                studentName=r.新生姓名,
                signUpDate=r.报名时间,
                reportDate=r.报道时间,
                major=r.报名专业,
                programLength=r.报名学制,
                tuitionShould=r.应收学费,
                tuitionPaid=r.报名交费金额,
                additionalPayment=r.补款金额,
                arrearsAmount=r.仍欠费金额,
                isFullPayment=r.是否全款,
                isLoan=r.是否贷款,
                hasAttendedClass=r.是否过课时,
                trialPeriod=r.试学周期,
                isRefund=r.是否退费,
                refundTime=r.退费时间,
                refundNote=r.退费情况说明,
                consultant=r.咨询师,
                instructor=getattr(r, '教员', None),
                hasAccommodation=r.是否住宿,
                dormName=r.宿舍名,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

