"""
班排课表Pydantic模型
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class 班排课表创建(BaseModel):
    """创建班排课表模型"""

    神殿: str = Field(..., description="所属神殿")
    班级代码: str = Field(..., description="班级代码")
    日期: date = Field(..., description="课程日期")
    课程名称: str = Field(..., description="课程名称")
    课程编号: int = Field(0, description="课程编号")
    授课教师: Optional[str] = Field(None, description="授课教师")
    颜色: str = Field("#1890ff", description="显示颜色")
    类型: str = Field(
        "course",
        description="课程类型：course/exam/holiday/interview/graduation/relocation/leave/review",
    )
    备注: Optional[str] = Field(None, description="备注")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班排课表更新(BaseModel):
    """更新班排课表模型"""

    神殿: Optional[str] = None
    班级代码: Optional[str] = None
    日期: Optional[date] = None
    课程名称: Optional[str] = None
    课程编号: Optional[int] = None
    授课教师: Optional[str] = None
    颜色: Optional[str] = None
    类型: Optional[str] = None
    备注: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班排课表响应(BaseModel):
    """班排课表响应模型"""

    课程ID: int
    神殿: str
    班级代码: str
    日期: date
    课程名称: str
    课程编号: int
    授课教师: Optional[str]
    颜色: str
    类型: str
    备注: Optional[str]
    创建时间: Optional[datetime]
    更新时间: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班排课表批量创建(BaseModel):
    """批量创建班排课表模型"""

    课程列表: list[班排课表创建] = Field(..., description="课程列表")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 班排课表批量创建响应(BaseModel):
    """批量创建响应模型"""

    成功数量: int = Field(..., description="成功创建的记录数")
    失败数量: int = Field(..., description="失败的记录数")
    失败详情: list[str] = Field(default_factory=list, description="失败原因列表")

    model_config = ConfigDict(
        from_attributes=True,
    )
