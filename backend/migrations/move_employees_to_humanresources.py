"""
将员工管理主表迁移到 humanresources schema

说明：
- 员工主表属于人资业务数据，统一落到 humanresources schema
- 现有 API 路径保留，物理存储位置调整为 humanresources.employees

运行方式：
python backend/migrations/move_employees_to_humanresources.py
"""

import os
import sys

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


def _table_exists(conn, schema: str, table: str) -> bool:
    return bool(
        conn.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = :schema
                      AND table_name = :table
                )
                """
            ),
            {"schema": schema, "table": table},
        ).scalar()
    )


def _table_count(conn, schema: str, table: str) -> int:
    return int(conn.execute(text(f'SELECT COUNT(*) FROM "{schema}"."{table}"')).scalar() or 0)


def _ensure_humanresources_schema(conn) -> None:
    try:
        conn.execute(text('CREATE SCHEMA IF NOT EXISTS "humanresources"'))
    except IntegrityError:
        if not conn.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.schemata
                    WHERE schema_name = 'humanresources'
                )
                """
            )
        ).scalar():
            raise


def run_migration():
    with engine.begin() as conn:
        _ensure_humanresources_schema(conn)

        source_exists = _table_exists(conn, "config", "employees")
        target_exists = _table_exists(conn, "humanresources", "employees")

        if source_exists and target_exists:
            source_count = _table_count(conn, "config", "employees")
            target_count = _table_count(conn, "humanresources", "employees")
            if target_count == 0:
                conn.execute(text('DROP TABLE "humanresources"."employees"'))
                target_exists = False
            elif source_count == 0:
                return
            else:
                raise RuntimeError(
                    "config.employees 与 humanresources.employees 同时存在且都有数据，请人工处理后重试"
                )

        if target_exists:
            return
        if not source_exists:
            return

        conn.execute(text('ALTER TABLE "config"."employees" SET SCHEMA "humanresources"'))


if __name__ == "__main__":
    run_migration()
