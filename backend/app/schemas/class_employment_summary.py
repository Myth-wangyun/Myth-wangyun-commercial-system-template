"""
班级就业总结Pydantic模型
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class 班级就业总结创建(BaseModel):
    """创建班级就业总结模型"""

    神殿: str = Field(..., description="所属神殿")
    班级名称: str = Field(..., description="班级名称")
    年份: int = Field(..., description="年份")
    月份: int = Field(..., description="月份")
    档案人数: int = Field(0, description="档案人数")
    需就业人数: int = Field(0, description="需就业人数")
    目标就业人数: int = Field(0, description="目标就业人数")
    实际就业人数: int = Field(0, description="实际就业人数")
    目标就业率: Decimal = Field(Decimal("100"), description="目标就业率(%)")
    实际就业率: Decimal = Field(Decimal("0"), description="实际就业率(%)")
    目标需就业率: Decimal = Field(Decimal("100"), description="目标需就业率(%)")
    实际需就业率: Decimal = Field(Decimal("0"), description="实际需就业率(%)")
    目标平均薪资: Decimal = Field(Decimal("0"), description="目标平均薪资(元)")
    实际平均薪资: Decimal = Field(Decimal("0"), description="实际平均薪资(元)")
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班级就业总结更新(BaseModel):
    """更新班级就业总结模型"""

    神殿: Optional[str] = None
    班级名称: Optional[str] = None
    年份: Optional[int] = None
    月份: Optional[int] = None
    档案人数: Optional[int] = None
    需就业人数: Optional[int] = None
    目标就业人数: Optional[int] = None
    实际就业人数: Optional[int] = None
    目标就业率: Optional[Decimal] = None
    实际就业率: Optional[Decimal] = None
    目标需就业率: Optional[Decimal] = None
    实际需就业率: Optional[Decimal] = None
    目标平均薪资: Optional[Decimal] = None
    实际平均薪资: Optional[Decimal] = None
    备注: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班级就业总结响应(BaseModel):
    """班级就业总结响应模型"""

    总结ID: int
    神殿: str
    班级名称: str
    年份: int
    月份: int
    档案人数: int
    需就业人数: int
    目标就业人数: int
    实际就业人数: int
    目标就业率: float
    实际就业率: float
    目标需就业率: float
    实际需就业率: float
    目标平均薪资: float
    实际平均薪资: float
    备注: Optional[str]
    创建时间: Optional[datetime]
    更新时间: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班级就业总结Upsert(BaseModel):
    """班级就业总结Upsert模型（支持英文字段格式）"""

    id: Optional[str] = None
    classCode: str = Field(..., description="班级名称")
    campus: str = Field(..., description="神殿")
    year: int = Field(..., description="年份")
    month: int = Field(..., description="月份")
    archiveCount: int = Field(0, description="档案人数")
    needEmploymentCount: int = Field(0, description="需就业人数")
    targetEmploymentCount: int = Field(0, description="目标就业人数")
    actualEmploymentCount: int = Field(0, description="实际就业人数")
    targetEmploymentRate: Decimal = Field(Decimal("0"), description="目标就业率(%)")
    actualEmploymentRate: Decimal = Field(Decimal("0"), description="实际就业率(%)")
    targetNeedEmploymentRate: Decimal = Field(Decimal("0"), description="目标需就业率(%)")
    actualNeedEmploymentRate: Decimal = Field(Decimal("0"), description="实际需就业率(%)")
    targetAverageSalary: Decimal = Field(Decimal("0"), description="目标平均薪资(元)")
    actualAverageSalary: Decimal = Field(Decimal("0"), description="实际平均薪资(元)")
    notes: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        from_attributes=True,
    )
