"""
人力资源相关数据模型 - 员工主数据
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class EmployeeProfile(AccountBase):
    """员工管理业务主表"""

    __tablename__ = "employees"
    __table_args__ = (
        Index("idx_employees_campus_name", "campus_name"),
        Index("idx_employees_department", "department"),
        Index("idx_employees_user_id", "user_id"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="员工ID")
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        comment="关联用户ID",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="员工姓名")
    department: Mapped[str] = mapped_column(String(100), nullable=False, comment="部门")
    position: Mapped[str] = mapped_column(String(100), nullable=False, comment="职位")
    contact: Mapped[str] = mapped_column(String(100), nullable=False, comment="联系方式")
    campus_name: Mapped[str | None] = mapped_column(
        String(100),
        ForeignKey("config.campuses.name", ondelete="SET NULL"),
        nullable=True,
        comment="所属神殿名称",
    )
    labor_relation_company: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="劳动关系所属公司")
    actual_work_company: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="实际工作所在公司")
    position_category: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="岗位类别")
    position_nature_override: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="岗位性质手动覆盖值"
    )
    ethnicity: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="民族")
    native_place: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="籍贯")
    contract_sign_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="劳动合同签订日期")
    contract_end_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="劳动合同终止日期")
    id_number: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="身份证号")
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True, comment="出生日期")
    political_status: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="政治面貌")
    marital_status: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="婚姻状况")
    first_education: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="第一学历")
    first_major: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="第一学历专业")
    first_school: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="第一学历院校")
    first_remark: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="第一学历备注")
    second_education: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="第二学历")
    second_major: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="第二学历专业")
    second_school: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="第二学历院校")
    second_remark: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="第二学历备注")
    title_level: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="职称")
    hukou_address: Mapped[str | None] = mapped_column(Text, nullable=True, comment="户籍地址")
    current_address: Mapped[str | None] = mapped_column(Text, nullable=True, comment="现住址")
    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="紧急联系人姓名"
    )
    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="紧急联系人电话"
    )
    emergency_contact: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="紧急联系人")
    bank_account_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="银行卡开户姓名")
    bank_name: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="银行卡开户行")
    bank_card_number: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="银行卡号")
    base_salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment="基础薪资")
    performance_salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True, comment="绩效薪资")
    personnel_change: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="人事变动")
    reward_welfare: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="奖励福利")
    archive_remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="员工档案备注")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否在职")
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
        return f"<Employee(name={self.name}, department={self.department})>"
