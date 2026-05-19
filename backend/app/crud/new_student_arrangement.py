"""
CRUD for new student arrangement
"""

from datetime import date as dt_date
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.new_student_arrangement import NewStudentArrangement


def list_arrangements(
    db: Session,
    campus: Optional[str] = None,
    date: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[List[NewStudentArrangement], int]:
    query = db.query(NewStudentArrangement)
    if campus:
        query = query.filter(NewStudentArrangement.campus == campus)

    # 兼容旧逻辑：date 仍然按“单日”过滤，不影响“神殿每日新生安排表”的现有功能
    if date:
        try:
            date_obj = dt_date.fromisoformat(date)
            query = query.filter(NewStudentArrangement.arrangement_date == date_obj)
        except ValueError:
            pass  # 日期格式无效则忽略此过滤条件
    # 新增能力：按年月过滤（用于绩效/奖惩等按月汇总页面），不传则不启用
    elif year is not None and month is not None:
        query = query.filter(
            func.extract('year', NewStudentArrangement.arrangement_date) == year,
            func.extract('month', NewStudentArrangement.arrangement_date) == month,
        )

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            func.lower(NewStudentArrangement.student_name).like(func.lower(pattern))
            | func.lower(NewStudentArrangement.major).like(func.lower(pattern))
        )
    total = query.count()
    records = (
        query.order_by(NewStudentArrangement.arrangement_date.desc(), NewStudentArrangement.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return records, total


def create_arrangement(db: Session, data: dict) -> NewStudentArrangement:
    owed_amount = (data.get("receivable_amount") or 0) - (data.get("received_amount") or 0)
    payload = {**data, "owed_amount": owed_amount}
    record = NewStudentArrangement(**payload)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_arrangement(db: Session, record_id: int, data: dict) -> Optional[NewStudentArrangement]:
    record = db.get(NewStudentArrangement, record_id)
    if not record:
        return None
    for key, value in data.items():
        if hasattr(record, key) and value is not None:
            setattr(record, key, value)
    if data.get("receivable_amount") is not None or data.get("received_amount") is not None:
        record.owed_amount = (record.receivable_amount or 0) - (record.received_amount or 0)
    db.commit()
    db.refresh(record)
    return record


def delete_arrangement(db: Session, record_id: int) -> bool:
    record = db.get(NewStudentArrangement, record_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
