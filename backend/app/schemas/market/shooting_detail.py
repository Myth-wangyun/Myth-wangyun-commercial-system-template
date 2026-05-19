"""
市场部月拍摄明细表 Schema
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ShootingDetailBase(BaseModel):
    """拍摄明细基础模型"""
    sequence: Optional[int] = None
    shooting_date: Optional[str] = None
    shooting_campus: Optional[str] = None
    appearing_teacher: Optional[str] = None
    appearing_reward_standard: Optional[str] = None
    appearing_reward_amount: Optional[int] = None
    assisting_teacher: Optional[str] = None
    responsible_campus: Optional[str] = None
    assisting_reward_standard: Optional[str] = None
    assisting_reward_amount: Optional[int] = None
    total_reward_amount: Optional[int] = None
    remark: Optional[str] = None


class ShootingDetailOut(ShootingDetailBase):
    """拍摄明细输出模型"""
    id: int
    year: int
    month: int
    
    model_config = ConfigDict(from_attributes=True)


class ShootingDetailSaveRequest(BaseModel):
    """保存拍摄明细请求"""
    year: int
    month: int
    items: List[ShootingDetailBase]


class ShootingDetailListResponse(BaseModel):
    """拍摄明细列表响应"""
    items: List[ShootingDetailOut]
    total: int
