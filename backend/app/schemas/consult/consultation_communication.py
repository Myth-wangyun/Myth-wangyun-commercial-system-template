"""
咨询沟通记录Schema定义
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class 咨询沟通记录创建(BaseModel):
    """创建咨询沟通记录"""

    记录ID: int = Field(..., description="关联的咨询量明细记录ID")
    对象ID: Optional[int] = Field(
        None, description="关联的咨询对象ID（可自动从记录ID获取）"
    )

    沟通时间: datetime = Field(..., description="沟通时间")
    用时: Optional[int] = Field(0, ge=0, description="沟通用时（分钟）")
    咨询师: Optional[str] = Field(None, max_length=50, description="咨询师")

    沟通方式: str = Field(..., max_length=20, description="沟通方式：网聊、电话、当面")

    需求点: Optional[str] = Field(None, max_length=200, description="需求点")
    关注点: Optional[str] = Field(None, max_length=200, description="关注点")
    抗拒点: Optional[str] = Field(None, max_length=200, description="抗拒点")

    咨询内容: Optional[str] = Field(None, description="咨询内容详情")
    咨询结果: Optional[str] = Field(None, description="咨询结果")

    报名意愿: Optional[str] = Field(
        None, max_length=20, description="报名意愿等级：A/B/C/D类"
    )
    有需求: Optional[int] = Field(0, ge=0, le=1, description="是否有需求")
    有钱: Optional[int] = Field(0, ge=0, le=1, description="是否有钱")
    有时间: Optional[int] = Field(0, ge=0, le=1, description="是否有时间")
    有支持: Optional[int] = Field(0, ge=0, le=1, description="是否有支持")

    具备条件: Optional[str] = Field(None, max_length=100, description="具备条件描述")
    课程意向: Optional[str] = Field(None, max_length=100, description="课程意向")

    联系不上: Optional[int] = Field(0, ge=0, le=1, description="是否联系不上")

    预定回访时间: Optional[datetime] = Field(None, description="预定下次回访时间")

    model_config = ConfigDict(
        from_attributes=True,
    )


class 咨询沟通记录更新(BaseModel):
    """更新咨询沟通记录"""

    沟通时间: Optional[datetime] = None
    用时: Optional[int] = None
    咨询师: Optional[str] = None
    沟通方式: Optional[str] = None

    需求点: Optional[str] = None
    关注点: Optional[str] = None
    抗拒点: Optional[str] = None

    咨询内容: Optional[str] = None
    咨询结果: Optional[str] = None

    报名意愿: Optional[str] = None
    有需求: Optional[int] = None
    有钱: Optional[int] = None
    有时间: Optional[int] = None
    有支持: Optional[int] = None

    具备条件: Optional[str] = None
    课程意向: Optional[str] = None

    联系不上: Optional[int] = None
    预定回访时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class 咨询沟通记录响应(BaseModel):
    """咨询沟通记录响应"""

    沟通ID: int
    记录ID: int
    对象ID: int

    沟通时间: Optional[datetime] = None
    用时: Optional[int] = None
    咨询师: Optional[str] = None
    沟通方式: Optional[str] = None

    需求点: Optional[str] = None
    关注点: Optional[str] = None
    抗拒点: Optional[str] = None

    咨询内容: Optional[str] = None
    咨询结果: Optional[str] = None

    报名意愿: Optional[str] = None
    有需求: Optional[int] = None
    有钱: Optional[int] = None
    有时间: Optional[int] = None
    有支持: Optional[int] = None

    具备条件: Optional[str] = None
    课程意向: Optional[str] = None

    联系不上: Optional[int] = None
    预定回访时间: Optional[datetime] = None

    创建人: Optional[str] = None
    创建时间: Optional[datetime] = None
    更新时间: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class 咨询沟通记录分页响应(BaseModel):
    """咨询沟通记录分页响应"""

    success: bool = True
    data: List[咨询沟通记录响应]
    total: int
    page: int
    page_size: int


# 电话量统计相关Schema
class 电话量统计项(BaseModel):
    """电话量统计项"""

    日期: Optional[str] = None
    月份: Optional[int] = None
    年份: Optional[int] = None
    咨询师: Optional[str] = None
    神殿: Optional[str] = None

    电话量: int = 0
    网聊量: int = 0
    当面量: int = 0
    总沟通量: int = 0

    联系成功量: int = 0
    联系失败量: int = 0

    平均用时: float = 0  # 分钟


class 电话量统计响应(BaseModel):
    """电话量统计响应"""

    success: bool = True
    data: List[电话量统计项]
    summary: Optional[电话量统计项] = None  # 汇总行


class 咨询师电话量统计(BaseModel):
    """咨询师电话量统计"""

    咨询师: str
    电话量: int = 0
    网聊量: int = 0
    当面量: int = 0
    总沟通量: int = 0
    平均用时: float = 0

    # 按月份细分
    月度数据: Optional[List[dict]] = None


class 咨询量带沟通记录响应(BaseModel):
    """咨询量明细带沟通记录响应"""

    咨询量明细: dict
    沟通记录列表: List[咨询沟通记录响应]
    沟通记录数: int
