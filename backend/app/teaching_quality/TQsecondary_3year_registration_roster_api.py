"""
教学质量模块 - 中专3年学籍注册花名册 API（单表）
前缀：/api/v1/teaching-quality
GET  /secondary-3year-registration-roster?campus=..&year=YYYY&month=MM
POST /secondary-3year-registration-roster  { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQsecondary_3year_registration_roster_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQsecondary_3year_registration_roster_db import (
    init_secondary_3year_registration_roster_tables as init_tables,
)

router = APIRouter()

def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化中专3年学籍注册花名册失败: {e}")


class Row(BaseModel):
    schoolName: Optional[str] = None
    registrationTime: Optional[str] = None
    graduationTime: Optional[str] = None
    studentNumber: str
    studentName: Optional[str] = None
    gender: Optional[str] = None
    idCardNumber: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None
    educationSystem: Optional[str] = None
    className: Optional[str] = None
    studyMode: Optional[str] = None
    nation: Optional[str] = None
    politicalStatus: Optional[str] = None
    householdType: Optional[str] = None
    contactPhone: Optional[str] = None
    householdAddress: Optional[str] = None
    enrollmentTarget: Optional[str] = None
    isMigrantChild: Optional[str] = None
    registrationYear: Optional[str] = None
    scholarshipStatus: Optional[str] = None
    parentName1: Optional[str] = None
    parentPhone1: Optional[str] = None
    parentName2: Optional[str] = None
    parentPhone2: Optional[str] = None
    headTeacher: Optional[str] = None


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


@router.get("/secondary-3year-registration-roster", response_model=ListOutput, summary="获取中专3年学籍注册花名册（按月）")
def get_secondary_3year_roster(
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
                schoolName=r.学校名称,
                registrationTime=r.注册时间,
                graduationTime=r.毕业时间,
                studentNumber=r.学号,
                studentName=r.姓名,
                gender=r.性别,
                idCardNumber=r.身份证号,
                major=r.专业,
                grade=r.年级,
                educationSystem=r.学制,
                className=r.班级,
                studyMode=r.学习形式,
                nation=r.民族,
                politicalStatus=r.政治面貌,
                householdType=r.户口性质,
                contactPhone=r.联系电话,
                householdAddress=r.户口所在地,
                enrollmentTarget=r.招生对象,
                isMigrantChild=r.是否随迁子女,
                registrationYear=r.注册年份,
                scholarshipStatus=r.助学金状态,
                parentName1=r.家长姓名1,
                parentPhone1=r.家长电话1,
                parentName2=r.家长姓名2,
                parentPhone2=r.家长电话2,
                headTeacher=r.班主任,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post("/secondary-3year-registration-roster", response_model=ListOutput, summary="保存中专3年学籍注册花名册（按月覆盖写入）")
def save_secondary_3year_roster(payload: SavePayload, db: Session = Depends(get_db)):
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
                schoolName=r.学校名称,
                registrationTime=r.注册时间,
                graduationTime=r.毕业时间,
                studentNumber=r.学号,
                studentName=r.姓名,
                gender=r.性别,
                idCardNumber=r.身份证号,
                major=r.专业,
                grade=r.年级,
                educationSystem=r.学制,
                className=r.班级,
                studyMode=r.学习形式,
                nation=r.民族,
                politicalStatus=r.政治面貌,
                householdType=r.户口性质,
                contactPhone=r.联系电话,
                householdAddress=r.户口所在地,
                enrollmentTarget=r.招生对象,
                isMigrantChild=r.是否随迁子女,
                registrationYear=r.注册年份,
                scholarshipStatus=r.助学金状态,
                parentName1=r.家长姓名1,
                parentPhone1=r.家长电话1,
                parentName2=r.家长姓名2,
                parentPhone2=r.家长电话2,
                headTeacher=r.班主任,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

