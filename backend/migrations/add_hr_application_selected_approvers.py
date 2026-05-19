"""
为人事申请单增加“本单自选审批人”字段。

运行方式：
python backend/migrations/add_hr_application_selected_approvers.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    ALTER TABLE IF EXISTS humanresources.recruitment_requests
        ADD COLUMN IF NOT EXISTS selected_approver_user_ids TEXT;

    ALTER TABLE IF EXISTS humanresources.regularization_applications
        ADD COLUMN IF NOT EXISTS selected_approver_user_ids TEXT;

    ALTER TABLE IF EXISTS humanresources.social_insurance_applications
        ADD COLUMN IF NOT EXISTS selected_approver_user_ids TEXT;

    ALTER TABLE IF EXISTS humanresources.promotion_applications
        ADD COLUMN IF NOT EXISTS selected_approver_user_ids TEXT;
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
