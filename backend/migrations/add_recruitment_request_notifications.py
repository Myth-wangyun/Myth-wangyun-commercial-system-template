"""
新增招聘需求申请审批通知表

运行方式：
python backend/migrations/add_recruitment_request_notifications.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import engine


def run_migration():
    with engine.begin() as conn:
        request_table_schema = conn.execute(
            text(
                """
                SELECT table_schema
                FROM information_schema.tables
                WHERE table_name = 'recruitment_requests'
                  AND table_schema IN ('humanresources', 'public')
                ORDER BY CASE WHEN table_schema = 'humanresources' THEN 0 ELSE 1 END
                LIMIT 1
                """
            )
        ).scalar() or "public"

        sql = f"""
        CREATE TABLE IF NOT EXISTS public.recruitment_request_notifications (
            id SERIAL PRIMARY KEY,
            request_id INTEGER NOT NULL REFERENCES {request_table_schema}.recruitment_requests(id) ON DELETE CASCADE,
            recipient_user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
            notification_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            stage VARCHAR(50),
            action_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
            action_by_name VARCHAR(100),
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP NULL
        );

        CREATE INDEX IF NOT EXISTS ix_recruitment_request_notifications_request_id
        ON public.recruitment_request_notifications(request_id);

        CREATE INDEX IF NOT EXISTS ix_recruitment_request_notifications_recipient_user_id
        ON public.recruitment_request_notifications(recipient_user_id);

        CREATE INDEX IF NOT EXISTS ix_recruitment_request_notifications_is_read
        ON public.recruitment_request_notifications(is_read);
        """
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
