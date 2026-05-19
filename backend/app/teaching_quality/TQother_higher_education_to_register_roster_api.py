"""
教学质量模块 - 其他高等教育学籍需注册花名册 API（按神殿全量）
前缀：/api/v1/teaching-quality
GET  /other-higher-education-to-register-roster?campus=..
POST /other-higher-education-to-register-roster  { 神殿名称, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQother_higher_education_to_register_roster_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQother_higher_education_to_register_roster_db import (
    init_other_higher_education_to_register_roster_tables as init_tables,
)

router = APIRouter()


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化其他高等教育学籍需注册花名册失败: {e}")


class Row(BaseModel):
    pendingRegistrationTime: Optional[str] = None
    studentName: Optional[str] = None
    gender: Optional[str] = None
    idCardNumber: Optional[str] = None
    major: Optional[str] = None
    educationSystem: Optional[str] = None
    className: Optional[str] = None
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
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    行列表: List[Row] = Field(default_factory=list)


@router.get("/other-higher-education-to-register-roster", response_model=ListOutput, summary="获取其他高等教育学籍需注册花名册（按神殿）")
def get_roster(
    campus: str = Query(..., alias="campus"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                pendingRegistrationTime=r.需注册时间,
                studentName=r.姓名,
                gender=r.性别,
                idCardNumber=r.身份证号,
                major=r.专业,
                educationSystem=r.学制,
                className=r.班级,
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

    return ListOutput(神殿名称=campus, 行列表=out_rows)


@router.post("/other-higher-education-to-register-roster", response_model=ListOutput, summary="保存其他高等教育学籍需注册花名册（按神殿覆盖写入）")
def save_roster(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    rows = fetch_rows(db, 神殿名称=payload.神殿名称)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                pendingRegistrationTime=r.需注册时间,
                studentName=r.姓名,
                gender=r.性别,
                idCardNumber=r.身份证号,
                major=r.专业,
                educationSystem=r.学制,
                className=r.班级,
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

    return ListOutput(神殿名称=payload.神殿名称, 行列表=out_rows)

