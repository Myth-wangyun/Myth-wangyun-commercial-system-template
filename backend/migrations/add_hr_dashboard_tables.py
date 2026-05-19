"""
创建人事看板统一事实表、快照表、聚合表。

目标：
- humanresources.dashboard_manual_recruitment_daily
- humanresources.salary_welfare_facts
- humanresources.performance_facts
- humanresources.employee_archive_snapshots
- humanresources.dashboard_daily_aggregates
- humanresources.dashboard_monthly_aggregates
- humanresources.dashboard_yearly_aggregates
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.dashboard_manual_recruitment_daily (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        stat_date DATE NOT NULL,
        org_name VARCHAR(100) NOT NULL,
        authorized_posts INTEGER NOT NULL DEFAULT 0,
        current_posts INTEGER NOT NULL DEFAULT 0,
        boss_invite_count INTEGER NOT NULL DEFAULT 0,
        zhilian_invite_count INTEGER NOT NULL DEFAULT 0,
        other_platform_invite_count INTEGER NOT NULL DEFAULT 0,
        planned_optimize_count INTEGER NOT NULL DEFAULT 0,
        actual_optimize_count INTEGER NOT NULL DEFAULT 0,
        transfer_names_json TEXT,
        optimize_names_json TEXT,
        resign_names_json TEXT,
        updated_by_user_id INTEGER,
        updated_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_dashboard_manual_recruitment_daily'
        ) THEN
            ALTER TABLE humanresources.dashboard_manual_recruitment_daily
                ADD CONSTRAINT uq_dashboard_manual_recruitment_daily
                UNIQUE (scope, stat_date, org_name);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS ix_dashboard_manual_recruitment_daily_scope
    ON humanresources.dashboard_manual_recruitment_daily(scope);

    CREATE INDEX IF NOT EXISTS ix_dashboard_manual_recruitment_daily_stat_date
    ON humanresources.dashboard_manual_recruitment_daily(stat_date);

    ALTER TABLE humanresources.dashboard_manual_recruitment_daily
        ADD COLUMN IF NOT EXISTS boss_invite_count INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE humanresources.dashboard_manual_recruitment_daily
        ADD COLUMN IF NOT EXISTS zhilian_invite_count INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE humanresources.dashboard_manual_recruitment_daily
        ADD COLUMN IF NOT EXISTS other_platform_invite_count INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS humanresources.salary_welfare_facts (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        org_kind VARCHAR(20) NOT NULL DEFAULT 'org',
        org_name VARCHAR(100) NOT NULL,
        stat_date DATE NOT NULL,
        user_id INTEGER,
        person_name VARCHAR(100),
        position VARCHAR(100),
        position_category VARCHAR(20),
        headcount INTEGER NOT NULL DEFAULT 0,
        salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
        annual_welfare_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        monthly_incentive_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        temporary_reward_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
        cadre_salary_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        staff_salary_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        remark TEXT,
        updated_by_user_id INTEGER,
        updated_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_salary_welfare_facts_scope
    ON humanresources.salary_welfare_facts(scope);

    CREATE INDEX IF NOT EXISTS ix_salary_welfare_facts_stat_date
    ON humanresources.salary_welfare_facts(stat_date);

    CREATE INDEX IF NOT EXISTS ix_salary_welfare_facts_org_name
    ON humanresources.salary_welfare_facts(org_name);

    CREATE TABLE IF NOT EXISTS humanresources.performance_facts (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        org_kind VARCHAR(20) NOT NULL DEFAULT 'org',
        org_name VARCHAR(100) NOT NULL,
        stat_month DATE NOT NULL,
        user_id INTEGER,
        person_name VARCHAR(100) NOT NULL DEFAULT '',
        position_category VARCHAR(20),
        average_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
        leader_average_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
        staff_average_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
        remark TEXT,
        updated_by_user_id INTEGER,
        updated_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_performance_facts_scope_month_org_name'
        ) THEN
            ALTER TABLE humanresources.performance_facts
                ADD CONSTRAINT uq_performance_facts_scope_month_org_name
                UNIQUE (scope, stat_month, org_name, person_name);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS ix_performance_facts_scope
    ON humanresources.performance_facts(scope);

    CREATE INDEX IF NOT EXISTS ix_performance_facts_stat_month
    ON humanresources.performance_facts(stat_month);

    CREATE INDEX IF NOT EXISTS ix_performance_facts_org_name
    ON humanresources.performance_facts(org_name);

    CREATE TABLE IF NOT EXISTS humanresources.employee_archive_snapshots (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        snapshot_date DATE NOT NULL,
        user_id INTEGER NOT NULL,
        username VARCHAR(100) NOT NULL,
        campus_name VARCHAR(100),
        org_name VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        position VARCHAR(100),
        position_category VARCHAR(20),
        position_nature VARCHAR(20),
        insurance_start_date DATE,
        leave_date DATE,
        base_salary NUMERIC(12, 2),
        performance_salary NUMERIC(12, 2),
        reward_welfare VARCHAR(200),
        user_status VARCHAR(20) NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_employee_archive_snapshots_scope_date_user'
        ) THEN
            ALTER TABLE humanresources.employee_archive_snapshots
                ADD CONSTRAINT uq_employee_archive_snapshots_scope_date_user
                UNIQUE (scope, snapshot_date, user_id);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS ix_employee_archive_snapshots_scope
    ON humanresources.employee_archive_snapshots(scope);

    CREATE INDEX IF NOT EXISTS ix_employee_archive_snapshots_snapshot_date
    ON humanresources.employee_archive_snapshots(snapshot_date);

    CREATE INDEX IF NOT EXISTS ix_employee_archive_snapshots_org_name
    ON humanresources.employee_archive_snapshots(org_name);

    CREATE TABLE IF NOT EXISTS humanresources.dashboard_daily_aggregates (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        org_kind VARCHAR(50) NOT NULL,
        org_key VARCHAR(200) NOT NULL,
        org_name VARCHAR(100),
        metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        lists_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        recalculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_dashboard_daily_aggregates_row'
        ) THEN
            ALTER TABLE humanresources.dashboard_daily_aggregates
                ADD CONSTRAINT uq_dashboard_daily_aggregates_row
                UNIQUE (scope, domain, period, org_kind, org_key);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS ix_dashboard_daily_aggregates_scope_period
    ON humanresources.dashboard_daily_aggregates(scope, period);

    CREATE TABLE IF NOT EXISTS humanresources.dashboard_monthly_aggregates (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        org_kind VARCHAR(50) NOT NULL,
        org_key VARCHAR(200) NOT NULL,
        org_name VARCHAR(100),
        metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        lists_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        recalculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_dashboard_monthly_aggregates_row'
        ) THEN
            ALTER TABLE humanresources.dashboard_monthly_aggregates
                ADD CONSTRAINT uq_dashboard_monthly_aggregates_row
                UNIQUE (scope, domain, period, org_kind, org_key);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS ix_dashboard_monthly_aggregates_scope_period
    ON humanresources.dashboard_monthly_aggregates(scope, period);

    CREATE TABLE IF NOT EXISTS humanresources.dashboard_yearly_aggregates (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(20) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        org_kind VARCHAR(50) NOT NULL,
        org_key VARCHAR(200) NOT NULL,
        org_name VARCHAR(100),
        metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        lists_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        recalculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_dashboard_yearly_aggregates_row'
        ) THEN
            ALTER TABLE humanresources.dashboard_yearly_aggregates
                ADD CONSTRAINT uq_dashboard_yearly_aggregates_row
                UNIQUE (scope, domain, period, org_kind, org_key);
        END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS ix_dashboard_yearly_aggregates_scope_period
    ON humanresources.dashboard_yearly_aggregates(scope, period);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
