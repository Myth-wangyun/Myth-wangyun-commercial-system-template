from typing import List, Optional

from pydantic import BaseModel, Field


class EmployeeInterviewRecordRowIn(BaseModel):
    id: Optional[int] = None
    year: int
    interview_date: Optional[str] = None
    interviewee: str = ''

    jan_interviewer: str = ''
    jan_content: str = ''
    feb_interviewer: str = ''
    feb_content: str = ''
    mar_interviewer: str = ''
    mar_content: str = ''
    apr_interviewer: str = ''
    apr_content: str = ''
    may_interviewer: str = ''
    may_content: str = ''
    jun_interviewer: str = ''
    jun_content: str = ''
    jul_interviewer: str = ''
    jul_content: str = ''
    aug_interviewer: str = ''
    aug_content: str = ''
    sep_interviewer: str = ''
    sep_content: str = ''
    oct_interviewer: str = ''
    oct_content: str = ''
    nov_interviewer: str = ''
    nov_content: str = ''
    dec_interviewer: str = ''
    dec_content: str = ''


class EmployeeInterviewRecordRowOut(BaseModel):
    id: int
    year: int
    interview_date: Optional[str] = None
    interviewee: str

    jan_interviewer: str
    jan_content: str
    feb_interviewer: str
    feb_content: str
    mar_interviewer: str
    mar_content: str
    apr_interviewer: str
    apr_content: str
    may_interviewer: str
    may_content: str
    jun_interviewer: str
    jun_content: str
    jul_interviewer: str
    jul_content: str
    aug_interviewer: str
    aug_content: str
    sep_interviewer: str
    sep_content: str
    oct_interviewer: str
    oct_content: str
    nov_interviewer: str
    nov_content: str
    dec_interviewer: str
    dec_content: str

    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @classmethod
    def model_validate(cls, obj):
        # 兼容 SQLAlchemy ORM
        if hasattr(obj, 'to_dict'):
            return cls(**obj.to_dict())
        return cls(**obj)


class EmployeeInterviewRecordListResponse(BaseModel):
    items: List[EmployeeInterviewRecordRowOut] = Field(default_factory=list)


class EmployeeInterviewRecordBulkSaveRequest(BaseModel):
    rows: List[EmployeeInterviewRecordRowIn]


class EmployeeInterviewRecordBulkSaveResponse(BaseModel):
    saved_count: int
    items: List[EmployeeInterviewRecordRowOut] = Field(default_factory=list)

