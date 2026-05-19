"""
祈福司会议记录表 API
"""

from app.core.database import get_db
from app.crud import consult_meeting_record as crud
from app.schemas.consult_meeting_record import (
    会议记录创建,
    会议记录响应,
    会议记录更新,
    会议记录行,
)
from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/{year}",
    response_model=会议记录响应,
    summary="获取祈福司会议记录表",
)
async def get_meeting_record(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    record = crud.获取(db, year)
    if not record:
        # 返回默认的12行空数据
        default_rows = [
            会议记录行(
                序号=i + 1,
                时间='',
                地点='',
                主持人='',
                重要领导='',
                参与人='',
                议题='',
                问题解决='',
                问题待解决='',
            )
            for i in range(12)
        ]
        return 会议记录响应(年份=year, 表格数据=default_rows)
    return 会议记录响应(
        年份=year,
        表格数据=record.表格数据,
        更新时间=record.更新时间,
    )


@router.post(
    "/",
    response_model=会议记录响应,
    summary="创建祈福司会议记录表",
)
async def create_meeting_record(
    数据: 会议记录创建 = Body(..., description="会议记录数据"),
    db: Session = Depends(get_db),
):
    try:
        record = crud.创建(db, 数据)
        return 会议记录响应(
            年份=record.年份,
            表格数据=record.表格数据,
            更新时间=record.更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.put(
    "/{year}",
    response_model=会议记录响应,
    summary="更新祈福司会议记录表",
)
async def update_meeting_record(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: 会议记录更新 = Body(..., description="会议记录表数据"),
    db: Session = Depends(get_db),
):
    try:
        record = crud.更新(db, year, 数据)
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")
        return 会议记录响应(
            年份=record.年份,
            表格数据=record.表格数据,
            更新时间=record.更新时间,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")


@router.delete(
    "/{year}",
    summary="删除祈福司会议记录表",
)
async def delete_meeting_record(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        success = crud.删除(db, year)
        if not success:
            raise HTTPException(status_code=404, detail="记录不存在")
        return {"message": "删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
