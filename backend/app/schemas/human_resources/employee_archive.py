from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


POSITION_CATEGORY_VALUES = {"干部", "员工"}
POSITION_NATURE_OVERRIDE_VALUES = {"正式"}


class EmployeeArchiveOptionsOut(BaseModel):
    departments: list[str] = Field(default_factory=list)
    positions: list[str] = Field(default_factory=list)
    position_categories: list[str] = Field(default_factory=list)


class EmployeeArchiveUpsert(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    position: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=100)
    gender: Optional[str] = Field(default=None, max_length=20)
    entry_date: Optional[date] = None
    labor_relation_company: Optional[str] = Field(default=None, max_length=100)
    actual_work_company: Optional[str] = Field(default=None, max_length=100)
    position_category: Optional[str] = Field(default=None, max_length=20)
    position_nature: Optional[str] = Field(default=None, max_length=20)
    ethnicity: Optional[str] = Field(default=None, max_length=20)
    native_place: Optional[str] = Field(default=None, max_length=100)
    contract_sign_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    id_number: Optional[str] = Field(default=None, max_length=50)
    birth_date: Optional[date] = None
    political_status: Optional[str] = Field(default=None, max_length=50)
    marital_status: Optional[str] = Field(default=None, max_length=20)
    first_education: Optional[str] = Field(default=None, max_length=50)
    first_major: Optional[str] = Field(default=None, max_length=100)
    first_school: Optional[str] = Field(default=None, max_length=200)
    first_remark: Optional[str] = Field(default=None, max_length=200)
    second_education: Optional[str] = Field(default=None, max_length=50)
    second_major: Optional[str] = Field(default=None, max_length=100)
    second_school: Optional[str] = Field(default=None, max_length=200)
    second_remark: Optional[str] = Field(default=None, max_length=200)
    title_level: Optional[str] = Field(default=None, max_length=100)
    hukou_address: Optional[str] = None
    current_address: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=50)
    emergency_contact: Optional[str] = Field(default=None, max_length=200)
    bank_account_name: Optional[str] = Field(default=None, max_length=100)
    bank_name: Optional[str] = Field(default=None, max_length=200)
    bank_card_number: Optional[str] = Field(default=None, max_length=100)
    base_salary: Optional[Decimal] = None
    performance_salary: Optional[Decimal] = None
    personnel_change: Optional[str] = Field(default=None, max_length=200)
    reward_welfare: Optional[str] = Field(default=None, max_length=200)
    archive_remark: Optional[str] = None

    @field_validator("position_category")
    @classmethod
    def validate_position_category(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if normalized not in POSITION_CATEGORY_VALUES:
            raise ValueError("岗位类别仅支持：干部、员工")
        return normalized

    @field_validator("position_nature")
    @classmethod
    def validate_position_nature(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            return None
        if normalized not in POSITION_NATURE_OVERRIDE_VALUES:
            raise ValueError("岗位性质手动设置仅支持：正式")
        return normalized


class EmployeeArchiveOut(BaseModel):
    id: Optional[int] = None
    user_id: int
    username: str
    campus_name: Optional[str] = None
    name: str
    department: str
    position: str
    position_category: Optional[str] = None
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    phone: Optional[str] = None
    native_place: Optional[str] = None
    entry_date: Optional[date] = None
    labor_relation_company: Optional[str] = None
    actual_work_company: Optional[str] = None
    contract_sign_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    insurance_start_date: Optional[date] = None
    position_nature: Optional[str] = None
    leave_date: Optional[date] = None
    id_number: Optional[str] = None
    birth_date: Optional[date] = None
    political_status: Optional[str] = None
    marital_status: Optional[str] = None
    first_education: Optional[str] = None
    first_major: Optional[str] = None
    first_school: Optional[str] = None
    first_remark: Optional[str] = None
    second_education: Optional[str] = None
    second_major: Optional[str] = None
    second_school: Optional[str] = None
    second_remark: Optional[str] = None
    title_level: Optional[str] = None
    hukou_address: Optional[str] = None
    current_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_card_number: Optional[str] = None
    base_salary: Optional[Decimal] = None
    performance_salary: Optional[Decimal] = None
    personnel_change: Optional[str] = None
    reward_welfare: Optional[str] = None
    archive_remark: Optional[str] = None
    user_status: str
    can_edit: bool
    can_edit_hr_fields: bool
    can_edit_self_fields: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class EmployeeArchiveChangeLogOut(BaseModel):
    id: int
    employee_id: int
    field_name: str
    field_label: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    change_source: str
    change_source_label: str
    source_record_id: Optional[int] = None
    changed_by_user_id: Optional[int] = None
    changed_by_name: Optional[str] = None
    created_at: datetime


class EmployeeArchiveSelfOut(EmployeeArchiveOut):
    pass
