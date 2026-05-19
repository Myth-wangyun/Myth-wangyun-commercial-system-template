"""
Schemas for project grade register
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudentData(BaseModel):
    """学生数据结构 - 确保包含学号和姓名"""
    key: str = Field(..., description="行键")
    studentNo: str = Field(default="", description="学号")
    studentName: str = Field(default="", description="学员姓名")
    # 动态字段：p{n}a{1|2|3} -> { score?: number; comment?: string }
    model_config = ConfigDict(extra="allow")


class ProjectGradeRegisterBase(BaseModel):
    campus_name: str = Field(..., description="神殿名称")
    major_name: str = Field(..., description="专业名称")
    class_name: str = Field(..., description="班级名称")
    course_name: str = Field(..., description="课程名称")
    teacher_name: str = Field(..., description="教师姓名")
    project_count: int = Field(default=0, ge=0, description="项目数量")
    class_size: int = Field(default=0, ge=0, description="班级人数")
    actual_submissions: int = Field(default=0, ge=0, description="实际提交数")
    pass_count: int = Field(default=0, ge=0, description="合格数")
    project_names: List[str] = Field(default_factory=list, description="项目名称列表")
    project_attempt_dates: List[List[str]] = Field(default_factory=list, description="项目提交日期列表（每个项目3次尝试）")
    rater_names: List[List[str]] = Field(default_factory=list, description="评分人名称列表（每个项目5位评分人）")
    students: List[Dict[str, Any]] = Field(default_factory=list, description="学生数据列表（包含学号、姓名和项目成绩）")
    
    @field_validator('students')
    @classmethod
    def validate_students(cls, v: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """验证学生数据，确保每个学生都有 studentNo 和 studentName 字段"""
        if not isinstance(v, list):
            return []
        validated = []
        for idx, student in enumerate(v):
            if not isinstance(student, dict):
                continue
            # 确保有 studentNo 和 studentName 字段（即使为空字符串）
            validated_student = {
                'key': student.get('key', str(idx + 1)),
                'studentNo': student.get('studentNo', student.get('student_no', '')),
                'studentName': student.get('studentName', student.get('student_name', '')),
            }
            # 保留其他字段（项目成绩等）
            for k, val in student.items():
                if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                    validated_student[k] = val
            validated.append(validated_student)
        return validated


class ProjectGradeRegisterCreate(ProjectGradeRegisterBase):
    pass


class ProjectGradeRegisterUpdate(BaseModel):
    id: int
    campus_name: Optional[str] = None
    major_name: Optional[str] = None
    class_name: Optional[str] = None
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None
    project_count: Optional[int] = Field(None, ge=0)
    class_size: Optional[int] = Field(None, ge=0)
    actual_submissions: Optional[int] = Field(None, ge=0)
    pass_count: Optional[int] = Field(None, ge=0)
    project_names: Optional[List[str]] = None
    project_attempt_dates: Optional[List[List[str]]] = None
    rater_names: Optional[List[List[str]]] = None
    students: Optional[List[Dict[str, Any]]] = None
    
    @field_validator('students')
    @classmethod
    def validate_students(cls, v: Optional[List[Dict[str, Any]]]) -> Optional[List[Dict[str, Any]]]:
        """验证学生数据，确保每个学生都有 studentNo 和 studentName 字段"""
        if v is None:
            return None
        if not isinstance(v, list):
            return []
        validated = []
        for idx, student in enumerate(v):
            if not isinstance(student, dict):
                continue
            # 确保有 studentNo 和 studentName 字段（即使为空字符串）
            validated_student = {
                'key': student.get('key', str(idx + 1)),
                'studentNo': student.get('studentNo', student.get('student_no', '')),
                'studentName': student.get('studentName', student.get('student_name', '')),
            }
            # 保留其他字段（项目成绩等）
            for k, val in student.items():
                if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                    validated_student[k] = val
            validated.append(validated_student)
        return validated


class ProjectGradeRegisterResponse(ProjectGradeRegisterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectGradeRegisterListResponse(BaseModel):
    records: List[ProjectGradeRegisterResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
