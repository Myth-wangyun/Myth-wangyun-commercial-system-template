"""
祈福司入职离职汇总表数据模式
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 祈福司入职离职汇总表模式 ====================

class 祈福司入职离职汇总表创建(BaseModel):
    """创建祈福司入职离职汇总表记录"""
    年份: int = Field(..., description="统计年份")
    岗位: str = Field(..., max_length=50, description="岗位名称（咨询干部/咨询/咨询助理/渠道）")
    指标类型: str = Field(..., max_length=20, description="指标类型（实际招聘人数/离职人数）")

    # 各月数据
    一月: int = Field(default=0, description="1月数据")
    二月: int = Field(default=0, description="2月数据")
    三月: int = Field(default=0, description="3月数据")
    四月: int = Field(default=0, description="4月数据")
    五月: int = Field(default=0, description="5月数据")
    六月: int = Field(default=0, description="6月数据")
    七月: int = Field(default=0, description="7月数据")
    八月: int = Field(default=0, description="8月数据")
    九月: int = Field(default=0, description="9月数据")
    十月: int = Field(default=0, description="10月数据")
    十一月: int = Field(default=0, description="11月数据")
    十二月: int = Field(default=0, description="12月数据")

    # 合计
    合计: int = Field(default=0, description="全年合计")

    # 操作信息
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")


class 祈福司入职离职汇总表更新(BaseModel):
    """更新祈福司入职离职汇总表记录"""
    记录ID: int = Field(..., description="记录ID")
    年份: Optional[int] = Field(None, description="统计年份")
    岗位: Optional[str] = Field(None, max_length=50, description="岗位名称")
    指标类型: Optional[str] = Field(None, max_length=20, description="指标类型")

    # 各月数据
    一月: Optional[int] = Field(None, description="1月数据")
    二月: Optional[int] = Field(None, description="2月数据")
    三月: Optional[int] = Field(None, description="3月数据")
    四月: Optional[int] = Field(None, description="4月数据")
    五月: Optional[int] = Field(None, description="5月数据")
    六月: Optional[int] = Field(None, description="6月数据")
    七月: Optional[int] = Field(None, description="7月数据")
    八月: Optional[int] = Field(None, description="8月数据")
    九月: Optional[int] = Field(None, description="9月数据")
    十月: Optional[int] = Field(None, description="10月数据")
    十一月: Optional[int] = Field(None, description="11月数据")
    十二月: Optional[int] = Field(None, description="12月数据")

    # 合计
    合计: Optional[int] = Field(None, description="全年合计")

    # 操作信息
    神殿: Optional[str] = Field(None, max_length=50, description="神殿")


class 祈福司入职离职汇总表响应(BaseModel):
    """祈福司入职离职汇总表响应"""
    记录ID: int = Field(..., description="记录ID")
    年份: int = Field(..., description="统计年份")
    岗位: str = Field(..., description="岗位名称")
    指标类型: str = Field(..., description="指标类型")

    # 各月数据
    一月: int = Field(..., description="1月数据")
    二月: int = Field(..., description="2月数据")
    三月: int = Field(..., description="3月数据")
    四月: int = Field(..., description="4月数据")
    五月: int = Field(..., description="5月数据")
    六月: int = Field(..., description="6月数据")
    七月: int = Field(..., description="7月数据")
    八月: int = Field(..., description="8月数据")
    九月: int = Field(..., description="9月数据")
    十月: int = Field(..., description="10月数据")
    十一月: int = Field(..., description="11月数据")
    十二月: int = Field(..., description="12月数据")

    # 合计
    合计: int = Field(..., description="全年合计")

    # 操作信息
    神殿: Optional[str] = Field(None, description="神殿")
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()}
    )


class 祈福司入职离职汇总表批量更新(BaseModel):
    """批量更新（用于前端表格编辑后一次性提交）"""
    记录列表: list[祈福司入职离职汇总表更新] = Field(..., description="要更新的记录列表")
