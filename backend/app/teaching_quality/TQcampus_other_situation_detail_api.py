"""
教学质量模块 - 神殿教化司其他情况明细表（按月保存明细行）API
前缀：/api/v1/teaching-quality
GET  /campus-other-situation-detail?campus=..&year=YYYY&month=MM
POST /campus-other-situation-detail { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_other_situation_detail_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_other_situation_detail_db import (
    init_other_situation_detail_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    studentName: Optional[str] = None
    gender: Optional[str] = None
    enrollDate: Optional[str] = None
    enrollAge: Optional[str] = None
    campusSource: Optional[str] = None
    consultant: Optional[str] = None
    receivableTuition: Optional[int] = None
    idCard: Optional[str] = None
    reportedMajor: Optional[str] = None
    educationSystem: Optional[str] = None
    headTeacherName: Optional[str] = None
    studentStatus: Optional[str] = None
    education: Optional[str] = None
    major: Optional[str] = None
    graduatedSchool: Optional[str] = None
    highestDegree: Optional[str] = None
    contactPhone: Optional[str] = None
    parentPhone: Optional[str] = None
    mailingAddress: Optional[str] = None
    householdType: Optional[str] = None
    studyMode: Optional[str] = None
    currentAddress: Optional[str] = None
    hasRegistrationCommitment: Optional[str] = None
    registrationCommitmentDetails: Optional[str] = None
    hasRegistered: Optional[str] = None
    registeredSchool: Optional[str] = None
    completedCoursesInfo: Optional[str] = None
    completedCoursesNames: Optional[str] = None
    remainingCoursesInfo: Optional[str] = None
    situationDescription: Optional[str] = None
    studentParentThoughts: Optional[str] = None
    nextWorkPlan: Optional[str] = None
    enrollmentAgreementStatus: Optional[str] = None
    employmentWaiverStatement: Optional[str] = None
    remarks: Optional[str] = None


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


@router.get("/campus-other-situation-detail", response_model=ListOutput, summary="获取其他情况明细（按月）")
def get_other_situation_detail(
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
                enrollDate=r.入学时间,
                enrollAge=r.入学年龄,
                campusSource=r.神殿来源,
                consultant=r.咨询师,
                receivableTuition=r.应收学费金额,
                idCard=r.身份证号,
                reportedMajor=r.所报专业,
                educationSystem=r.学制,
                headTeacherName=r.班主任姓名,
                studentStatus=r.学员状态,
                education=r.学历,
                major=r.专业,
                graduatedSchool=r.毕业学校,
                highestDegree=r.最高学历证书及性质,
                contactPhone=r.联系电话,
                parentPhone=r.家长电话,
                mailingAddress=r.通信地址,
                householdType=r.户口性质,
                studyMode=r.就读方式,
                currentAddress=r.现住址,
                hasRegistrationCommitment=r.是否承诺注册学历,
                registrationCommitmentDetails=r.承诺注册学历性质级别名称,
                hasRegistered=r.是否已注册中专大专,
                registeredSchool=r.所注册学校,
                completedCoursesInfo=r.已上课时数周期时长,
                completedCoursesNames=r.所学过的课程名称,
                remainingCoursesInfo=r.剩余没学的课程名称及剩余课时数,
                situationDescription=r.情况说明,
                studentParentThoughts=r.目前学生和家长的想法,
                nextWorkPlan=r.下一步对他的工作计划,
                enrollmentAgreementStatus=r.入学协议签署情况,
                employmentWaiverStatement=r.放弃就业声明,
                remarks=r.备注,
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post("/campus-other-situation-detail", response_model=ListOutput, summary="保存其他情况明细（覆盖写入按月）")
def save_other_situation_detail(payload: SavePayload, db: Session = Depends(get_db)):
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
                enrollDate=r.入学时间,
                enrollAge=r.入学年龄,
                campusSource=r.神殿来源,
                consultant=r.咨询师,
                receivableTuition=r.应收学费金额,
                idCard=r.身份证号,
                reportedMajor=r.所报专业,
                educationSystem=r.学制,
                headTeacherName=r.班主任姓名,
                studentStatus=r.学员状态,
                education=r.学历,
                major=r.专业,
                graduatedSchool=r.毕业学校,
                highestDegree=r.最高学历证书及性质,
                contactPhone=r.联系电话,
                parentPhone=r.家长电话,
                mailingAddress=r.通信地址,
                householdType=r.户口性质,
                studyMode=r.就读方式,
                currentAddress=r.现住址,
                hasRegistrationCommitment=r.是否承诺注册学历,
                registrationCommitmentDetails=r.承诺注册学历性质级别名称,
                hasRegistered=r.是否已注册中专大专,
                registeredSchool=r.所注册学校,
                completedCoursesInfo=r.已上课时数周期时长,
                completedCoursesNames=r.所学过的课程名称,
                remainingCoursesInfo=r.剩余没学的课程名称及剩余课时数,
                situationDescription=r.情况说明,
                studentParentThoughts=r.目前学生和家长的想法,
                nextWorkPlan=r.下一步对他的工作计划,
                enrollmentAgreementStatus=r.入学协议签署情况,
                employmentWaiverStatement=r.放弃就业声明,
                remarks=r.备注,
            )
        )
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

