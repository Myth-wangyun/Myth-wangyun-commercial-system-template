"""市场部剪辑年度汇报表 - Schemas

市场部剪辑年度汇报表的请求/响应模型
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


def to_camel(string: str) -> str:
    """将 snake_case 转换为 camelCase"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class AnnualEditReportBase(BaseModel):
    """剪辑年度汇报基础信息（只有合计行）"""
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel
    )
    
    key: str = Field(..., description='前端key')
    period: str = Field(..., description='period标识: all-year 或 1-12')
    periodLabel: str = Field(..., description='period名称: 全年度 或 1月')
    campus: str = Field(default='合计', description='始终为"合计"')

    # 文案类
    audienceTypeCount: Optional[str] = Field('', description='人群类别(文本)')
    plannedArticles: Optional[int] = Field(0, description='计划文案数')
    actualArticles: Optional[int] = Field(0, description='实际文案数')

    # 拍摄类
    plannedEditDemand: Optional[int] = Field(0, description='计划拍摄次数')
    completedEditDemand: Optional[int] = Field(0, description='截止昨日应完成拍摄次数')
    actualShootVideos: Optional[int] = Field(0, description='实际拍摄次数')
    shootCompletionProgress: Optional[str] = Field('', description='拍摄完成进度')

    # 剪辑类
    monthlyEditPlans: Optional[int] = Field(0, description='本月计划剪辑数')
    completedEarlyPlans: Optional[int] = Field(0, description='截止昨日应完成剪辑次数')
    actualEditedVideos: Optional[int] = Field(0, description='实际完成剪辑数')
    editProgressRate: Optional[str] = Field('', description='剪辑完成进度')

    # 结果类
    auditPassVideoCount: Optional[int] = Field(0, description='审核通过数')
    auditPassRate: Optional[str] = Field('', description='审核通过率')

    # 集团活动
    groupActivity: Optional[str] = Field('', description='集团活动')


class AnnualEditReportListResponse(BaseModel):
    """列表响应"""
    model_config = ConfigDict(
        populate_by_name=True,
    )
    
    code: int = Field(200, description='状态码')
    message: str = Field('success', description='消息')
    data: List[AnnualEditReportBase] = Field(..., description='数据列表')
