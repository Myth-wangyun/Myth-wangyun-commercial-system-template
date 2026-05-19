"""
CRUD helpers for config master data tables.
"""

from datetime import date
from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.config_master import (
    CampusProfile,
    ClassProfile,
    CourseProfile,
    HomeroomTeacherProfile,
    MajorProfile,
    TeacherClassAssignment,
    TeacherProfile,
)
from app.models.human_resources import EmployeeProfile
from app.models.user import User, UserStatus
from app.schemas.config_master import (
    AssignmentCreate,
    AssignmentUpdate,
    CampusCreate,
    CampusUpdate,
    ClassCreate,
    ClassUpdate,
    CourseCreate,
    CourseUpdate,
    EmployeeCreate,
    EmployeeUpdate,
    HomeroomTeacherCreate,
    HomeroomTeacherUpdate,
    MajorCreate,
    MajorUpdate,
    TeacherCreate,
    TeacherUpdate,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _commit_with_refresh(db: Session, obj):
    db.add(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# Campus
# ---------------------------------------------------------------------------


def list_campuses(db: Session, active: Optional[bool] = None) -> List[CampusProfile]:
    query = db.query(CampusProfile)
    if active is not None:
        query = query.filter(CampusProfile.is_active == active)
    return query.order_by(CampusProfile.name).all()


def get_campus(db: Session, name: str) -> Optional[CampusProfile]:
    return db.query(CampusProfile).filter_by(name=name).first()


def create_campus(db: Session, data: CampusCreate) -> CampusProfile:
    obj = CampusProfile(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_campus(db: Session, name: str, data: CampusUpdate) -> Optional[CampusProfile]:
    obj = get_campus(db, name)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_campus(db: Session, name: str) -> bool:
    obj = get_campus(db, name)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Majors
# ---------------------------------------------------------------------------


def list_majors(
    db: Session, campus_name: Optional[str] = None, active: Optional[bool] = None
) -> List[MajorProfile]:
    query = db.query(MajorProfile)
    if campus_name:
        query = query.filter(MajorProfile.campus_name == campus_name)
    if active is not None:
        query = query.filter(MajorProfile.is_active == active)
    return query.order_by(MajorProfile.campus_name, MajorProfile.name).all()


def get_major(db: Session, major_id: int) -> Optional[MajorProfile]:
    return db.query(MajorProfile).filter_by(id=major_id).first()


def create_major(db: Session, data: MajorCreate) -> MajorProfile:
    obj = MajorProfile(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_major(db: Session, major_id: int, data: MajorUpdate) -> Optional[MajorProfile]:
    obj = get_major(db, major_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_major(db: Session, major_id: int) -> bool:
    obj = get_major(db, major_id)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------


def list_courses(
    db: Session,
    campus_name: Optional[str] = None,
    major_id: Optional[int] = None,
    active: Optional[bool] = None,
) -> List[CourseProfile]:
    query = db.query(CourseProfile)
    if campus_name:
        query = query.filter(CourseProfile.campus_name == campus_name)
    if major_id:
        query = query.filter(CourseProfile.major_id == major_id)
    if active is not None:
        query = query.filter(CourseProfile.is_active == active)
    return query.order_by(CourseProfile.course_name).all()


def get_course(db: Session, course_id: int) -> Optional[CourseProfile]:
    return db.query(CourseProfile).filter_by(id=course_id).first()


def create_course(db: Session, data: CourseCreate) -> CourseProfile:
    obj = CourseProfile(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_course(db: Session, course_id: int, data: CourseUpdate) -> Optional[CourseProfile]:
    obj = get_course(db, course_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_course(db: Session, course_id: int) -> bool:
    obj = get_course(db, course_id)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Teacher Profiles
# ---------------------------------------------------------------------------


def list_teachers(
    db: Session,
    campus_name: Optional[str] = None,
    active: Optional[bool] = None,
    participate_kpi: Optional[bool] = None,
    position: Optional[str] = None,  # 职位过滤，支持多个职位用逗号分隔
    is_primary: Optional[bool] = None,  # 是否负责强化（从teacher_class_assignments表筛选）
) -> list:
    # 如果指定了职位过滤，直接从 users 表查询
    if position:
        positions = [p.strip() for p in position.split(',') if p.strip()]
        if positions:
            # 直接从 users 表查询指定职位的用户
            query = db.query(User).filter(
                User.position.in_(positions),
                User.status == UserStatus.ACTIVE  # 只查询活跃用户
            )
            
            # 如果指定了神殿，也进行过滤
            if campus_name:
                # 处理神殿名称格式（可能带"神殿"后缀）
                campus_variants = [campus_name]
                if not campus_name.endswith('神殿'):
                    campus_variants.append(f"{campus_name}神殿")
                else:
                    campus_variants.append(campus_name.replace('神殿', ''))
                from sqlalchemy import or_
                query = query.filter(or_(*[User.campus == v for v in campus_variants]))
            
            users = query.order_by(User.real_name).all()
            
            # 将 User 对象转换为 TeacherProfile 格式的伪对象
            # 创建一个简单的类来模拟 TeacherProfile 的接口
            class TeacherProfileProxy:
                def __init__(self, user: User):
                    self.id = user.user_id
                    self.name = user.real_name
                    # 确保 campus_name 格式正确（可能需要添加"神殿"后缀）
                    campus = user.campus or ''
                    if campus and not campus.endswith('神殿'):
                        campus = f"{campus}神殿"
                    self.campus_name = campus
                    self.campus_code = user.campus or ''
                    self.user_id = user.user_id
                    self.title = user.position
                    self.phone = user.phone
                    self.email = user.email
                    self.is_active = True
                    self.participate_kpi = True
                    self.teacher_code = None
                    self.specialty = None
                    self.notes = None
                    self.created_at = user.created_at
                    self.updated_at = user.updated_at
                
                def __repr__(self):
                    return f"<TeacherProfileProxy(name={self.name}, campus={self.campus_name}, position={self.title})>"
            
            return [TeacherProfileProxy(user) for user in users]
    
    # 如果没有指定职位过滤，使用原来的逻辑
    query = db.query(TeacherProfile)
    
    if campus_name:
        query = query.filter(TeacherProfile.campus_name == campus_name)
    if active is not None:
        query = query.filter(TeacherProfile.is_active == active)
    if participate_kpi is not None:
        query = query.filter(TeacherProfile.participate_kpi == participate_kpi)
    
    # 过滤有 is_primary=true 关联记录的教员
    if is_primary is not None:
        subquery = db.query(TeacherClassAssignment.teacher_id).filter(
            TeacherClassAssignment.is_primary == is_primary
        ).distinct().subquery()
        query = query.filter(TeacherProfile.id.in_(subquery))
    
    return query.order_by(TeacherProfile.name).all()


def get_teacher(db: Session, teacher_id: int) -> Optional[TeacherProfile]:
    return db.query(TeacherProfile).filter_by(id=teacher_id).first()


def create_teacher(db: Session, data: TeacherCreate) -> TeacherProfile:
    obj = TeacherProfile(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_teacher(db: Session, teacher_id: int, data: TeacherUpdate) -> Optional[TeacherProfile]:
    obj = get_teacher(db, teacher_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_teacher(db: Session, teacher_id: int) -> bool:
    obj = get_teacher(db, teacher_id)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Homeroom Teachers
# ---------------------------------------------------------------------------


def list_homeroom_teachers(
    db: Session, campus_name: Optional[str] = None, active: Optional[bool] = None
) -> List[HomeroomTeacherProfile]:
    query = db.query(HomeroomTeacherProfile)
    if campus_name:
        query = query.filter(HomeroomTeacherProfile.campus_name == campus_name)
    if active is not None:
        query = query.filter(HomeroomTeacherProfile.is_active == active)
    return query.order_by(HomeroomTeacherProfile.name).all()


def create_homeroom_teacher(
    db: Session, data: HomeroomTeacherCreate
) -> HomeroomTeacherProfile:
    payload = data.model_dump(exclude_unset=True)
    try:
        teacher = HomeroomTeacherProfile(**payload)
        return _commit_with_refresh(db, teacher)
    except Exception:
        db.rollback()
        raise


def update_homeroom_teacher(
    db: Session, homeroom_id: int, data: HomeroomTeacherUpdate
) -> Optional[HomeroomTeacherProfile]:
    teacher = db.query(HomeroomTeacherProfile).filter_by(id=homeroom_id).first()
    if not teacher:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(teacher, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(teacher)
    return teacher


def delete_homeroom_teacher(db: Session, homeroom_id: int) -> bool:
    obj = db.query(HomeroomTeacherProfile).filter_by(id=homeroom_id).first()
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Classes
# ---------------------------------------------------------------------------


def list_classes(
    db: Session,
    campus_name: Optional[str] = None,
    major_id: Optional[int] = None,
    active: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    """获取班级列表，包含关联的专业、班主任、授课教员和学制信息"""
    from sqlalchemy import or_

    from app.models.teacher_employment_summary import 神殿后端教员就业汇总表
    
    query = db.query(ClassProfile)
    if campus_name:
        # 支持模糊匹配：完整名称 或 去掉"神殿"后缀的名称
        normalized_name = campus_name.rstrip('神殿').strip()
        query = query.filter(
            or_(
                ClassProfile.campus_name == campus_name,
                ClassProfile.campus_name == normalized_name,
                ClassProfile.campus_name == f"{normalized_name}神殿",
            )
        )
    if major_id:
        query = query.filter(ClassProfile.major_id == major_id)
    if active is not None:
        query = query.filter(ClassProfile.is_active == active)
    
    classes = query.order_by(ClassProfile.class_code).all()
    
    # 获取所有相关的专业和教员信息
    major_ids = [c.major_id for c in classes if c.major_id]
    homeroom_ids = [c.homeroom_teacher_id for c in classes if c.homeroom_teacher_id]
    class_ids = [c.id for c in classes]
    
    majors = {}
    if major_ids:
        major_records = db.query(MajorProfile).filter(MajorProfile.id.in_(major_ids)).all()
        majors = {m.id: m.name for m in major_records}
    
    homeroom_teachers = {}
    if homeroom_ids:
        homeroom_records = db.query(HomeroomTeacherProfile).filter(HomeroomTeacherProfile.id.in_(homeroom_ids)).all()
        homeroom_teachers = {t.id: t.name for t in homeroom_records}
    
    # 获取授课教员信息（从 TeacherClassAssignment 获取 role='instructor' 的教员）
    instructors = {}
    if class_ids:
        instructor_assignments = db.query(
            TeacherClassAssignment.class_id,
            TeacherProfile.name
        ).join(
            TeacherProfile, TeacherClassAssignment.teacher_id == TeacherProfile.id
        ).filter(
            TeacherClassAssignment.class_id.in_(class_ids),
            TeacherClassAssignment.role == 'instructor',
            TeacherClassAssignment.is_primary == True
        ).all()
        for class_id, instructor_name in instructor_assignments:
            instructors[class_id] = instructor_name
    
    # 获取学制信息（从教员就业汇总表获取）
    program_lengths = {}
    if campus_name:
        class_names = [c.class_name for c in classes]
        if class_names:
            program_records = db.query(
                神殿后端教员就业汇总表.班级名称,
                神殿后端教员就业汇总表.学制
            ).filter(
                神殿后端教员就业汇总表.神殿 == campus_name,
                神殿后端教员就业汇总表.班级名称.in_(class_names),
                神殿后端教员就业汇总表.学制 != '',
                神殿后端教员就业汇总表.学制 != None
            ).distinct().all()
            for class_name, program_length in program_records:
                if class_name not in program_lengths and program_length:
                    program_lengths[class_name] = program_length
    
    # 构建返回结果
    result = []
    for c in classes:
        # 优先使用 ClassProfile 中存储的 major_name 和 homeroom_teacher_name
        major_name = getattr(c, 'major_name', None) or (majors.get(c.major_id) if c.major_id else None)
        homeroom_name = getattr(c, 'homeroom_teacher_name', None) or (homeroom_teachers.get(c.homeroom_teacher_id) if c.homeroom_teacher_id else None)
        # 优先使用 ClassProfile 中存储的 program_length
        prog_len = getattr(c, 'program_length', None) or program_lengths.get(c.class_name)
        
        class_dict = {
            "id": c.id,
            "class_code": c.class_code,
            "class_name": c.class_name,
            "campus_name": c.campus_name,
            "major_id": c.major_id,
            "major_name": major_name,
            "homeroom_teacher_id": c.homeroom_teacher_id,
            "homeroom_teacher_name": homeroom_name,
            "instructor_name": instructors.get(c.id),  # 授课教员
            "program_length": prog_len,  # 学制
            "status": c.status,
            "start_date": c.start_date,
            "end_date": c.end_date,
            "student_capacity": c.student_capacity,
            "is_active": c.is_active,
            "notes": c.notes,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        }
        result.append(class_dict)
    
    return result


def get_class(db: Session, class_id: int) -> Optional[ClassProfile]:
    return db.query(ClassProfile).filter_by(id=class_id).first()


def create_class(db: Session, data: ClassCreate) -> ClassProfile:
    obj = ClassProfile(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_class(db: Session, class_id: int, data: ClassUpdate) -> Optional[ClassProfile]:
    obj = get_class(db, class_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_class(db: Session, class_id: int) -> bool:
    obj = get_class(db, class_id)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Teacher-Class Assignments
# ---------------------------------------------------------------------------


def list_assignments(
    db: Session,
    teacher_id: Optional[int] = None,
    class_id: Optional[int] = None,
    active_only: bool = False,
) -> List[TeacherClassAssignment]:
    query = db.query(TeacherClassAssignment)
    if teacher_id:
        query = query.filter(TeacherClassAssignment.teacher_id == teacher_id)
    if class_id:
        query = query.filter(TeacherClassAssignment.class_id == class_id)
    if active_only:
        today = date.today()
        query = query.filter(
            or_(
                TeacherClassAssignment.end_date.is_(None),
                TeacherClassAssignment.end_date >= today,
            )
        )
    records = query.order_by(TeacherClassAssignment.teacher_id).all()

    # 补充 teacher_name / class_name 便于前端下拉展示（不改变表结构）
    teacher_ids = {r.teacher_id for r in records if r.teacher_id}
    class_ids = {r.class_id for r in records if r.class_id}

    teacher_name_by_id = {}
    class_name_by_id = {}
    if teacher_ids:
        for t in db.query(TeacherProfile).filter(TeacherProfile.id.in_(teacher_ids)).all():
            teacher_name_by_id[t.id] = t.name
    if class_ids:
        for c in db.query(ClassProfile).filter(ClassProfile.id.in_(class_ids)).all():
            class_name_by_id[c.id] = c.class_name

    for r in records:
        setattr(r, 'teacher_name', teacher_name_by_id.get(r.teacher_id))
        setattr(r, 'class_name', class_name_by_id.get(r.class_id))

    return records


def get_assignment(db: Session, assignment_id: int) -> Optional[TeacherClassAssignment]:
    return db.query(TeacherClassAssignment).filter_by(id=assignment_id).first()


def create_assignment(db: Session, data: AssignmentCreate) -> TeacherClassAssignment:
    obj = TeacherClassAssignment(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_assignment(
    db: Session, assignment_id: int, data: AssignmentUpdate
) -> Optional[TeacherClassAssignment]:
    obj = get_assignment(db, assignment_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_assignment(db: Session, assignment_id: int) -> bool:
    obj = get_assignment(db, assignment_id)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True


# ---------------------------------------------------------------------------
# Employee
# ---------------------------------------------------------------------------


def list_employees(
    db: Session,
    campus_name: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    name: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[EmployeeProfile]:
    query = db.query(EmployeeProfile)
    if campus_name:
        query = query.filter(EmployeeProfile.campus_name == campus_name)
    if department:
        query = query.filter(EmployeeProfile.department == department)
    if position:
        query = query.filter(EmployeeProfile.position == position)
    if name:
        query = query.filter(EmployeeProfile.name.ilike(f"%{name}%"))
    if is_active is not None:
        query = query.filter(EmployeeProfile.is_active == is_active)
    return query.order_by(EmployeeProfile.id).all()


def get_employee(db: Session, employee_id: int) -> Optional[EmployeeProfile]:
    return db.query(EmployeeProfile).filter_by(id=employee_id).first()


def create_employee(db: Session, data: EmployeeCreate) -> EmployeeProfile:
    obj = EmployeeProfile(**data.model_dump())
    return _commit_with_refresh(db, obj)


def update_employee(
    db: Session, employee_id: int, data: EmployeeUpdate
) -> Optional[EmployeeProfile]:
    obj = get_employee(db, employee_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(obj)
    return obj


def delete_employee(db: Session, employee_id: int) -> bool:
    obj = get_employee(db, employee_id)
    if not obj:
        return False
    db.delete(obj)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True
