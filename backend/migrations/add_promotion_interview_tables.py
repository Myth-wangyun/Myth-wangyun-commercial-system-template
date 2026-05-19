"""
创建晋升面试评价表。

目标：
- humanresources.promotion_interviews

运行方式：
python backend/migrations/add_promotion_interview_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.promotion_interviews (
        id SERIAL PRIMARY KEY,
        source_application_id INTEGER,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        campus VARCHAR(100) NOT NULL,
        interview_date DATE NOT NULL,
        interviewer VARCHAR(100),
        performance_type VARCHAR(10) NOT NULL,
        scores JSONB NOT NULL DEFAULT '{}'::jsonb,
        total_score INTEGER NOT NULL DEFAULT 0,
        is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        created_by_user_id INTEGER,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE IF EXISTS humanresources.promotion_interviews
        ADD COLUMN IF NOT EXISTS source_application_id INTEGER,
        ADD COLUMN IF NOT EXISTS name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS department VARCHAR(100),
        ADD COLUMN IF NOT EXISTS position VARCHAR(100),
        ADD COLUMN IF NOT EXISTS campus VARCHAR(100),
        ADD COLUMN IF NOT EXISTS interview_date DATE,
        ADD COLUMN IF NOT EXISTS interviewer VARCHAR(100),
        ADD COLUMN IF NOT EXISTS performance_type VARCHAR(10),
        ADD COLUMN IF NOT EXISTS scores JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS total_score INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER,
        ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

    CREATE INDEX IF NOT EXISTS ix_promotion_interviews_campus
    ON humanresources.promotion_interviews(campus);

    CREATE INDEX IF NOT EXISTS ix_promotion_interviews_department
    ON humanresources.promotion_interviews(department);

    CREATE INDEX IF NOT EXISTS ix_promotion_interviews_status
    ON humanresources.promotion_interviews(status);

    CREATE INDEX IF NOT EXISTS ix_promotion_interviews_interview_date
    ON humanresources.promotion_interviews(interview_date);

    CREATE INDEX IF NOT EXISTS ix_promotion_interviews_name
    ON humanresources.promotion_interviews(name);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_promotion_interviews_source_application_id
    ON humanresources.promotion_interviews(source_application_id);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
