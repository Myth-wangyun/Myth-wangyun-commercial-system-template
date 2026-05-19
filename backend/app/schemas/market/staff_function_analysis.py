"""市场部员工功能分析表 - Schemas

包含四个功能分析表的请求/响应模型：
1. 中层功能分析
2. 网推功能分析
3. 网聊功能分析
4. AI研发功能分析
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List

from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# 员工相关 Schemas
# ============================================================

class EmployeeBase(BaseModel):
    """员工基础信息"""
    employee_key: str = Field(..., description='员工唯一标识')
    employee_name: str = Field(..., description='员工姓名')
    position: str = Field('', description='职位（中层专用）')


class EmployeeCreate(EmployeeBase):
    """创建员工"""
    pass


class EmployeeOut(EmployeeBase):
    """员工输出"""
    id: int
    year: str
    category: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 中层功能分析 Schemas
# ============================================================

class MiddleManagementScoreItem(BaseModel):
    """中层评分项"""
    row_id: int = Field(..., description='评分项序号(1-20)')
    rating: float = Field(0, description='评分')


class MiddleManagementWeightItem(BaseModel):
    """中层权重项"""
    row_id: int = Field(..., description='评分项序号(1-20)')
    weight: float = Field(0, description='权重百分比')


class MiddleManagementEmployeeData(BaseModel):
    """中层员工数据"""
    employee_key: str = Field(..., description='员工唯一标识')
    employee_name: str = Field(..., description='员工姓名')
    position: str = Field('', description='职位')
    ratings: Dict[int, float] = Field(default_factory=dict, description='评分 {row_id: rating}')


class MiddleManagementSaveRequest(BaseModel):
    """中层功能分析保存请求"""
    year: str = Field(..., description='年份')
    employees: List[MiddleManagementEmployeeData] = Field(default_factory=list, description='员工列表及评分')
    weights: Dict[int, float] = Field(default_factory=dict, description='权重 {row_id: weight}')


class MiddleManagementDataResponse(BaseModel):
    """中层功能分析数据响应"""
    year: str
    employees: List[MiddleManagementEmployeeData]
    weights: Dict[int, float]


# ============================================================
# 网推/网聊/AI研发 通用 Schemas
# ============================================================

class StaffScoreItem(BaseModel):
    """员工评分项"""
    row_id: int = Field(..., description='评分项序号')
    score: float = Field(0, description='得分')


class StaffEmployeeData(BaseModel):
    """员工数据（网推/网聊/AI研发通用）"""
    employee_key: str = Field(..., description='员工唯一标识')
    employee_name: str = Field(..., description='员工姓名')
    scores: Dict[int, float] = Field(default_factory=dict, description='得分 {row_id: score}')


class StaffFunctionSaveRequest(BaseModel):
    """员工功能分析保存请求（网推/网聊/AI研发通用）"""
    year: str = Field(..., description='年份')
    employees: List[StaffEmployeeData] = Field(default_factory=list, description='员工列表及得分')


class StaffFunctionDataResponse(BaseModel):
    """员工功能分析数据响应（网推/网聊/AI研发通用）"""
    year: str
    employees: List[StaffEmployeeData]


# ============================================================
# 统一保存响应
# ============================================================

class SaveResponse(BaseModel):
    """保存响应"""
    success: bool = True
    message: str = '保存成功'
    saved_count: int = 0

