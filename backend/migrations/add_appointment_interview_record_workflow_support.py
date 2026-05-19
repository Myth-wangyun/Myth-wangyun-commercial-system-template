"""
为任命访谈记录补充审批链路字段与通知表。

目标：
- humanresources.appointment_interview_records.selected_approver_user_ids
- public.appointment_interview_record_approval_actions
- public.appointment_interview_record_notifications

运行方式：
python backend/migrations/add_appointment_interview_record_workflow_support.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    ALTER TABLE IF EXISTS humanresources.appointment_interview_records
        ADD COLUMN IF NOT EXISTS selected_approver_user_ids TEXT;

    CREATE TABLE IF NOT EXISTS public.appointment_interview_record_approval_actions (
        id SERIAL PRIMARY KEY,
        record_id INTEGER NOT NULL REFERENCES humanresources.appointment_interview_records(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(30) NOT NULL,
        approver_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        approver_name VARCHAR(100),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_record_approval_actions_record_id
    ON public.appointment_interview_record_approval_actions(record_id);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_record_approval_actions_stage
    ON public.appointment_interview_record_approval_actions(stage);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_record_approval_actions_approver_user_id
    ON public.appointment_interview_record_approval_actions(approver_user_id);

    CREATE TABLE IF NOT EXISTS public.appointment_interview_record_notifications (
        id SERIAL PRIMARY KEY,
        record_id INTEGER NOT NULL REFERENCES humanresources.appointment_interview_records(id) ON DELETE CASCADE,
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

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_record_notifications_record_id
    ON public.appointment_interview_record_notifications(record_id);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_record_notifications_recipient_user_id
    ON public.appointment_interview_record_notifications(recipient_user_id);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_record_notifications_is_read
    ON public.appointment_interview_record_notifications(is_read);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
