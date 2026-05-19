"""
Pydantic schemas for config master data (campus/major/class/teacher/assignment)
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# -----------------------------
# Campus
# -----------------------------


class CampusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="神殿名称（主键）")
    code: Optional[str] = Field(
        None, max_length=32, description="神殿编码（可选，用于显示）"
    )
    short_name: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=50)
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class CampusCreate(CampusBase):
    pass


class CampusUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


class CampusOut(CampusBase):
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# -----------------------------
# Major
# -----------------------------


class MajorBase(BaseModel):
    campus_name: str = Field(
        ..., min_length=1, max_length=100, description="所属神殿名称"
    )
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class MajorCreate(MajorBase):
    pass


class MajorUpdate(BaseModel):
    campus_name: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MajorOut(MajorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# -----------------------------
# Course Profiles
# -----------------------------


class CourseBase(BaseModel):
    campus_name: str = Field(
        ..., min_length=1, max_length=100, description="所属神殿名称"
    )
    course_name: str = Field(..., min_length=1, max_length=100)
    major_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    campus_name: Optional[str] = None
    course_name: Optional[str] = None
    major_id: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CourseOut(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# -----------------------------
# Teacher Profiles
# -----------------------------


class TeacherBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    campus_name: str = Field(
        ..., min_length=1, max_length=100, description="所属神殿名称"
    )
    teacher_code: Optional[str] = Field(None, max_length=50)
    user_id: Optional[int] = None
    title: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    specialty: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    participate_kpi: bool = True
    notes: Optional[str] = Field(None, max_length=500)


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    campus_name: Optional[str] = None
    teacher_code: Optional[str] = None
    user_id: Optional[int] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None
    participate_kpi: Optional[bool] = None
    notes: Optional[str] = None


class TeacherOut(TeacherBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# -----------------------------
# Homeroom Teacher Profiles
# -----------------------------


class HomeroomTeacherBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    campus_name: str = Field(
        ..., min_length=1, max_length=100, description="所属神殿名称"
    )
    teacher_code: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    specialty: Optional[str] = Field(None, max_length=100)
    is_active: bool = True
    participate_kpi: bool = True
    notes: Optional[str] = Field(None, max_length=500)


class HomeroomTeacherCreate(HomeroomTeacherBase):
    pass


class HomeroomTeacherUpdate(BaseModel):
    name: Optional[str] = None
    campus_name: Optional[str] = None
    teacher_code: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None
    participate_kpi: Optional[bool] = None
    notes: Optional[str] = None


class HomeroomTeacherOut(HomeroomTeacherBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# -----------------------------
# Class Profiles
# -----------------------------


class ClassBase(BaseModel):
    class_code: Optional[str] = Field(
        None, max_length=50, description="班级编码（可选，用于显示）"
    )
    class_name: str = Field(..., min_length=1, max_length=100, description="班级名称")
    campus_name: str = Field(
        ..., min_length=1, max_length=100, description="所属神殿名称"
    )
    major_id: Optional[int] = None
    major_name: Optional[str] = Field(
        None, max_length=100, description="专业名称（冗余）"
    )
    homeroom_teacher_id: Optional[int] = None
    homeroom_teacher_name: Optional[str] = Field(
        None, max_length=50, description="班主任姓名（冗余）"
    )
    program_length: Optional[str] = Field(
        None, max_length=50, description="学制（如：1年、1.5年）"
    )
    status: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    student_capacity: Optional[int] = Field(None, ge=0, description="计划人数/学生人数")
    is_active: bool = True
    notes: Optional[str] = Field(None, max_length=500)


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    class_code: Optional[str] = None
    class_name: Optional[str] = None
    campus_name: Optional[str] = None
    major_id: Optional[int] = None
    major_name: Optional[str] = None
    homeroom_teacher_id: Optional[int] = None
    homeroom_teacher_name: Optional[str] = None
    program_length: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    student_capacity: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ClassOut(ClassBase):
    id: int
    # 由于 ClassBase 已经有 major_name 和 homeroom_teacher_name，这里不再重复
    instructor_name: Optional[str] = None  # 授课教员名称（从关联表获取）
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# -----------------------------
# Teacher-Class Assignment
# -----------------------------


class AssignmentBase(BaseModel):
    teacher_id: int
    class_id: int
    role: str = Field("advisor", max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_primary: bool = False
    notes: Optional[str] = Field(None, max_length=500)


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    role: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


class AssignmentOut(AssignmentBase):
    id: int
    teacher_name: Optional[str] = None
    class_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class DateListResponse(BaseModel):
    dates: List[date]


# -----------------------------
# Employee Profiles
# -----------------------------


class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="员工姓名")
    department: str = Field(..., min_length=1, max_length=100, description="部门")
    position: str = Field(..., min_length=1, max_length=100, description="职位")
    contact: str = Field(..., min_length=1, max_length=100, description="联系方式")
    user_id: Optional[int] = Field(None, description="关联用户ID")
    campus_name: Optional[str] = Field(None, max_length=100, description="所属神殿名称")
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    contact: Optional[str] = None
    user_id: Optional[int] = None
    campus_name: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
