"""
创建员工档案关键字段变更日志表。

运行方式:
python backend/migrations/add_employee_archive_change_logs.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.employee_archive_change_logs (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES humanresources.employees(id) ON DELETE CASCADE,
        field_name VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        change_source VARCHAR(50) NOT NULL,
        source_record_id INTEGER,
        changed_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        changed_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_employee_archive_change_logs_employee_id
    ON humanresources.employee_archive_change_logs(employee_id);

    CREATE INDEX IF NOT EXISTS ix_employee_archive_change_logs_field_name
    ON humanresources.employee_archive_change_logs(field_name);

    CREATE INDEX IF NOT EXISTS ix_employee_archive_change_logs_created_at
    ON humanresources.employee_archive_change_logs(created_at);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))

    print("[成功] 员工档案关键字段变更日志表已创建")


if __name__ == "__main__":
    run_migration()
