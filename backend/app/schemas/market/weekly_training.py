"""
市场部培训周度表 Schema
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class WeeklyTrainingRowIn(BaseModel):
    """培训周度表行输入"""
    id: Optional[int] = None

    row_index: int = Field(default=0, description='序号')
    position: str = Field(default='', description='岗位')
    training_time: str = Field(default='', description='培训时间')
    training_project: str = Field(default='', description='培训项目')
    main_content: str = Field(default='', description='主要内容')
    training_method: str = Field(default='', description='培训方式')
    organizer: str = Field(default='', description='组织负责人')
    trainee_count: int = Field(default=0, description='培训人次')
    qualified_count: int = Field(default=0, description='合格人数')
    pass_rate: float = Field(default=0, description='考试合格率')
    avg_score: float = Field(default=0, description='平均成绩')


class WeeklyTrainingRowOut(BaseModel):
    """培训周度表行输出"""
    id: int
    year_month: str = ''
    row_index: int = 0
    position: str = ''
    training_time: str = ''
    training_project: str = ''
    main_content: str = ''
    training_method: str = ''
    organizer: str = ''
    trainee_count: int = 0
    qualified_count: int = 0
    pass_rate: float = 0
    avg_score: float = 0

    @classmethod
    def model_validate(cls, obj):
        """从 SQLAlchemy model 转换为 pydantic model"""
        return cls(
            id=obj.id,
            year_month=obj.year_month or '',
            row_index=obj.row_index or 0,
            position=obj.position or '',
            training_time=obj.training_time or '',
            training_project=obj.training_project or '',
            main_content=obj.main_content or '',
            training_method=obj.training_method or '',
            organizer=obj.organizer or '',
            trainee_count=obj.trainee_count or 0,
            qualified_count=obj.qualified_count or 0,
            pass_rate=obj.pass_rate or 0,
            avg_score=obj.avg_score or 0,
        )


class WeeklyTrainingTotals(BaseModel):
    """培训周度表合计行"""
    trainee_count: int = 0
    qualified_count: int = 0
    pass_rate: str = '#DIV/0!'
    avg_score: str = '#DIV/0!'


class WeeklyTrainingListResponse(BaseModel):
    """培训周度表列表响应"""
    items: List[WeeklyTrainingRowOut]
    totals: WeeklyTrainingTotals


class WeeklyTrainingBulkSaveRequest(BaseModel):
    """培训周度表批量保存请求"""
    year_month: str = Field(..., description='年月，格式 YYYY-MM')
    rows: List[WeeklyTrainingRowIn]


class WeeklyTrainingBulkSaveResponse(BaseModel):
    """培训周度表批量保存响应"""
    saved_count: int
    items: List[WeeklyTrainingRowOut]
    totals: WeeklyTrainingTotals


# ============ 培训月度表 Schema ============

class MonthlyTrainingRemarkIn(BaseModel):
    """月度表备注输入"""
    year: str = Field(..., description='年份，格式 YYYY')
    month: int = Field(..., description='月份，1-12，0表示汇总行')
    position: str = Field(..., description='岗位')
    remarks: str = Field(default='', description='备注')


class MonthlyTrainingRemarkOut(BaseModel):
    """月度表备注输出"""
    id: int
    year: str
    month: int
    position: str
    remarks: str


class MonthlyTrainingBulkSaveRequest(BaseModel):
    """月度表批量保存备注请求"""
    year: str = Field(..., description='年份，格式 YYYY')
    remarks: List[MonthlyTrainingRemarkIn]


class MonthlyTrainingBulkSaveResponse(BaseModel):
    """月度表批量保存备注响应"""
    saved_count: int


# ============ 培训汇总表 Schema ============

class SummaryTrainingRemarkIn(BaseModel):
    """汇总表备注输入"""
    position: str = Field(default='', description='岗位，空字符串表示合计行')
    remarks: str = Field(default='', description='备注')


class SummaryTrainingBulkSaveRequest(BaseModel):
    """汇总表批量保存备注请求"""
    year: str = Field(..., description='年份，格式 YYYY')
    remarks: List[SummaryTrainingRemarkIn]


class SummaryTrainingBulkSaveResponse(BaseModel):
    """汇总表批量保存备注响应"""
    saved_count: int
