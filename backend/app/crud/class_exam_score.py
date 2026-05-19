"""
CRUD for class exam scores
"""

from typing import List, Optional, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.class_exam_score import ClassExamScore


def _calc_totals(major_name: str, scores_first: dict, scores_makeup: dict):
    """
    根据专业计算综合分与通过情况，并返回最终成绩JSON、班级人数、通过人数
    scores_first/scores_makeup 结构期望：{"students": [{student_id, student_name, vocabulary_score, written_score, lab_score, daily_score}]}
    """
    students_first = scores_first.get("students", []) if isinstance(scores_first, dict) else []
    students_makeup = scores_makeup.get("students", []) if isinstance(scores_makeup, dict) else []
    makeup_map = {item.get("student_id"): item for item in students_makeup}

    def compute_total(item: dict) -> float:
        written = float(item.get("written_score") or 0)
        lab = float(item.get("lab_score") or 0)
        daily = float(item.get("daily_score") or 0)
        if major_name and ("设计" in major_name or "媒" in major_name):
            return written * 0.4 + lab * 0.4 + daily * 0.2
        # 默认 IT
        return written * 0.5 + lab * 0.5

    finals = []
    pass_count = 0

    for stu in students_first:
        sid = stu.get("student_id")
        first_total = compute_total(stu)
        makeup = makeup_map.get(sid)
        makeup_total = compute_total(makeup) if makeup else None
        result = first_total if first_total >= 60 else (makeup_total if makeup_total is not None else None)
        passed = (first_total >= 60) or (makeup_total is not None and makeup_total >= 60)
        if passed:
            pass_count += 1
        finals.append(
            {
                "student_id": sid,
                "student_name": stu.get("student_name"),
                "first_total": first_total,
                "makeup_total": makeup_total,
                "result": result,
                "passed": passed,
            }
        )

    class_size = len(students_first)
    scores_final = {"students": finals}
    return scores_final, class_size, pass_count


def list_scores(
    db: Session,
    campus_name: Optional[str] = None,
    class_name: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[ClassExamScore], int]:
    query = db.query(ClassExamScore)
    
    # 神殿名称灵活匹配：支持 "盛邦" 和 "主神殿" 互相匹配
    if campus_name:
        campus_normalized = campus_name.replace('神殿', '')
        campus_with_suffix = f"{campus_normalized}神殿" if not campus_name.endswith('神殿') else campus_name
        # 构建可能的匹配值列表
        campus_variants = [campus_name, campus_normalized, campus_with_suffix]
        # 去重
        campus_variants = list(dict.fromkeys(campus_variants))
        # 使用 OR 条件匹配所有可能的格式
        query = query.filter(or_(*[ClassExamScore.campus_name == variant for variant in campus_variants]))
    
    # 班级名称灵活匹配：支持 "168" 和 "168班" 互相匹配
    if class_name:
        class_normalized = class_name.replace('班', '')
        class_with_suffix = f"{class_normalized}班" if not class_name.endswith('班') else class_name
        # 构建可能的匹配值列表
        class_variants = [class_name, class_normalized, class_with_suffix]
        # 去重
        class_variants = list(dict.fromkeys(class_variants))
        # 使用 OR 条件匹配所有可能的格式
        query = query.filter(or_(*[ClassExamScore.class_name == variant for variant in class_variants]))
    
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            func.lower(ClassExamScore.course_name).like(func.lower(pattern))
            | func.lower(ClassExamScore.instructor_name).like(func.lower(pattern))
        )
    total = query.count()
    records = (
        query.order_by(ClassExamScore.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return records, total


def create_score(db: Session, data: dict) -> ClassExamScore:
    scores_first = data.get("scores_first") or {}
    scores_makeup = data.get("scores_makeup") or {}
    scores_final, class_size, pass_count = _calc_totals(
        data.get("major_name", ""), scores_first, scores_makeup
    )
    record = ClassExamScore(
        **data,
        scores_final=scores_final,
        class_size=class_size,
        pass_count=pass_count,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_score(db: Session, record_id: int, data: dict) -> Optional[ClassExamScore]:
    record = db.get(ClassExamScore, record_id)
    if not record:
        return None
    for key, value in data.items():
        if value is not None and hasattr(record, key):
            setattr(record, key, value)
    # 重新计算
    scores_first = record.scores_first or {}
    scores_makeup = record.scores_makeup or {}
    scores_final, class_size, pass_count = _calc_totals(
        record.major_name, scores_first, scores_makeup
    )
    record.scores_final = scores_final
    record.class_size = class_size
    record.pass_count = pass_count
    db.commit()
    db.refresh(record)
    return record


def delete_score(db: Session, record_id: int) -> bool:
    record = db.get(ClassExamScore, record_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
