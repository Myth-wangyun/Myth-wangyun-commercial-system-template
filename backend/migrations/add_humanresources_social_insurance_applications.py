"""
新增/修正员工社保办理申请相关表到目标 schema。

目标：
- humanresources.social_insurance_applications
- config.social_insurance_approval_configs
- config.social_insurance_approval_config_approvers
- public.social_insurance_application_approval_actions
- public.social_insurance_application_notifications

设计约束：
- 人资业务主表必须存放在 humanresources schema
- 审批配置存放在 config schema
- 审批动作与通知存放在 public schema

运行方式：
python backend/migrations/add_humanresources_social_insurance_applications.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;
    CREATE SCHEMA IF NOT EXISTS config;

    CREATE TABLE IF NOT EXISTS config.social_insurance_approval_configs (
        id SERIAL PRIMARY KEY,
        campus VARCHAR(100) NOT NULL,
        apply_department VARCHAR(100) NOT NULL DEFAULT '',
        apply_position VARCHAR(100) NOT NULL DEFAULT '',
        stage VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_social_insurance_approval_config_scope
    ON config.social_insurance_approval_configs(campus, apply_department, apply_position, stage);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_approval_configs_campus
    ON config.social_insurance_approval_configs(campus);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_approval_configs_stage
    ON config.social_insurance_approval_configs(stage);

    CREATE TABLE IF NOT EXISTS config.social_insurance_approval_config_approvers (
        id SERIAL PRIMARY KEY,
        config_id INTEGER NOT NULL REFERENCES config.social_insurance_approval_configs(id) ON DELETE CASCADE,
        approver_user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        approver_name VARCHAR(100) NOT NULL,
        approver_department VARCHAR(100),
        approver_position VARCHAR(100),
        approver_campus VARCHAR(100),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_social_insurance_approval_config_approver
    ON config.social_insurance_approval_config_approvers(config_id, approver_user_id);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_approval_config_approvers_config_id
    ON config.social_insurance_approval_config_approvers(config_id);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_approval_config_approvers_user_id
    ON config.social_insurance_approval_config_approvers(approver_user_id);

    CREATE TABLE IF NOT EXISTS humanresources.social_insurance_applications (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        fill_date DATE NOT NULL,
        campus VARCHAR(100) NOT NULL,
        account_no VARCHAR(100),
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        id_number VARCHAR(50) NOT NULL,
        household_type VARCHAR(50) NOT NULL,
        id_expiry VARCHAR(100) NOT NULL,
        hire_date DATE NOT NULL,
        registered_address TEXT NOT NULL,
        prev_payment_place VARCHAR(100),
        prev_payment_type VARCHAR(100),
        prev_payment_base DOUBLE PRECISION,
        insurance_type VARCHAR(20) NOT NULL,
        dept_manager_opinion TEXT,
        hr_payment_content TEXT,
        hr_payment_base DOUBLE PRECISION,
        hr_start_date DATE,
        hr_insurance_place VARCHAR(100),
        hr_opinion TEXT,
        principal_opinion TEXT,
        chairman_opinion TEXT,
        remark TEXT,
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

    CREATE UNIQUE INDEX IF NOT EXISTS uq_social_insurance_applications_application_no
    ON humanresources.social_insurance_applications(application_no);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_applications_campus
    ON humanresources.social_insurance_applications(campus);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_applications_department
    ON humanresources.social_insurance_applications(department);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_applications_status
    ON humanresources.social_insurance_applications(status);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_applications_stage
    ON humanresources.social_insurance_applications(current_stage);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_applications_fill_date
    ON humanresources.social_insurance_applications(fill_date);

    CREATE TABLE IF NOT EXISTS public.social_insurance_application_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.social_insurance_applications(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_social_insurance_application_approval_actions_app_id
    ON public.social_insurance_application_approval_actions(application_id);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_application_approval_actions_stage
    ON public.social_insurance_application_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_application_approval_actions_approver_user_id
    ON public.social_insurance_application_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.social_insurance_application_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.social_insurance_applications(id) ON DELETE CASCADE,
        recipient_user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        notification_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        stage VARCHAR(50),
        action_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        action_by_name VARCHAR(100),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_social_insurance_application_notifications_app_id
    ON public.social_insurance_application_notifications(application_id);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_application_notifications_recipient_user_id
    ON public.social_insurance_application_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_social_insurance_application_notifications_is_read
    ON public.social_insurance_application_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
