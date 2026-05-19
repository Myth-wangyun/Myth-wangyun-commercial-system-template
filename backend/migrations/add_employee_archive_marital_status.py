"""
为员工档案补充婚姻状况字段。
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS humanresources;

    ALTER TABLE IF EXISTS humanresources.employees
        ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()