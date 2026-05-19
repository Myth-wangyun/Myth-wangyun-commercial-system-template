"""
创建晋升申请与审批配置相关表。

目标：
- humanresources.promotion_applications
- config.promotion_approval_configs
- config.promotion_approval_config_approvers
- public.promotion_application_approval_actions
- public.promotion_application_notifications

运行方式：
python backend/migrations/add_promotion_application_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS config;
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.promotion_applications (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        fill_date DATE NOT NULL,
        campus VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        native_place VARCHAR(100),
        age INTEGER,
        entry_date DATE NOT NULL,
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        work_overview TEXT NOT NULL,
        promotion_reason TEXT NOT NULL,
        confidence_and_expectation TEXT NOT NULL,
        original_level VARCHAR(100),
        original_salary DOUBLE PRECISION,
        promoted_level VARCHAR(100),
        promoted_base_salary DOUBLE PRECISION,
        promoted_performance_salary DOUBLE PRECISION,
        promoted_salary DOUBLE PRECISION,
        department_manager_opinion TEXT,
        department_manager_passed BOOLEAN,
        principal_opinion TEXT,
        principal_passed BOOLEAN,
        biz_director_opinion TEXT,
        biz_director_passed BOOLEAN,
        hr_director_opinion TEXT,
        hr_director_passed BOOLEAN,
        chairman_opinion TEXT,
        chairman_passed BOOLEAN,
        is_passed BOOLEAN,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        current_stage VARCHAR(50),
        rejection_reason TEXT,
        created_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        created_by_name VARCHAR(100),
        submitted_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE IF EXISTS humanresources.promotion_applications
        ADD COLUMN IF NOT EXISTS native_place VARCHAR(100),
        ADD COLUMN IF NOT EXISTS age INTEGER,
        ADD COLUMN IF NOT EXISTS work_overview TEXT,
        ADD COLUMN IF NOT EXISTS promotion_reason TEXT,
        ADD COLUMN IF NOT EXISTS confidence_and_expectation TEXT,
        ADD COLUMN IF NOT EXISTS original_level VARCHAR(100),
        ADD COLUMN IF NOT EXISTS original_salary DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS promoted_level VARCHAR(100),
        ADD COLUMN IF NOT EXISTS promoted_base_salary DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS promoted_performance_salary DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS promoted_salary DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS department_manager_opinion TEXT,
        ADD COLUMN IF NOT EXISTS department_manager_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS principal_opinion TEXT,
        ADD COLUMN IF NOT EXISTS principal_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS biz_director_opinion TEXT,
        ADD COLUMN IF NOT EXISTS biz_director_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS hr_director_opinion TEXT,
        ADD COLUMN IF NOT EXISTS hr_director_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS chairman_opinion TEXT,
        ADD COLUMN IF NOT EXISTS chairman_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS is_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_promotion_applications_application_no
    ON humanresources.promotion_applications(application_no);

    CREATE INDEX IF NOT EXISTS ix_promotion_applications_campus
    ON humanresources.promotion_applications(campus);

    CREATE INDEX IF NOT EXISTS ix_promotion_applications_department
    ON humanresources.promotion_applications(department);

    CREATE INDEX IF NOT EXISTS ix_promotion_applications_status
    ON humanresources.promotion_applications(status);

    CREATE INDEX IF NOT EXISTS ix_promotion_applications_stage
    ON humanresources.promotion_applications(current_stage);

    CREATE TABLE IF NOT EXISTS config.promotion_approval_configs (
        id SERIAL PRIMARY KEY,
        campus VARCHAR(100) NOT NULL,
        apply_department VARCHAR(100) NOT NULL DEFAULT '',
        apply_position VARCHAR(100) NOT NULL DEFAULT '',
        stage VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_promotion_approval_config_scope
    ON config.promotion_approval_configs(campus, apply_department, apply_position, stage);

    CREATE INDEX IF NOT EXISTS ix_promotion_approval_configs_campus
    ON config.promotion_approval_configs(campus);

    CREATE INDEX IF NOT EXISTS ix_promotion_approval_configs_stage
    ON config.promotion_approval_configs(stage);

    CREATE TABLE IF NOT EXISTS config.promotion_approval_config_approvers (
        id SERIAL PRIMARY KEY,
        config_id INTEGER NOT NULL REFERENCES config.promotion_approval_configs(id) ON DELETE CASCADE,
        approver_user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        approver_name VARCHAR(100) NOT NULL,
        approver_department VARCHAR(100),
        approver_position VARCHAR(100),
        approver_campus VARCHAR(100),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_promotion_approval_config_approver
    ON config.promotion_approval_config_approvers(config_id, approver_user_id);

    CREATE INDEX IF NOT EXISTS ix_promotion_approval_config_approvers_config_id
    ON config.promotion_approval_config_approvers(config_id);

    CREATE INDEX IF NOT EXISTS ix_promotion_approval_config_approvers_user_id
    ON config.promotion_approval_config_approvers(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.promotion_application_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.promotion_applications(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_promotion_application_approval_actions_application_id
    ON public.promotion_application_approval_actions(application_id);

    CREATE INDEX IF NOT EXISTS ix_promotion_application_approval_actions_stage
    ON public.promotion_application_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_promotion_application_approval_actions_approver_user_id
    ON public.promotion_application_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.promotion_application_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.promotion_applications(id) ON DELETE CASCADE,
        recipient_user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        notification_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        stage VARCHAR(50),
        action_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        action_by_name VARCHAR(100),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_promotion_application_notifications_application_id
    ON public.promotion_application_notifications(application_id);

    CREATE INDEX IF NOT EXISTS ix_promotion_application_notifications_recipient_user_id
    ON public.promotion_application_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_promotion_application_notifications_is_read
    ON public.promotion_application_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
