"""
Pydantic schemas for manager function evaluation
最高议事厅智慧司学术经理功能评价表
"""

from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class EvaluatorScore(BaseModel):
    """单个评分人的分数"""

    name: str = Field(..., description="评分人姓名")
    价值观: int = Field(0, ge=0, description="价值观分数")
    业务能力: int = Field(0, ge=0, description="业务能力分数")
    团队建设: int = Field(0, ge=0, description="团队建设分数")
    管理能力: int = Field(0, ge=0, description="管理能力分数")
    合计: int = Field(0, ge=0, description="合计分数")


class ManagerFunctionEvaluationData(BaseModel):
    """评价数据结构"""

    month: str = Field(..., description="评价月份 YYYY-MM")
    evaluators: List[EvaluatorScore] = Field(
        default_factory=list, description="评分人列表"
    )
    details: Optional[Any] = Field(None, description="详细评分明细")


class ManagerFunctionEvaluationBase(BaseModel):
    神殿: str = Field(..., description="神殿名称")
    年份: int = Field(..., ge=2000, le=2100, description="数据年份")
    月份: str = Field(..., description="评价月份 YYYY-MM")
    数据: ManagerFunctionEvaluationData = Field(..., description="评价数据")


class ManagerFunctionEvaluationCreate(ManagerFunctionEvaluationBase):
    pass


class ManagerFunctionEvaluationUpdate(BaseModel):
    数据: Optional[ManagerFunctionEvaluationData] = None


class ManagerFunctionEvaluationOut(ManagerFunctionEvaluationBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )
