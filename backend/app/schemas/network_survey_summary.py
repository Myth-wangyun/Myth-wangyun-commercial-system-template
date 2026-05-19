"""
网络调查汇总表 Schema
"""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class PlatformConfig(BaseModel):
    """平台配置"""

    key: str
    label: str


class CityConfig(BaseModel):
    """城市配置"""

    key: str
    label: str


class RowData(BaseModel):
    """行数据"""

    campus: str
    major: str = ""
    data: Dict[str, int]


class NetworkSurveySummaryBase(BaseModel):
    """网络调查汇总表基础Schema"""

    年份: int
    platforms: List[PlatformConfig] = []
    cities: List[CityConfig] = []
    rows: List[RowData] = []


class NetworkSurveySummaryCreate(NetworkSurveySummaryBase):
    """创建网络调查汇总表"""

    pass


class NetworkSurveySummaryUpdate(BaseModel):
    """更新网络调查汇总表"""

    年份: Optional[int] = None
    platforms: Optional[List[PlatformConfig]] = None
    cities: Optional[List[CityConfig]] = None
    rows: Optional[List[RowData]] = None


class NetworkSurveySummaryOut(NetworkSurveySummaryBase):
    """网络调查汇总表输出"""

    id: int
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )
