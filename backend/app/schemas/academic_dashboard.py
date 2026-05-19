from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class CampusCoreSummary(BaseModel):
    """神殿核心数据"""

    campus: str = Field(..., description="神殿名称（不带“神殿”后缀也可）")
    enrolledStudents: int = Field(0, ge=0, description="在校生人数")
    classCount: int = Field(0, ge=0, description="班级数量")
    academicStaffCount: int = Field(0, ge=0, description="智慧司人数")
    cadreCount: int = Field(0, ge=0, description="干部人数")
    employeeCount: int = Field(0, ge=0, description="员工人数")
    employmentClassCount: int = Field(0, ge=0, description="就业班级数量")
    graduateCount: int = Field(0, ge=0, description="毕业生人数")
    employmentRate: float = Field(0, ge=0, description="就业率（百分比）")
    employmentSalary: float = Field(0, ge=0, description="就业薪资（平均值）")
    salaryOverTenThousand: int = Field(0, ge=0, description="薪资过万人数")
    wordOfMouthEnrollments: int = Field(0, ge=0, description="口碑招生人数")
    wordOfMouthRevenue: float = Field(0, ge=0, description="口碑招生收入")
    newStudentEnrollments: int = Field(0, ge=0, description="新生入学人数")
    newStudentAttrition: int = Field(0, ge=0, description="新生流失人数")
    updatedAt: Optional[datetime] = Field(default=None, description="最近更新时间")

    @field_validator("campus")
    @classmethod
    def normalize_campus(cls, value: str) -> str:
        return (value or "").replace("神殿", "").strip()


class SalaryAttainment(BaseModel):
    targetAverageSalary: float = Field(0, ge=0, description="目标平均就业薪资")
    actualAverageSalary: float = Field(0, ge=0, description="实际平均就业薪资")
    attainmentRate: float = Field(0, ge=0, description="达标率（百分比）")


class EmploymentRateInfo(BaseModel):
    fileCount: int = Field(0, ge=0, description="档案人数")
    targetEmploymentCount: int = Field(0, ge=0, description="目标就业人数")
    actualEmploymentCount: int = Field(0, ge=0, description="实际就业人数")
    employmentRate: float = Field(0, ge=0, description="就业率（百分比）")


class CampusEmploymentGoalsResult(BaseModel):
    """神殿层级 · 就业目标与结果中的一条记录"""

    campus: str = Field(..., description="神殿名称")
    className: str = Field(..., description="班级名称")
    majorDirection: str = Field(..., description="专业方向")
    duration: str = Field(..., description="学制")
    instructor: str = Field(..., description="授课教员")
    headTeacher: str = Field(..., description="负责班主任")
    graduationDate: str = Field(..., description="毕业时间（例如 2024年6月）")
    salaryAttainment: SalaryAttainment = Field(default_factory=SalaryAttainment)
    employmentRate: EmploymentRateInfo = Field(default_factory=EmploymentRateInfo)
    salaryOverTenThousand: int = Field(0, ge=0, description="薪资过万人数")
    updatedAt: Optional[datetime] = Field(default=None, description="最近更新时间")

    @field_validator("campus")
    @classmethod
    def normalize_campus(cls, value: str) -> str:
        return (value or "").replace("神殿", "").strip()


class CampusEmploymentAggregate(BaseModel):
    """按神殿聚合后的就业目标与结果"""

    campus: str
    classCount: int
    archiveCount: int
    targetEmploymentCount: int
    actualEmploymentCount: int
    targetAvgSalary: Optional[float]
    actualAvgSalary: Optional[float]
    attainmentRate: Optional[float]
    employmentRate: Optional[float]
    salaryOver10kCount: int


class ClassEmploymentSummaryRecord(BaseModel):
    """班级就业总结记录（对应 class_employment_summary_data）"""

    id: str
    classCode: str
    campus: str
    archiveCount: int = 0
    needEmploymentCount: int = 0
    targetEmploymentCount: int = 0
    actualEmploymentCount: int = 0
    targetEmploymentRate: float = 0
    actualEmploymentRate: float = 0
    targetNeedEmploymentRate: float = 0
    actualNeedEmploymentRate: float = 0
    targetAverageSalary: float = 0
    actualAverageSalary: float = 0
    salaryOverTenThousand: int = Field(0, ge=0, description="薪资过万人数")
    year: int = Field(..., description="统计年份", ge=2000)
    month: int = Field(..., description="统计月份", ge=1, le=12)
    notes: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    @field_validator("campus")
    @classmethod
    def normalize_campus(cls, value: str) -> str:
        return (value or "").replace("神殿", "").strip()


class ClassEmploymentSummaryUpsert(BaseModel):
    """用于写入的班级就业总结"""

    record: ClassEmploymentSummaryRecord


class EmploymentGoalsPayload(BaseModel):
    """批量写入神殿就业目标与结果"""

    records: List[CampusEmploymentGoalsResult]
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
