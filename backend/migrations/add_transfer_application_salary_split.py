"""
为调岗申请表补充基础薪资、绩效薪资拆分字段。

运行方式:
python backend/migrations/add_transfer_application_salary_split.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration() -> None:
    statements = [
        """
        ALTER TABLE IF EXISTS humanresources.transfer_applications
        ADD COLUMN IF NOT EXISTS new_base_salary DOUBLE PRECISION
        """,
        """
        ALTER TABLE IF EXISTS humanresources.transfer_applications
        ADD COLUMN IF NOT EXISTS new_performance_salary DOUBLE PRECISION
        """,
        """
        COMMENT ON COLUMN humanresources.transfer_applications.new_base_salary
        IS '调岗后基础薪资'
        """,
        """
        COMMENT ON COLUMN humanresources.transfer_applications.new_performance_salary
        IS '调岗后绩效薪资'
        """,
        """
        UPDATE humanresources.transfer_applications
        SET new_base_salary = new_salary
        WHERE new_base_salary IS NULL
          AND new_performance_salary IS NULL
          AND new_salary IS NOT NULL
        """,
    ]

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


if __name__ == "__main__":
    run_migration()
