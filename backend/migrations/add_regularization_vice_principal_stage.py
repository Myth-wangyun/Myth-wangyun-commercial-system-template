"""
为转正申请增加副校长审批字段，并统一集团人力资源部字段注释。
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    ALTER TABLE IF EXISTS humanresources.regularization_applications
        ADD COLUMN IF NOT EXISTS vice_principal_opinion TEXT,
        ADD COLUMN IF NOT EXISTS vice_principal_passed BOOLEAN;

    COMMENT ON COLUMN humanresources.regularization_applications.vice_principal_opinion IS '副校长意见';
    COMMENT ON COLUMN humanresources.regularization_applications.vice_principal_passed IS '副校长是否通过';
    COMMENT ON COLUMN humanresources.regularization_applications.hr_opinion IS '集团人力资源部意见';
    COMMENT ON COLUMN humanresources.regularization_applications.hr_passed IS '集团人力资源部是否通过';
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()