"""市场部剪辑月度汇报表 - Schemas

市场部剪辑月度汇报表的请求/响应模型
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


def to_camel(string: str) -> str:
    """将 snake_case 转换为 camelCase"""
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class MonthlyEditReportBase(BaseModel):
    """剪辑月度汇报基础信息"""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    key: str = Field(..., description="前端key")
    row_type: str = Field(..., description="行类型: summary合计/data神殿")
    period: str = Field(..., description="period标识: all-year 或 1-12")
    period_label: Optional[str] = Field("", description="period名称")
    campus: Optional[str] = Field("", description="神殿名称")

    # 文案类
    audience_type_count: Optional[str] = Field("", description="人群类别(文本)")
    planned_articles: Optional[int] = Field(0, description="计划文案数")
    actual_articles: Optional[int] = Field(0, description="实际文案数")

    # 拍摄类
    planned_edit_demand: Optional[int] = Field(0, description="计划拍摄次数")
    completed_edit_demand: Optional[int] = Field(
        0, description="截止昨日应完成拍摄次数"
    )
    actual_shoot_videos: Optional[int] = Field(0, description="实际拍摄次数")
    shoot_completion_progress: Optional[str] = Field("", description="拍摄完成进度")

    # 待剪类
    monthly_edit_plans: Optional[int] = Field(0, description="本月计划剪辑数")
    completed_early_plans: Optional[int] = Field(
        0, description="截止昨日应完成剪辑次数"
    )
    actual_edited_videos: Optional[int] = Field(0, description="实际完成剪辑数")
    edit_progress_rate: Optional[str] = Field("", description="剪辑完成进度")

    # 结果类
    audit_pass_video_count: Optional[int] = Field(0, description="审核通过数")
    audit_pass_rate: Optional[str] = Field("", description="审核通过率")

    # 集团活动
    group_activity: Optional[str] = Field("", description="集团活动")


class MonthlyEditReport(MonthlyEditReportBase):
    """剪辑月度汇报详情"""

    id: int
    year: int
    month: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class MonthlyEditReportListResponse(BaseModel):
    """列表响应"""

    model_config = ConfigDict(
        populate_by_name=True,
    )

    code: int = Field(200, description="状态码")
    message: str = Field("success", description="消息")
    data: List[MonthlyEditReportBase] = Field(..., description="数据列表")


class MonthlyEditReportSaveRequest(BaseModel):
    """保存请求"""

    year: int = Field(..., description="年份")
    data: List[MonthlyEditReportBase] = Field(..., description="数据列表")
