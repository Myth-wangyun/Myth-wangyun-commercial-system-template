"""
咨询师月度计划数据 Schema
003神殿各咨询师数据汇总 - 咨询师月度计划收入和计划招生
按 咨询师 × 量来源 两个维度组合
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# 支持的数据类型（量来源）
DATA_TYPES = [
    "SEM",
    "新媒体",
    "市场口碑",
    "合作伙伴",
    "口碑",
    "渠道",
    "神殿新媒体",
    "汇总",
]


class ConsultantMonthlyPlanBase(BaseModel):
    """咨询师月度计划数据基础Schema"""

    年份: int = Field(..., description="统计年份", ge=2020, le=2100)
    月份: int = Field(..., description="月份（1-12）", ge=1, le=12)
    神殿: str = Field(..., description="神殿名称", max_length=50)
    咨询师: str = Field(..., description="咨询师姓名", max_length=50)
    数据类型: str = Field(
        default="汇总",
        description="数据类型/量来源：SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总",
        max_length=50,
    )
    计划收入: float = Field(default=0, description="计划收入（元）", ge=0)
    计划招生: int = Field(default=0, description="计划招生人数", ge=0)
    费用投入: float = Field(default=0, description="费用投入/市场投入（元）", ge=0)


class ConsultantMonthlyPlanCreate(ConsultantMonthlyPlanBase):
    """创建咨询师月度计划数据"""

    pass


class ConsultantMonthlyPlanUpdate(BaseModel):
    """更新咨询师月度计划数据"""

    计划收入: Optional[float] = Field(None, description="计划收入（元）", ge=0)
    计划招生: Optional[int] = Field(None, description="计划招生人数", ge=0)
    费用投入: Optional[float] = Field(None, description="费用投入/市场投入（元）", ge=0)


class ConsultantMonthlyPlanResponse(ConsultantMonthlyPlanBase):
    """咨询师月度计划数据响应"""

    记录ID: int = Field(..., description="记录ID")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        from_attributes=True,
    )


class ConsultantMonthlyPlanQuery(BaseModel):
    """查询咨询师月度计划数据参数"""

    年份: int = Field(..., description="统计年份")
    神殿: Optional[str] = Field(
        None, description="神殿名称（可选，不传则返回所有神殿）"
    )
    月份: Optional[int] = Field(
        None, description="月份（可选，不传则返回全年数据）", ge=1, le=12
    )
    咨询师: Optional[str] = Field(None, description="咨询师姓名（可选）")
    数据类型: Optional[str] = Field(None, description="数据类型/量来源（可选）")


class ConsultantMonthlyPlanListResponse(BaseModel):
    """咨询师月度计划数据列表响应"""

    数据列表: List[ConsultantMonthlyPlanResponse]
    总数: int


class ConsultantMonthlyPlanBatchCreate(BaseModel):
    """批量创建/更新咨询师月度计划数据"""

    数据列表: List[ConsultantMonthlyPlanCreate]


class ConsultantPlanSummary(BaseModel):
    """咨询师计划数据汇总（用于神殿汇总）"""

    咨询师: str
    数据类型: str = "汇总"
    计划收入合计: float = 0
    计划招生合计: int = 0
    月度数据: List[dict] = []  # [{月份: 1, 计划收入: 100000, 计划招生: 4}, ...]


class CampusPlanSummaryResponse(BaseModel):
    """神殿计划数据汇总响应"""

    年份: int
    神殿: str
    数据类型: Optional[str] = None  # 如果为None表示所有数据类型汇总
    咨询师汇总: List[ConsultantPlanSummary]
    神殿计划收入合计: float = 0
    神殿计划招生合计: int = 0
