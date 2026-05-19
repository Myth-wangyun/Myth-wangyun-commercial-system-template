"""
Config master data APIs (campus, major, class, teacher, teacher-class assignments)
"""

from typing import List, Optional, Set

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ....core.auth import get_current_admin_user
from ....core.database import get_db, get_teaching_quality_db
from ....crud import config_master as crud
from ....models.class_assignment_grade import ClassAssignmentGrade
from ....models.class_exam_score import ClassExamScore
from ....models.config_master import CampusProfile, ClassProfile, CourseProfile
from ....models.human_resources import EmployeeProfile
from ....models.press_interview_score import PressInterviewScore
from ....models.project_grade_register import ProjectGradeRegister
from ....models.user import User, UserRole, UserStatus
from ....schemas.config_master import (
    AssignmentCreate,
    AssignmentOut,
    AssignmentUpdate,
    CampusCreate,
    CampusOut,
    CampusUpdate,
    ClassCreate,
    ClassOut,
    ClassUpdate,
    CourseCreate,
    CourseOut,
    CourseUpdate,
    EmployeeCreate,
    EmployeeOut,
    EmployeeUpdate,
    HomeroomTeacherCreate,
    HomeroomTeacherOut,
    HomeroomTeacherUpdate,
    MajorCreate,
    MajorOut,
    MajorUpdate,
    TeacherCreate,
    TeacherOut,
    TeacherUpdate,
)
from ....services.class_sync_service import sync_config_class_to_teaching_quality
from ....teaching_quality.TQclass_file_record_db import 班级档案表

router = APIRouter()


# ---------------------
# 神殿
# ---------------------


@router.get("/campuses", response_model=List[CampusOut], summary="神殿列表")
def list_campuses(
    active: Optional[bool] = Query(None, description="是否只看启用"),
    db: Session = Depends(get_db),
):
    return crud.list_campuses(db, active=active)


@router.post("/campuses", response_model=CampusOut, summary="新增神殿")
def create_campus(data: CampusCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_campus(db, data)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"创建失败: {e.orig}") from e


@router.put(
    "/campuses/{name}",
    response_model=CampusOut,
    summary="更新神殿",
)
def update_campus(
    name: str = Path(..., description="神殿名称"),
    data: CampusUpdate = Body(...),
    db: Session = Depends(get_db),
):
    campus = crud.update_campus(db, name, data)
    if not campus:
        raise HTTPException(status_code=404, detail="神殿不存在")
    return campus


@router.delete("/campuses/{name}", summary="删除神殿")
def delete_campus(name: str, db: Session = Depends(get_db)):
    if not crud.delete_campus(db, name):
        raise HTTPException(status_code=404, detail="神殿不存在")
    return {"success": True}


# ---------------------
# 专业
# ---------------------


@router.get("/majors", response_model=List[MajorOut], summary="专业列表")
def list_majors(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    active: Optional[bool] = Query(None, description="是否只看启用"),
    db: Session = Depends(get_db),
):
    return crud.list_majors(db, campus_name=campus_name, active=active)


@router.post("/majors", response_model=MajorOut, summary="新增专业")
def create_major(data: MajorCreate, db: Session = Depends(get_db)):
    try:
        # 验证神殿是否存在
        campus = db.query(CampusProfile).filter(CampusProfile.name == data.campus_name).first()
        if not campus:
            raise HTTPException(
                status_code=422,
                detail=f"神殿 '{data.campus_name}' 不存在，请先创建神殿"
            )
        return crud.create_major(db, data)
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "uq_majors_campus_name" in error_msg or "unique constraint" in error_msg.lower():
            raise HTTPException(
                status_code=422,
                detail=f"该神殿已存在名为 '{data.name}' 的专业，请使用其他名称"
            ) from e
        raise HTTPException(status_code=400, detail=f"创建失败: {error_msg}") from e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建专业失败: {str(e)}") from e


@router.put("/majors/{major_id}", response_model=MajorOut, summary="更新专业")
def update_major(
    major_id: int = Path(..., description="专业ID"),
    data: MajorUpdate = Body(...),
    db: Session = Depends(get_db),
):
    major = crud.update_major(db, major_id, data)
    if not major:
        raise HTTPException(status_code=404, detail="专业不存在")
    return major


@router.delete("/majors/{major_id}", summary="删除专业")
def delete_major(major_id: int, db: Session = Depends(get_db)):
    if not crud.delete_major(db, major_id):
        raise HTTPException(status_code=404, detail="专业不存在")
    return {"success": True}


# ---------------------
# 课程
# ---------------------


@router.get("/courses", response_model=List[CourseOut], summary="课程列表")
def list_courses(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    major_id: Optional[int] = Query(None, description="按专业过滤"),
    active: Optional[bool] = Query(None, description="是否只看启用"),
    db: Session = Depends(get_db),
):
    return crud.list_courses(db, campus_name=campus_name, major_id=major_id, active=active)


@router.post("/courses", response_model=CourseOut, summary="新增课程")
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_course(db, data)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"创建失败: {e.orig}") from e


@router.put("/courses/{course_id}", response_model=CourseOut, summary="更新课程")
def update_course(
    course_id: int = Path(..., description="课程ID"),
    data: CourseUpdate = Body(...),
    db: Session = Depends(get_db),
):
    record = crud.update_course(db, course_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="课程不存在")
    return record


@router.delete("/courses/{course_id}", summary="删除课程")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    if not crud.delete_course(db, course_id):
        raise HTTPException(status_code=404, detail="课程不存在")
    return {"success": True}


# ---------------------
# 教员
# ---------------------


@router.get("/teachers", response_model=List[TeacherOut], summary="教员列表")
def list_teachers(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    active: Optional[bool] = Query(None),
    participate_kpi: Optional[bool] = Query(None, description="是否参与KPI"),
    position: Optional[str] = Query(None, description="按职位过滤，支持多个职位用逗号分隔，如：学术经理,学术副经理"),
    is_primary: Optional[bool] = Query(None, description="是否负责强化（从teacher_class_assignments表筛选）"),
    db: Session = Depends(get_db),
):
    return crud.list_teachers(
        db,
        campus_name=campus_name,
        active=active,
        participate_kpi=participate_kpi,
        position=position,
        is_primary=is_primary,
    )


@router.post("/teachers", response_model=TeacherOut, summary="新增教员")
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_teacher(db, data)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"创建失败: {e.orig}") from e


@router.put("/teachers/{teacher_id}", response_model=TeacherOut, summary="更新教员")
def update_teacher(
    teacher_id: int = Path(..., description="教员ID"),
    data: TeacherUpdate = Body(...),
    db: Session = Depends(get_db),
):
    teacher = crud.update_teacher(db, teacher_id, data)
    if not teacher:
        raise HTTPException(status_code=404, detail="教员不存在")
    return teacher


@router.delete("/teachers/{teacher_id}", summary="删除教员")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    if not crud.delete_teacher(db, teacher_id):
        raise HTTPException(status_code=404, detail="教员不存在")
    return {"success": True}


# ---------------------
# 班主任
# ---------------------


@router.get("/homeroom-teachers", response_model=List[HomeroomTeacherOut], summary="班主任列表")
def list_homeroom_teachers(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    active: Optional[bool] = Query(None, description="是否只看启用"),
    db: Session = Depends(get_db),
):
    return crud.list_homeroom_teachers(db, campus_name=campus_name, active=active)


@router.post("/homeroom-teachers", response_model=HomeroomTeacherOut, summary="新增班主任")
def create_homeroom_teacher(data: HomeroomTeacherCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_homeroom_teacher(db, data)
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"创建失败: {e.orig}") from e


@router.put("/homeroom-teachers/{homeroom_id}", response_model=HomeroomTeacherOut, summary="更新班主任")
def update_homeroom_teacher(
    homeroom_id: int = Path(..., description="班主任ID"),
    data: HomeroomTeacherUpdate = Body(...),
    db: Session = Depends(get_db),
):
    teacher = crud.update_homeroom_teacher(db, homeroom_id, data)
    if not teacher:
        raise HTTPException(status_code=404, detail="班主任不存在")
    return teacher


@router.delete("/homeroom-teachers/{homeroom_id}", summary="删除班主任")
def delete_homeroom_teacher(homeroom_id: int, db: Session = Depends(get_db)):
    if not crud.delete_homeroom_teacher(db, homeroom_id):
        raise HTTPException(status_code=404, detail="班主任不存在")
    return {"success": True}


