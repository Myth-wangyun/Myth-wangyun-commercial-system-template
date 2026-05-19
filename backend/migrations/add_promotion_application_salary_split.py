"""
为晋升申请表补充晋升后基础薪资、晋升后绩效薪资字段。

运行方式:
python backend/migrations/add_promotion_application_salary_split.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    ALTER TABLE IF EXISTS humanresources.promotion_applications
        ADD COLUMN IF NOT EXISTS promoted_base_salary DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS promoted_performance_salary DOUBLE PRECISION;

    COMMENT ON COLUMN humanresources.promotion_applications.promoted_base_salary IS '晋升后基础薪资';
    COMMENT ON COLUMN humanresources.promotion_applications.promoted_performance_salary IS '晋升后绩效薪资';

    UPDATE humanresources.promotion_applications
    SET promoted_base_salary = promoted_salary
    WHERE promoted_base_salary IS NULL
      AND promoted_performance_salary IS NULL
      AND promoted_salary IS NOT NULL;
    """

    with engine.begin() as conn:
        conn.execute(text(sql))

    print("[成功] 晋升申请表薪资拆分字段迁移完成")


if __name__ == "__main__":
    run_migration()
