"""
Endpoints for new student arrangements
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import new_student_arrangement as crud
from ....schemas.new_student_arrangement import (
    NewStudentArrangementCreate,
    NewStudentArrangementListResponse,
    NewStudentArrangementResponse,
    NewStudentArrangementUpdate,
)

router = APIRouter()


@router.get("/", response_model=NewStudentArrangementListResponse, summary="获取每日新生安排列表")
def list_arrangements(
    campus: str | None = Query(None, description="神殿"),
    date: str | None = Query(None, description="安排日期(YYYY-MM-DD)"),
    year: int | None = Query(None, description="年份"),
    month: int | None = Query(None, description="月份(1-12)"),
    search: str | None = Query(None, description="搜索关键字"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    # 兼容旧功能：传 date 时仍按“单日”查询；不传 date 时可用 year+month 做“按月”查询
    if date and (year is not None or month is not None):
        raise HTTPException(status_code=400, detail="date 与 year/month 不能同时传")

    records, total = crud.list_arrangements(
        db,
        campus=campus,
        date=date,
        year=year,
        month=month,
        search=search,
        page=page,
        page_size=page_size,
    )
    return NewStudentArrangementListResponse(
        records=[NewStudentArrangementResponse.from_orm(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=NewStudentArrangementResponse, summary="创建每日新生安排")
def create_arrangement(payload: NewStudentArrangementCreate, db: Session = Depends(get_db)):
    record = crud.create_arrangement(db, payload.model_dump())
    return NewStudentArrangementResponse.from_orm(record)


@router.put("/", response_model=NewStudentArrangementResponse, summary="更新每日新生安排")
def update_arrangement(payload: NewStudentArrangementUpdate, db: Session = Depends(get_db)):
    record = crud.update_arrangement(db, payload.id, payload.model_dump(exclude={"id"}))
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return NewStudentArrangementResponse.from_orm(record)


@router.delete("/", summary="删除每日新生安排")
def delete_arrangement(id: int, db: Session = Depends(get_db)):
    ok = crud.delete_arrangement(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}
