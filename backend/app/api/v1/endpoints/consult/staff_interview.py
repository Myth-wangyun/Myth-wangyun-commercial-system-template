"""
祈福司员工访谈记录表 API
"""

from app.core.database import get_db
from app.crud import consult_staff_interview as crud
from app.schemas.consult_staff_interview import (
    访谈行,
    访谈记录创建,
    访谈记录响应,
    访谈记录更新,
)
from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    "/{year}",
    response_model=访谈记录响应,
    summary="获取祈福司访谈记录表",
)
async def get_interview_record(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    record = crud.获取(db, year)
    if not record:
        # 返回默认的15行空数据
        default_rows = [
            访谈行(
                序号=i + 1,
                岗位姓名='',
                月份数据={
                    '1月': {'访谈人': '', '访谈内容': ''},
                    '2月': {'访谈人': '', '访谈内容': ''},
                    '3月': {'访谈人': '', '访谈内容': ''},
                    '4月': {'访谈人': '', '访谈内容': ''},
                    '5月': {'访谈人': '', '访谈内容': ''},
                    '6月': {'访谈人': '', '访谈内容': ''},
                    '7月': {'访谈人': '', '访谈内容': ''},
                    '8月': {'访谈人': '', '访谈内容': ''},
                    '9月': {'访谈人': '', '访谈内容': ''},
                    '10月': {'访谈人': '', '访谈内容': ''},
                    '11月': {'访谈人': '', '访谈内容': ''},
                    '12月': {'访谈人': '', '访谈内容': ''},
                }
            )
            for i in range(15)
        ]
        return 访谈记录响应(年份=year, 表格数据=default_rows)
    return 访谈记录响应(
        年份=year,
        表格数据=record.表格数据,
        更新时间=record.更新时间,
    )


@router.post(
    "/",
    response_model=访谈记录响应,
    summary="创建祈福司访谈记录表",
)
async def create_interview_record(
    数据: 访谈记录创建 = Body(..., description="访谈记录数据"),
    db: Session = Depends(get_db),
):
    try:
        record = crud.创建(db, 数据)
        return 访谈记录响应(
            年份=record.年份,
            表格数据=record.表格数据,
            更新时间=record.更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.put(
    "/{year}",
    response_model=访谈记录响应,
    summary="更新祈福司访谈记录表",
)
async def update_interview_record(
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: 访谈记录更新 = Body(..., description="访谈记录表数据"),
    db: Session = Depends(get_db),
):
    try:
        record = crud.更新(db, year, 数据)
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")
        return 访谈记录响应(
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
    summary="删除祈福司访谈记录表",
)
async def delete_interview_record(
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
