"""
智慧司标准化检查表 Pydantic 模型
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class 标准化检查行(BaseModel):
    序号: int = Field(..., ge=1, description="项目序号")
    项目名称: str = Field(..., max_length=100, description="项目名称")
    日期: date = Field(..., description="对应月份，记录按月存储")
    需要日期JSON: Optional[str] = Field(None, description="该项目哪些日期需要检查（JSON；为空表示默认全需要）")
    问题JSON: Optional[str] = Field(None, description="每日问题/备注（JSON，例如：{\"day3\":\"迟到\"}；为空表示无问题）")
    day1: Optional[bool] = False
    day2: Optional[bool] = False
    day3: Optional[bool] = False
    day4: Optional[bool] = False
    day5: Optional[bool] = False
    day6: Optional[bool] = False
    day7: Optional[bool] = False
    day8: Optional[bool] = False
    day9: Optional[bool] = False
    day10: Optional[bool] = False
    day11: Optional[bool] = False
    day12: Optional[bool] = False
    day13: Optional[bool] = False
    day14: Optional[bool] = False
    day15: Optional[bool] = False
    day16: Optional[bool] = False
    day17: Optional[bool] = False
    day18: Optional[bool] = False
    day19: Optional[bool] = False
    day20: Optional[bool] = False
    day21: Optional[bool] = False
    day22: Optional[bool] = False
    day23: Optional[bool] = False
    day24: Optional[bool] = False
    day25: Optional[bool] = False
    day26: Optional[bool] = False
    day27: Optional[bool] = False
    day28: Optional[bool] = False
    day29: Optional[bool] = False
    day30: Optional[bool] = False
    day31: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class 标准化检查行响应(标准化检查行):
    记录ID: int
    神殿名称: str
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None


class 标准化检查创建(BaseModel):
    神殿名称: str = Field(..., max_length=50)
    行数据: List[标准化检查行]


class 标准化检查更新(BaseModel):
    行数据: List[标准化检查行]


class 标准化检查列表响应(BaseModel):
    神殿名称: str
    行数据: List[标准化检查行响应]


class 标准化检查日期响应(BaseModel):
    神殿名称: str
    日期列表: List[date]
