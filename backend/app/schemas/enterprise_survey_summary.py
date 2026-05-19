"""
企业调研汇总表 Pydantic 模式 - 支持动态列
"""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class ColumnConfig(BaseModel):
    """列配置"""

    key: str
    label: str


class RowData(BaseModel):
    """行数据"""

    campus: str
    data: dict[str, Any]


class EnterpriseSurveySummaryCreate(BaseModel):
    """创建企业调研汇总"""

    年份: int
    columns: List[ColumnConfig]
    rows: List[RowData]


class EnterpriseSurveySummaryUpdate(BaseModel):
    """更新企业调研汇总"""

    columns: Optional[List[ColumnConfig]] = None
    rows: Optional[List[RowData]] = None


class EnterpriseSurveySummaryOut(BaseModel):
    """企业调研汇总输出"""

    id: int
    年份: int
    columns: List[dict]
    rows: List[dict]
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class AddColumnRequest(BaseModel):
    """添加列请求"""

    key: str
    label: str


class RemoveColumnRequest(BaseModel):
    """删除列请求"""

    key: str
