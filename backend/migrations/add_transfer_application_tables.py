"""
创建调岗申请相关表。

目标：
- humanresources.transfer_applications
- public.transfer_application_approval_actions
- public.transfer_application_notifications

运行方式：
python backend/migrations/add_transfer_application_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.transfer_applications (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        apply_date DATE NOT NULL,
        campus VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        entry_date DATE NOT NULL,
        original_salary DOUBLE PRECISION,
        target_department VARCHAR(100) NOT NULL,
        target_position VARCHAR(100) NOT NULL,
        new_base_salary DOUBLE PRECISION,
        new_performance_salary DOUBLE PRECISION,
        new_salary DOUBLE PRECISION,
        reason TEXT NOT NULL,
        applicant_name VARCHAR(100),
        out_department_manager_opinion TEXT,
        out_department_manager_passed BOOLEAN,
        hr_first_review_opinion TEXT,
        hr_first_review_passed BOOLEAN,
        in_department_manager_opinion TEXT,
        in_department_manager_passed BOOLEAN,
        biz_director_opinion TEXT,
        biz_director_passed BOOLEAN,
        hr_final_review_opinion TEXT,
        hr_final_review_passed BOOLEAN,
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

    CREATE UNIQUE INDEX IF NOT EXISTS uq_transfer_applications_application_no
    ON humanresources.transfer_applications(application_no);

    CREATE INDEX IF NOT EXISTS ix_transfer_applications_campus
    ON humanresources.transfer_applications(campus);

    CREATE INDEX IF NOT EXISTS ix_transfer_applications_department
    ON humanresources.transfer_applications(department);

    CREATE INDEX IF NOT EXISTS ix_transfer_applications_target_department
    ON humanresources.transfer_applications(target_department);

    CREATE INDEX IF NOT EXISTS ix_transfer_applications_status
    ON humanresources.transfer_applications(status);

    CREATE INDEX IF NOT EXISTS ix_transfer_applications_stage
    ON humanresources.transfer_applications(current_stage);

    CREATE TABLE IF NOT EXISTS public.transfer_application_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.transfer_applications(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_transfer_application_approval_actions_app_id
    ON public.transfer_application_approval_actions(application_id);

    CREATE INDEX IF NOT EXISTS ix_transfer_application_approval_actions_stage
    ON public.transfer_application_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_transfer_application_approval_actions_approver_user_id
    ON public.transfer_application_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.transfer_application_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.transfer_applications(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS ix_transfer_application_notifications_app_id
    ON public.transfer_application_notifications(application_id);

    CREATE INDEX IF NOT EXISTS ix_transfer_application_notifications_recipient_user_id
    ON public.transfer_application_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_transfer_application_notifications_is_read
    ON public.transfer_application_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
