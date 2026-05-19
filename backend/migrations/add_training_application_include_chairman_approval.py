"""
为培训申请表增加可选的董事长审批开关字段。
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    ALTER TABLE IF EXISTS humanresources.training_applications
    ADD COLUMN IF NOT EXISTS include_chairman_approval BOOLEAN NOT NULL DEFAULT FALSE;

    COMMENT ON COLUMN humanresources.training_applications.include_chairman_approval IS '是否启用董事长审批';
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()