# ---------------------
# 班级
# ---------------------


@router.get("/classes", response_model=List[ClassOut], summary="班级列表")
def list_classes(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    major_id: Optional[int] = Query(None),
    active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.list_classes(
        db, campus_name=campus_name, major_id=major_id, active=active
    )


@router.get("/classes/from-database", response_model=List[str], summary="从数据库表获取唯一班级列表")
def list_classes_from_database(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    db: Session = Depends(get_db),
):
    """
    从所有包含 class_name 字段的数据库表中查询唯一的班级名称列表
    包括：
    - class_exam_scores (班考试成绩表)
    - class_assignment_grades (班作业成绩表)
    - project_grade_registers (班项目成绩表)
    - press_interview_scores (班压力面试成绩表)
    
    返回去重后的班级名称列表，与配置中心的班级列表合并使用
    """
    class_names: Set[str] = set()
    
    # 从班考试成绩表查询
    query = db.query(ClassExamScore.class_name).distinct()
    if campus_name:
        query = query.filter(ClassExamScore.campus_name == campus_name)
    class_names.update([row[0] for row in query.all() if row[0]])
    
    # 从班作业成绩表查询
    query = db.query(ClassAssignmentGrade.class_name).distinct()
    if campus_name:
        query = query.filter(ClassAssignmentGrade.campus_name == campus_name)
    class_names.update([row[0] for row in query.all() if row[0]])
    
    # 从班项目成绩表查询
    query = db.query(ProjectGradeRegister.class_name).distinct()
    if campus_name:
        query = query.filter(ProjectGradeRegister.campus_name == campus_name)
    class_names.update([row[0] for row in query.all() if row[0]])
    
    # 从班压力面试成绩表查询
    query = db.query(PressInterviewScore.class_name).distinct()
    if campus_name:
        query = query.filter(PressInterviewScore.campus_name == campus_name)
    class_names.update([row[0] for row in query.all() if row[0]])
    
    # 返回排序后的列表
    return sorted(list(class_names))


@router.post("/classes", response_model=ClassOut, summary="新增班级")
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    try:
        # 验证神殿是否存在
        campus = db.query(CampusProfile).filter(CampusProfile.name == data.campus_name).first()
        if not campus:
            raise HTTPException(
                status_code=422,
                detail=f"神殿 '{data.campus_name}' 不存在，请先创建神殿"
            )
        new_class = crud.create_class(db, data)
        
        # 同步到 teaching_quality.班级列表
        try:
            sync_config_class_to_teaching_quality(tq_db, new_class, action="upsert")
        except Exception as sync_err:
            print(f"[config_master] 同步班级到 teaching_quality 失败: {sync_err}")
        
        return new_class
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "unique constraint" in error_msg.lower() or "duplicate" in error_msg.lower():
            raise HTTPException(
                status_code=422,
                detail="班级创建失败：可能已存在相同的班级编码或名称"
            ) from e
        raise HTTPException(status_code=400, detail=f"创建失败: {error_msg}") from e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建班级失败: {str(e)}") from e


@router.put("/classes/{class_id}", response_model=ClassOut, summary="更新班级")
def update_class(
    class_id: int = Path(..., description="班级ID"),
    data: ClassUpdate = Body(...),
    db: Session = Depends(get_db),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    record = crud.update_class(db, class_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="班级不存在")
    
    # 同步到 teaching_quality.班级列表
    try:
        sync_config_class_to_teaching_quality(tq_db, record, action="upsert")
    except Exception as sync_err:
        print(f"[config_master] 同步班级到 teaching_quality 失败: {sync_err}")
    
    return record


@router.delete("/classes/{class_id}", summary="删除班级")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    # 先获取班级信息用于同步删除
    class_record = db.query(ClassProfile).filter(ClassProfile.id == class_id).first()
    
    if not crud.delete_class(db, class_id):
        raise HTTPException(status_code=404, detail="班级不存在")
    
    # 同步删除 teaching_quality.班级列表 中的记录
    if class_record:
        try:
            sync_config_class_to_teaching_quality(tq_db, class_record, action="delete")
        except Exception as sync_err:
            print(f"[config_master] 同步删除班级到 teaching_quality 失败: {sync_err}")
    
    return {"success": True}


# ---------------------
# 教员-班级关系
# ---------------------


@router.get(
    "/assignments",
    response_model=List[AssignmentOut],
    summary="教员与班级关联列表",
)
def list_assignments(
    teacher_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    active_only: bool = Query(False, description="只返回当前有效记录"),
    db: Session = Depends(get_db),
):
    return crud.list_assignments(
        db,
        teacher_id=teacher_id,
        class_id=class_id,
        active_only=active_only,
    )


@router.post(
    "/assignments",
    response_model=AssignmentOut,
    summary="新增教员-班级关联",
)
def create_assignment(data: AssignmentCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_assignment(db, data)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"创建失败: {e.orig}") from e


@router.put(
    "/assignments/{assignment_id}",
    response_model=AssignmentOut,
    summary="更新教员-班级关联",
)
def update_assignment(
    assignment_id: int = Path(..., description="关联ID"),
    data: AssignmentUpdate = Body(...),
    db: Session = Depends(get_db),
):
    record = crud.update_assignment(db, assignment_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/assignments/{assignment_id}", summary="删除教员-班级关联")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


# ---------------------
# 统计数据
# ---------------------


@router.get("/stats/summary", summary="获取系统统计摘要")
def get_system_stats(
    db: Session = Depends(get_db),
):
    """
    获取系统统计摘要，包括：
    - 在校学生数（从 teaching_quality.班级档案表 统计）
    - 教职工数（从 public.users 表统计 count(user_id)）
    - 专业课程数（从 config.courses 表统计 count(id)）
    - 神殿总数（从 config.campuses 表统计记录数）
    """
    try:
        # 神殿总数（campuses 表主键是 name）
        total_campuses = db.query(func.count(CampusProfile.name)).scalar() or 0

        # 专业课程数（courses 表主键是 id）
        total_courses = db.query(func.count(CourseProfile.id)).scalar() or 0

        # 教职工数（从 public.users 表统计 count(user_id)）
        total_staff = db.query(func.count(User.user_id)).scalar() or 0

        # 在校学生数（从 teaching_quality.班级档案表 统计）
        total_students = 0
        try:
            total_students = db.query(func.count(班级档案表.记录ID)).scalar() or 0
        except Exception as e:
            print(f"[stats/summary] 从班级档案表统计学生数量失败: {e}")
            total_students = 0

        return {
            "totalStudents": total_students,
            "totalStaff": total_staff,
            "totalCourses": total_courses,
            "totalCampuses": total_campuses,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计数据失败: {str(e)}") from e


# ---------------------
# 员工管理
# ---------------------


@router.post("/employees/import", summary="从用户表导入员工")
def import_employees_from_users(db: Session = Depends(get_db)):
    """
    从 public.users 表批量导入员工到 humanresources.employees 表
    只导入状态为 ACTIVE 且尚未存在的用户
    """
    try:
        from app.models.user import UserStatus
        
        # 获取有效神殿列表
        valid_campuses = set([c[0] for c in db.query(CampusProfile.name).all()])
        
        # 获取所有活跃用户
        users = db.query(User).filter(User.status == UserStatus.ACTIVE).all()
        
        # 获取已存在的 user_id
        existing_user_ids = set(
            [e.user_id for e in db.query(EmployeeProfile.user_id).filter(
                EmployeeProfile.user_id.isnot(None)
            ).all()]
        )
        
        imported_count = 0
        skipped_count = 0
        
        for user in users:
            # 如果用户已存在，跳过
            if user.user_id in existing_user_ids:
                skipped_count += 1
                continue
            
            # 神殿不在有效列表中则设为None
            campus = user.campus if user.campus in valid_campuses else None
            
            # 创建员工记录
            employee = EmployeeProfile(
                user_id=user.user_id,
                name=user.real_name or f"用户{user.user_id}",
                department=user.department or "未设置",
                position=user.position or "未设置",
                contact=user.phone or "无",
                campus_name=campus,
                is_active=True
            )
            db.add(employee)
            imported_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "imported": imported_count,
            "skipped": skipped_count,
            "message": f"成功导入 {imported_count} 个员工，跳过 {skipped_count} 个已存在的记录"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"导入员工失败: {str(e)}") from e


@router.get("/employees/departments", response_model=List[str], summary="获取部门列表")
def get_departments(db: Session = Depends(get_db)):
    """
    优先从员工管理表获取所有去重的部门列表，缺失时兜底 public.users
    """
    try:
        employee_departments = db.query(EmployeeProfile.department).filter(
            EmployeeProfile.department.isnot(None),
            EmployeeProfile.department != ''
        ).distinct().all()
        user_departments = db.query(User.department).filter(
            User.department.isnot(None),
            User.department != ''
        ).distinct().all()
        values = {
            department
            for department, in [*employee_departments, *user_departments]
            if department
        }
        return sorted(values)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取部门列表失败: {str(e)}") from e


@router.get("/employees/positions", response_model=List[str], summary="获取职位列表")
def get_positions(db: Session = Depends(get_db)):
    """
    优先从员工管理表获取所有去重的职位列表，缺失时兜底 public.users
    """
    try:
        employee_positions = db.query(EmployeeProfile.position).filter(
            EmployeeProfile.position.isnot(None),
            EmployeeProfile.position != ''
        ).distinct().all()
        user_positions = db.query(User.position).filter(
            User.position.isnot(None),
            User.position != ''
        ).distinct().all()
        values = {
            position
            for position, in [*employee_positions, *user_positions]
            if position
        }
        return sorted(values)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取职位列表失败: {str(e)}") from e


@router.get("/department-users", response_model=List[dict], summary="按部门获取用户列表（按神殿分组）")
def get_users_by_department(
    department: str = Query(..., description="部门名称，如：智慧司"),
    db: Session = Depends(get_db)
):
    """
    从 public.users 表获取指定部门的所有人员，按神殿分组返回
    返回格式：[{campus: 神殿名, users: [{user_id, real_name, position, phone}]}]
    没有神殿的用户放在 "其他" 分组中
    """
    try:
        users = db.query(
            User.user_id,
            User.real_name,
            User.department,
            User.position,
            User.phone,
            User.campus
        ).filter(
            User.status == UserStatus.ACTIVE,
            User.department == department
        ).all()
        
        # 按神殿分组
        campus_groups: dict = {}
        for u in users:
            campus = u.campus if u.campus else "其他"
            if campus not in campus_groups:
                campus_groups[campus] = []
            campus_groups[campus].append({
                "user_id": u.user_id,
                "real_name": u.real_name,
                "position": u.position,
                "phone": u.phone,
                "campus": u.campus or "其他",
            })
        
        # 转换为列表格式，按神殿名排序
        result = [
            {"campus": campus, "users": users_list}
            for campus, users_list in sorted(campus_groups.items(), key=lambda x: (x[0] == "其他", x[0]))
        ]
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取部门用户列表失败: {str(e)}") from e


@router.get("/employees/users", response_model=List[dict], summary="获取可选用户列表")
def get_available_users(db: Session = Depends(get_db)):
    """
    获取 public.users 表中的用户列表，用于关联员工
    """
    try:
        from app.models.user import UserStatus
        users = db.query(
            User.user_id,
            User.real_name,
            User.department,
            User.position,
            User.phone,
            User.campus
        ).filter(
            User.status == UserStatus.ACTIVE
        ).all()
        
        return [
            {
                "user_id": u.user_id,
                "real_name": u.real_name,
                "department": u.department,
                "position": u.position,
                "phone": u.phone,
                "campus": u.campus,
            }
            for u in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户列表失败: {str(e)}") from e


@router.get("/employees", response_model=List[EmployeeOut], summary="员工列表")
def list_employees(
    campus_name: Optional[str] = Query(None, description="按神殿名称过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    position: Optional[str] = Query(None, description="按职位过滤"),
    name: Optional[str] = Query(None, description="按姓名搜索"),
    is_active: Optional[bool] = Query(None, description="是否只看在职"),
    db: Session = Depends(get_db),
):
    return crud.list_employees(db, campus_name=campus_name, department=department, position=position, name=name, is_active=is_active)


@router.get("/employees/{employee_id}", response_model=EmployeeOut, summary="员工详情")
def get_employee(
    employee_id: int = Path(..., description="员工ID"),
    db: Session = Depends(get_db),
):
    employee = crud.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="员工不存在")
    return employee


@router.post("/employees", response_model=EmployeeOut, summary="新增员工")
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    try:
        # 如果提供了 user_id，从 users 表同步数据
        if data.user_id:
            user = db.query(User).filter(User.user_id == data.user_id).first()
            if user:
                # 使用 users 表的数据覆盖
                data_dict = data.model_dump()
                data_dict['name'] = user.real_name
                data_dict['department'] = user.department or data.department
                data_dict['position'] = user.position or data.position
                data_dict['contact'] = user.phone or data.contact
                data_dict['campus_name'] = user.campus or data.campus_name
                # 创建新的 EmployeeCreate 对象
                from app.schemas.config_master import EmployeeCreate as EC
                data = EC(**data_dict)
        
        return crud.create_employee(db, data)
    except IntegrityError as e:
        db.rollback()
        if 'duplicate key' in str(e.orig).lower():
            raise HTTPException(status_code=400, detail="该用户已经关联了员工记录") from e
        raise HTTPException(status_code=400, detail=f"创建失败: {e.orig}") from e


@router.put("/employees/{employee_id}", response_model=EmployeeOut, summary="更新员工")
def update_employee(
    employee_id: int = Path(..., description="员工ID"),
    data: EmployeeUpdate = Body(...),
    db: Session = Depends(get_db),
):
    employee = crud.update_employee(db, employee_id, data)
    if not employee:
        raise HTTPException(status_code=404, detail="员工不存在")
    return employee


@router.delete("/employees/{employee_id}", summary="删除员工")
def delete_employee(
    employee_id: int = Path(..., description="员工ID"),
    db: Session = Depends(get_db),
):
    if not crud.delete_employee(db, employee_id):
        raise HTTPException(status_code=404, detail="员工不存在")
    return {"success": True}


# ---------------------
# 用户权限管理 (直接操作 users 表)
# ---------------------

@router.get("/user-permissions", summary="获取用户权限配置列表")
def list_user_permissions(
    campus: Optional[str] = Query(None, description="按神殿过滤"),
    department: Optional[str] = Query(None, description="按部门过滤"),
    position: Optional[str] = Query(None, description="按职位过滤"),
    name: Optional[str] = Query(None, description="按姓名搜索"),
    db: Session = Depends(get_db),
):
    """
    获取所有用户的权限配置信息（直接从 users 表读取）
    用于员工管理页面显示和编辑权限相关字段
    
    支持神殿名称的模糊匹配（如"河北主神殿"、"河北盛邦"、"盛邦"等变体）
    """
    from app.models.user import UserStatus
    from sqlalchemy import or_
    
    query = db.query(User).filter(User.status == UserStatus.ACTIVE)
    
    if campus:
        # 支持神殿名称的多种变体匹配
        # 例如：前端传 "河北主神殿"，数据库可能存储 "主神殿" 或 "盛邦"
        campus_normalized = campus.replace('神殿', '').strip()  # "河北盛邦"
        
        # 尝试去掉可能的省份前缀（如"河北"、"山东"等）
        campus_short = campus_normalized
        for prefix in ['河北', '贵州', '广西', '山西', '陕西', '江苏', '浙江', '广东', '四川']:
            if campus_normalized.startswith(prefix):
                campus_short = campus_normalized[len(prefix):].strip()
                break
        
        print(f"[DEBUG user-permissions] 查询参数: campus={campus}, campus_normalized={campus_normalized}, campus_short={campus_short}, department={department}")
        
        query = query.filter(
            or_(
                User.campus == campus,  # 精确匹配 "河北主神殿"
                User.campus == campus_normalized,  # 去掉"神殿" "河北盛邦"
                User.campus == f"{campus_normalized}神殿",  # 加上"神殿" "河北主神殿"
                User.campus == campus_short,  # 去掉省份前缀 "盛邦"
                User.campus == f"{campus_short}神殿",  # 去掉省份前缀+神殿 "主神殿"
                User.campus.ilike(f"%{campus_short}%")  # 模糊匹配 "%盛邦%"
            )
        )
    if department:
        query = query.filter(User.department == department)
    if position:
        query = query.filter(User.position == position)
    if name:
        query = query.filter(User.real_name.ilike(f"%{name}%"))
    
    users = query.order_by(User.real_name).all()
    
    print(f"[DEBUG user-permissions] 查询结果: 找到 {len(users)} 个用户")
    if len(users) > 0:
        print(f"[DEBUG user-permissions] 前3个用户: {[(u.real_name, u.campus, u.department, u.position) for u in users[:3]]}")
    
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "name": u.real_name,
            "department": u.department,
            "position": u.position,
            "campus": u.campus,
            "phone": u.phone,
            "email": u.email,
            "role": u.role.value if u.role else None,
            "is_superuser": u.is_superuser,
            "status": u.status.value if u.status else "active",
        }
        for u in users
    ]


@router.get("/user-permissions/{user_id}", summary="获取单个用户权限配置")
def get_user_permission(
    user_id: int = Path(..., description="用户ID"),
    db: Session = Depends(get_db),
):
    """获取单个用户的权限配置信息"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return {
        "user_id": user.user_id,
        "username": user.username,
        "name": user.real_name,
        "department": user.department,
        "position": user.position,
        "campus": user.campus,
        "phone": user.phone,
        "email": user.email,
        "role": user.role.value if user.role else None,
        "is_superuser": user.is_superuser,
        "status": user.status.value if user.status else "active",
    }


@router.put("/user-permissions/{user_id}", summary="更新用户权限配置")
def update_user_permission(
    user_id: int = Path(..., description="用户ID"),
    data: dict = Body(..., description="更新数据"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    更新用户的权限相关字段（需要管理员权限）
    可更新：department, position, campus, status
    这会直接影响用户的菜单访问权限
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 允许更新的字段
    allowed_fields = ['department', 'position', 'campus', 'phone', 'email', 'status']
    
    for field in allowed_fields:
        if field in data and data[field] is not None:
            if field == 'status':
                # 转换状态字符串为枚举
                if data[field] == 'active':
                    setattr(user, field, UserStatus.ACTIVE)
                elif data[field] == 'inactive':
                    setattr(user, field, UserStatus.INACTIVE)
                else:
                    setattr(user, field, data[field])
            else:
                setattr(user, field, data[field])
    
    try:
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "user_id": user.user_id,
            "username": user.username,
            "name": user.real_name,
            "department": user.department,
            "position": user.position,
            "campus": user.campus,
            "phone": user.phone,
            "email": user.email,
            "role": user.role.value if user.role else None,
            "is_superuser": user.is_superuser,
            "status": user.status.value if user.status else "active",
            "message": "权限配置更新成功，用户需要重新登录或刷新页面以应用新权限"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.get("/user-permissions/options/departments", response_model=List[str], summary="获取部门选项")
def get_department_options(db: Session = Depends(get_db)):
    """获取所有已使用的部门列表，用于下拉选项"""
    # 预定义的部门列表
    predefined = ['智慧司', '教化司', '祈福司', '市场部', '人资行政部', '神藏司']
    
    # 从数据库获取已使用的部门
    db_departments = db.query(User.department).distinct().filter(User.department.isnot(None)).all()
    db_list = [d[0] for d in db_departments if d[0]]
    
    # 合并并去重
    all_depts = list(set(predefined + db_list))
    return sorted(all_depts)


@router.get("/user-permissions/options/positions", response_model=List[str], summary="获取职位选项")
def get_position_options(db: Session = Depends(get_db)):
    """获取所有已使用的职位列表，用于下拉选项"""
    # 预定义的职位列表（按权限级别排序）
    predefined = [
        '董事长', '学术总监', '教质总监',
         '市场部经理',
        '班主任', 'SEM竞价'
    ]
    
    # 从数据库获取已使用的职位
    db_positions = db.query(User.position).distinct().filter(User.position.isnot(None)).all()
    db_list = [p[0] for p in db_positions if p[0]]
    
    # 合并，保持预定义顺序在前
    result = predefined.copy()
    for p in db_list:
        if p not in result:
            result.append(p)
    
    return result


@router.get("/user-permissions/options/campuses", response_model=List[str], summary="获取神殿选项")
def get_campus_options(db: Session = Depends(get_db)):
    """获取所有可用的神殿列表，用于下拉选项"""
    campuses = db.query(CampusProfile.name).filter(CampusProfile.is_active.is_(True)).all()
    return sorted([c[0] for c in campuses])


@router.post("/user-permissions", summary="创建新员工")
def create_user(
    data: dict = Body(..., description="用户数据"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    创建新员工账户（需要管理员权限）
    必填字段：username, password, real_name, department, position
    """
    from ....core.security import security_manager
    
    # 验证必填字段
    required_fields = ['username', 'password', 'real_name', 'department', 'position']
    for field in required_fields:
        if field not in data or not data[field]:
            raise HTTPException(status_code=400, detail=f"缺少必填字段: {field}")
    
    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == data['username']).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    # 检查邮箱是否已存在
    if data.get('email'):
        existing_email = db.query(User).filter(User.email == data['email']).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="邮箱已被使用")
    
    try:
        # 加密密码
        password_hash = security_manager.get_password_hash(data['password'])
        
        # 创建用户对象
        new_user = User(
            username=data['username'],
            password_hash=password_hash,
            real_name=data['real_name'],
            email=data.get('email'),
            phone=data.get('phone'),
            department=data['department'],
            position=data['position'],
            campus=data.get('campus'),
            gender=data.get('gender'),
            role=UserRole.STAFF,  # 默认为普通员工
            status=UserStatus.ACTIVE,  # 默认为在职状态
            is_superuser=False,
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": "员工创建成功",
            "user_id": new_user.user_id,
            "username": new_user.username,
            "name": new_user.real_name,
            "department": new_user.department,
            "position": new_user.position,
            "campus": new_user.campus,
            "phone": new_user.phone,
            "email": new_user.email,
            "status": new_user.status.value if new_user.status else "active",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建员工失败: {str(e)}") from e


@router.delete("/user-permissions/{user_id}", summary="删除员工")
def delete_user(
    user_id: int = Path(..., description="用户ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    删除员工账户（需要管理员权限）
    软删除，将状态设置为 inactive
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 防止删除超级管理员
    if user.is_superuser:
        raise HTTPException(status_code=403, detail="不能删除超级管理员账户")
    
    try:
        # 软删除：设置状态为 inactive
        user.status = UserStatus.INACTIVE
        db.commit()
        
        return {
            "success": True,
            "message": "员工已删除（状态设置为离职）",
            "user_id": user.user_id,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除员工失败: {str(e)}") from e


@router.get("/get-teacher-by-class", summary="根据班级获取教员")
def get_teacher_by_class(
    className: str = Query(..., description="班级名称"),
    db: Session = Depends(get_db),
):
    """根据班级名称获取关联的教员信息（支持多个负责强化的教员）"""
    from ....models.config_master import TeacherClassAssignment, TeacherProfile
    
    try:
        print(f"[DEBUG] 查询班级: {className}")
        
        # 查询班级 - 使用正确的字段名 class_name
        class_obj = db.query(ClassProfile).filter(ClassProfile.class_name == className).first()
        if not class_obj:
            print(f"[DEBUG] 未找到班级: {className}")
            return {"teacherName": "", "teacherNames": [], "className": className, "debug": "class_not_found"}
        
        print(f"[DEBUG] 找到班级 ID: {class_obj.id}, 名称: {class_obj.class_name}")
        
        # 查询所有负责强化的教员（is_primary=True）
        primary_assignments = db.query(TeacherClassAssignment).filter(
            TeacherClassAssignment.class_id == class_obj.id,
            TeacherClassAssignment.is_primary.is_(True)
        ).all()
        
        teacher_names = []
        for assignment in primary_assignments:
            teacher = db.query(TeacherProfile).filter(
                TeacherProfile.id == assignment.teacher_id
            ).first()
            if teacher and teacher.name not in teacher_names:
                teacher_names.append(teacher.name)
        
        print(f"[DEBUG] 找到负责强化的教员: {teacher_names}")
        
        # 返回多个教员（teacherNames数组）以及兼容旧接口的teacherName（逗号分隔）
        return {
            "teacherName": ",".join(teacher_names) if teacher_names else "",
            "teacherNames": teacher_names,
            "className": className
        }
    except Exception as e:
        import traceback
        print(f"[ERROR] get_teacher_by_class: {e}")
        print(traceback.format_exc())
        return {"teacherName": "", "teacherNames": [], "className": className, "error": str(e)}
