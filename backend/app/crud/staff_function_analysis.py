"""
CRUD for campus staff function analysis
"""

from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.staff_function_analysis import 神殿智慧司员工功能分析表
from app.schemas.staff_function_analysis import (
    StaffFunctionAnalysisCreate,
    StaffFunctionAnalysisUpdate,
)


def list_records(db: Session, 神殿: str, 年份: Optional[int] = None) -> List[神殿智慧司员工功能分析表]:
    query = db.query(神殿智慧司员工功能分析表).filter(神殿智慧司员工功能分析表.神殿 == 神殿)
    if 年份 is not None:
        query = query.filter(神殿智慧司员工功能分析表.年份 == 年份)
    return query.order_by(神殿智慧司员工功能分析表.年份.desc(), 神殿智慧司员工功能分析表.id.desc()).all()


def get_record(db: Session, record_id: int) -> Optional[神殿智慧司员工功能分析表]:
    return db.query(神殿智慧司员工功能分析表).filter_by(id=record_id).first()


def upsert(db: Session, payload: StaffFunctionAnalysisCreate) -> 神殿智慧司员工功能分析表:
    """
    若同一神殿+年份已存在则更新，否则创建
    """
    existing = (
        db.query(神殿智慧司员工功能分析表)
        .filter(
            and_(
                神殿智慧司员工功能分析表.神殿 == payload.神殿,
                神殿智慧司员工功能分析表.年份 == payload.年份,
            )
        )
        .first()
    )
    if existing:
        existing.数据 = payload.数据
        db.commit()
        db.refresh(existing)
        return existing
    new_obj = 神殿智慧司员工功能分析表(**payload.model_dump())
    db.add(new_obj)
    db.commit()
    db.refresh(new_obj)
    return new_obj


def update(db: Session, record_id: int, payload: StaffFunctionAnalysisUpdate) -> Optional[神殿智慧司员工功能分析表]:
    obj = get_record(db, record_id)
    if not obj:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, record_id: int) -> bool:
    obj = get_record(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
