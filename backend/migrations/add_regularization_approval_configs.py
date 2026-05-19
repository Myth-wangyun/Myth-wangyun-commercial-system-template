"""
为转正申请补充可配置审批链与董事长审批字段。

目标：
- humanresources.regularization_applications 新增 chairman_* 字段
- config.regularization_approval_configs
- config.regularization_approval_config_approvers

运行方式：
python backend/migrations/add_regularization_approval_configs.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS config;
    CREATE SCHEMA IF NOT EXISTS humanresources;

    ALTER TABLE IF EXISTS humanresources.regularization_applications
        ADD COLUMN IF NOT EXISTS chairman_opinion TEXT,
        ADD COLUMN IF NOT EXISTS chairman_passed BOOLEAN;

    CREATE TABLE IF NOT EXISTS config.regularization_approval_configs (
        id SERIAL PRIMARY KEY,
        campus VARCHAR(100) NOT NULL,
        apply_department VARCHAR(100) NOT NULL DEFAULT '',
        apply_position VARCHAR(100) NOT NULL DEFAULT '',
        stage VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_regularization_approval_config_scope
    ON config.regularization_approval_configs(campus, apply_department, apply_position, stage);

    CREATE INDEX IF NOT EXISTS ix_regularization_approval_configs_campus
    ON config.regularization_approval_configs(campus);

    CREATE INDEX IF NOT EXISTS ix_regularization_approval_configs_stage
    ON config.regularization_approval_configs(stage);

    CREATE TABLE IF NOT EXISTS config.regularization_approval_config_approvers (
        id SERIAL PRIMARY KEY,
        config_id INTEGER NOT NULL REFERENCES config.regularization_approval_configs(id) ON DELETE CASCADE,
        approver_user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        approver_name VARCHAR(100) NOT NULL,
        approver_department VARCHAR(100),
        approver_position VARCHAR(100),
        approver_campus VARCHAR(100),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_regularization_approval_config_approver
    ON config.regularization_approval_config_approvers(config_id, approver_user_id);

    CREATE INDEX IF NOT EXISTS ix_regularization_approval_config_approvers_config_id
    ON config.regularization_approval_config_approvers(config_id);

    CREATE INDEX IF NOT EXISTS ix_regularization_approval_config_approvers_user_id
    ON config.regularization_approval_config_approvers(approver_user_id);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
