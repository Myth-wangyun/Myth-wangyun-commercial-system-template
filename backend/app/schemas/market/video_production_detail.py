"""市场部视频剪辑制作明细 - Schemas

市场部 X月视频剪辑制作明细的请求/响应模型
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# 视频制作明细 Schemas
# ============================================================

class VideoProductionDetailBase(BaseModel):
    """视频制作明细基础信息"""
    sequence: Optional[int] = Field(None, description='序号')
    copywriting_date: Optional[str] = Field(None, description='文案日期')
    theme: Optional[str] = Field(None, description='主题')
    target_audience: Optional[str] = Field(None, description='针对人群')
    campus: Optional[str] = Field(None, description='神殿')
    actual_shooting_date: Optional[str] = Field(None, description='实际拍摄日期')
    video_name: Optional[str] = Field(None, description='短视频名称')
    duration: Optional[int] = Field(None, description='时长(秒)')
    remark_link: Optional[str] = Field(None, description='备注链接')


class VideoProductionDetailCreate(VideoProductionDetailBase):
    """创建视频制作明细"""
    pass


class VideoProductionDetailUpdate(VideoProductionDetailBase):
    """更新视频制作明细"""
    pass


class VideoProductionDetailOut(VideoProductionDetailBase):
    """视频制作明细输出"""
    id: int
    year: int
    month: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class VideoProductionDetailListResponse(BaseModel):
    """视频制作明细列表响应"""
    year: int
    month: int
    items: List[VideoProductionDetailOut]
    total: int


class VideoProductionDetailSaveRequest(BaseModel):
    """保存视频制作明细请求"""
    year: int = Field(..., description='年份，如：2025')
    month: int = Field(..., ge=1, le=12, description='月份(1-12)，如：9')
    items: List[VideoProductionDetailCreate] = Field(default_factory=list, description='视频明细列表')
