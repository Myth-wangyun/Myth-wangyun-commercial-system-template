"""
Endpoints for project grade register
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import project_grade_register as crud
from ....schemas.project_grade_register import (
    ProjectGradeRegisterCreate,
    ProjectGradeRegisterListResponse,
    ProjectGradeRegisterResponse,
    ProjectGradeRegisterUpdate,
)

router = APIRouter()


@router.get("/", response_model=ProjectGradeRegisterListResponse, summary="获取项目成绩表列表")
def list_registers(
    campus_name: str | None = Query(None, description="神殿名称"),
    class_name: str | None = Query(None, description="班级名称"),
    major_name: str | None = Query(None, description="专业名称"),
    course_name: str | None = Query(None, description="课程名称"),
    teacher_name: str | None = Query(None, description="教师姓名"),
    search: str | None = Query(None, description="搜索课程/教师/学员"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    records, total = crud.list_registers(
        db,
        campus_name=campus_name,
        class_name=class_name,
        major_name=major_name,
        course_name=course_name,
        teacher_name=teacher_name,
        search=search,
        page=page,
        page_size=page_size,
    )
    
    # 标准化 students 数据，确保旧数据也能正常返回
    normalized_records = []
    for r in records:
        try:
            # 标准化 students 数据
            normalized_students = []
            if hasattr(r, 'students') and r.students and isinstance(r.students, list):
                for idx, student in enumerate(r.students):
                    if not isinstance(student, dict):
                        continue
                    # 确保有 studentNo 和 studentName 字段
                    normalized_student = {
                        'key': student.get('key', str(idx + 1)),
                        'studentNo': student.get('studentNo', student.get('student_no', '')),
                        'studentName': student.get('studentName', student.get('student_name', '')),
                    }
                    # 保留其他字段
                    for k, v in student.items():
                        if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                            normalized_student[k] = v
                    normalized_students.append(normalized_student)
            
            # 标准化所有字段，确保格式正确
            # 标准化 project_names
            normalized_project_names = []
            if isinstance(r.project_names, list):
                normalized_project_names = [str(item) for item in r.project_names if item is not None]
            
            # 标准化 project_attempt_dates - 确保是 List[List[str]]
            normalized_project_attempt_dates = []
            if isinstance(r.project_attempt_dates, list):
                for item in r.project_attempt_dates:
                    if isinstance(item, list):
                        # 已经是列表，转换为字符串列表
                        normalized_project_attempt_dates.append([str(subitem) for subitem in item if subitem is not None])
                    elif item is not None:
                        # 不是列表，尝试转换
                        normalized_project_attempt_dates.append([str(item)])
            
            # 标准化 rater_names - 确保是 List[List[str]]
            normalized_rater_names = []
            if isinstance(r.rater_names, list):
                for item in r.rater_names:
                    if isinstance(item, list):
                        # 已经是列表，转换为字符串列表
                        normalized_rater_names.append([str(subitem) for subitem in item if subitem is not None])
                    elif item is not None:
                        # 不是列表，尝试转换
                        normalized_rater_names.append([str(item)])
            
            # 创建响应对象，使用标准化后的所有字段
            record_dict = {
                'id': r.id,
                'campus_name': str(r.campus_name) if r.campus_name else '',
                'major_name': str(r.major_name) if r.major_name else '',
                'class_name': str(r.class_name) if r.class_name else '',
                'course_name': str(r.course_name) if r.course_name else '',
                'teacher_name': str(r.teacher_name) if r.teacher_name else '',
                'project_count': int(r.project_count) if r.project_count is not None else 0,
                'class_size': int(r.class_size) if r.class_size is not None else 0,
                'actual_submissions': int(r.actual_submissions) if r.actual_submissions is not None else 0,
                'pass_count': int(r.pass_count) if r.pass_count is not None else 0,
                'project_names': normalized_project_names,
                'project_attempt_dates': normalized_project_attempt_dates,
                'rater_names': normalized_rater_names,
                'students': normalized_students,
                'created_at': r.created_at,
                'updated_at': r.updated_at,
            }
            normalized_records.append(ProjectGradeRegisterResponse(**record_dict))
        except Exception as e:
            # 如果转换失败，记录错误但继续处理其他记录
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"转换记录 {r.id} 失败: {str(e)}", exc_info=True)
            # 跳过这条记录，避免影响其他数据的加载
            continue
    
    return ProjectGradeRegisterListResponse(
        records=normalized_records,
        total=total,
        page=page,
        page_size=page_size,
    )


def _normalize_record(r) -> dict:
    """标准化单条记录数据"""
    # 标准化 students 数据
    normalized_students = []
    if hasattr(r, 'students') and r.students and isinstance(r.students, list):
        for idx, student in enumerate(r.students):
            if not isinstance(student, dict):
                continue
            normalized_student = {
                'key': student.get('key', str(idx + 1)),
                'studentNo': student.get('studentNo', student.get('student_no', '')),
                'studentName': student.get('studentName', student.get('student_name', '')),
            }
            for k, v in student.items():
                if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                    normalized_student[k] = v
            normalized_students.append(normalized_student)
    
    # 标准化 project_names
    normalized_project_names = []
    if isinstance(r.project_names, list):
        normalized_project_names = [str(item) for item in r.project_names if item is not None]
    
    # 标准化 project_attempt_dates - 确保是 List[List[str]]
    normalized_project_attempt_dates = []
    if isinstance(r.project_attempt_dates, list):
        for item in r.project_attempt_dates:
            if isinstance(item, list):
                normalized_project_attempt_dates.append([str(subitem) if subitem else '' for subitem in item])
            elif item is not None:
                normalized_project_attempt_dates.append([str(item)])
            else:
                normalized_project_attempt_dates.append(['', '', ''])
    
    # 标准化 rater_names - 确保是 List[List[str]]
    normalized_rater_names = []
    if isinstance(r.rater_names, list):
        for item in r.rater_names:
            if isinstance(item, list):
                normalized_rater_names.append([str(subitem) if subitem else '' for subitem in item])
            elif item is not None:
                normalized_rater_names.append([str(item)])
    
    return {
        'id': r.id,
        'campus_name': str(r.campus_name) if r.campus_name else '',
        'major_name': str(r.major_name) if r.major_name else '',
        'class_name': str(r.class_name) if r.class_name else '',
        'course_name': str(r.course_name) if r.course_name else '',
        'teacher_name': str(r.teacher_name) if r.teacher_name else '',
        'project_count': int(r.project_count) if r.project_count is not None else 0,
        'class_size': int(r.class_size) if r.class_size is not None else 0,
        'actual_submissions': int(r.actual_submissions) if r.actual_submissions is not None else 0,
        'pass_count': int(r.pass_count) if r.pass_count is not None else 0,
        'project_names': normalized_project_names,
        'project_attempt_dates': normalized_project_attempt_dates,
        'rater_names': normalized_rater_names,
        'students': normalized_students,
        'created_at': r.created_at,
        'updated_at': r.updated_at,
    }


@router.post("/", response_model=ProjectGradeRegisterResponse, summary="创建项目成绩表")
def create_register(payload: ProjectGradeRegisterCreate, db: Session = Depends(get_db)):
    record = crud.create_register(db, payload.model_dump())
    return ProjectGradeRegisterResponse(**_normalize_record(record))


@router.put("/", response_model=ProjectGradeRegisterResponse, summary="更新项目成绩表")
def update_register(payload: ProjectGradeRegisterUpdate, db: Session = Depends(get_db)):
    record = crud.update_register(db, payload.id, payload.model_dump(exclude={"id"}))
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return ProjectGradeRegisterResponse(**_normalize_record(record))


@router.delete("/", summary="删除项目成绩表")
def delete_register(id: int, db: Session = Depends(get_db)):
    ok = crud.delete_register(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
