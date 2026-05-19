"""
神殿后端教员就业汇总表 Pydantic Schemas
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class 教员就业汇总创建(BaseModel):
    """创建教员就业汇总模型"""

    神殿: str = Field(..., description="所属神殿")
    教员姓名: str = Field(..., description="教员姓名")
    专业: str = Field(..., description="专业")
    学制: str = Field(..., description="学制")
    班级名称: str = Field(..., description="班级名称")
    毕业时间: Optional[str] = Field(None, description="毕业时间（YYYY-MM格式）")
    目标平均就业薪资: Optional[float] = Field(None, description="目标平均就业薪资(元)")
    实际平均就业薪资: Optional[float] = Field(None, description="实际平均就业薪资(元)")
    达标率: Optional[float] = Field(None, description="达标率(%)")
    目标就业人数: Optional[int] = Field(None, description="目标就业人数")
    实际就业人数: Optional[int] = Field(None, description="实际就业人数")
    就业率: Optional[float] = Field(None, description="就业率(%)")
    薪资过万人数: Optional[int] = Field(None, description="薪资过万人数")


class 教员就业汇总更新(BaseModel):
    """更新教员就业汇总模型"""

    神殿: Optional[str] = Field(None, description="所属神殿")
    教员姓名: Optional[str] = Field(None, description="教员姓名")
    专业: Optional[str] = Field(None, description="专业")
    学制: Optional[str] = Field(None, description="学制")
    班级名称: Optional[str] = Field(None, description="班级名称")
    毕业时间: Optional[str] = Field(None, description="毕业时间（YYYY-MM格式）")
    目标平均就业薪资: Optional[float] = Field(None, description="目标平均就业薪资(元)")
    实际平均就业薪资: Optional[float] = Field(None, description="实际平均就业薪资(元)")
    达标率: Optional[float] = Field(None, description="达标率(%)")
    目标就业人数: Optional[int] = Field(None, description="目标就业人数")
    实际就业人数: Optional[int] = Field(None, description="实际就业人数")
    就业率: Optional[float] = Field(None, description="就业率(%)")
    薪资过万人数: Optional[int] = Field(None, description="薪资过万人数")


class 教员就业汇总响应(BaseModel):
    """教员就业汇总响应模型"""

    汇总ID: int
    神殿: str
    教员姓名: str
    专业: str
    学制: str
    班级名称: str
    毕业时间: Optional[str]
    目标平均就业薪资: Optional[float]
    实际平均就业薪资: Optional[float]
    达标率: Optional[float]
    目标就业人数: Optional[int]
    实际就业人数: Optional[int]
    就业率: Optional[float]
    薪资过万人数: Optional[int]
    创建时间: Optional[str]
    更新时间: Optional[str]

    model_config = ConfigDict(
        from_attributes=True,
    )


class 自动统计请求(BaseModel):
    """自动统计请求模型"""

    神殿: str = Field(..., description="所属神殿")
    教员姓名: Optional[str] = Field(None, description="教员姓名（可选，用于过滤）")
    班级名称: Optional[str] = Field(None, description="班级名称（可选，用于过滤）")


class 自动统计响应(BaseModel):
    """自动统计响应模型"""

    处理数量: int
    结果: list
