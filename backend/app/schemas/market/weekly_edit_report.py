"""市场部剪辑周度汇报表 - Schemas

市场部剪辑周度汇报表的请求/响应模型
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# 剪辑周度汇报 Schemas
# ============================================================

class WeeklyEditReportBase(BaseModel):
    """剪辑周度汇报基础信息"""
    row_type: str = Field(..., description='行类型: month-summary月合计/summary周汇总/campus神殿')
    week_label: Optional[str] = Field('', description='周标签，如: 第1周')
    week_date_range: Optional[str] = Field('', description='周日期范围，如: 1月1日-1月7日')
    campus: Optional[str] = Field('', description='神殿名称，合计行则为"合计"')

    # 文案类
    audience_type_count: Optional[float] = Field(0, description='人群类别数量')
    planned_articles: Optional[int] = Field(0, description='计划文案数')
    actual_articles: Optional[int] = Field(0, description='实际文案数')

    # 拍摄类
    planned_edit_demand: Optional[int] = Field(0, description='计划拍摄次数')
    completed_edit_demand: Optional[int] = Field(0, description='截止昨日应完成拍摄次数')
    actual_shoot_videos: Optional[int] = Field(0, description='实际拍摄次数')
    shoot_edit_completion_rate: Optional[str] = Field('', description='拍摄完成率')
    shoot_completion_progress: Optional[str] = Field('', description='拍摄完成进度')

    # 待剪类
    monthly_edit_plans: Optional[int] = Field(0, description='本月计划剪辑数')
    completed_early_plans: Optional[int] = Field(0, description='截止昨日应完成剪辑次数')
    actual_edited_videos: Optional[int] = Field(0, description='实际完成剪辑数')
    edit_progress_rate: Optional[str] = Field('', description='剪辑完成进度')

    # 结果类
    released_video_count: Optional[int] = Field(0, description='发布视频数')
    release_rate: Optional[str] = Field('', description='发布率')
    audit_pass_video_count: Optional[int] = Field(0, description='审核通过数')
    audit_pass_rate: Optional[str] = Field('', description='审核通过率')
    group_activity: Optional[str] = Field('', description='集团活动')


class WeeklyEditReportCreate(WeeklyEditReportBase):
    """创建剪辑周度汇报"""
    week: int = Field(..., description='周序号')


class WeeklyEditReportUpdate(WeeklyEditReportBase):
    """更新剪辑周度汇报"""
    pass


class WeeklyEditReportOut(WeeklyEditReportBase):
    """剪辑周度汇报输出"""
    id: int
    year: int
    month: int
    week: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WeeklyEditReportListResponse(BaseModel):
    """剪辑周度汇报列表响应"""
    year: int
    month: int
    items: List[WeeklyEditReportOut]
    total: int


class WeeklyEditReportSaveRequest(BaseModel):
    """保存剪辑周度汇报请求"""
    year: int = Field(..., description='年份，如：2025')
    month: int = Field(..., ge=1, le=12, description='月份(1-12)，如：9')
    items: List[WeeklyEditReportCreate] = Field(default_factory=list, description='汇报数据列表')
