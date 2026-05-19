"""
创建停薪留职申请相关表。

目标：
- humanresources.unpaid_leave_applications
- public.unpaid_leave_application_approval_actions
- public.unpaid_leave_application_notifications

运行方式：
python backend/migrations/add_unpaid_leave_application_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.unpaid_leave_applications (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        fill_date DATE NOT NULL,
        campus VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(20),
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        entry_date DATE NOT NULL,
        birth_date DATE,
        phone VARCHAR(50),
        email VARCHAR(100),
        home_address TEXT,
        current_address TEXT,
        reason TEXT NOT NULL,
        department_head_opinion TEXT,
        department_head_passed BOOLEAN,
        biz_director_opinion TEXT,
        biz_director_passed BOOLEAN,
        hr_opinion TEXT,
        hr_passed BOOLEAN,
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

    CREATE UNIQUE INDEX IF NOT EXISTS uq_unpaid_leave_applications_application_no
    ON humanresources.unpaid_leave_applications(application_no);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_applications_campus
    ON humanresources.unpaid_leave_applications(campus);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_applications_department
    ON humanresources.unpaid_leave_applications(department);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_applications_status
    ON humanresources.unpaid_leave_applications(status);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_applications_stage
    ON humanresources.unpaid_leave_applications(current_stage);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_applications_fill_date
    ON humanresources.unpaid_leave_applications(fill_date);

    CREATE TABLE IF NOT EXISTS public.unpaid_leave_application_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.unpaid_leave_applications(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_application_approval_actions_app_id
    ON public.unpaid_leave_application_approval_actions(application_id);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_application_approval_actions_stage
    ON public.unpaid_leave_application_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_application_approval_actions_approver_user_id
    ON public.unpaid_leave_application_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.unpaid_leave_application_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.unpaid_leave_applications(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_application_notifications_app_id
    ON public.unpaid_leave_application_notifications(application_id);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_application_notifications_recipient_user_id
    ON public.unpaid_leave_application_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_unpaid_leave_application_notifications_is_read
    ON public.unpaid_leave_application_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
