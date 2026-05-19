"""
创建任命访谈记录表。

目标：
- humanresources.appointment_interview_records

运行方式：
python backend/migrations/add_appointment_interview_record_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.appointment_interview_records (
        id SERIAL PRIMARY KEY,
        source_application_id INTEGER,
        source_promotion_interview_id INTEGER,
        campus VARCHAR(100) NOT NULL DEFAULT '',
        interviewer VARCHAR(100) NOT NULL,
        interviewee VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        interview_date DATE NOT NULL,
        answers JSONB NOT NULL DEFAULT '[]'::jsonb,
        suggestions TEXT,
        self_sign JSONB NOT NULL DEFAULT '{}'::jsonb,
        principal_approval JSONB NOT NULL DEFAULT '{}'::jsonb,
        principal_passed BOOLEAN,
        hr_approval JSONB NOT NULL DEFAULT '{}'::jsonb,
        hr_passed BOOLEAN,
        chairman_approval JSONB NOT NULL DEFAULT '{}'::jsonb,
        chairman_passed BOOLEAN,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        current_stage VARCHAR(50),
        rejection_reason TEXT,
        submitted_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_by_user_id INTEGER,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE IF EXISTS humanresources.appointment_interview_records
        ADD COLUMN IF NOT EXISTS source_application_id INTEGER,
        ADD COLUMN IF NOT EXISTS source_promotion_interview_id INTEGER,
        ADD COLUMN IF NOT EXISTS campus VARCHAR(100) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS interviewer VARCHAR(100),
        ADD COLUMN IF NOT EXISTS interviewee VARCHAR(100),
        ADD COLUMN IF NOT EXISTS location VARCHAR(255),
        ADD COLUMN IF NOT EXISTS interview_date DATE,
        ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS suggestions TEXT,
        ADD COLUMN IF NOT EXISTS self_sign JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS principal_approval JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS principal_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS hr_approval JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS hr_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS chairman_approval JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS chairman_passed BOOLEAN,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER,
        ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_campus
    ON humanresources.appointment_interview_records(campus);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_interviewer
    ON humanresources.appointment_interview_records(interviewer);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_interviewee
    ON humanresources.appointment_interview_records(interviewee);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_status
    ON humanresources.appointment_interview_records(status);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_current_stage
    ON humanresources.appointment_interview_records(current_stage);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_interview_date
    ON humanresources.appointment_interview_records(interview_date);

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_source_application_id
    ON humanresources.appointment_interview_records(source_application_id);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_interview_records_source_promotion_interview_id
    ON humanresources.appointment_interview_records(source_promotion_interview_id);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
