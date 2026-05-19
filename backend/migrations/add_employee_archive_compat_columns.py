"""
为旧库补齐员工档案兼容列。
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
        ADD COLUMN IF NOT EXISTS labor_relation_company VARCHAR(100),
        ADD COLUMN IF NOT EXISTS actual_work_company VARCHAR(100),
        ADD COLUMN IF NOT EXISTS position_category VARCHAR(20),
        ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(20),
        ADD COLUMN IF NOT EXISTS native_place VARCHAR(100),
        ADD COLUMN IF NOT EXISTS contract_sign_date DATE,
        ADD COLUMN IF NOT EXISTS contract_end_date DATE,
        ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS birth_date DATE,
        ADD COLUMN IF NOT EXISTS political_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS first_education VARCHAR(50),
        ADD COLUMN IF NOT EXISTS first_major VARCHAR(100),
        ADD COLUMN IF NOT EXISTS first_school VARCHAR(200),
        ADD COLUMN IF NOT EXISTS first_remark VARCHAR(200),
        ADD COLUMN IF NOT EXISTS second_education VARCHAR(50),
        ADD COLUMN IF NOT EXISTS second_major VARCHAR(100),
        ADD COLUMN IF NOT EXISTS second_school VARCHAR(200),
        ADD COLUMN IF NOT EXISTS second_remark VARCHAR(200),
        ADD COLUMN IF NOT EXISTS title_level VARCHAR(100),
        ADD COLUMN IF NOT EXISTS hukou_address TEXT,
        ADD COLUMN IF NOT EXISTS current_address TEXT,
        ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(200),
        ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS bank_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS bank_card_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS performance_salary NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS personnel_change VARCHAR(200),
        ADD COLUMN IF NOT EXISTS reward_welfare VARCHAR(200),
        ADD COLUMN IF NOT EXISTS archive_remark TEXT;
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()