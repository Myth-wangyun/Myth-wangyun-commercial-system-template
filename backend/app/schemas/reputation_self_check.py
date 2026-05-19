"""Schemas for reputation self check"""

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class DayData(BaseModel):
    newStudentCount: int | None = 0
    newStudentNames: Optional[str] = None
    newStudentRecordFilled: Optional[bool] = None
    newStudentOnlineWorks: Optional[bool] = None
    oldStudentCount: int | None = 0
    oldStudentClass: Optional[str] = None
    oldStudentNames: Optional[str] = None
    oldStudentRecordFilled: Optional[bool] = None
    graduateCount: int | None = 0
    graduateNames: Optional[str] = None
    graduateRecordFilled: Optional[bool] = None
    wechatMoments: int | None = 0
    douyin: int | None = 0
    kuaishou: int | None = 0
    xiaohongshu: int | None = 0
    dailyTotal: int | None = 0


class MonthlyTotals(BaseModel):
    newStudentTotal: int = 0
    oldStudentTotal: int = 0
    graduateTotal: int = 0
    wechatMomentsTotal: int = 0
    douyinTotal: int = 0
    kuaishouTotal: int = 0
    xiaohongshuTotal: int = 0
    grandTotal: int = 0


class ReputationSelfCheckBase(BaseModel):
    campus: str = Field(..., alias="campus_name")
    teacherName: str = Field(..., alias="teacher_name")
    year: int
    month: int
    dailyData: Dict[str, DayData] = Field(default_factory=dict, alias="daily_data")

    model_config = ConfigDict(
        populate_by_name=True,
    )


class ReputationSelfCheckCreate(ReputationSelfCheckBase):
    id: Optional[int] = None


class ReputationSelfCheckResponse(ReputationSelfCheckBase):
    id: int
    monthlyTotals: MonthlyTotals

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class ReputationSelfCheckListResponse(BaseModel):
    records: List[ReputationSelfCheckResponse] = Field(default_factory=list)
