"""
创建离职审批单相关表。

目标：
- humanresources.resignation_approvals
- public.resignation_approval_actions
- public.resignation_approval_notifications

运行方式：
python backend/migrations/add_resignation_approval_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.resignation_approvals (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        fill_date DATE NOT NULL,
        campus VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(20),
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        entry_date DATE,
        contract_end_date DATE,
        leave_date DATE NOT NULL,
        leave_type VARCHAR(50) NOT NULL,
        leave_type_other VARCHAR(255),
        reason TEXT NOT NULL,
        employee_sign VARCHAR(100),
        employee_sign_date DATE,
        department_head_opinion TEXT,
        department_head_passed BOOLEAN,
        department_head_salary_end_date DATE,
        hr_opinion TEXT,
        hr_passed BOOLEAN,
        hr_salary_end_date DATE,
        principal_opinion TEXT,
        principal_passed BOOLEAN,
        operations_review_opinion TEXT,
        operations_review_passed BOOLEAN,
        chairman_opinion TEXT,
        chairman_passed BOOLEAN,
        is_passed BOOLEAN,
        selected_approver_user_ids TEXT,
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

    CREATE UNIQUE INDEX IF NOT EXISTS uq_resignation_approvals_application_no
    ON humanresources.resignation_approvals(application_no);

    CREATE INDEX IF NOT EXISTS ix_resignation_approvals_campus
    ON humanresources.resignation_approvals(campus);

    CREATE INDEX IF NOT EXISTS ix_resignation_approvals_department
    ON humanresources.resignation_approvals(department);

    CREATE INDEX IF NOT EXISTS ix_resignation_approvals_status
    ON humanresources.resignation_approvals(status);

    CREATE INDEX IF NOT EXISTS ix_resignation_approvals_stage
    ON humanresources.resignation_approvals(current_stage);

    CREATE INDEX IF NOT EXISTS ix_resignation_approvals_leave_date
    ON humanresources.resignation_approvals(leave_date);

    CREATE TABLE IF NOT EXISTS public.resignation_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.resignation_approvals(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_resignation_approval_actions_app_id
    ON public.resignation_approval_actions(application_id);

    CREATE INDEX IF NOT EXISTS ix_resignation_approval_actions_stage
    ON public.resignation_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_resignation_approval_actions_approver_user_id
    ON public.resignation_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.resignation_approval_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.resignation_approvals(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS ix_resignation_approval_notifications_app_id
    ON public.resignation_approval_notifications(application_id);

    CREATE INDEX IF NOT EXISTS ix_resignation_approval_notifications_recipient_user_id
    ON public.resignation_approval_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_resignation_approval_notifications_is_read
    ON public.resignation_approval_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
