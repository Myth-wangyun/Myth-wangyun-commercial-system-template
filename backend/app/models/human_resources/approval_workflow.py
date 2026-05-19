"""
规则化审批流程配置模型。
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class ApprovalFlowTemplate(AccountBase):
    """审批流程模板。"""

    __tablename__ = "approval_flow_templates"
    __table_args__ = (
        UniqueConstraint(
            "flow_type",
            "campus",
            "apply_department",
            "apply_position",
            name="uq_approval_flow_templates_scope",
        ),
        Index("ix_approval_flow_templates_flow_type", "flow_type"),
        Index("ix_approval_flow_templates_campus", "campus"),
        Index("ix_approval_flow_templates_priority", "priority"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    flow_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="流程类型"
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="模板名称")
    campus: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="适用神殿，空表示全部",
    )
    apply_department: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="适用部门，空表示全部",
    )
    apply_position: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="适用岗位，空表示全部",
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="模板说明"
    )
    priority: Mapped[int] = mapped_column(
        Integer, nullable=False, default=100, server_default="100", comment="优先级"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="TRUE", comment="是否启用"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    nodes: Mapped[list["ApprovalFlowTemplateNode"]] = relationship(
        "ApprovalFlowTemplateNode",
        back_populates="template",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ApprovalFlowTemplateNode.node_order.asc()",
    )


class ApprovalFlowTemplateNode(AccountBase):
    """审批流程模板节点。"""

    __tablename__ = "approval_flow_template_nodes"
    __table_args__ = (
        UniqueConstraint(
            "template_id",
            "stage",
            name="uq_approval_flow_template_nodes_stage",
        ),
        Index("ix_approval_flow_template_nodes_template_id", "template_id"),
        Index("ix_approval_flow_template_nodes_order", "node_order"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    template_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config.approval_flow_templates.id", ondelete="CASCADE"),
        nullable=False,
        comment="模板ID",
    )
    stage: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="审批阶段编码"
    )
    stage_label: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="审批阶段名称"
    )
    node_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1", comment="节点顺序"
    )
    approver_source_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="审批人来源类型"
    )
    approver_source_value: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="审批人来源值"
    )
    is_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="TRUE", comment="是否必经"
    )
    allow_multi_approver: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="FALSE",
        comment="是否允许多人审批",
    )
    applicant_selectable: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="TRUE",
        comment="申请人是否可调整",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )

    template: Mapped["ApprovalFlowTemplate"] = relationship(
        "ApprovalFlowTemplate", back_populates="nodes"
    )


class OrgResponsibilityBinding(AccountBase):
    """组织职责绑定。"""

    __tablename__ = "org_responsibility_bindings"
    __table_args__ = (
        UniqueConstraint(
            "responsibility_code",
            "campus_scope",
            "department_scope",
            "position_scope",
            "user_id",
            name="uq_org_responsibility_bindings_scope_user",
        ),
        Index("ix_org_responsibility_bindings_code", "responsibility_code"),
        Index("ix_org_responsibility_bindings_campus_scope", "campus_scope"),
        Index("ix_org_responsibility_bindings_department_scope", "department_scope"),
        Index("ix_org_responsibility_bindings_position_scope", "position_scope"),
        Index("ix_org_responsibility_bindings_active", "is_active"),
        {"schema": "config"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    responsibility_code: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="职责编码"
    )
    responsibility_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="职责名称"
    )
    campus_scope: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="适用神殿，空表示全部",
    )
    department_scope: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="适用部门，空表示全部",
    )
    position_scope: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        server_default="",
        comment="适用岗位，空表示全部",
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("public.users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="绑定用户ID",
    )
    user_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="绑定用户姓名"
    )
    user_department: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="绑定用户部门快照"
    )
    user_position: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="绑定用户职位快照"
    )
    user_campus: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="绑定用户神殿快照"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0", comment="排序"
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="TRUE",
        comment="是否主负责人",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="TRUE", comment="是否启用"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )
