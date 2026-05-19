"""
人事看板统一事实表与聚合表模型。
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Date,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class DashboardManualRecruitmentDaily(AccountBase):
    __tablename__ = "dashboard_manual_recruitment_daily"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "stat_date",
            "org_name",
            name="uq_dashboard_manual_recruitment_daily",
        ),
        Index("ix_dashboard_manual_recruitment_daily_scope", "scope"),
        Index("ix_dashboard_manual_recruitment_daily_stat_date", "stat_date"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    stat_date: Mapped[date] = mapped_column(Date, nullable=False, comment="统计日期")
    org_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="部门或神殿"
    )
    authorized_posts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="编制职数"
    )
    current_posts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="现有职数"
    )
    boss_invite_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="Boss直聘邀约人数"
    )
    zhilian_invite_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="智联招聘邀约人数"
    )
    other_platform_invite_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="其他平台邀约人数"
    )
    planned_optimize_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="计划优化人数"
    )
    actual_optimize_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="实际优化人数"
    )
    transfer_names_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="调岗人员名单 JSON"
    )
    optimize_names_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="优化人员名单 JSON"
    )
    resign_names_json: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="离职人员名单 JSON"
    )
    updated_by_user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="最后更新人ID"
    )
    updated_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="最后更新人姓名"
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


class SalaryWelfareFact(AccountBase):
    __tablename__ = "salary_welfare_facts"
    __table_args__ = (
        Index("ix_salary_welfare_facts_scope", "scope"),
        Index("ix_salary_welfare_facts_stat_date", "stat_date"),
        Index("ix_salary_welfare_facts_org_name", "org_name"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    org_kind: Mapped[str] = mapped_column(
        String(20), nullable=False, default="org", comment="组织维度类型"
    )
    org_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="部门或神殿"
    )
    stat_date: Mapped[date] = mapped_column(Date, nullable=False, comment="统计日期")
    user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="员工ID"
    )
    person_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="姓名"
    )
    position: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="岗位"
    )
    position_category: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="岗位类别"
    )
    headcount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="现有人数"
    )
    salary: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="薪酬"
    )
    annual_welfare_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="年度福利总额"
    )
    monthly_incentive_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="月度激励总额"
    )
    temporary_reward_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="临时奖励总额"
    )
    deduction: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="扣款"
    )
    cadre_salary_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="干部薪酬总额"
    )
    staff_salary_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0, comment="基层薪酬总额"
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    updated_by_user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="最后更新人ID"
    )
    updated_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="最后更新人姓名"
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


class PerformanceFact(AccountBase):
    __tablename__ = "performance_facts"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "stat_month",
            "org_name",
            "person_name",
            name="uq_performance_facts_scope_month_org_name",
        ),
        Index("ix_performance_facts_scope", "scope"),
        Index("ix_performance_facts_stat_month", "stat_month"),
        Index("ix_performance_facts_org_name", "org_name"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    org_kind: Mapped[str] = mapped_column(
        String(20), nullable=False, default="org", comment="组织维度类型"
    )
    org_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="部门或神殿"
    )
    stat_month: Mapped[date] = mapped_column(
        Date, nullable=False, comment="统计月份，使用每月1号"
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="员工ID"
    )
    person_name: Mapped[str] = mapped_column(
        String(100), nullable=False, default="", comment="姓名"
    )
    position_category: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="岗位类别"
    )
    average_score: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), nullable=False, default=0, comment="绩效平均分"
    )
    leader_average_score: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), nullable=False, default=0, comment="干部绩效平均分"
    )
    staff_average_score: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), nullable=False, default=0, comment="基层绩效平均分"
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    updated_by_user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="最后更新人ID"
    )
    updated_by_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="最后更新人姓名"
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


class EmployeeArchiveSnapshot(AccountBase):
    __tablename__ = "employee_archive_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "snapshot_date",
            "user_id",
            name="uq_employee_archive_snapshots_scope_date_user",
        ),
        Index("ix_employee_archive_snapshots_scope", "scope"),
        Index("ix_employee_archive_snapshots_snapshot_date", "snapshot_date"),
        Index("ix_employee_archive_snapshots_org_name", "org_name"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    snapshot_date: Mapped[date] = mapped_column(
        Date, nullable=False, comment="快照日期"
    )
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="用户ID")
    username: Mapped[str] = mapped_column(String(100), nullable=False, comment="用户名")
    campus_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="神殿"
    )
    org_name: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="部门或神殿"
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="姓名")
    department: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="部门"
    )
    position: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="岗位"
    )
    position_category: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="岗位类别"
    )
    position_nature: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="岗位性质"
    )
    insurance_start_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="五险缴纳时间"
    )
    leave_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, comment="离职时间"
    )
    base_salary: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True, comment="基础薪资"
    )
    performance_salary: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True, comment="绩效薪资"
    )
    reward_welfare: Mapped[str | None] = mapped_column(
        String(200), nullable=True, comment="奖励福利"
    )
    user_status: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="用户状态"
    )
    is_active: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, comment="是否在岗"
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


class DashboardDailyAggregate(AccountBase):
    __tablename__ = "dashboard_daily_aggregates"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "domain",
            "period",
            "org_kind",
            "org_key",
            name="uq_dashboard_daily_aggregates_row",
        ),
        Index("ix_dashboard_daily_aggregates_scope_period", "scope", "period"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    domain: Mapped[str] = mapped_column(String(50), nullable=False, comment="聚合域")
    period: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="日期字符串 YYYY-MM"
    )
    org_kind: Mapped[str] = mapped_column(String(50), nullable=False, comment="行维度")
    org_key: Mapped[str] = mapped_column(
        String(200), nullable=False, comment="行唯一标识"
    )
    org_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="组织名"
    )
    metrics_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb"), comment="标量字段"
    )
    lists_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb"), comment="数组字段"
    )
    recalculated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="重算时间"
    )


class DashboardMonthlyAggregate(AccountBase):
    __tablename__ = "dashboard_monthly_aggregates"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "domain",
            "period",
            "org_kind",
            "org_key",
            name="uq_dashboard_monthly_aggregates_row",
        ),
        Index("ix_dashboard_monthly_aggregates_scope_period", "scope", "period"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    domain: Mapped[str] = mapped_column(String(50), nullable=False, comment="聚合域")
    period: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="月份字符串 YYYY"
    )
    org_kind: Mapped[str] = mapped_column(String(50), nullable=False, comment="行维度")
    org_key: Mapped[str] = mapped_column(
        String(200), nullable=False, comment="行唯一标识"
    )
    org_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="组织名"
    )
    metrics_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb"), comment="标量字段"
    )
    lists_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb"), comment="数组字段"
    )
    recalculated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="重算时间"
    )


class DashboardYearlyAggregate(AccountBase):
    __tablename__ = "dashboard_yearly_aggregates"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "domain",
            "period",
            "org_kind",
            "org_key",
            name="uq_dashboard_yearly_aggregates_row",
        ),
        Index("ix_dashboard_yearly_aggregates_scope_period", "scope", "period"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="业务线范围：hq/offline"
    )
    domain: Mapped[str] = mapped_column(String(50), nullable=False, comment="聚合域")
    period: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="年份字符串 YYYY"
    )
    org_kind: Mapped[str] = mapped_column(String(50), nullable=False, comment="行维度")
    org_key: Mapped[str] = mapped_column(
        String(200), nullable=False, comment="行唯一标识"
    )
    org_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="组织名"
    )
    metrics_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb"), comment="标量字段"
    )
    lists_json: Mapped[dict[str, Any] | list[Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb"), comment="数组字段"
    )
    recalculated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), comment="重算时间"
    )
class DashboardRefreshState(AccountBase):
    __tablename__ = "dashboard_refresh_states"
    __table_args__ = (
        UniqueConstraint(
            "scope",
            "granularity",
            "period",
            name="uq_dashboard_refresh_states_scope_granularity_period",
        ),
        Index("ix_dashboard_refresh_states_dirty_running", "dirty", "running"),
        {"schema": "humanresources"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(String(20), nullable=False)
    granularity: Mapped[str] = mapped_column(String(20), nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    anchor_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    dirty: Mapped[bool] = mapped_column(nullable=False, default=False)
    running: Mapped[bool] = mapped_column(nullable=False, default=False)
    last_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_requested_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
