"""
创建培训满意度调查相关表。

目标：
- humanresources.training_satisfaction_surveys

运行方式：
python backend/migrations/add_training_satisfaction_survey_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.training_satisfaction_surveys (
        id SERIAL PRIMARY KEY,
        department VARCHAR(100) NOT NULL,
        training_date DATE NOT NULL,
        training_location VARCHAR(255) NOT NULL,
        course_content VARCHAR(255) NOT NULL,
        trainer VARCHAR(100) NOT NULL,
        scores_json TEXT NOT NULL,
        course_content_total INTEGER NOT NULL DEFAULT 0,
        trainer_total INTEGER NOT NULL DEFAULT 0,
        training_method_total INTEGER NOT NULL DEFAULT 0,
        total_score INTEGER NOT NULL DEFAULT 0,
        open_q4 TEXT,
        open_q5 TEXT,
        open_q6 TEXT,
        year VARCHAR(10) NOT NULL,
        remark TEXT,
        created_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_training_satisfaction_surveys_year
    ON humanresources.training_satisfaction_surveys(year);

    CREATE INDEX IF NOT EXISTS ix_training_satisfaction_surveys_department
    ON humanresources.training_satisfaction_surveys(department);

    CREATE INDEX IF NOT EXISTS ix_training_satisfaction_surveys_training_date
    ON humanresources.training_satisfaction_surveys(training_date);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
