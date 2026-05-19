"""
祈福司转量审批配置 CRUD
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.models.consult.transfer_approval_config import (
    TransferApprovalConfig,
    TransferApprovalConfigApprover,
)
from app.models.user import User, UserStatus
from app.schemas.consult.transfer_approval_config import TransferApprovalConfigUpsert


def list_configs(db: Session, campus: Optional[str] = None) -> list[TransferApprovalConfig]:
    query = db.query(TransferApprovalConfig).options(
        selectinload(TransferApprovalConfig.approvers)
    )
    if campus:
        query = query.filter(TransferApprovalConfig.campus == campus)
    return query.order_by(TransferApprovalConfig.campus.asc()).all()


def get_config_by_campus(db: Session, campus: str) -> Optional[TransferApprovalConfig]:
    return (
        db.query(TransferApprovalConfig)
        .options(selectinload(TransferApprovalConfig.approvers))
        .filter(TransferApprovalConfig.campus == campus)
        .first()
    )


def resolve_approver_users(db: Session, campus: Optional[str]) -> list[User]:
    if not campus:
        return []

    config = (
        db.query(TransferApprovalConfig)
        .options(selectinload(TransferApprovalConfig.approvers))
        .filter(
            TransferApprovalConfig.campus == campus,
            TransferApprovalConfig.is_active.is_(True),
        )
        .first()
    )
    if not config or not config.approvers:
        return []

    user_ids = [item.approver_user_id for item in config.approvers]
    users = (
        db.query(User)
        .filter(User.user_id.in_(user_ids), User.status == UserStatus.ACTIVE)
        .all()
    )
    user_map = {user.user_id: user for user in users}
    return [user_map[user_id] for user_id in user_ids if user_id in user_map]


def get_user_approver_campuses(db: Session, user_id: int) -> list[str]:
    rows = (
        db.query(TransferApprovalConfig.campus)
        .join(
            TransferApprovalConfigApprover,
            TransferApprovalConfigApprover.config_id == TransferApprovalConfig.id,
        )
        .filter(
            TransferApprovalConfig.is_active.is_(True),
            TransferApprovalConfigApprover.approver_user_id == user_id,
        )
        .order_by(TransferApprovalConfig.campus.asc())
        .all()
    )
    return [row[0] for row in rows]


def is_user_campus_approver(db: Session, campus: Optional[str], user_id: int) -> bool:
    if not campus:
        return False
    count = (
        db.query(TransferApprovalConfigApprover)
        .join(TransferApprovalConfig, TransferApprovalConfig.id == TransferApprovalConfigApprover.config_id)
        .filter(
            TransferApprovalConfig.campus == campus,
            TransferApprovalConfig.is_active.is_(True),
            TransferApprovalConfigApprover.approver_user_id == user_id,
        )
        .count()
    )
    return count > 0


def upsert_config(
    db: Session,
    campus: str,
    payload: TransferApprovalConfigUpsert,
) -> TransferApprovalConfig:
    campus = campus.strip()
    if not campus:
        raise ValueError("神殿不能为空")
    if not payload.approver_user_ids:
        raise ValueError("请至少配置一个审批人")

    approvers = (
        db.query(User)
        .filter(
            User.user_id.in_(payload.approver_user_ids),
            User.status == UserStatus.ACTIVE,
        )
        .all()
    )
    approver_map = {item.user_id: item for item in approvers}
    missing_user_ids = [
        user_id for user_id in payload.approver_user_ids if user_id not in approver_map
    ]
    if missing_user_ids:
        raise ValueError(f"审批人不存在或已停用: {missing_user_ids}")

    record = (
        db.query(TransferApprovalConfig)
        .options(selectinload(TransferApprovalConfig.approvers))
        .filter(TransferApprovalConfig.campus == campus)
        .first()
    )

    if not record:
        record = TransferApprovalConfig(campus=campus, is_active=payload.is_active)
        db.add(record)
        db.flush()
    else:
        record.is_active = payload.is_active
        record.approvers.clear()
        db.flush()

    for index, user_id in enumerate(payload.approver_user_ids):
        user = approver_map[user_id]
        record.approvers.append(
            TransferApprovalConfigApprover(
                approver_user_id=user.user_id,
                approver_name=user.real_name,
                approver_department=user.department,
                approver_position=user.position,
                approver_campus=user.campus,
                sort_order=index,
            )
        )

    db.commit()
    db.refresh(record)
    return record


def serialize_config(record: TransferApprovalConfig) -> dict:
    return {
        "id": record.id,
        "campus": record.campus,
        "is_active": record.is_active,
        "approvers": [
            {
                "id": approver.id,
                "approver_user_id": approver.approver_user_id,
                "approver_name": approver.approver_name,
                "approver_department": approver.approver_department,
                "approver_position": approver.approver_position,
                "approver_campus": approver.approver_campus,
                "sort_order": approver.sort_order,
            }
            for approver in record.approvers
        ],
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
