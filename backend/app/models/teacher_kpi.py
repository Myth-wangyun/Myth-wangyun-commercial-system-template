"""
Teacher KPI templates and result models
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TeacherKPITemplate(AccountBase):
    """模板定义（config schema）"""

    __tablename__ = "teacher_kpi_templates"
    __table_args__ = {"schema": "config"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="模板ID")
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="教员", comment="适用角色")
    indicator: Mapped[str] = mapped_column(String(200), nullable=False, comment="KPI 指标")
    formula: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="计算细则")
    data_source: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="数据来源/考核人")
    default_weight: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="默认权重")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<TeacherKPITemplate(role={self.role}, indicator={self.indicator})>"


class TeacherKPIResult(AccountBase):
    """教师 KPI 结果（academic schema）"""

    __tablename__ = "teacher_kpi_results"
    __table_args__ = (
        Index(
            "idx_kpi_result_unique",
            "campus_name",
            "year",
            "month",
            "teacher_id",
            "indicator",
            unique=False,
        ),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    teacher_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("config.teacher_profiles.id", ondelete="SET NULL"),
        nullable=True,
        comment="教员ID",
    )
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="教员姓名")
    role: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="岗位/角色")
    template_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("config.teacher_kpi_templates.id", ondelete="SET NULL"),
        nullable=True,
        comment="关联模板ID",
    )
    indicator: Mapped[str] = mapped_column(String(200), nullable=False, comment="KPI指标")
    formula: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="计算细则")
    data_source: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="数据来源/考核人")
    weight: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="权重(%)")
    score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="得分")
    kpi_value: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="KPI值")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<TeacherKPIResult(teacher={self.teacher_name}, year={self.year}, month={self.month})>"


class TeacherKPIAssessment(AccountBase):
    """教师 KPI 考核数据（academic schema）"""

    __tablename__ = "teacher_kpi_assessments"
    __table_args__ = (
        Index(
            "idx_kpi_assessment_unique",
            "campus_name",
            "year",
            "month",
            "teacher_name",
            unique=True,
        ),
        {"schema": "academic"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="神殿名称")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    month: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    teacher_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="教员姓名")
    department_performance: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, comment="部门业绩")
    assignment_submit_rate: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="作业/项目提交率")
    assignment_pass_rate: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="作业/项目合格率")
    exam_pass_rate: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="考试合格率")
    employment_count: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="学员就业人数")
    employment_salary: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, comment="平均就业薪资")
    attendance_rate: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="全勤率")
    old_student_loss: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="老生流失")
    new_student_loss: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="新生流失")
    satisfaction: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="学员满意度")
    recruitment_completion: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="招聘/工作完成率")
    wechat_moments: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="朋友圈转发")
    kuaishou_shares: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="快手转发")
    douyin_shares: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="抖音转发")
    new_media_total: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="新媒体转发合计")
    leader_review: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="领导评价")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    def __repr__(self) -> str:
        return f"<TeacherKPIAssessment(teacher={self.teacher_name}, year={self.year}, month={self.month})>"
