import os
import shutil
from pathlib import Path
from typing import Annotated

from app.core.database import get_db
from app.core.paths import get_upload_root
from app.schemas.market.meeting_record import (
    FileUploadResponse,
    MeetingRecordBulkSaveRequest,
    MeetingRecordBulkSaveResponse,
    MeetingRecordListResponse,
    MeetingRecordRowOut,
)
from app.services.market.meeting_record import bulk_save, list_rows
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

router = APIRouter()

UPLOAD_BASE_DIR = get_upload_root()
UPLOAD_DIR = UPLOAD_BASE_DIR / "meeting-records"
DbSession = Annotated[Session, Depends(get_db)]
UploadedMeetingRecord = Annotated[UploadFile, File(...)]


def _ensure_upload_dir() -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


@router.get('/meeting-record', response_model=MeetingRecordListResponse, summary='获取会议记录表')
def get_meeting_record(db: DbSession):
    items = list_rows(db)
    return {
        'items': [MeetingRecordRowOut.model_validate(i) for i in items],
    }


@router.post(
    '/meeting-record/bulk-save',
    response_model=MeetingRecordBulkSaveResponse,
    summary='整表保存会议记录表（覆盖）',
)
def bulk_save_meeting_record(payload: MeetingRecordBulkSaveRequest, db: DbSession):
    items = bulk_save(db, payload.rows)
    return {
        'saved_count': len(items),
        'items': [MeetingRecordRowOut.model_validate(i) for i in items],
    }


@router.post(
    '/meeting-record/upload',
    response_model=FileUploadResponse,
    summary='上传会议记录文件',
)
async def upload_meeting_record_file(
    file: UploadedMeetingRecord,
    db: DbSession,
):
    """上传会议记录文件"""
    try:
        # 确保上传目录存在
        upload_dir = _ensure_upload_dir()
        
        # 生成唯一文件名
        import time
        timestamp = int(time.time() * 1000)
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = upload_dir / unique_filename
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 返回相对路径
        relative_path = f"meeting-records/{unique_filename}"
        
        return FileUploadResponse(
            file_path=relative_path,
            file_name=file.filename or unique_filename,
            message="文件上传成功"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}") from e


@router.get(
    '/meeting-record/download',
    summary='下载会议记录文件',
)
async def download_meeting_record_file(file_path: str):
    """下载会议记录文件"""
    try:
        # 构建完整文件路径
        full_path = UPLOAD_BASE_DIR / file_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        return FileResponse(
            path=str(full_path),
            filename=full_path.name,
            media_type='application/octet-stream'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件下载失败: {str(e)}") from e


@router.delete(
    '/meeting-record/delete-file',
    summary='删除会议记录文件',
)
async def delete_meeting_record_file(file_path: str):
    """删除会议记录文件"""
    try:
        # 构建完整文件路径
        full_path = UPLOAD_BASE_DIR / file_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 删除文件
        os.remove(full_path)
        
        return {"message": "文件删除成功", "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件删除失败: {str(e)}") from e
