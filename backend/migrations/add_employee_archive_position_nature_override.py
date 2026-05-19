"""
为员工档案补充岗位性质手动覆盖字段。

运行方式:
python backend/migrations/add_employee_archive_position_nature_override.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration() -> None:
    statements = [
        """
        ALTER TABLE IF EXISTS humanresources.employees
        ADD COLUMN IF NOT EXISTS position_nature_override VARCHAR(20)
        """,
        """
        COMMENT ON COLUMN humanresources.employees.position_nature_override
        IS '岗位性质手动覆盖值'
        """,
    ]

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


if __name__ == "__main__":
    run_migration()
