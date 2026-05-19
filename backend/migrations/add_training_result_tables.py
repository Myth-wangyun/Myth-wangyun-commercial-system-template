"""
创建培训成绩汇总表相关表。

目标：
- humanresources.training_results
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.training_results (
        id SERIAL PRIMARY KEY,
        campus VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        training_date DATE NOT NULL,
        training_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
        expected_count INTEGER NOT NULL DEFAULT 0,
        actual_count INTEGER NOT NULL DEFAULT 0,
        pass_count INTEGER NOT NULL DEFAULT 0,
        fail_count INTEGER NOT NULL DEFAULT 0,
        average_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
        average_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
        pass_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
        trainees_json TEXT NOT NULL,
        year VARCHAR(10) NOT NULL,
        remark TEXT,
        created_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_training_results_year
    ON humanresources.training_results(year);

    CREATE INDEX IF NOT EXISTS ix_training_results_campus
    ON humanresources.training_results(campus);

    CREATE INDEX IF NOT EXISTS ix_training_results_department
    ON humanresources.training_results(department);

    CREATE INDEX IF NOT EXISTS ix_training_results_training_date
    ON humanresources.training_results(training_date);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()