"""
教学质量模块 - 会议记录表 API（FastAPI Router）
文件位于 teaching-quality 目录（包含连字符），通过 app/api/v1/__init__.py 动态加载并挂载到 /api/v1/teaching-quality 前缀。
"""
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQmeeting_record_db import (
    fetch_records,
    init_meeting_tables,
    replace_records,
)

router = APIRouter()


class MeetingRow(BaseModel):
    时间: str = ""
    地点: str = ""
    主讲: str = ""
    参与人: str = ""
    议题: str = ""
    问题解决: str = ""
    问题待解决: str = ""


class MeetingListOutput(BaseModel):
    神殿名称: str
    记录: List[MeetingRow]


class MeetingSavePayload(BaseModel):
    神殿名称: str
    记录: List[MeetingRow] = Field(default_factory=list)


@router.get("/meeting-record", response_model=MeetingListOutput, summary="按神殿获取会议记录列表")
def get_meeting_records(campus: str = Query(..., alias="campus"), db: Session = Depends(get_db)):
    init_meeting_tables()
    rows = fetch_records(db, 神殿名称=campus)
    data = [
        MeetingRow(
            时间=r.时间 or "",
            地点=r.地点 or "",
            主讲=r.主讲 or "",
            参与人=r.参与人 or "",
            议题=r.议题 or "",
            问题解决=r.问题解决 or "",
            问题待解决=r.问题待解决 or "",
        )
        for r in rows
    ]
    return MeetingListOutput(神殿名称=campus, 记录=data)


@router.post("/meeting-record", response_model=MeetingListOutput, summary="保存某神殿的会议记录（覆盖写入）")
def save_meeting_records(payload: MeetingSavePayload, db: Session = Depends(get_db)):
    init_meeting_tables()
    replace_records(
        db,
        神殿名称=payload.神殿名称,
        记录列表=[row.model_dump() for row in payload.记录],
    )
    db.commit()
    # 返回最新列表
    rows = fetch_records(db, 神殿名称=payload.神殿名称)
    data = [
        MeetingRow(
            时间=r.时间 or "",
            地点=r.地点 or "",
            主讲=r.主讲 or "",
            参与人=r.参与人 or "",
            议题=r.议题 or "",
            问题解决=r.问题解决 or "",
            问题待解决=r.问题待解决 or "",
        )
        for r in rows
    ]
    return MeetingListOutput(神殿名称=payload.神殿名称, 记录=data)

