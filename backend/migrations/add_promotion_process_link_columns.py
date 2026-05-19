"""
为晋升申请、晋升面试、任命访谈补齐自动同步所需的关联列。

运行方式:
python backend/migrations/add_promotion_process_link_columns.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    ALTER TABLE IF EXISTS humanresources.promotion_interviews
        ADD COLUMN IF NOT EXISTS source_application_id INTEGER;

    COMMENT ON COLUMN humanresources.promotion_interviews.source_application_id
    IS '来源晋升申请ID';

    CREATE UNIQUE INDEX IF NOT EXISTS uq_promotion_interviews_source_application_id
    ON humanresources.promotion_interviews(source_application_id);

    ALTER TABLE IF EXISTS humanresources.appointment_interview_records
        ADD COLUMN IF NOT EXISTS source_application_id INTEGER,
        ADD COLUMN IF NOT EXISTS source_promotion_interview_id INTEGER;

    COMMENT ON COLUMN humanresources.appointment_interview_records.source_application_id
    IS '来源晋升申请ID';

    COMMENT ON COLUMN humanresources.appointment_interview_records.source_promotion_interview_id
    IS '来源晋升面试ID';

    CREATE INDEX IF NOT EXISTS ix_appointment_interview_records_source_application_id
    ON humanresources.appointment_interview_records(source_application_id);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_interview_records_source_promotion_interview_id
    ON humanresources.appointment_interview_records(source_promotion_interview_id);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
