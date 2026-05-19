"""
新生流失明细表 Pydantic schemas
按年份、月份、教员姓名存储，学生列表使用数组
"""

from typing import List

from pydantic import BaseModel, ConfigDict, Field


class StudentInfo(BaseModel):
    """学生信息"""

    交接学生姓名: str = Field(..., description="交接学生姓名")
    是否入学: str = Field(..., description="是否入学（是/否）")
    是否过课时: str = Field(default="", description="是否过课时（是/否）")
    是否退费: str = Field(default="", description="是否退费（是/否）")


class TeacherRecord(BaseModel):
    """教员记录"""

    教员姓名: str = Field(..., description="教员姓名")
    学生列表: List[StudentInfo] = Field(..., description="学生列表")


class NewStudentLossDetailCreate(BaseModel):
    """创建/更新新生流失明细表请求"""

    神殿名称: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    月份: int = Field(..., ge=1, le=12, description="月份")
    教员记录列表: List[TeacherRecord] = Field(..., description="教员记录列表")


class NewStudentLossDetailResponse(BaseModel):
    """单条流失明细响应"""

    id: int
    神殿名称: str
    年份: int
    月份: int
    教员姓名: str
    学生列表: List[StudentInfo]

    model_config = ConfigDict(
        from_attributes=True,
    )


class NewStudentLossDetailListResponse(BaseModel):
    """流失明细列表响应"""

    神殿名称: str
    年份: int
    月份: int
    数据: List[NewStudentLossDetailResponse]
    总数: int
