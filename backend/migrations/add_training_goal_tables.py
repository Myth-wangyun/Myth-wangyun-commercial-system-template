"""
创建培训目标相关表。

目标：
- humanresources.training_goals

运行方式：
python backend/migrations/add_training_goal_tables.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    CREATE TABLE IF NOT EXISTS humanresources.training_goals (
        id SERIAL PRIMARY KEY,
        parent_category VARCHAR(50) NOT NULL,
        sub_category VARCHAR(100) NOT NULL,
        level VARCHAR(50) NOT NULL,
        objectives_json TEXT NOT NULL,
        year VARCHAR(10) NOT NULL,
        remark TEXT,
        created_by_user_id INTEGER REFERENCES public.users(user_id) ON DELETE SET NULL,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_training_goals_year_parent_sub_level
    ON humanresources.training_goals(year, parent_category, sub_category, level);

    CREATE INDEX IF NOT EXISTS ix_training_goals_year
    ON humanresources.training_goals(year);

    CREATE INDEX IF NOT EXISTS ix_training_goals_parent_category
    ON humanresources.training_goals(parent_category);

    CREATE INDEX IF NOT EXISTS ix_training_goals_level
    ON humanresources.training_goals(level);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
