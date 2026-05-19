"""
Pydantic schemas for questionbank writing summary
神殿智慧司题库编写汇总表 Pydantic 模式 - 支持动态列
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class ColumnConfig(BaseModel):
    """列配置"""

    key: str  # 列唯一标识，如 "network", "ai"
    label: str  # 列显示名称，如 "网络云运维", "人工智能"


class RowData(BaseModel):
    """行数据"""

    campus: str  # 神殿名称
    data: Dict[str, int]  # 数据字典，如 {"network_new": 10, "network_edit": 5, ...}


class QuestionbankWritingSummaryCreate(BaseModel):
    """创建题库编写汇总请求"""

    年份: int
    columns: List[ColumnConfig]
    rows: List[RowData]


class QuestionbankWritingSummaryUpdate(BaseModel):
    """更新题库编写汇总请求"""

    年份: Optional[int] = None
    columns: Optional[List[ColumnConfig]] = None
    rows: Optional[List[RowData]] = None


class QuestionbankWritingSummaryOut(BaseModel):
    """题库编写汇总响应"""

    id: int
    年份: int
    columns: List[Dict[str, Any]]
    rows: List[Dict[str, Any]]
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


# 保留旧的 schema 以兼容旧接口
class QuestionbankWritingRecordCreate(BaseModel):
    神殿名称: str
    年份: int
    网络新编: int = 0
    网络修改: int = 0
    人工智能新编: int = 0
    人工智能修改: int = 0
    AIGC新编: int = 0
    AIGC修改: int = 0
    AI数媒新编: int = 0
    AI数媒修改: int = 0


class QuestionbankWritingRecordUpdate(BaseModel):
    神殿名称: Optional[str] = None
    年份: Optional[int] = None
    网络新编: Optional[int] = None
    网络修改: Optional[int] = None
    人工智能新编: Optional[int] = None
    人工智能修改: Optional[int] = None
    AIGC新编: Optional[int] = None
    AIGC修改: Optional[int] = None
    AI数媒新编: Optional[int] = None
    AI数媒修改: Optional[int] = None


class QuestionbankWritingRecordOut(BaseModel):
    id: int
    神殿名称: str
    年份: int
    网络新编: int
    网络修改: int
    人工智能新编: int
    人工智能修改: int
    AIGC新编: int
    AIGC修改: int
    AI数媒新编: int
    AI数媒修改: int
    新编合计: int
    修改合计: int
    创建时间: Optional[str] = None
    更新时间: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class BatchSaveRequest(BaseModel):
    年份: int
    records: List[dict]
