"""
CRUD for project grade register
"""

from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.project_grade_register import ProjectGradeRegister


def list_registers(
    db: Session,
    campus_name: Optional[str] = None,
    class_name: Optional[str] = None,
    major_name: Optional[str] = None,
    course_name: Optional[str] = None,
    teacher_name: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[ProjectGradeRegister], int]:
    query = db.query(ProjectGradeRegister)
    if campus_name:
        query = query.filter(ProjectGradeRegister.campus_name == campus_name)
    if class_name:
        query = query.filter(ProjectGradeRegister.class_name == class_name)
    if major_name:
        query = query.filter(ProjectGradeRegister.major_name == major_name)
    if course_name:
        query = query.filter(ProjectGradeRegister.course_name == course_name)
    if teacher_name:
        query = query.filter(ProjectGradeRegister.teacher_name == teacher_name)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            func.lower(ProjectGradeRegister.course_name).like(func.lower(pattern))
            | func.lower(ProjectGradeRegister.teacher_name).like(func.lower(pattern))
            | func.lower(ProjectGradeRegister.major_name).like(func.lower(pattern))
            | func.lower(ProjectGradeRegister.class_name).like(func.lower(pattern))
        )
    total = query.count()
    records = (
        query.order_by(ProjectGradeRegister.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return records, total


def create_register(db: Session, data: dict) -> ProjectGradeRegister:
    # 确保 students 数据格式正确
    if 'students' in data and isinstance(data['students'], list):
        normalized_students = []
        for idx, student in enumerate(data['students']):
            if not isinstance(student, dict):
                continue
            # 标准化字段名：确保使用 studentNo 和 studentName
            normalized_student = {
                'key': student.get('key', str(idx + 1)),
                'studentNo': student.get('studentNo', student.get('student_no', '')),
                'studentName': student.get('studentName', student.get('student_name', '')),
            }
            # 保留其他字段（项目成绩等）
            for k, v in student.items():
                if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                    normalized_student[k] = v
            normalized_students.append(normalized_student)
        data['students'] = normalized_students
    
    record = ProjectGradeRegister(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_register(db: Session, record_id: int, data: dict) -> Optional[ProjectGradeRegister]:
    record = db.get(ProjectGradeRegister, record_id)
    if not record:
        return None
    
    # 如果更新 students 数据，确保格式正确
    if 'students' in data and isinstance(data['students'], list):
        normalized_students = []
        for idx, student in enumerate(data['students']):
            if not isinstance(student, dict):
                continue
            # 标准化字段名：确保使用 studentNo 和 studentName
            normalized_student = {
                'key': student.get('key', str(idx + 1)),
                'studentNo': student.get('studentNo', student.get('student_no', '')),
                'studentName': student.get('studentName', student.get('student_name', '')),
            }
            # 保留其他字段（项目成绩等）
            for k, v in student.items():
                if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                    normalized_student[k] = v
            normalized_students.append(normalized_student)
        data['students'] = normalized_students
    
    for key, value in data.items():
        if value is not None and hasattr(record, key):
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


def delete_register(db: Session, record_id: int) -> bool:
    record = db.get(ProjectGradeRegister, record_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
