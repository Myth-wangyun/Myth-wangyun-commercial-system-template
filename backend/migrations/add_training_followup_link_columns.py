"""
为培训成绩汇总表、培训满意度调查表补齐来源培训申请关联列。

用法：
python backend/migrations/add_training_followup_link_columns.py
"""

from pathlib import Path
import sys

from sqlalchemy import text

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.database import engine  # noqa: E402


SQL_STATEMENTS = [
    """
    ALTER TABLE IF EXISTS humanresources.training_results
    ADD COLUMN IF NOT EXISTS source_application_id INTEGER;
    """,
    """
    COMMENT ON COLUMN humanresources.training_results.source_application_id IS '来源培训申请ID';
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_training_results_source_application_id
    ON humanresources.training_results(source_application_id);
    """,
    """
    ALTER TABLE IF EXISTS humanresources.training_satisfaction_surveys
    ADD COLUMN IF NOT EXISTS source_application_id INTEGER;
    """,
    """
    COMMENT ON COLUMN humanresources.training_satisfaction_surveys.source_application_id IS '来源培训申请ID';
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_training_satisfaction_surveys_source_application_id
    ON humanresources.training_satisfaction_surveys(source_application_id);
    """,
]


def main() -> None:
    with engine.begin() as conn:
        for statement in SQL_STATEMENTS:
            conn.execute(text(statement))
    print("[成功] 已补齐培训联动来源列")


if __name__ == '__main__':
    main()