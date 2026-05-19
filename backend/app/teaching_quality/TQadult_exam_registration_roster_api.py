"""
教学质量模块 - 成考学籍注册花名册 API（按月）
前缀：/api/v1/teaching-quality
GET  /adult-exam-registration-roster?campus=..&year=YYYY&month=MM
POST /adult-exam-registration-roster  { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQadult_exam_registration_roster_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQadult_exam_registration_roster_db import (
    init_adult_exam_registration_roster_tables as init_tables,
)

router = APIRouter()

def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化成考学籍注册花名册失败: {e}")


class Row(BaseModel):
    serialNumber: int
    studentName: Optional[str] = None
    gender: Optional[str] = None
    idCardNumber: Optional[str] = None
    schoolName: Optional[str] = None
    registrationTime: Optional[str] = None
    graduationTime: Optional[str] = None
    studentNumber: Optional[str] = None
    studentRecordNumber: Optional[str] = None
    educationSystem: Optional[str] = None
    studyMode: Optional[str] = None
    contactPhone: Optional[str] = None
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


@router.get("/adult-exam-registration-roster", response_model=ListOutput, summary="获取成考学籍注册花名册（按月）")
def get_roster(
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
                studentName=r.姓名,
                gender=r.性别,
                idCardNumber=r.身份证号,
                schoolName=r.学校名称,
                registrationTime=r.注册时间,
                graduationTime=r.毕业时间,
                studentNumber=r.学号,
                studentRecordNumber=r.学籍号,
                educationSystem=r.学制,
                studyMode=r.学习形式,
                contactPhone=r.联系电话,
                headTeacher=r.班主任,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post("/adult-exam-registration-roster", response_model=ListOutput, summary="保存成考学籍注册花名册（按月覆盖写入）")
def save_roster(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                studentName=r.姓名,
                gender=r.性别,
                idCardNumber=r.身份证号,
                schoolName=r.学校名称,
                registrationTime=r.注册时间,
                graduationTime=r.毕业时间,
                studentNumber=r.学号,
                studentRecordNumber=r.学籍号,
                educationSystem=r.学制,
                studyMode=r.学习形式,
                contactPhone=r.联系电话,
                headTeacher=r.班主任,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

