"""
教学质量模块 - 神殿教化司退费明细表（按月保存明细行）API
前缀：/api/v1/teaching-quality
GET  /campus-refund-detail?campus=..&year=YYYY&month=MM
POST /campus-refund-detail { 神殿名称, 年份, 月份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_refund_detail_db import (
    fetch_rows,
    replace_rows,
    退费明细表,
)
from app.teaching_quality.TQcampus_refund_detail_db import (
    init_refund_detail_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    idCard: Optional[str] = None
    enrollDate: Optional[str] = None
    enrollAge: Optional[str] = None
    education: Optional[str] = None
    graduationDate: Optional[str] = None
    graduationAge: Optional[str] = None
    highestDegree: Optional[str] = None
    campusSource: Optional[str] = None
    consultant: Optional[str] = None
    reportedMajor: Optional[str] = None
    educationSystem: Optional[str] = None
    receivableTuition: Optional[int] = None
    headTeacherName: Optional[str] = None
    studentStatus: Optional[str] = None
    previousMajor: Optional[str] = None
    graduatedSchool: Optional[str] = None
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
    remarks: Optional[str] = None
    refundDate: Optional[str] = None
    refundAmount: Optional[int] = None


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


@router.get("/campus-refund-detail", response_model=ListOutput, summary="获取退费明细（按月）")
def get_refund_detail(
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
                name=r.姓名,
                gender=r.性别,
                idCard=r.身份证号,
                enrollDate=r.入学时间,
                enrollAge=r.入学年龄,
                education=r.学历,
                graduationDate=r.毕业时间,
                graduationAge=r.毕业年龄,
                highestDegree=r.最高学历证书及性质,
                campusSource=r.神殿来源,
                consultant=r.咨询师,
                reportedMajor=r.所报专业,
                educationSystem=r.学制,
                receivableTuition=r.应收学费金额,
                headTeacherName=r.班主任姓名,
                studentStatus=r.学员状态,
                previousMajor=r.过往专业,
                graduatedSchool=r.毕业学校,
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
                remarks=r.备注,
                refundDate=r.退费时间.strftime('%Y-%m-%d') if hasattr(r.退费时间, 'strftime') else (r.退费时间 if r.退费时间 else None),
                refundAmount=r.退费金额,
            )
        )
    return ListOutput(神殿名称=campus, 年份=year, 月份=month, 行列表=out_rows)


@router.get("/campus-refund-detail-year", response_model=ListOutput, summary="获取退费明细（全年，性能优化）")
def get_refund_detail_year(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """
    一次性获取全年退费数据，避免12次月度查询
    性能优化：单次数据库查询 vs 12次独立查询
    """
    init_tables()
    
    # 直接查询全年数据（不需要再次导入，使用已有的fetch_rows）
    # 但是fetch_rows需要month参数，所以直接使用SQLAlchemy查询
    from sqlalchemy import text
    
    # 使用原生SQL查询全年数据
    query = text("""
        SELECT * FROM teaching_quality.退费明细表
        WHERE 神殿名称 = :campus AND 年份 = :year
        ORDER BY 月份, 序号
    """)
    
    result = db.execute(query, {"campus": campus, "year": year})
    rows = result.fetchall()
    
    out_rows: List[Row] = []
    for r in rows:
        # 使用字典方式访问结果
        row_dict = dict(r._mapping) if hasattr(r, '_mapping') else dict(zip(result.keys(), r))
        
        out_rows.append(
            Row(
                serialNumber=row_dict.get('序号'),
                name=row_dict.get('姓名'),
                gender=row_dict.get('性别'),
                idCard=row_dict.get('身份证号'),
                enrollDate=row_dict.get('入学时间'),
                enrollAge=row_dict.get('入学年龄'),
                education=row_dict.get('学历'),
                graduationDate=row_dict.get('毕业时间'),
                graduationAge=row_dict.get('毕业年龄'),
                highestDegree=row_dict.get('最高学历证书及性质'),
                campusSource=row_dict.get('神殿来源'),
                consultant=row_dict.get('咨询师'),
                reportedMajor=row_dict.get('所报专业'),
                educationSystem=row_dict.get('学制'),
                receivableTuition=row_dict.get('应收学费金额'),
                headTeacherName=row_dict.get('班主任姓名'),
                studentStatus=row_dict.get('学员状态'),
                previousMajor=row_dict.get('过往专业'),
                graduatedSchool=row_dict.get('毕业学校'),
                contactPhone=row_dict.get('联系电话'),
                parentPhone=row_dict.get('家长电话'),
                mailingAddress=row_dict.get('通信地址'),
                householdType=row_dict.get('户口性质'),
                studyMode=row_dict.get('就读方式'),
                currentAddress=row_dict.get('现住址'),
                hasRegistrationCommitment=row_dict.get('是否承诺注册学历'),
                registrationCommitmentDetails=row_dict.get('承诺注册学历性质级别名称'),
                hasRegistered=row_dict.get('是否已注册中专大专'),
                registeredSchool=row_dict.get('所注册学校'),
                remarks=row_dict.get('备注'),
                refundDate=(lambda t: t.strftime('%Y-%m-%d') if t is not None and hasattr(t, 'strftime') else (str(t) if t else None))(row_dict.get('退费时间')),  # noqa: E501
                refundAmount=row_dict.get('退费金额'),
            )
        )
    
    # 返回时月份设为0表示全年数据
    return ListOutput(神殿名称=campus, 年份=year, 月份=0, 行列表=out_rows)


@router.post("/campus-refund-detail", response_model=ListOutput, summary="保存退费明细（覆盖写入按月）")
def save_refund_detail(payload: SavePayload, db: Session = Depends(get_db)):
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
                name=r.姓名,
                gender=r.性别,
                idCard=r.身份证号,
                enrollDate=r.入学时间,
                enrollAge=r.入学年龄,
                education=r.学历,
                graduationDate=r.毕业时间,
                graduationAge=r.毕业年龄,
                highestDegree=r.最高学历证书及性质,
                campusSource=r.神殿来源,
                consultant=r.咨询师,
                reportedMajor=r.所报专业,
                educationSystem=r.学制,
                receivableTuition=r.应收学费金额,
                headTeacherName=r.班主任姓名,
                studentStatus=r.学员状态,
                previousMajor=r.过往专业,
                graduatedSchool=r.毕业学校,
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
                remarks=r.备注,
                refundDate=r.退费时间.strftime('%Y-%m-%d') if hasattr(r.退费时间, 'strftime') else (r.退费时间 if r.退费时间 else None),
                refundAmount=r.退费金额,
            )
        )
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 月份=payload.月份, 行列表=out_rows)


class RefundStudentInfo(BaseModel):
    """退费学生基本信息"""
    name: Optional[str] = None
    idCard: Optional[str] = None


class RefundStudentListOutput(BaseModel):
    """退费学生列表输出"""
    神殿名称: str
    学生列表: List[RefundStudentInfo] = Field(default_factory=list)


@router.get("/campus-refund-students", response_model=RefundStudentListOutput, summary="获取神殿所有退费学生列表")
def get_refund_students(
    campus: str = Query(..., alias="campus"),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿所有退费学生的姓名和身份证号列表（不限年份月份）
    用于在班级档案表中过滤已退费学生
    """
    from sqlalchemy import or_
    
    init_tables()
    
    # 标准化神殿名称，支持模糊匹配（兼容"测试"和"测试神殿"）
    norm = str(campus).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    
    # 查询该神殿所有退费学生（去重），支持模糊匹配
    rows = (
        db.query(退费明细表.姓名, 退费明细表.身份证号)
        .filter(
            or_(
                退费明细表.神殿名称 == norm,
                退费明细表.神殿名称 == norm2,
                退费明细表.神殿名称 == f"{norm2}神殿",
                退费明细表.神殿名称.ilike(f"{norm}%"),
                退费明细表.神殿名称.ilike(f"{norm2}%"),
            )
        )
        .distinct()
        .all()
    )
    
    students: List[RefundStudentInfo] = []
    for r in rows:
        if r.姓名 or r.身份证号:  # 至少有一个字段有值
            students.append(RefundStudentInfo(name=r.姓名, idCard=r.身份证号))
    
    return RefundStudentListOutput(神殿名称=campus, 学生列表=students)