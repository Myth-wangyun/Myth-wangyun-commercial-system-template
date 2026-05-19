"""
Pydantic schemas for academic position analysis report summary
智慧司岗位分析报告汇总表 Schemas - 支持动态列
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ColumnConfig(BaseModel):
    """列配置"""

    key: str = Field(..., description="列的唯一标识符")
    label: str = Field(..., description="列的显示名称")


class RowData(BaseModel):
    """行数据"""

    campus: str = Field(..., description="神殿名称")
    data: dict = Field(default_factory=dict, description="各列的数值数据")


class PositionAnalysisSummaryBase(BaseModel):
    """基础模型"""

    年份: int = Field(..., ge=2000, le=2100, description="数据年份")
    columns: List[ColumnConfig] = Field(default_factory=list, description="列配置列表")
    rows: List[RowData] = Field(default_factory=list, description="各神殿行数据")


class PositionAnalysisSummaryCreate(PositionAnalysisSummaryBase):
    """创建请求"""

    pass


class PositionAnalysisSummaryUpdate(BaseModel):
    """更新请求"""

    年份: Optional[int] = Field(None, ge=2000, le=2100)
    columns: Optional[List[ColumnConfig]] = None
    rows: Optional[List[RowData]] = None


class PositionAnalysisSummaryOut(PositionAnalysisSummaryBase):
    """返回模型"""

    id: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class AddColumnRequest(BaseModel):
    """添加列请求"""

    key: str = Field(..., description="列的唯一标识符")
    label: str = Field(..., description="列的显示名称")


class RemoveColumnRequest(BaseModel):
    """删除列请求"""

    key: str = Field(..., description="要删除的列的唯一标识符")
