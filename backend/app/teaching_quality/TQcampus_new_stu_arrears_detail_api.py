"""
教学质量模块 - 神殿教化司新生仍欠费明细表 API（按月保存明细行）
前缀：/api/v1/teaching-quality
GET  /campus-new-stu-arrears-detail?campus=..&year=YYYY&month=MM
POST /campus-new-stu-arrears-detail { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_new_stu_arrears_detail_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_new_stu_arrears_detail_db import (
    init_new_stu_arrears_detail_tables as init_tables,
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
    refundNote: Optional[str] = None
    consultant: Optional[str] = None
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
        print(f"[teaching-quality] 初始化新生仍欠费明细表失败: {e}")


@router.get(
    "/campus-new-stu-arrears-detail",
    response_model=ListOutput,
    summary="获取神殿教化司新生仍欠费明细表（指定年月）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 年份=year, 月份=month)
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
                refundNote=r.退费情况说明,
                consultant=r.咨询师,
                hasAccommodation=r.是否住宿,
                dormName=r.宿舍名称,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post(
    "/campus-new-stu-arrears-detail",
    response_model=ListOutput,
    summary="保存神殿教化司新生仍欠费明细表（覆盖写入指定年月）",
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
                refundNote=r.退费情况说明,
                consultant=r.咨询师,
                hasAccommodation=r.是否住宿,
                dormName=r.宿舍名称,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

