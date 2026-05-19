"""
集团人资基础 - 转正述职报告 CRUD
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.human_resources.employee import EmployeeProfile
from app.models.human_resources.work_report import WorkReport
from app.models.user import User, UserRole, UserStatus
from app.schemas.human_resources.work_report import WorkReportCreate, WorkReportUpdate

HR_ADMIN_DEPARTMENT_MARKERS = ("人资行政", "人事行政", "人力资源", "人事部")
CADRE_POSITION_KEYWORDS = ("董事长", "总监", "经理", "主管", "部长", "主任", "校长", "负责人")


def _normalize_compact_text(value: Optional[str]) -> str:
    return (value or "").replace(" ", "").strip()


def _is_hr_admin_department(department: Optional[str]) -> bool:
    normalized = _normalize_compact_text(department)
    return any(marker in normalized for marker in HR_ADMIN_DEPARTMENT_MARKERS)


def _is_chairman_position(position: Optional[str]) -> bool:
    return (position or "").strip() == "董事长"


def _require_reporter_profile(current_user: User) -> tuple[str, str, str, str | None]:
    reporter_name = (current_user.real_name or current_user.username or "").strip()
    reporter_department = (current_user.department or "").strip()
    reporter_position = (current_user.position or "").strip()
    reporter_campus = (current_user.campus or "").strip() or None

    if not reporter_name:
        raise ValueError("当前账号缺少姓名，无法创建述职报告")
    if not reporter_department:
        raise ValueError("当前账号缺少部门信息，无法创建述职报告")
    if not reporter_position:
        raise ValueError("当前账号缺少岗位信息，无法创建述职报告")

    return reporter_name, reporter_department, reporter_position, reporter_campus


def _base_query(db: Session):
    return db.query(WorkReport)


def _get_user_profile(db: Session, user_id: int | None) -> tuple[User | None, EmployeeProfile | None]:
    if not user_id:
        return None, None
    pair = (
        db.query(User, EmployeeProfile)
        .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.user_id)
        .filter(User.user_id == user_id)
        .first()
    )
    if not pair:
        return None, None
    return pair


def _resolve_user_department(user: User | None, profile: EmployeeProfile | None) -> str:
    return (profile.department if profile and profile.department else user.department if user else "") or ""


def _resolve_user_position(user: User | None, profile: EmployeeProfile | None) -> str:
    return (profile.position if profile and profile.position else user.position if user else "") or ""


def _resolve_position_category(profile: EmployeeProfile | None) -> str:
    return (profile.position_category or "").strip() if profile else ""


def _same_department(department_a: Optional[str], department_b: Optional[str]) -> bool:
    return _normalize_compact_text(department_a) == _normalize_compact_text(department_b)


def _is_cadre_or_above(user: User | None, profile: EmployeeProfile | None) -> bool:
    if user is None:
        return False
    if user.is_superuser or user.role in {UserRole.ADMIN, UserRole.MANAGER}:
        return True

    position_category = _resolve_position_category(profile)
    if position_category == "干部":
        return True

    position = _normalize_compact_text(_resolve_user_position(user, profile))
    return any(keyword in position for keyword in CADRE_POSITION_KEYWORDS)


def _global_viewer_user_ids(db: Session) -> set[int]:
    users = db.query(User).filter(User.status == UserStatus.ACTIVE).all()
    return {
        user.user_id
        for user in users
        if _is_hr_admin_department(user.department) or _is_chairman_position(user.position)
    }


def _is_same_department_cadre_viewer(
    db: Session,
    record: WorkReport,
    current_user: User,
) -> bool:
    user, profile = _get_user_profile(db, current_user.user_id)
    if user is None:
        return False
    if not _same_department(_resolve_user_department(user, profile), record.reporter_department):
        return False
    return _is_cadre_or_above(user, profile)


def get_record(db: Session, record_id: int) -> WorkReport | None:
    return _base_query(db).filter(WorkReport.id == record_id).first()


def get_latest_record_for_user(db: Session, user_id: int | None) -> WorkReport | None:
    if not user_id:
        return None
    return (
        _base_query(db)
        .filter(WorkReport.reporter_user_id == user_id)
        .order_by(WorkReport.report_date.desc(), WorkReport.created_at.desc())
        .first()
    )


def has_completed_report_for_user(db: Session, user_id: int | None) -> bool:
    return get_latest_record_for_user(db, user_id) is not None


def ensure_user_completed_report(
    db: Session,
    user_id: int | None,
    error_message: str = "请先填写述职报告后再填写转正申请表",
) -> WorkReport:
    record = get_latest_record_for_user(db, user_id)
    if record is None:
        raise ValueError(error_message)
    return record


def get_current_user_report_status(db: Session, current_user: User) -> dict:
    latest_record = get_latest_record_for_user(db, current_user.user_id)
    return {
        "has_completed_report": latest_record is not None,
        "latest_report_id": latest_record.id if latest_record else None,
        "latest_report_date": latest_record.report_date if latest_record else None,
    }


def can_view_record(db: Session, record: WorkReport, current_user: User) -> bool:
    if current_user.user_id == record.reporter_user_id:
        return True
    if current_user.user_id in _global_viewer_user_ids(db):
        return True
    return _is_same_department_cadre_viewer(db, record, current_user)


def can_edit_record(db: Session, record: WorkReport, current_user: User) -> bool:
    _ = db
    return current_user.user_id == record.reporter_user_id


def list_records(db: Session, current_user: User) -> list[WorkReport]:
    query = _base_query(db).order_by(WorkReport.report_date.desc(), WorkReport.created_at.desc())
    if current_user.user_id in _global_viewer_user_ids(db):
        return query.all()

    records = query.all()
    return [record for record in records if can_view_record(db, record, current_user)]


def create_record(db: Session, payload: WorkReportCreate, current_user: User) -> WorkReport:
    reporter_name, reporter_department, reporter_position, reporter_campus = _require_reporter_profile(current_user)

    record = WorkReport(
        reporter_user_id=current_user.user_id,
        reporter_name=reporter_name,
        reporter_department=reporter_department,
        reporter_position=reporter_position,
        reporter_campus=reporter_campus,
        report_date=payload.report_date,
        work_description=payload.work_description.strip(),
        difficulties=payload.difficulties.strip(),
        achievements=payload.achievements.strip(),
        improvements=payload.improvements.strip(),
        future_plan=payload.future_plan.strip(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(
    db: Session,
    record: WorkReport,
    payload: WorkReportUpdate,
    current_user: User,
) -> WorkReport:
    if not can_edit_record(db, record, current_user):
        raise PermissionError("无权编辑该述职报告")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(record, field, value)

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: WorkReport, current_user: User) -> None:
    if not can_edit_record(db, record, current_user):
        raise PermissionError("无权删除该述职报告")

    db.delete(record)
    db.commit()


def serialize_record(record: WorkReport, current_user: User, db: Session) -> dict:
    editable = can_edit_record(db, record, current_user)
    return {
        "id": record.id,
        "reporter_user_id": record.reporter_user_id,
        "name": record.reporter_name,
        "department": record.reporter_department,
        "position": record.reporter_position,
        "campus": record.reporter_campus,
        "report_date": record.report_date,
        "work_description": record.work_description,
        "difficulties": record.difficulties,
        "achievements": record.achievements,
        "improvements": record.improvements,
        "future_plan": record.future_plan,
        "can_edit": editable,
        "can_delete": editable,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
