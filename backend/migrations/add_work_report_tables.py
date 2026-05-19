"""
创建转正述职报告表。

目标：
- humanresources.work_reports

运行方式：
python backend/migrations/add_work_report_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.work_reports (
        id SERIAL PRIMARY KEY,
        reporter_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        reporter_name VARCHAR(100) NOT NULL,
        reporter_department VARCHAR(100) NOT NULL,
        reporter_position VARCHAR(100) NOT NULL,
        reporter_campus VARCHAR(100),
        report_date DATE NOT NULL,
        work_description TEXT NOT NULL,
        difficulties TEXT NOT NULL,
        achievements TEXT NOT NULL,
        improvements TEXT NOT NULL,
        future_plan TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_work_reports_reporter_user_id
    ON humanresources.work_reports(reporter_user_id);

    CREATE INDEX IF NOT EXISTS ix_work_reports_report_date
    ON humanresources.work_reports(report_date);

    CREATE INDEX IF NOT EXISTS ix_work_reports_reporter_department
    ON humanresources.work_reports(reporter_department);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()