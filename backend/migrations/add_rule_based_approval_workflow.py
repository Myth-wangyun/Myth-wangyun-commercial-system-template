"""
创建规则化审批流程相关表。

目标：
- config.approval_flow_templates
- config.approval_flow_template_nodes
- config.org_responsibility_bindings

运行方式：
python backend/migrations/add_rule_based_approval_workflow.py
"""

import os
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def run_migration():
    sql = """
    CREATE SCHEMA IF NOT EXISTS config;

    CREATE TABLE IF NOT EXISTS config.approval_flow_templates (
        id SERIAL PRIMARY KEY,
        flow_type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        campus VARCHAR(100) NOT NULL DEFAULT '',
        apply_department VARCHAR(100) NOT NULL DEFAULT '',
        apply_position VARCHAR(100) NOT NULL DEFAULT '',
        description TEXT,
        priority INTEGER NOT NULL DEFAULT 100,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_approval_flow_templates_scope
    ON config.approval_flow_templates(flow_type, campus, apply_department, apply_position);

    CREATE INDEX IF NOT EXISTS ix_approval_flow_templates_flow_type
    ON config.approval_flow_templates(flow_type);

    CREATE INDEX IF NOT EXISTS ix_approval_flow_templates_campus
    ON config.approval_flow_templates(campus);

    CREATE INDEX IF NOT EXISTS ix_approval_flow_templates_priority
    ON config.approval_flow_templates(priority);

    CREATE TABLE IF NOT EXISTS config.approval_flow_template_nodes (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES config.approval_flow_templates(id) ON DELETE CASCADE,
        stage VARCHAR(50) NOT NULL,
        stage_label VARCHAR(100) NOT NULL,
        node_order INTEGER NOT NULL DEFAULT 1,
        approver_source_type VARCHAR(50) NOT NULL,
        approver_source_value VARCHAR(255),
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        allow_multi_approver BOOLEAN NOT NULL DEFAULT FALSE,
        applicant_selectable BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_approval_flow_template_nodes_stage
    ON config.approval_flow_template_nodes(template_id, stage);

    CREATE INDEX IF NOT EXISTS ix_approval_flow_template_nodes_template_id
    ON config.approval_flow_template_nodes(template_id);

    CREATE INDEX IF NOT EXISTS ix_approval_flow_template_nodes_order
    ON config.approval_flow_template_nodes(node_order);

    CREATE TABLE IF NOT EXISTS config.org_responsibility_bindings (
        id SERIAL PRIMARY KEY,
        responsibility_code VARCHAR(50) NOT NULL,
        responsibility_name VARCHAR(100) NOT NULL,
        campus_scope VARCHAR(100) NOT NULL DEFAULT '',
        department_scope VARCHAR(100) NOT NULL DEFAULT '',
        position_scope VARCHAR(100) NOT NULL DEFAULT '',
        user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        user_name VARCHAR(100) NOT NULL,
        user_department VARCHAR(100),
        user_position VARCHAR(100),
        user_campus VARCHAR(100),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_org_responsibility_bindings_scope_user
    ON config.org_responsibility_bindings(
        responsibility_code,
        campus_scope,
        department_scope,
        position_scope,
        user_id
    );

    CREATE INDEX IF NOT EXISTS ix_org_responsibility_bindings_code
    ON config.org_responsibility_bindings(responsibility_code);

    CREATE INDEX IF NOT EXISTS ix_org_responsibility_bindings_campus_scope
    ON config.org_responsibility_bindings(campus_scope);

    CREATE INDEX IF NOT EXISTS ix_org_responsibility_bindings_department_scope
    ON config.org_responsibility_bindings(department_scope);

    CREATE INDEX IF NOT EXISTS ix_org_responsibility_bindings_position_scope
    ON config.org_responsibility_bindings(position_scope);

    CREATE INDEX IF NOT EXISTS ix_org_responsibility_bindings_active
    ON config.org_responsibility_bindings(is_active);
    """

    with engine.begin() as conn:
        conn.execute(text(sql))


if __name__ == "__main__":
    run_migration()
