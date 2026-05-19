"""
祈福司员工访谈记录表 Schema
"""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class 月份访谈内容(BaseModel):
    """单个月份的访谈内容"""

    访谈人: str = Field(default="", description="访谈人")
    访谈内容: str = Field(default="", description="访谈内容")


class 访谈行(BaseModel):
    """访谈记录行"""

    序号: int = Field(..., description="序号")
    岗位姓名: str = Field(default="", description="岗位姓名")
    月份数据: Dict[str, 月份访谈内容] = Field(
        default_factory=dict, description="12个月份的访谈数据"
    )


class 访谈记录创建(BaseModel):
    """创建访谈记录"""

    年份: int = Field(..., ge=2000, le=2100, description="年份")
    表格数据: List[访谈行] = Field(..., description="表格数据")


class 访谈记录更新(BaseModel):
    """更新访谈记录"""

    表格数据: List[访谈行] = Field(..., description="表格数据")


class 访谈记录响应(BaseModel):
    """访谈记录响应"""

    年份: int = Field(..., description="年份")
    表格数据: List[访谈行] = Field(..., description="表格数据")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(
        from_attributes=True,
    )
