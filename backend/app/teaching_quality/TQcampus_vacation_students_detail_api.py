"""
教学质量模块 - 神殿教化司寒暑假学生明细表（按月保存明细行）API
前缀：/api/v1/teaching-quality
GET  /campus-vacation-students-detail?campus=..&year=YYYY&month=MM
POST /campus-vacation-students-detail { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_vacation_students_detail_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_vacation_students_detail_db import (
    init_vacation_students_detail_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    studentName: Optional[str] = None
    gender: Optional[str] = None
    originalClass: Optional[str] = None
    originalHeadTeacher: Optional[str] = None
    enrollDate: Optional[str] = None
    firstLeaveDate: Optional[str] = None
    contactPhone: Optional[str] = None
    secondPlannedReturnDate: Optional[str] = None
    secondActualReturnDate: Optional[str] = None
    secondLeaveDate: Optional[str] = None
    secondHeadTeacher: Optional[str] = None
    thirdPlannedReturnDate: Optional[str] = None
    thirdActualReturnDate: Optional[str] = None
    thirdLeaveDate: Optional[str] = None
    thirdHeadTeacher: Optional[str] = None
    enrollAge: Optional[str] = None
    idCard: Optional[str] = None
    consultant: Optional[str] = None
    receivableTuition: Optional[int] = None
    paidTuition: Optional[int] = None
    reportedMajor: Optional[str] = None
    educationSystem: Optional[str] = None
    hasRegistrationCommitment: Optional[str] = None
    registrationCommitmentDetails: Optional[str] = None
    hasRegistered: Optional[str] = None
    registeredSchool: Optional[str] = None
    completedCoursesInfo: Optional[str] = None
    completedCoursesNames: Optional[str] = None
    remainingCoursesInfo: Optional[str] = None
    vacationDescription: Optional[str] = None
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


@router.get("/campus-vacation-students-detail", response_model=ListOutput, summary="获取寒暑假学生明细（按月）")
def get_vacation_students_detail(
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
                studentName=r.学生姓名,
                gender=r.性别,
                originalClass=r.原班级,
                originalHeadTeacher=r.原班主任,
                enrollDate=r.入学时间,
                firstLeaveDate=r.第一次离校时间,
                contactPhone=r.联系电话,
                secondPlannedReturnDate=r.第二次应复学时间,
                secondActualReturnDate=r.第二次实际复学时间,
                secondLeaveDate=r.第二次离校时间,
                secondHeadTeacher=r.第二次班主任,
                thirdPlannedReturnDate=r.第三次应复学时间,
                thirdActualReturnDate=r.第三次实际复学时间,
                thirdLeaveDate=r.第三次离校时间,
                thirdHeadTeacher=r.第三次班主任,
                enrollAge=r.入学年龄,
                idCard=r.身份证号,
                consultant=r.咨询师,
                receivableTuition=r.应收学费,
                paidTuition=r.已收学费,
                reportedMajor=r.所报专业,
                educationSystem=r.学制,
                hasRegistrationCommitment=r.是否承诺注册学历,
                registrationCommitmentDetails=r.承诺注册学历性质级别名称,
                hasRegistered=r.是否已注册中专大专,
                registeredSchool=r.所注册学校,
                completedCoursesInfo=r.已上课时数周期时长,
                completedCoursesNames=r.所学过的课程名称,
                remainingCoursesInfo=r.剩余没学的课程名称及剩余课时数,
                vacationDescription=r.学生寒暑假情况说明,
                studentParentThoughts=r.目前学生和家长的想法,
                nextWorkPlan=r.下一步对他的工作计划,
                enrollmentAgreementStatus=r.入学协议签署情况,
                employmentWaiverStatement=r.放弃就业声明,
                remarks=r.备注,
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.post("/campus-vacation-students-detail", response_model=ListOutput, summary="保存寒暑假学生明细（覆盖写入按月）")
def save_vacation_students_detail(payload: SavePayload, db: Session = Depends(get_db)):
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
                studentName=r.学生姓名,
                gender=r.性别,
                originalClass=r.原班级,
                originalHeadTeacher=r.原班主任,
                enrollDate=r.入学时间,
                firstLeaveDate=r.第一次离校时间,
                contactPhone=r.联系电话,
                secondPlannedReturnDate=r.第二次应复学时间,
                secondActualReturnDate=r.第二次实际复学时间,
                secondLeaveDate=r.第二次离校时间,
                secondHeadTeacher=r.第二次班主任,
                thirdPlannedReturnDate=r.第三次应复学时间,
                thirdActualReturnDate=r.第三次实际复学时间,
                thirdLeaveDate=r.第三次离校时间,
                thirdHeadTeacher=r.第三次班主任,
                enrollAge=r.入学年龄,
                idCard=r.身份证号,
                consultant=r.咨询师,
                receivableTuition=r.应收学费,
                paidTuition=r.已收学费,
                reportedMajor=r.所报专业,
                educationSystem=r.学制,
                hasRegistrationCommitment=r.是否承诺注册学历,
                registrationCommitmentDetails=r.承诺注册学历性质级别名称,
                hasRegistered=r.是否已注册中专大专,
                registeredSchool=r.所注册学校,
                completedCoursesInfo=r.已上课时数周期时长,
                completedCoursesNames=r.所学过的课程名称,
                remainingCoursesInfo=r.剩余没学的课程名称及剩余课时数,
                vacationDescription=r.学生寒暑假情况说明,
                studentParentThoughts=r.目前学生和家长的想法,
                nextWorkPlan=r.下一步对他的工作计划,
                enrollmentAgreementStatus=r.入学协议签署情况,
                employmentWaiverStatement=r.放弃就业声明,
                remarks=r.备注,
            )
        )
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)

