"""
CRUD helpers for reputation key point detail
"""

from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.reputation_key_point import ReputationKeyPointDetail
from app.models.student_interview import StudentInterviewRecord


def list_details(db: Session, campus: str, year: int) -> List[ReputationKeyPointDetail]:
    return (
        db.query(ReputationKeyPointDetail)
        .filter(
            ReputationKeyPointDetail.campus_name == campus,
            ReputationKeyPointDetail.year == year,
        )
        .order_by(ReputationKeyPointDetail.month, ReputationKeyPointDetail.teacher_name)
        .all()
    )


def replace_details(
    db: Session, campus: str, year: int, records: List[dict]
) -> None:
    db.query(ReputationKeyPointDetail).filter(
        ReputationKeyPointDetail.campus_name == campus,
        ReputationKeyPointDetail.year == year,
    ).delete(synchronize_session=False)

    for record in records:
        db.add(
            ReputationKeyPointDetail(
                campus_name=campus,
                year=year,
                month=record["month"],
                teacher_name=record["teacher_name"],
                wechat_moments_count=record.get("wechat_moments_count", 0),
                douyin_count=record.get("douyin_count", 0),
                kuaishou_count=record.get("kuaishou_count", 0),
                xiaohongshu_count=record.get("xiaohongshu_count", 0),
                current_student_interview_count=record.get(
                    "current_student_interview_count", 0
                ),
                graduate_interview_count=record.get("graduate_interview_count", 0),
            )
        )
    db.commit()


def fetch_student_interview_counts(
    db: Session, campus: str, year: int, class_code: str | None = None
) -> dict[tuple[int, str], int]:
    """
    根据学员访谈记录统计在校生访谈次数，返回 {(month, teacher_name): count}
    只统计有实际访谈内容和访谈人的记录
    """
    query = db.query(
        StudentInterviewRecord.month,
        StudentInterviewRecord.interviewer,
        func.count().label("cnt"),
    ).filter(
        StudentInterviewRecord.campus_name == campus,
        StudentInterviewRecord.year == year,
        StudentInterviewRecord.interviewer != "",
        StudentInterviewRecord.content != "",
    )
    if class_code:
        query = query.filter(StudentInterviewRecord.class_code == class_code)

    rows = (
        query.group_by(
            StudentInterviewRecord.month,
            StudentInterviewRecord.interviewer,
        ).all()
    )
    return {(row.month, row.interviewer): row.cnt for row in rows}
