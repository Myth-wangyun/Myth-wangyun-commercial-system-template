"""
祈福司转量审批配置
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class TransferApprovalConfig(AccountBase):
    """按神殿配置转量审批人"""

    __tablename__ = "consult_transfer_approval_configs"
    __table_args__ = (
        UniqueConstraint("campus", name="uq_consult_transfer_approval_configs_campus"),
        Index("ix_consult_transfer_approval_configs_campus", "campus"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campus: Mapped[str] = mapped_column(String(100), nullable=False, comment="目标神殿")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    approvers: Mapped[list["TransferApprovalConfigApprover"]] = relationship(
        "TransferApprovalConfigApprover",
        back_populates="config",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="TransferApprovalConfigApprover.sort_order.asc()",
    )


class TransferApprovalConfigApprover(AccountBase):
    """转量审批配置审批人"""

    __tablename__ = "consult_transfer_approval_config_approvers"
    __table_args__ = (
        UniqueConstraint(
            "config_id",
            "approver_user_id",
            name="uq_consult_transfer_approval_config_approver",
        ),
        Index("ix_consult_transfer_approval_config_approvers_config_id", "config_id"),
        Index(
            "ix_consult_transfer_approval_config_approvers_user_id",
            "approver_user_id",
        ),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    config_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.consult_transfer_approval_configs.id", ondelete="CASCADE"),
        nullable=False,
    )
    approver_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="审批人用户ID",
    )
    approver_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="审批人姓名")
    approver_department: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="审批人部门")
    approver_position: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="审批人岗位")
    approver_campus: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="审批人神殿")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), comment="创建时间")

    config: Mapped["TransferApprovalConfig"] = relationship("TransferApprovalConfig", back_populates="approvers")
