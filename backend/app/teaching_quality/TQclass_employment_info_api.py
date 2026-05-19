"""
教学质量模块 - QT班就业信息表 API
前缀：/api/v1/teaching-quality
GET  /qt-class-employment-info?campus=..&year=YYYY&clazz=班级名
POST /qt-class-employment-info { 神殿名称, 年份, 班级名称, 行列表 }
POST /qt-class-employment-info/upload 上传Excel文件并自动解析
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQ_class_employment_info_db import (
    QT班就业信息表,
    _normalize_campus_name,
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQ_class_employment_info_db import (
    init_qt_class_employment_tables as init_tables,
)
from app.teaching_quality.TQclass_file_record_db import (
    fetch_class_file_rows,
    init_class_file_tables,
    班级档案表,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: Optional[int] = None
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    idCard: Optional[str] = None
    reportedMajor: Optional[str] = None
    education: Optional[str] = None
    major: Optional[str] = None
    graduateSchool: Optional[str] = None
    highestDegreeCert: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    graduationDate: Optional[str] = None  # 毕业时间
    entryDate: Optional[str] = None
    employmentRegion: Optional[str] = None
    employmentCompany: Optional[str] = None
    employmentPosition: Optional[str] = None
    probationarySalary: Optional[int] = None
    regularSalary: Optional[int] = None
    followUpStatus: Optional[str] = None
    followUpAssessmentSalary: Optional[int] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    班级名称: str
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    班级名称: str
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化 QT班就业信息表失败: {e}")


@router.get(
    "/qt-class-employment-info",
    response_model=ListOutput,
    summary="获取 QT班就业信息表（按班级）",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    clazz: str = Query(..., alias="clazz"),
    db: Session = Depends(get_db),
):
    init_tables()
    employment_rows: list[QT班就业信息表] = fetch_rows(
        db,
        神殿名称=campus,
        年份=year,
        班级名称=clazz,
    )

    # 若该班本年度尚未有就业信息，则从"班级档案表"拉取学生信息做一次性初始化写入
    if not employment_rows:
        try:
            init_class_file_tables()
            # 兼容"盛邦/主神殿"写法
            variants = {str(campus).strip()}
            if str(campus).endswith("神殿"):
                variants.add(str(campus)[:-2])
            else:
                variants.add(str(campus) + "神殿")

            class_file_rows: list[班级档案表] = []
            for cp in variants:
                class_file_rows = fetch_class_file_rows(db, 神殿名称=cp, 班级名称=clazz)
                if class_file_rows:
                    break

            if class_file_rows:
                mapped: list[dict[str, object | None]] = []
                serial_num = 1
                for class_file_row in class_file_rows:
                    # 获取学员状态和审批无需就业状态
                    student_status = str(class_file_row.学员状态 or "").strip()
                    employment_approval_status = str(class_file_row.审批无需就业 or "").strip()
                    student_name = str(class_file_row.姓名 or "").strip()

                    # 筛选条件：
                    # 1. 排除审批无需就业为"无需就业"的学生
                    # 2. 排除学员状态为"休学"、"退学"、"退费"的学生
                    if not student_name:
                        continue
                    if employment_approval_status == "无需就业":
                        continue
                    if student_status in ["休学", "退学", "退费"]:
                        continue

                    # 年龄优先使用"毕业年龄"，没有则用"入学年龄"，否则空
                    try:
                        age_text = class_file_row.毕业年龄 or class_file_row.入学年龄 or "0"
                        age_val = int(age_text) or None
                    except (ValueError, TypeError):
                        age_val = None
                    mapped.append(
                        {
                            "serialNumber": serial_num,
                            "name": student_name,
                            "gender": class_file_row.性别,
                            "idCard": class_file_row.身份证号,
                            "age": age_val,
                            "reportedMajor": class_file_row.所报专业,
                            "education": class_file_row.学历,
                            "major": class_file_row.过往专业,
                            "graduateSchool": class_file_row.毕业学校,
                            "highestDegreeCert": class_file_row.最高学历及性质,
                            "phone": class_file_row.联系电话,
                            "address": class_file_row.通信地址,
                            "graduationDate": class_file_row.毕业时间,
                            # 就业相关初始为空，由班主任/就业老师后续维护
                            "entryDate": None,
                            "employmentRegion": None,
                            "employmentCompany": None,
                            "employmentPosition": None,
                            "probationarySalary": None,
                            "regularSalary": None,
                            "followUpStatus": None,
                            "followUpAssessmentSalary": None,
                        }
                    )
                    serial_num += 1
                replace_rows(
                    db,
                    神殿名称=campus,
                    年份=year,
                    班级名称=clazz,
                    行列表=mapped,
                )
                db.commit()
                employment_rows = fetch_rows(db, 神殿名称=campus, 年份=year, 班级名称=clazz)
        except Exception as _e:
            # 初始化失败不影响页面，返回空模板由前端编辑
            pass

    # 若已存在数据但身份证号或年龄缺失，可尝试用班级档案表进行补全一次（仅补全空字段）
    if employment_rows and any(
        employment_row.身份证号 in (None, "") or employment_row.年龄 in (None, 0)
        for employment_row in employment_rows
    ):
        try:
            init_class_file_tables()
            class_file_rows = fetch_class_file_rows(db, 神殿名称=campus, 班级名称=clazz)
            class_file_map = {
                class_file_row.姓名: class_file_row
                for class_file_row in class_file_rows
            }
            updated = False
            for employment_row in employment_rows:
                if employment_row.身份证号 in (None, "") or employment_row.年龄 in (None, 0):
                    matched_class_file_row = class_file_map.get(employment_row.姓名 or "")
                    if matched_class_file_row is not None:
                        if employment_row.身份证号 in (None, ""):
                            employment_row.身份证号 = matched_class_file_row.身份证号
                            updated = True
                        if employment_row.年龄 in (None, 0):
                            try:
                                age_text = (
                                    matched_class_file_row.毕业年龄
                                    or matched_class_file_row.入学年龄
                                )
                                if age_text:
                                    employment_row.年龄 = int(age_text)
                                    updated = True
                            except (TypeError, ValueError):
                                pass
            if updated:
                db.commit()
        except Exception:
            pass

    out_rows: List[Row] = []
    for employment_row in employment_rows:
        out_rows.append(
            Row(
                serialNumber=employment_row.序号,
                name=employment_row.姓名,
                gender=employment_row.性别,
                idCard=employment_row.身份证号,
                age=employment_row.年龄,
                reportedMajor=employment_row.所报专业,
                education=employment_row.学历,
                major=employment_row.专业,
                graduateSchool=employment_row.毕业学校,
                highestDegreeCert=employment_row.最高学历证书及性质,
                phone=employment_row.联系电话,
                address=employment_row.通信地址,
                graduationDate=employment_row.毕业时间,
                entryDate=employment_row.入职时间,
                employmentRegion=employment_row.就业地区,
                employmentCompany=employment_row.就业单位,
                employmentPosition=employment_row.就业岗位,
                probationarySalary=employment_row.试用期薪资,
                regularSalary=employment_row.转正薪资,
                followUpStatus=employment_row.回访情况,
                followUpAssessmentSalary=employment_row.回访考核薪资,
            )
        )
    # 返回时使用标准化的神殿名称
    normalized_campus = _normalize_campus_name(campus)
    return ListOutput(神殿名称=normalized_campus, 年份=year, 班级名称=clazz, 行列表=out_rows)


@router.post(
    "/qt-class-employment-info",
    response_model=ListOutput,
    summary="保存 QT班就业信息表（按班级覆盖写入）",
)
def save_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        班级名称=payload.班级名称,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    employment_rows: list[QT班就业信息表] = fetch_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        班级名称=payload.班级名称,
    )
    out_rows: List[Row] = []
    for employment_row in employment_rows:
        out_rows.append(
            Row(
                serialNumber=employment_row.序号,
                name=employment_row.姓名,
                gender=employment_row.性别,
                idCard=employment_row.身份证号,
                age=employment_row.年龄,
                reportedMajor=employment_row.所报专业,
                education=employment_row.学历,
                major=employment_row.专业,
                graduateSchool=employment_row.毕业学校,
                highestDegreeCert=employment_row.最高学历证书及性质,
                phone=employment_row.联系电话,
                address=employment_row.通信地址,
                graduationDate=employment_row.毕业时间,
                entryDate=employment_row.入职时间,
                employmentRegion=employment_row.就业地区,
                employmentCompany=employment_row.就业单位,
                employmentPosition=employment_row.就业岗位,
                probationarySalary=employment_row.试用期薪资,
                regularSalary=employment_row.转正薪资,
                followUpStatus=employment_row.回访情况,
                followUpAssessmentSalary=employment_row.回访考核薪资,
            )
        )
    # 返回时使用标准化的神殿名称
    normalized_campus = _normalize_campus_name(payload.神殿名称)
    return ListOutput(神殿名称=normalized_campus, 年份=payload.年份, 班级名称=payload.班级名称, 行列表=out_rows)


# 注意：/qt-class-employment-summary 路由已由 TQ_class_employment_summary_api.py 提供
# 此文件仅提供 /qt-class-employment-info 路由（班级就业信息明细表）
# 避免路由重复定义导致冲突
