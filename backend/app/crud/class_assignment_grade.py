from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.class_assignment_grade import ClassAssignmentGrade
from app.schemas.class_assignment_grade import (
    ClassAssignmentGradeCreate,
    ClassAssignmentGradeUpdate,
)


def _compute_metrics(records: dict):
    students = records.get("students", []) if isinstance(records, dict) else []
    assignments_seen = set()
    actual_submit = 0
    pass_count = 0
    for stu in students:
        for entry in stu.get("assignments", []):
            num = entry.get("number")
            if num is not None:
                assignments_seen.add(num)
            score = entry.get("assignment_score")
            submitted = entry.get("submitted")
            if submitted or score is not None:
                actual_submit += 1
                try:
                    s_val = float(score) if score is not None else None
                except Exception:
                    s_val = None
                # 作业满分10分，合格标准6分
                if s_val is not None and s_val >= 6:
                    pass_count += 1
    class_size = len(students)
    assignment_count = len(assignments_seen)
    expected = class_size * assignment_count
    submit_rate = float(actual_submit) / expected * 100 if expected else 0
    # 合格率 = 合格数 / 有分值的作业数
    pass_rate = float(pass_count) / actual_submit * 100 if actual_submit else 0
    unsubmitted_count = expected - actual_submit
    return {
        "class_size": class_size,
        "assignment_count": assignment_count,
        "expected_submit": expected,
        "actual_submit": actual_submit,
        "unsubmitted_count": unsubmitted_count,
        "pass_count": pass_count,
        "submit_rate": round(submit_rate, 2),
        "pass_rate": round(pass_rate, 2),
    }


def list_records(
    db: Session,
    campus: Optional[str] = None,
    major: Optional[str] = None,
    class_name: Optional[str] = None,
    course: Optional[str] = None,
) -> List[ClassAssignmentGrade]:
    query = db.query(ClassAssignmentGrade)
    if campus:
        query = query.filter(ClassAssignmentGrade.campus_name == campus)
    if major:
        query = query.filter(ClassAssignmentGrade.major_name == major)
    if class_name:
        query = query.filter(ClassAssignmentGrade.class_name == class_name)
    if course:
        query = query.filter(ClassAssignmentGrade.course_name == course)
    return query.order_by(ClassAssignmentGrade.id.desc()).all()


def create_record(db: Session, data: ClassAssignmentGradeCreate) -> ClassAssignmentGrade:
    payload = data.model_dump()
    print(f"[DEBUG create_record] 收到的payload: class_size={payload.get('class_size')}, expected={payload.get('expected_submit')}, actual={payload.get('actual_submit')}, pass={payload.get('pass_count')}")
    # 如果前端没有传递统计字段，才重新计算（检查字段是否存在，而不是检查布尔值）
    should_compute = not all([
        "class_size" in payload and payload["class_size"] is not None,
        "assignment_count" in payload and payload["assignment_count"] is not None,
        "expected_submit" in payload and payload["expected_submit"] is not None,
        "actual_submit" in payload and payload["actual_submit"] is not None,
        "pass_count" in payload and payload["pass_count"] is not None
    ])
    print(f"[DEBUG create_record] 是否需要重新计算: {should_compute}")
    if should_compute:
        metrics = _compute_metrics(data.records if isinstance(data.records, dict) else {"students": data.records})
        print(f"[DEBUG create_record] 计算后的metrics: {metrics}")
        payload.update(metrics)
    obj = ClassAssignmentGrade(**payload)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_record(db: Session, record_id: int, data: ClassAssignmentGradeUpdate) -> Optional[ClassAssignmentGrade]:
    obj = db.query(ClassAssignmentGrade).filter_by(id=record_id).first()
    if not obj:
        return None
    updates = data.model_dump(exclude_unset=True)
    print(f"[DEBUG update_record] updates: class_size={updates.get('class_size')}, expected={updates.get('expected_submit')}, actual={updates.get('actual_submit')}, pass={updates.get('pass_count')}")
    # 如果前端传递了统计字段，优先使用前端的值；否则重新计算
    if "records" in updates and updates["records"] is not None:
        # 检查是否缺失统计字段（检查字段是否存在，而不是检查布尔值）
        should_compute = not all([
            "class_size" in updates and updates["class_size"] is not None,
            "assignment_count" in updates and updates["assignment_count"] is not None,
            "expected_submit" in updates and updates["expected_submit"] is not None,
            "actual_submit" in updates and updates["actual_submit"] is not None,
            "pass_count" in updates and updates["pass_count"] is not None
        ])
        print(f"[DEBUG update_record] 是否需要重新计算: {should_compute}")
        if should_compute:
            metrics = _compute_metrics(updates["records"] if isinstance(updates["records"], dict) else {"students": updates["records"]})
            print(f"[DEBUG update_record] 计算后的metrics: {metrics}")
            updates.update(metrics)
    for k, v in updates.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_record(db: Session, record_id: int) -> bool:
    obj = db.query(ClassAssignmentGrade).filter_by(id=record_id).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
