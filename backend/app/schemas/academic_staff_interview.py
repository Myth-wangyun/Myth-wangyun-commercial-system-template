"""
智慧司访谈记录表 Pydantic 模型
"""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class 月访谈内容(BaseModel):
    访谈人: Optional[str] = None
    访谈内容: Optional[str] = None


class 访谈行(BaseModel):
    序号: int = Field(..., ge=1)
    访谈对象: str = Field('', max_length=100)
    月份内容: Dict[str, 月访谈内容] = Field(default_factory=dict)


class 访谈记录创建(BaseModel):
    神殿名称: str = Field(..., max_length=50)
    年份: int = Field(..., ge=2000, le=2100)
    月份: int = Field(..., ge=1, le=12)
    表格数据: List[访谈行]


class 访谈记录更新(BaseModel):
    表格数据: List[访谈行]


class 访谈记录响应(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    表格数据: List[访谈行]
    更新时间: Optional[datetime] = None


class 访谈月份列表响应(BaseModel):
    神殿名称: str
    年份: int
    月份列表: List[int]
