"""
CRUD helpers for student interview records
"""

from typing import List

from sqlalchemy.orm import Session

from app.models.student_interview import StudentInterviewRecord


def list_interview_records(
    db: Session, campus: str, class_code: str = ""
) -> List[StudentInterviewRecord]:
    query = db.query(StudentInterviewRecord).filter(
        StudentInterviewRecord.campus_name == campus,
    )
    # 如果指定了 class_code，则按班级过滤；否则返回该神殿所有班级的记录
    if class_code:
        query = query.filter(StudentInterviewRecord.class_code == class_code)
    return query.order_by(StudentInterviewRecord.interview_date).all()


def list_distinct_class_codes(db: Session, campus: str) -> List[str]:
    """获取指定神殿的所有班级编码（去重）"""
    results = (
        db.query(StudentInterviewRecord.class_code)
        .filter(StudentInterviewRecord.campus_name == campus)
        .distinct()
        .all()
    )
    return [r[0] for r in results if r[0]]


def list_distinct_class_names(db: Session, campus: str) -> List[str]:
    """获取指定神殿的所有班级名称（去重）"""
    results = (
        db.query(StudentInterviewRecord.class_name)
        .filter(StudentInterviewRecord.campus_name == campus)
        .distinct()
        .all()
    )
    return [r[0] for r in results if r[0]]


def replace_interview_records(
    db: Session,
    campus: str,
    class_code: str,
    class_name: str,
    records: List[dict],
):
    db.query(StudentInterviewRecord).filter(
        StudentInterviewRecord.campus_name == campus,
        StudentInterviewRecord.class_code == class_code,
    ).delete(synchronize_session=False)

    for record in records:
        db.add(
            StudentInterviewRecord(
                campus_name=campus,
                class_code=class_code,
                class_name=class_name,
                student_name=record["student_name"],
                student_id=record.get("student_id"),
                interviewer=record["interviewer"],
                month=record["month"],
                year=record["year"],
                content=record["content"],
                interview_date=record["interview_date"],
                major_name=record.get("major_name"),
            )
        )
    db.commit()


def serialize_records(records: List[StudentInterviewRecord]) -> dict:
    if not records:
        return {}
    base = records[0]
    return {
        "campus": base.campus_name,
        "class_code": base.class_code,
        "class_name": base.class_name,
        "records": [
            {
                "student_name": r.student_name,
                "student_id": r.student_id,
                "interviewer": r.interviewer,
                "month": r.month,
                "year": r.year,
                "content": r.content,
                "interview_date": r.interview_date,
                "class_code": r.class_code,
                "class_name": r.class_name,
                "campus": r.campus_name,
                "major_name": r.major_name,
            }
            for r in records
        ],
    }
