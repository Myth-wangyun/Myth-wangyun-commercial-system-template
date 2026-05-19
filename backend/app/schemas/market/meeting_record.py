from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class MeetingRecordRowBase(BaseModel):
    meeting_time: str = Field('', description='时间')
    location: str = Field('', description='地点')
    host: str = Field('', description='主持人')
    important_leader: str = Field('', description='重要领导')
    participants: str = Field('', description='参与人')
    agenda: str = Field('', description='议题')
    issues_resolved: str = Field('', description='会议记录人')
    issues_pending: str = Field('', description='备注')
    file_path: str = Field('', description='会议纪要文件路径')
    file_name: str = Field('', description='会议纪要文件名')


class MeetingRecordRowCreate(MeetingRecordRowBase):
    pass


class MeetingRecordRowOut(MeetingRecordRowBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeetingRecordListResponse(BaseModel):
    items: List[MeetingRecordRowOut]


class MeetingRecordBulkSaveRequest(BaseModel):
    rows: List[MeetingRecordRowCreate] = Field(default_factory=list)


class MeetingRecordBulkSaveResponse(BaseModel):
    saved_count: int
    items: List[MeetingRecordRowOut]


class FileUploadResponse(BaseModel):
    file_path: str
    file_name: str
    message: str

