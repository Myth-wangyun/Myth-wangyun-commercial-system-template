"""
财务收入和退费数据模式
007财务收入和退费 - 最高议事厅核心数据
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==================== 数据类型枚举 ====================

DATA_TYPES = [
    "SEM",
    "新媒体",
    "市场口碑",
    "合作伙伴",
    "免费推广",
    "口碑",
    "渠道",
    "神殿新媒体",
    "汇总"
]


# ==================== 神殿月度财务数据模式 ====================

class 神殿月度财务数据创建(BaseModel):
    """创建神殿月度财务数据记录"""
    年份: int = Field(..., description="统计年份")
    月份: int = Field(..., ge=1, le=12, description="月份（1-12）")
    神殿: str = Field(..., max_length=50, description="神殿名称")
    数据类型: str = Field(..., max_length=50, description="数据类型")

    # 收入数据
    计划收入: Optional[Decimal] = Field(default=Decimal("0"), description="计划收入（元）")
    实际收入: Optional[Decimal] = Field(default=Decimal("0"), description="实际收入（元）")

    # 招生数据
    计划招生: Optional[int] = Field(default=0, description="计划招生人数")
    实际招生: Optional[int] = Field(default=0, description="实际招生人数")
    退费人数: Optional[int] = Field(default=0, description="退费人数")

    # 操作信息
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")


class 神殿月度财务数据更新(BaseModel):
    """更新神殿月度财务数据记录"""
    记录ID: int = Field(..., description="记录ID")
    年份: Optional[int] = Field(None, description="统计年份")
    月份: Optional[int] = Field(None, ge=1, le=12, description="月份（1-12）")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿名称")
    数据类型: Optional[str] = Field(None, max_length=50, description="数据类型")

    # 收入数据
    计划收入: Optional[Decimal] = Field(None, description="计划收入（元）")
    实际收入: Optional[Decimal] = Field(None, description="实际收入（元）")

    # 招生数据
    计划招生: Optional[int] = Field(None, description="计划招生人数")
    实际招生: Optional[int] = Field(None, description="实际招生人数")
    退费人数: Optional[int] = Field(None, description="退费人数")


class 神殿月度财务数据响应(BaseModel):
    """神殿月度财务数据响应"""
    记录ID: int = Field(..., description="记录ID")
    年份: int = Field(..., description="统计年份")
    月份: int = Field(..., description="月份")
    神殿: str = Field(..., description="神殿名称")
    数据类型: str = Field(..., description="数据类型")

    # 收入数据
    计划收入: Decimal = Field(..., description="计划收入（元）")
    实际收入: Decimal = Field(..., description="实际收入（元）")

    # 招生数据
    计划招生: int = Field(..., description="计划招生人数")
    实际招生: int = Field(..., description="实际招生人数")
    退费人数: int = Field(..., description="退费人数")

    # 操作信息
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class 神殿月度财务数据批量更新(BaseModel):
    """批量更新神殿月度财务数据"""
    数据列表: List[神殿月度财务数据更新] = Field(..., description="需要更新的数据列表")


class 神殿月度财务数据批量创建(BaseModel):
    """批量创建神殿月度财务数据"""
    数据列表: List[神殿月度财务数据创建] = Field(..., description="需要创建的数据列表")


# ==================== 最高议事厅核心数据汇总模式 ====================

class 最高议事厅核心数据汇总创建(BaseModel):
    """创建最高议事厅核心数据汇总记录"""
    年份: int = Field(..., description="统计年份")
    神殿: str = Field(..., max_length=50, description="神殿名称")
    数据类型: str = Field(..., max_length=50, description="数据类型")

    # 收入数据
    计划收入: Optional[Decimal] = Field(default=Decimal("0"), description="计划收入（元）")
    实际收入: Optional[Decimal] = Field(default=Decimal("0"), description="实际收入（元）")

    # 招生数据
    计划招生: Optional[int] = Field(default=0, description="计划招生人数")
    实际招生: Optional[int] = Field(default=0, description="实际招生人数")
    退费人数: Optional[int] = Field(default=0, description="退费人数")

    # 操作信息
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, max_length=50, description="创建人姓名")


class 最高议事厅核心数据汇总更新(BaseModel):
    """更新最高议事厅核心数据汇总记录"""
    记录ID: int = Field(..., description="记录ID")
    年份: Optional[int] = Field(None, description="统计年份")
    神殿: Optional[str] = Field(None, max_length=50, description="神殿名称")
    数据类型: Optional[str] = Field(None, max_length=50, description="数据类型")

    # 收入数据
    计划收入: Optional[Decimal] = Field(None, description="计划收入（元）")
    实际收入: Optional[Decimal] = Field(None, description="实际收入（元）")

    # 招生数据
    计划招生: Optional[int] = Field(None, description="计划招生人数")
    实际招生: Optional[int] = Field(None, description="实际招生人数")
    退费人数: Optional[int] = Field(None, description="退费人数")


class 最高议事厅核心数据汇总响应(BaseModel):
    """最高议事厅核心数据汇总响应"""
    记录ID: int = Field(..., description="记录ID")
    年份: int = Field(..., description="统计年份")
    神殿: str = Field(..., description="神殿名称")
    数据类型: str = Field(..., description="数据类型")

    # 收入数据
    计划收入: Decimal = Field(..., description="计划收入（元）")
    实际收入: Decimal = Field(..., description="实际收入（元）")

    # 招生数据
    计划招生: int = Field(..., description="计划招生人数")
    实际招生: int = Field(..., description="实际招生人数")
    退费人数: int = Field(..., description="退费人数")

    # 操作信息
    创建人ID: Optional[int] = Field(None, description="创建人ID")
    创建人姓名: Optional[str] = Field(None, description="创建人姓名")
    创建时间: Optional[datetime] = Field(None, description="创建时间")
    更新时间: Optional[datetime] = Field(None, description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class 最高议事厅核心数据汇总批量更新(BaseModel):
    """批量更新最高议事厅核心数据汇总"""
    数据列表: List[最高议事厅核心数据汇总更新] = Field(..., description="需要更新的数据列表")


# ==================== API查询响应模式 ====================

class 神殿月度数据查询响应(BaseModel):
    """神殿月度数据查询响应（用于TAB2）"""
    神殿: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    数据类型: str = Field(..., description="数据类型")
    月度数据: List[神殿月度财务数据响应] = Field(..., description="1-12月数据列表")
    年度汇总: dict = Field(..., description="年度汇总数据")


class 最高议事厅汇总数据查询响应(BaseModel):
    """最高议事厅汇总数据查询响应（用于TAB1）"""
    年份: int = Field(..., description="年份")
    数据类型: str = Field(..., description="数据类型")
    神殿数据: List[最高议事厅核心数据汇总响应] = Field(..., description="各神殿汇总数据")
    总计: dict = Field(..., description="所有神殿总计")
