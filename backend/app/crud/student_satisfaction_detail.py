"""
CRUD for student satisfaction detail
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.student_satisfaction_avg import StudentSatisfactionAvg
from app.models.student_satisfaction_detail import StudentSatisfactionDetail
from app.schemas.student_satisfaction_detail import (
    StudentSatisfactionAvgOut,
    StudentSatisfactionDetailCreate,
    StudentSatisfactionDetailUpdate,
)


def list_details(
    db: Session,
    campus: Optional[str] = None,
    teacher: Optional[str] = None,
    class_name: Optional[str] = None,
    year: Optional[int] = None,
) -> List[StudentSatisfactionDetail]:
    query = db.query(StudentSatisfactionDetail)
    if campus:
        query = query.filter(StudentSatisfactionDetail.campus_name == campus)
    if teacher:
        query = query.filter(StudentSatisfactionDetail.teacher_name == teacher)
    if class_name is not None:
        query = query.filter(StudentSatisfactionDetail.class_name == class_name)
    if year:
        query = query.filter(StudentSatisfactionDetail.year == year)
    return query.order_by(StudentSatisfactionDetail.id.desc()).all()


def get_detail(db: Session, record_id: int) -> Optional[StudentSatisfactionDetail]:
    return db.query(StudentSatisfactionDetail).filter_by(id=record_id).first()


def create_detail(db: Session, data: StudentSatisfactionDetailCreate) -> StudentSatisfactionDetail:
    obj = StudentSatisfactionDetail(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_detail(db: Session, record_id: int, data: StudentSatisfactionDetailUpdate) -> Optional[StudentSatisfactionDetail]:
    obj = get_detail(db, record_id)
    if not obj:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_detail(db: Session, record_id: int) -> bool:
    obj = get_detail(db, record_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


def list_avg(db: Session, campus: Optional[str] = None, year: Optional[int] = None) -> List[StudentSatisfactionAvg]:
    query = db.query(StudentSatisfactionAvg)
    if campus:
        query = query.filter(StudentSatisfactionAvg.campus_name == campus)
    if year:
        query = query.filter(StudentSatisfactionAvg.year == year)
    return query.order_by(StudentSatisfactionAvg.teacher_name).all()


def compute_avg_from_details(
    db: Session, campus: Optional[str] = None, year: Optional[int] = None
) -> List[StudentSatisfactionAvgOut]:
    """按教员/月份从明细表动态聚合平均分"""
    query = db.query(StudentSatisfactionDetail)
    if campus:
        query = query.filter(StudentSatisfactionDetail.campus_name == campus)
    if year:
        query = query.filter(StudentSatisfactionDetail.year == year)
    details = query.all()

    by_teacher: dict[str, dict[int, list[float]]] = {}
    for d in details:
        rows = d.rows or []
        for item in rows:
            if not isinstance(item, dict):
                continue

            # 1) 新格式：明确的 month / score 字段
            month_raw = item.get("month") or item.get("月份") or item.get("month_num")
            score_raw = item.get("score") or item.get("分数") or item.get("value")
            if month_raw is not None and score_raw is not None:
                try:
                    month = int(month_raw)
                    score = float(score_raw)
                except Exception:
                    month = None
                    score = None
                if month and 1 <= month <= 12 and score is not None:
                    if d.teacher_name not in by_teacher:
                        by_teacher[d.teacher_name] = {}
                    if month not in by_teacher[d.teacher_name]:
                        by_teacher[d.teacher_name][month] = []
                    by_teacher[d.teacher_name][month].append(score)
                    continue

            # 2) 旧格式：m1..m12 分散在每条 row 中
            for m in range(1, 13):
                key = f"m{m}"
                if key in item:
                    try:
                        score = float(item[key])
                    except Exception:
                        continue
                    if d.teacher_name not in by_teacher:
                        by_teacher[d.teacher_name] = {}
                    if m not in by_teacher[d.teacher_name]:
                        by_teacher[d.teacher_name][m] = []
                    by_teacher[d.teacher_name][m].append(score)

    results: List[StudentSatisfactionAvgOut] = []
    for teacher, months in by_teacher.items():
        data = {
            "campus_name": campus or details[0].campus_name if details else campus or "",
            "year": year or details[0].year if details else year or 0,
            "teacher_name": teacher,
        }
        for m, scores in months.items():
            if scores:
                avg_val = sum(scores) / len(scores)
                data[f"m{m}"] = round(avg_val, 2)
        results.append(StudentSatisfactionAvgOut(**data))
    # 按教师姓名排序
    results.sort(key=lambda x: x.teacher_name or "")
    return results
