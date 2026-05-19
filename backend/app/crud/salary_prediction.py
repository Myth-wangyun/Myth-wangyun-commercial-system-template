"""
CRUD for salary prediction sheet
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.salary_prediction import SalaryPrediction
from app.schemas.salary_prediction import (
    SalaryPredictionCreate,
    SalaryPredictionUpdate,
)


def list_salary_predictions(
    db: Session, campus: Optional[str] = None, class_name: Optional[str] = None
) -> List[SalaryPrediction]:
    query = db.query(SalaryPrediction)
    if campus:
        query = query.filter(SalaryPrediction.campus_name == campus)
    if class_name:
        query = query.filter(SalaryPrediction.class_name == class_name)
    return query.order_by(SalaryPrediction.id.desc()).all()


def get_salary_prediction(db: Session, record_id: int) -> Optional[SalaryPrediction]:
    return db.query(SalaryPrediction).filter_by(id=record_id).first()


def create_salary_prediction(db: Session, data: SalaryPredictionCreate) -> SalaryPrediction:
    obj = SalaryPrediction(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_salary_prediction(
    db: Session, record_id: int, data: SalaryPredictionUpdate
) -> Optional[SalaryPrediction]:
    obj = get_salary_prediction(db, record_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_salary_prediction(db: Session, record_id: int) -> bool:
    obj = get_salary_prediction(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
