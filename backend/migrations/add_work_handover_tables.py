"""
创建工作交接表相关表。

目标：
- humanresources.work_handovers
- public.work_handover_approval_actions
- public.work_handover_notifications

运行方式：
python backend/migrations/add_work_handover_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.work_handovers (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        campus VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        entry_date DATE,
        phone VARCHAR(50),
        email VARCHAR(100),
        leave_date DATE NOT NULL,
        leave_type VARCHAR(50),
        leave_type_other VARCHAR(255),
        leave_reason_json TEXT,
        leave_reason_other TEXT,
        address TEXT,
        dept_handover_json TEXT,
        finance_handover_json TEXT,
        hr_handover_json TEXT,
        all_completed BOOLEAN NOT NULL DEFAULT FALSE,
        principal_sign VARCHAR(100),
        principal_date DATE,
        department_head_opinion TEXT,
        department_head_passed BOOLEAN,
        operations_review_opinion TEXT,
        operations_review_passed BOOLEAN,
        academic_review_opinion TEXT,
        academic_review_passed BOOLEAN,
        teaching_quality_review_opinion TEXT,
        teaching_quality_review_passed BOOLEAN,
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

    CREATE UNIQUE INDEX IF NOT EXISTS uq_work_handovers_application_no
    ON humanresources.work_handovers(application_no);

    CREATE INDEX IF NOT EXISTS ix_work_handovers_campus
    ON humanresources.work_handovers(campus);

    CREATE INDEX IF NOT EXISTS ix_work_handovers_department
    ON humanresources.work_handovers(department);

    CREATE INDEX IF NOT EXISTS ix_work_handovers_status
    ON humanresources.work_handovers(status);

    CREATE INDEX IF NOT EXISTS ix_work_handovers_stage
    ON humanresources.work_handovers(current_stage);

    CREATE INDEX IF NOT EXISTS ix_work_handovers_leave_date
    ON humanresources.work_handovers(leave_date);

    CREATE TABLE IF NOT EXISTS public.work_handover_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.work_handovers(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_work_handover_approval_actions_app_id
    ON public.work_handover_approval_actions(application_id);

    CREATE INDEX IF NOT EXISTS ix_work_handover_approval_actions_stage
    ON public.work_handover_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_work_handover_approval_actions_approver_user_id
    ON public.work_handover_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.work_handover_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.work_handovers(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS ix_work_handover_notifications_app_id
    ON public.work_handover_notifications(application_id);

    CREATE INDEX IF NOT EXISTS ix_work_handover_notifications_recipient_user_id
    ON public.work_handover_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_work_handover_notifications_is_read
    ON public.work_handover_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
