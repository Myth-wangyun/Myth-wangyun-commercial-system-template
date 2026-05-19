"""
Schemas for reputation key point detail
"""

from typing import List

from pydantic import BaseModel, ConfigDict, Field


class ReputationKeyPointDetailBase(BaseModel):
    campus_name: str = Field(..., description="神殿名称")
    year: int = Field(..., ge=2000, le=2100, description="年份")
    month: int = Field(..., ge=1, le=12, description="月份")
    teacher_name: str = Field(..., description="教员姓名")
    wechat_moments_count: int = Field(0, ge=0, description="朋友圈数量")
    douyin_count: int = Field(0, ge=0, description="抖音数量")
    kuaishou_count: int = Field(0, ge=0, description="快手数量")
    xiaohongshu_count: int = Field(0, ge=0, description="小红书数量")
    current_student_interview_count: int = Field(0, ge=0, description="在校生访谈数量")
    graduate_interview_count: int = Field(0, ge=0, description="毕业生访谈数量")


class ReputationKeyPointDetailResponse(ReputationKeyPointDetailBase):
    id: int
    online_total: int = Field(0, description="线上宣传合计")
    interview_total: int = Field(0, description="访谈合计")

    model_config = ConfigDict(
        from_attributes=True,
    )


class ReputationKeyPointDetailPayload(BaseModel):
    campus_name: str
    year: int
    class_code: str | None = None
    records: List[ReputationKeyPointDetailBase] = Field(default_factory=list)


class ReputationKeyPointListResponse(BaseModel):
    campus_name: str
    year: int
    records: List[ReputationKeyPointDetailResponse] = Field(default_factory=list)
