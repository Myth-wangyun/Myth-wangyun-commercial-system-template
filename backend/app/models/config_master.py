"""
配置主数据：神殿、专业、班级、教员以及教员班级关联（config schema）
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class CampusProfile(AccountBase):
    """神殿基础信息"""

    __tablename__ = "campuses"
    __table_args__ = {"schema": "config"}

    name: Mapped[str] = mapped_column(String(100), primary_key=True, comment="神殿名称，唯一主键")
    code: Mapped[str | None] = mapped_column(String(32), nullable=True, comment="神殿编码（可选，用于显示）")
    short_name: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="神殿简称")
    city: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="所在城市")
    address: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="详细地址")
    contact_name: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="联系人")
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="联系人电话")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<Campus(name={self.name})>"


class MajorProfile(AccountBase):
    """专业定义，每个神殿可以维护多条"""

    __tablename__ = "majors"
    __table_args__ = (
        UniqueConstraint("campus_name", "name", name="uq_majors_campus_name"),
        Index("idx_majors_campus_name", "campus_name"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="主键")
    campus_name: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("config.campuses.name", ondelete="CASCADE"),
        nullable=False,
        comment="所属神殿名称",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="专业名称")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="专业说明")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<Major(name={self.name}, campus={self.campus_name})>"


class CourseProfile(AccountBase):
    """课程定义，可按神殿和专业维护"""

    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("campus_name", "course_name", name="uq_courses_campus_name_course"),
        Index("idx_courses_campus_name", "campus_name"),
        Index("idx_courses_major", "major_id"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="课程ID")
    campus_name: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("config.campuses.name", ondelete="CASCADE"),
        nullable=False,
        comment="所属神殿名称",
    )
    major_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("config.majors.id", ondelete="SET NULL"),
        nullable=True,
        comment="关联专业ID",
    )
    course_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="课程名称")
    description: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="课程描述")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<Course(name={self.course_name}, campus={self.campus_name})>"


class ClassProfile(AccountBase):
    """班级定义，与神殿和专业关联（同时与 teaching_quality.班级列表 同步）"""

    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint("campus_name", "class_name", name="uq_classes_campus_name"),
        Index("idx_classes_campus_name", "campus_name"),
        Index("idx_classes_major", "major_id"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="班级ID")
    class_code: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班级编码（可选，用于显示）")
    class_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="班级名称")
    campus_name: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("config.campuses.name", ondelete="CASCADE"),
        nullable=False,
        comment="所属神殿名称",
    )
    major_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("config.majors.id", ondelete="SET NULL"),
        nullable=True,
        comment="所属专业ID",
    )
    # 专业名称（冗余存储，方便同步到班级档案表）
    major_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="专业名称")
    status: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班级状态（在读/结业等）")
    homeroom_teacher_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("config.homeroom_teachers.id", ondelete="SET NULL"),
        nullable=True,
        comment="班主任ID",
    )
    # 班主任姓名（冗余存储，方便同步到班级档案表）
    homeroom_teacher_name: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班主任姓名")
    # 学制（与班级档案表同步）
    program_length: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="学制（如：1年、1.5年、两年制）")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="开班日期")
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="结课日期")
    student_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="计划人数/学生人数")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="备注")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<Class(name={self.class_name}, campus={self.campus_name})>"


class TeacherProfile(AccountBase):
    """教员定义，可关联 users 表"""

    __tablename__ = "teacher_profiles"
    __table_args__ = (
        UniqueConstraint("teacher_code", name="uq_teacher_profiles_code"),
        UniqueConstraint("user_id", name="uq_teacher_profiles_user_id"),
        Index("idx_teacher_profiles_campus_name", "campus_name"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="教员ID")
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="关联用户ID",
    )
    teacher_code: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="教员编码/工号（可选）")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="教员姓名")
    campus_name: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("config.campuses.name", ondelete="SET NULL"),
        nullable=False,
        comment="所属神殿名称",
    )
    title: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="职位/职称")
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="联系方式")
    email: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="邮箱")
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="专业方向")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否在职")
    participate_kpi: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, comment="是否参与KPI考核"
    )
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="备注")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<Teacher(name={self.name}, campus={self.campus_name})>"


class HomeroomTeacherProfile(AccountBase):
    """班主任定义（独立表）"""

    __tablename__ = "homeroom_teachers"
    __table_args__ = (
        Index("idx_homeroom_teachers_campus_name", "campus_name"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="班主任ID")
    teacher_code: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班主任编码/工号（可选）")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="班主任姓名")
    campus_name: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("config.campuses.name", ondelete="SET NULL"),
        nullable=False,
        comment="所属神殿名称",
    )
    title: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="职位/职称")
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="联系方式")
    email: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="邮箱")
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="专业方向")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否在职")
    participate_kpi: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, comment="是否参与KPI考核"
    )
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="备注")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<HomeroomTeacher(name={self.name}, campus={self.campus_name})>"


class TeacherClassAssignment(AccountBase):
    """教员与班级的关联（班主任、任课教师等）"""

    __tablename__ = "teacher_class_assignments"
    __table_args__ = (
        UniqueConstraint(
            "teacher_id",
            "class_id",
            "role",
            name="uq_teacher_class_role",
        ),
        Index("idx_teacher_class_teacher", "teacher_id"),
        Index("idx_teacher_class_class", "class_id"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="关联ID")
    teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.teacher_profiles.id", ondelete="CASCADE"),
        nullable=False,
        comment="教员ID",
    )
    class_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.classes.id", ondelete="CASCADE"),
        nullable=False,
        comment="班级ID",
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="advisor", comment="角色/职责")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="开始日期")
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="结束日期")
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="是否负责强化")
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="备注")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<TeacherClass(teacher={self.teacher_id}, class={self.class_id}, role={self.role})>"

