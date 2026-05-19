"""
教学质量模块 - 班级档案 API
GET  /api/v1/teaching-quality/class-file?campus=盛邦&class=T132
POST /api/v1/teaching-quality/class-file  { 神殿名称, 班级名称, 行列表: [...] }  覆盖保存
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQclass_file_record_db import (
    fetch_class_file_rows as fetch_rows,
)
from app.teaching_quality.TQclass_file_record_db import (
    init_class_file_tables as init_tables,
)
from app.teaching_quality.TQclass_file_record_db import (
    replace_class_file_rows as replace_rows,
)

router = APIRouter()

def _startup_init():
    # 确保启动时即创建 teaching_quality.班级档案表
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化班级档案表失败: {e}")


class FormerHeadTeacher(BaseModel):
    """往任班主任信息"""
    name: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None


class Row(BaseModel):
    key: Optional[str] = None
    serialNumber: int
    name: Optional[str] = None
    gender: Optional[str] = None
    idCard: Optional[str] = None
    enrollmentDate: Optional[str] = None
    enrollmentAge: Optional[str] = None
    education: Optional[str] = None
    graduationDate: Optional[str] = None
    graduationAge: Optional[str] = None
    highestEducationAndType: Optional[str] = None
    campusSource: Optional[str] = None
    enrollmentCampus: Optional[str] = None
    consultant: Optional[str] = None
    reportedMajor: Optional[str] = None
    schoolingLength: Optional[str] = None
    openingDate: Optional[str] = None
    tuitionAmount: Optional[str] = None
    headTeacher: Optional[str] = None
    formerHeadTeachers: Optional[List[FormerHeadTeacher]] = None
    studentStatus: Optional[str] = None
    previousMajor: Optional[str] = None
    graduateSchool: Optional[str] = None
    phone: Optional[str] = None
    parentPhone: Optional[str] = None
    address: Optional[str] = None
    householdType: Optional[str] = None
    studyMode: Optional[str] = None
    currentAddress: Optional[str] = None
    promisedRegisterEducation: Optional[str] = None
    promisedEducationNature: Optional[str] = None
    promisedEducationLevel: Optional[str] = None
    educationSchoolName: Optional[str] = None
    registeredSecondaryOrCollege: Optional[str] = None
    registeredSchool: Optional[str] = None
    remark: Optional[str] = None
    employmentApprovalStatus: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    班级名称: str
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    班级名称: str
    行列表: List[Row] = Field(default_factory=list)

# 解决 Pydantic v2 在动态加载模块下的前向引用问题
try:
    # Pydantic v2: ensure forward refs/types are resolved especially when this module
    # is loaded dynamically via importlib (FastAPI generates OpenAPI using TypeAdapter).
    FormerHeadTeacher.model_rebuild()
    Row.model_rebuild()
    ListOutput.model_rebuild()
    SavePayload.model_rebuild()
except Exception:
    pass

def _row_to_dict(r) -> dict:
    """将数据库行转换为字典，避免重复代码"""
    # 处理往任班主任字段，兼容旧格式（字符串列表）和新格式（字典列表）
    former_teachers = []
    if r.往任班主任:
        for item in r.往任班主任:
            if isinstance(item, str):
                # 旧格式：字符串列表，转换为新格式
                former_teachers.append({
                    "name": item,
                    "startDate": "",
                    "endDate": ""
                })
            elif isinstance(item, dict):
                # 新格式：字典列表
                former_teachers.append({
                    "name": item.get("name", ""),
                    "startDate": item.get("startDate", ""),
                    "endDate": item.get("endDate", "")
                })
    
    return {
        "serialNumber": r.序号,
        "name": r.姓名,
        "gender": r.性别,
        "idCard": r.身份证号,
        "enrollmentDate": r.入学时间.isoformat() if r.入学时间 else None,
        "enrollmentAge": r.入学年龄,
        "education": r.学历,
        "graduationDate": r.毕业时间.isoformat() if r.毕业时间 else None,
        "graduationAge": r.毕业年龄,
        "highestEducationAndType": r.最高学历及性质,
        "campusSource": r.神殿来源,
        "enrollmentCampus": r.招生神殿,
        "consultant": r.咨询师,
        "reportedMajor": r.所报专业,
        "schoolingLength": r.学制,
        "openingDate": r.开班时间.isoformat() if r.开班时间 else None,
        "tuitionAmount": r.应收学费金额,
        "headTeacher": r.班主任姓名,
        "formerHeadTeachers": former_teachers,
        "studentStatus": r.学员状态,
        "previousMajor": r.过往专业,
        "graduateSchool": r.毕业学校,
        "phone": r.联系电话,
        "parentPhone": r.家长电话,
        "address": r.通信地址,
        "householdType": r.户口性质,
        "studyMode": r.就读方式,
        "currentAddress": r.现住址,
        "promisedRegisterEducation": r.是否承诺注册学历,
        "promisedEducationNature": r.承诺注册学历性质,
        "promisedEducationLevel": r.承诺注册学历级别,
        "educationSchoolName": r.学历学校名称,
        "registeredSecondaryOrCollege": r.是否已注册中专或大专,
        "registeredSchool": r.所注册学校,
        "remark": r.备注,
        "employmentApprovalStatus": r.审批无需就业,
    }

@router.get("/class-file", response_model=ListOutput, summary="获取班级档案（按神殿+班级）")
def get_class_file(
    campus: str = Query(..., alias="campus"),
    klass: str = Query(..., alias="class"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 班级名称=klass)
    data = [Row(**_row_to_dict(r)) for r in rows]
    return ListOutput(神殿名称=campus, 班级名称=klass, 行列表=data)


@router.post("/class-file", response_model=ListOutput, summary="保存班级档案（覆盖写入）")
def save_class_file(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        班级名称=payload.班级名称,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    # 直接返回已保存的数据，避免回读数据库
    data = [Row(**row.model_dump()) for row in payload.行列表]
    return ListOutput(神殿名称=payload.神殿名称, 班级名称=payload.班级名称, 行列表=data)


class StudentSearchResult(BaseModel):
    """学生搜索结果，用于自动补全"""
    name: Optional[str] = None
    gender: Optional[str] = None
    idCard: Optional[str] = None
    enrollmentDate: Optional[str] = None
    enrollmentAge: Optional[str] = None
    education: Optional[str] = None
    graduationDate: Optional[str] = None
    graduationAge: Optional[str] = None
    highestEducationAndType: Optional[str] = None
    campusSource: Optional[str] = None
    enrollmentCampus: Optional[str] = None
    consultant: Optional[str] = None
    reportedMajor: Optional[str] = None
    schoolingLength: Optional[str] = None
    tuitionAmount: Optional[str] = None
    headTeacher: Optional[str] = None
    formerHeadTeachers: Optional[List[FormerHeadTeacher]] = None
    studentStatus: Optional[str] = None
    previousMajor: Optional[str] = None
    graduateSchool: Optional[str] = None
    phone: Optional[str] = None
    parentPhone: Optional[str] = None
    address: Optional[str] = None
    householdType: Optional[str] = None
    studyMode: Optional[str] = None
    currentAddress: Optional[str] = None
    promisedRegisterEducation: Optional[str] = None
    promisedEducationNature: Optional[str] = None
    promisedEducationLevel: Optional[str] = None
    educationSchoolName: Optional[str] = None
    registeredSecondaryOrCollege: Optional[str] = None
    registeredSchool: Optional[str] = None
    remark: Optional[str] = None
    employmentApprovalStatus: Optional[str] = None
    # 额外信息
    className: Optional[str] = None
    campusName: Optional[str] = None


@router.get("/class-file/search-students", response_model=List[StudentSearchResult], summary="搜索班级档案中的学生（用于自动补全）")
def search_students(
    keyword: str = Query("", description="搜索关键词（姓名）"),
    campus: Optional[str] = Query(None, description="神殿名称过滤"),
    class_name: Optional[str] = Query(None, alias="class", description="班级名称过滤"),
    db: Session = Depends(get_db),
):
    """
    从班级档案表中搜索学生，返回匹配的学生列表。
    可用于退费明细表等页面的姓名自动补全功能。
    支持按班级名称过滤，用于获取指定班级的学生列表。
    """
    init_tables()
    
    # 动态加载数据库模块获取模型
    # 使用原始 SQL 查询，因为 ORM 模型在动态加载模块中
    from sqlalchemy import text
    
    # 构建查询
    base_query = """
        SELECT 
            姓名, 性别, 身份证号, 入学时间, 入学年龄, 学历, 毕业时间, 毕业年龄,
            最高学历及性质, 神殿来源, 咨询师, 所报专业, 学制, 应收学费金额,
            班主任姓名, 学员状态, 过往专业, 毕业学校, 联系电话, 家长电话,
            通信地址, 户口性质, 就读方式, 现住址, 是否承诺注册学历,
            承诺注册学历性质, 承诺注册学历级别, 学历学校名称,
            是否已注册中专或大专, 所注册学校, 备注, 审批无需就业,
            班级名称, 神殿名称
        FROM teaching_quality.班级档案表
        WHERE 姓名 IS NOT NULL AND 姓名 != ''
    """
    
    params = {}
    
    if keyword:
        base_query += " AND 姓名 LIKE :keyword"
        params["keyword"] = f"%{keyword}%"
    
    if campus:
        # 支持模糊匹配神殿名称
        normalized = campus.rstrip('神殿').strip()
        base_query += " AND (神殿名称 = :campus OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)"
        params["campus"] = campus
        params["normalized"] = normalized
        params["with_suffix"] = f"{normalized}神殿"
    
    if class_name:
        base_query += " AND 班级名称 = :class_name"
        params["class_name"] = class_name
    
    base_query += " ORDER BY 姓名 LIMIT 100"
    
    result = db.execute(text(base_query), params)
    rows = result.fetchall()
    
    students = []
    for r in rows:
        students.append(StudentSearchResult(
            name=r[0],
            gender=r[1],
            idCard=r[2],
            enrollmentDate=r[3].isoformat() if r[3] else None,
            enrollmentAge=r[4],
            education=r[5],
            graduationDate=r[6].isoformat() if r[6] else None,
            graduationAge=r[7],
            highestEducationAndType=r[8],
            campusSource=r[9],
            consultant=r[10],
            reportedMajor=r[11],
            schoolingLength=r[12],
            tuitionAmount=r[13],
            headTeacher=r[14],
            studentStatus=r[15],
            previousMajor=r[16],
            graduateSchool=r[17],
            phone=r[18],
            parentPhone=r[19],
            address=r[20],
            householdType=r[21],
            studyMode=r[22],
            currentAddress=r[23],
            promisedRegisterEducation=r[24],
            promisedEducationNature=r[25],
            promisedEducationLevel=r[26],
            educationSchoolName=r[27],
            registeredSecondaryOrCollege=r[28],
            registeredSchool=r[29],
            remark=r[30],
            employmentApprovalStatus=r[31] if len(r) > 31 else None,
            className=r[32] if len(r) > 32 else None,
            campusName=r[33] if len(r) > 33 else None,
        ))
    
    return students


class TransferStudentPayload(BaseModel):
    """转班请求参数"""
    studentName: str = Field(..., description="学员姓名")
    sourceCampus: str = Field(..., description="原神殿名称")
    sourceClass: str = Field(..., description="原班级名称")
    targetCampus: str = Field(..., description="目标神殿名称")
    targetClass: str = Field(..., description="目标班级名称")
    idCard: Optional[str] = Field(None, description="身份证号（可选，优先使用）")


class TransferStudentResponse(BaseModel):
    """转班响应"""
    success: bool
    message: str


# ---- Pydantic v2 / FastAPI OpenAPI fix (dynamic import) ----
# When this module is loaded via importlib (see backend/main.py load_teaching_quality_routers),
# FastAPI builds OpenAPI using Pydantic TypeAdapter. If any model in endpoint signatures
# isn't rebuilt, Pydantic may raise: "class-not-fully-defined".
# Rebuild here after all models are declared.
try:
    FormerHeadTeacher.model_rebuild()
    Row.model_rebuild()
    ListOutput.model_rebuild()
    SavePayload.model_rebuild()
    StudentSearchResult.model_rebuild()
    TransferStudentPayload.model_rebuild()
    TransferStudentResponse.model_rebuild()
except Exception:
    pass


@router.post("/class-file/transfer-student", response_model=TransferStudentResponse, summary="学员转班")
def transfer_student(
    payload: TransferStudentPayload,
    db: Session = Depends(get_db),
):
    """
    将学员从一个班级转到另一个班级。
    操作：修改班级档案表中该学员记录的班级名称和班级ID字段。
    """
    init_tables()
    
    # 导入需要的模型
    from sqlalchemy import text
    
    try:
        # 规范化神殿名称（去掉"神殿"后缀，用于更灵活的匹配）
        campus_normalized = payload.sourceCampus.rstrip('神殿').strip() if payload.sourceCampus else ''
        campus_with_suffix = f"{campus_normalized}神殿" if campus_normalized else payload.sourceCampus
        
        # 使用 LIKE 模式匹配神殿名称（处理前后空格等问题）
        campus_pattern = f"%{campus_normalized}%"
        
        print(f"[转班] 开始查找学生: {payload.studentName}, 身份证: {payload.idCard}, 神殿: {payload.sourceCampus}, 原班级: {payload.sourceClass}")
        print(f"[转班] 神殿名称变体: 原始={payload.sourceCampus}, 规范化={campus_normalized}, 带后缀={campus_with_suffix}, 模式={campus_pattern}")
        
        # 1. 查找学生记录（优先使用身份证号，如果没有则使用姓名；兼容神殿名称带/不带"神殿"后缀）
        # 首先尝试在原班级查找，如果找不到，则在同神殿其他班级查找（允许跨班级转班）
        student_row = None
        
        if payload.idCard and payload.idCard.strip():
            id_card_clean = payload.idCard.strip()
            print(f"[转班] 使用身份证号查找: {id_card_clean}")
            
            # 优先使用身份证号查找 - 先在任意班级查找（更宽松）
            # 使用 LIKE 进行模糊匹配，处理各种空格和格式问题
            find_query_any_class = text("""
                SELECT "记录ID", "班级ID", "班级名称", "神殿名称", "姓名", "身份证号", "学员状态"
                FROM teaching_quality."班级档案表"
                WHERE (TRIM("神殿名称") LIKE :campus_pattern
                       OR "神殿名称" LIKE :campus_pattern)
                AND (TRIM(COALESCE("身份证号", '')) = :id_card 
                     OR "身份证号" = :id_card
                     OR REPLACE(COALESCE("身份证号", ''), ' ', '') = :id_card
                     OR UPPER(TRIM(COALESCE("身份证号", ''))) = UPPER(:id_card))
                LIMIT 1
            """)
            
            result_any = db.execute(find_query_any_class, {
                "campus_pattern": campus_pattern,
                "id_card": id_card_clean,
            })
            student_row = result_any.fetchone()
            
            if student_row:
                print(f"[转班] 通过身份证号找到学生: {student_row[4]}, 班级: {student_row[2]}, 神殿: {student_row[3]}, 状态: {student_row[6]}")
            else:
                print("[转班] 通过身份证号未找到学生，尝试使用姓名查找")
        
        # 如果身份证号找不到，尝试使用姓名
        if not student_row:
            print(f"[转班] 使用姓名查找: {payload.studentName}")
            
            find_query_by_name = text("""
                SELECT "记录ID", "班级ID", "班级名称", "神殿名称", "姓名", "身份证号", "学员状态"
                FROM teaching_quality."班级档案表"
                WHERE (TRIM("神殿名称") LIKE :campus_pattern
                       OR "神殿名称" LIKE :campus_pattern)
                AND (TRIM(COALESCE("姓名", '')) = :student_name 
                     OR "姓名" = :student_name)
                LIMIT 1
            """)
            
            result_by_name = db.execute(find_query_by_name, {
                "campus_pattern": campus_pattern,
                "student_name": payload.studentName.strip(),
            })
            student_row = result_by_name.fetchone()
            
            if student_row:
                print(f"[转班] 通过姓名找到学生: {student_row[4]}, 班级: {student_row[2]}, 神殿: {student_row[3]}, 状态: {student_row[6]}")
        
        if not student_row:
            # 调试：列出该神殿所有学生
            debug_query = text("""
                SELECT "姓名", "身份证号", "班级名称", "神殿名称", "学员状态"
                FROM teaching_quality."班级档案表"
                WHERE (TRIM("神殿名称") LIKE :campus_pattern
                       OR "神殿名称" LIKE :campus_pattern)
                LIMIT 20
            """)
            debug_result = db.execute(debug_query, {
                "campus_pattern": campus_pattern,
            })
            debug_rows = debug_result.fetchall()
            print("[转班] 调试 - 该神殿前20条学生记录:")
            for dr in debug_rows:
                print(f"  - 姓名: {dr[0]}, 身份证: {dr[1]}, 班级: {dr[2]}, 神殿: {dr[3]}, 状态: {dr[4]}")
            
            search_by = f"身份证号：{payload.idCard}" if payload.idCard and payload.idCard.strip() else f"姓名：{payload.studentName}"
            return TransferStudentResponse(
                success=False,
                message=f"未找到学员（{search_by}，神殿：{payload.sourceCampus}）"
            )
        
        # 如果找到的学生不在原班级，更新原班级信息为实际所在的班级
        actual_class = student_row[2]  # 班级名称
        if actual_class != payload.sourceClass:
            print(f"[转班] 注意：学生 {payload.studentName} 实际在 {actual_class} 班，不在指定的 {payload.sourceClass} 班，将继续转班")
        
        student_id = student_row[0]
        
        # 2. 获取目标班级的班级ID（兼容神殿名称带/不带"神殿"后缀）
        target_campus_normalized = payload.targetCampus.rstrip('神殿').strip() if payload.targetCampus else ''
        target_campus_with_suffix = f"{target_campus_normalized}神殿" if target_campus_normalized else payload.targetCampus
        target_campus_variants = [v for v in {payload.targetCampus.strip() if payload.targetCampus else '', target_campus_normalized, target_campus_with_suffix} if v]
        
        find_target_class_query = text("""
            SELECT id FROM teaching_quality."班级列表"
            WHERE ("神殿" = :target_campus OR "神殿" = :target_campus_with_suffix OR "神殿" = :target_campus_normalized)
            AND "班级名称" = :target_class
            LIMIT 1
        """)
        
        target_class_result = db.execute(find_target_class_query, {
            "target_campus": payload.targetCampus,
            "target_campus_with_suffix": target_campus_with_suffix,
            "target_campus_normalized": target_campus_normalized,
            "target_class": payload.targetClass,
        })
        target_class_row = target_class_result.fetchone()
        
        # 如果班级列表中没找到，也允许转班（可能是新班级还没同步）
        target_class_id = target_class_row[0] if target_class_row else None
        
        # 2.1 选择一个“目标神殿名称”写入，优先沿用该班级档案表已存在的神殿写法（避免出现 测试 vs 测试神殿 两份数据）
        pick_target_campus_query = text("""
            SELECT "神殿名称"
            FROM teaching_quality."班级档案表"
            WHERE TRIM("神殿名称") = ANY(:campus_variants)
              AND "班级名称" = :target_class
            ORDER BY LENGTH(TRIM("神殿名称")) DESC
            LIMIT 1
        """)
        picked = db.execute(
            pick_target_campus_query,
            {"campus_variants": target_campus_variants, "target_class": payload.targetClass},
        ).fetchone()
        update_campus = (picked[0] if picked and picked[0] else payload.targetCampus) or target_campus_normalized or target_campus_with_suffix
        update_campus = update_campus.strip()

        # 3. 查找目标班级的最大序号，为转入学生分配新序号（跨神殿写法取并集）
        max_serial_query = text("""
            SELECT COALESCE(MAX("序号"), 0) 
            FROM teaching_quality."班级档案表"
            WHERE TRIM("神殿名称") = ANY(:campus_variants)
              AND "班级名称" = :target_class
        """)
        
        max_serial_result = db.execute(max_serial_query, {
            "campus_variants": target_campus_variants,
            "target_class": payload.targetClass,
        })
        max_serial = max_serial_result.scalar() or 0
        new_serial = max_serial + 1
        
        print(f"[转班] 目标班级 {payload.targetClass} 当前最大序号: {max_serial}, 新序号: {new_serial}")
        
        # 4. 更新学生记录的班级信息和序号
        print(f"[转班] 写入目标神殿名称: {update_campus}（variants={target_campus_variants}）")
        
        # 使用循环重试机制处理序号冲突
        max_retries = 5
        for retry in range(max_retries):
            try:
                # 检查当前学员状态，如果是"休学"则改为"复学"
                current_status_query = text("""
                    SELECT "学员状态" FROM teaching_quality."班级档案表"
                    WHERE "记录ID" = :student_id
                """)
                current_status_result = db.execute(current_status_query, {"student_id": student_id})
                current_status_row = current_status_result.fetchone()
                current_status = current_status_row[0] if current_status_row else None
                
                # 如果当前状态是"休学"，转班后改为"复学"
                new_status = "复学" if current_status == "休学" else current_status
                
                update_query = text("""
                    UPDATE teaching_quality."班级档案表"
                    SET "班级ID" = :target_class_id,
                        "班级名称" = :target_class,
                        "神殿名称" = :target_campus,
                        "序号" = :new_serial,
                        "学员状态" = :new_status
                    WHERE "记录ID" = :student_id
                """)
                
                db.execute(update_query, {
                    "target_class_id": target_class_id,
                    "target_class": payload.targetClass,
                    "target_campus": update_campus,
                    "new_serial": new_serial,
                    "new_status": new_status,
                    "student_id": student_id,
                })
                
                db.commit()
                print(f"[转班] 成功: {payload.studentName} 从 {actual_class} 转到 {payload.targetClass}, 新序号: {new_serial}")
                break
                
            except Exception as update_error:
                db.rollback()
                error_str = str(update_error)
                if "UniqueViolation" in error_str or "unique" in error_str.lower() or "duplicate" in error_str.lower():
                    # 序号冲突，重新获取最大序号并重试
                    print(f"[转班] 序号冲突，重试 {retry + 1}/{max_retries}")
                    
                    # 重新查询最大序号
                    max_serial_result = db.execute(max_serial_query, {
                        "target_campus": payload.targetCampus,
                        "target_campus_with_suffix": target_campus_with_suffix,
                        "target_campus_normalized": target_campus_normalized,
                        "target_class": payload.targetClass,
                    })
                    max_serial = max_serial_result.scalar() or 0
                    new_serial = max_serial + 1
                    
                    if retry == max_retries - 1:
                        raise Exception(f"序号冲突，重试{max_retries}次后仍然失败")
                else:
                    raise
        
        return TransferStudentResponse(
            success=True,
            message=f"学员 {payload.studentName} 已从 {payload.sourceCampus}-{actual_class} 转至 {payload.targetCampus}-{payload.targetClass}"
        )
        
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"[转班失败] {error_detail}")
        return TransferStudentResponse(
            success=False,
            message=f"转班失败：{str(e)}"
        )


@router.get("/class-file/students-by-status", response_model=List[StudentSearchResult], summary="根据学员状态获取学生列表")
def get_students_by_status(
    campus: str = Query(..., description="神殿名称"),
    status: str = Query(..., description="学员状态（退费/休学/长期请假/长期不上课/寒暑假/其他）"),
    db: Session = Depends(get_db),
):
    """
    从班级档案表中获取指定神殿、指定学员状态的所有学生。
    用于学员异动明细表的自动导入功能。
    """
    init_tables()
    
    from sqlalchemy import text
    
    # 构建查询
    query = text("""
        SELECT 
            "姓名", "性别", "身份证号", "入学时间", "入学年龄", "学历", "毕业时间", "毕业年龄",
            "最高学历及性质", "神殿来源", "咨询师", "所报专业", "学制", "应收学费金额",
            "班主任姓名", "学员状态", "过往专业", "毕业学校", "联系电话", "家长电话",
            "通信地址", "户口性质", "就读方式", "现住址", "是否承诺注册学历",
            "承诺注册学历性质", "承诺注册学历级别", "学历学校名称",
            "是否已注册中专或大专", "所注册学校", "备注",
            "班级名称", "神殿名称"
        FROM teaching_quality."班级档案表"
        WHERE "学员状态" = :status
          AND ("神殿名称" = :campus OR "神殿名称" = :campus_normalized OR "神殿名称" = :campus_with_suffix)
          AND "姓名" IS NOT NULL 
          AND "姓名" != ''
        ORDER BY "班级名称", "序号"
    """)
    
    # 规范化神殿名称
    campus_normalized = campus.rstrip('神殿').strip()
    campus_with_suffix = f"{campus_normalized}神殿"
    
    result = db.execute(query, {
        "status": status,
        "campus": campus,
        "campus_normalized": campus_normalized,
        "campus_with_suffix": campus_with_suffix,
    })
    rows = result.fetchall()
    
    students = []
    for r in rows:
        students.append(StudentSearchResult(
            name=r[0],
            gender=r[1],
            idCard=r[2],
            enrollmentDate=r[3].isoformat() if r[3] else None,
            enrollmentAge=r[4],
            education=r[5],
            graduationDate=r[6].isoformat() if r[6] else None,
            graduationAge=r[7],
            highestEducationAndType=r[8],
            campusSource=r[9],
            consultant=r[10],
            reportedMajor=r[11],
            schoolingLength=r[12],
            tuitionAmount=r[13],
            headTeacher=r[14],
            studentStatus=r[15],
            previousMajor=r[16],
            graduateSchool=r[17],
            phone=r[18],
            parentPhone=r[19],
            address=r[20],
            householdType=r[21],
            studyMode=r[22],
            currentAddress=r[23],
            promisedRegisterEducation=r[24],
            promisedEducationNature=r[25],
            promisedEducationLevel=r[26],
            educationSchoolName=r[27],
            registeredSecondaryOrCollege=r[28],
            registeredSchool=r[29],
            remark=r[30],
            className=r[31],
            campusName=r[32],
        ))
    
    return students
