"""
创建培训申请表相关表。
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.training_applications (
        id SERIAL PRIMARY KEY,
        application_no VARCHAR(50) NOT NULL,
        campus VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        category VARCHAR(20) NOT NULL,
        objective TEXT NOT NULL,
        trainees TEXT NOT NULL,
        content TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
        training_format VARCHAR(20) NOT NULL,
        exam_method VARCHAR(20) NOT NULL,
        trainer VARCHAR(100),
        expected_pass_rate NUMERIC(5, 2),
        cost_per_person NUMERIC(12, 2) NOT NULL DEFAULT 0,
        cost_count INTEGER NOT NULL DEFAULT 0,
        cost_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        cost_other NUMERIC(12, 2) NOT NULL DEFAULT 0,
        is_internal_training BOOLEAN NOT NULL DEFAULT FALSE,
        is_key_staff_training BOOLEAN NOT NULL DEFAULT FALSE,
        include_chairman_approval BOOLEAN NOT NULL DEFAULT FALSE,
        remark TEXT,
        department_head_opinion TEXT,
        department_head_passed BOOLEAN,
        principal_opinion TEXT,
        principal_passed BOOLEAN,
        group_department_opinion TEXT,
        group_department_passed BOOLEAN,
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
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_training_applications_application_no UNIQUE (application_no)
    );

    CREATE TABLE IF NOT EXISTS public.training_application_approval_actions (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.training_applications(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.training_application_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES humanresources.training_applications(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS ix_training_applications_campus ON humanresources.training_applications(campus);
    CREATE INDEX IF NOT EXISTS ix_training_applications_department ON humanresources.training_applications(department);
    CREATE INDEX IF NOT EXISTS ix_training_applications_status ON humanresources.training_applications(status);
    CREATE INDEX IF NOT EXISTS ix_training_applications_stage ON humanresources.training_applications(current_stage);
    CREATE INDEX IF NOT EXISTS ix_training_applications_start_date ON humanresources.training_applications(start_date);
    CREATE INDEX IF NOT EXISTS ix_training_application_actions_app_id ON public.training_application_approval_actions(application_id);
    CREATE INDEX IF NOT EXISTS ix_training_application_actions_stage ON public.training_application_approval_actions(stage);
    CREATE INDEX IF NOT EXISTS ix_training_application_actions_user_id ON public.training_application_approval_actions(approver_user_id);
    CREATE INDEX IF NOT EXISTS ix_training_application_notifications_app_id ON public.training_application_notifications(application_id);
    CREATE INDEX IF NOT EXISTS ix_training_application_notifications_user_id ON public.training_application_notifications(recipient_user_id);
    CREATE INDEX IF NOT EXISTS ix_training_application_notifications_read ON public.training_application_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()