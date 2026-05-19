"""CRUD operations for reputation self check"""

from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.reputation_self_check import ReputationSelfCheck

DAY_FIELDS = [
    "newStudentCount",
    "oldStudentCount",
    "graduateCount",
    "wechatMoments",
    "douyin",
    "kuaishou",
    "xiaohongshu",
    "dailyTotal",
]


def calculate_totals(daily_data: Dict[str, dict]) -> dict:
    totals = {
        "newStudentTotal": 0,
        "oldStudentTotal": 0,
        "graduateTotal": 0,
        "wechatMomentsTotal": 0,
        "douyinTotal": 0,
        "kuaishouTotal": 0,
        "xiaohongshuTotal": 0,
        "grandTotal": 0,
    }
    for data in daily_data.values():
        totals["newStudentTotal"] += data.get("newStudentCount", 0) or 0
        totals["oldStudentTotal"] += data.get("oldStudentCount", 0) or 0
        totals["graduateTotal"] += data.get("graduateCount", 0) or 0
        totals["wechatMomentsTotal"] += data.get("wechatMoments", 0) or 0
        totals["douyinTotal"] += data.get("douyin", 0) or 0
        totals["kuaishouTotal"] += data.get("kuaishou", 0) or 0
        totals["xiaohongshuTotal"] += data.get("xiaohongshu", 0) or 0
        totals["grandTotal"] += data.get("dailyTotal", 0) or 0
    return totals


def list_self_checks(
    db: Session,
    campus: str,
    year: int,
    month: Optional[int] = None,
) -> List[tuple[ReputationSelfCheck, dict]]:
    query = (
        db.query(ReputationSelfCheck)
        .filter(
            ReputationSelfCheck.campus_name == campus,
            ReputationSelfCheck.year == year,
        )
        .order_by(ReputationSelfCheck.teacher_name.asc())
    )
    if month:
        query = query.filter(ReputationSelfCheck.month == month)
    records = query.all()
    return [(record, calculate_totals(record.daily_data or {})) for record in records]


def save_self_check(db: Session, data: dict) -> ReputationSelfCheck:
    record = None
    record_id = data.get("id")
    if record_id:
        record = db.get(ReputationSelfCheck, record_id)
    if not record:
        record = (
            db.query(ReputationSelfCheck)
            .filter(
                ReputationSelfCheck.campus_name == data["campus_name"],
                ReputationSelfCheck.teacher_name == data["teacher_name"],
                ReputationSelfCheck.year == data["year"],
                ReputationSelfCheck.month == data["month"],
            )
            .first()
        )
    if not record:
        record = ReputationSelfCheck()
    record.campus_name = data["campus_name"]
    record.teacher_name = data["teacher_name"]
    record.year = data["year"]
    record.month = data["month"]
    record.daily_data = data.get("daily_data", {})

    db.add(record)
    db.commit()
    db.refresh(record)
    return record
