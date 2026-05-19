"""
新增/修正面试登记表主表到 humanresources schema

目标表：
- humanresources.interview_registrations

设计约束：
- 面试登记表属于集团人资基础业务数据，必须存放在 humanresources schema
- 如果历史上被错误创建到 public schema，本迁移会在安全前提下迁回 humanresources

运行方式：
python backend/migrations/add_humanresources_interview_registrations.py
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


def _move_public_table_if_needed(conn) -> bool:
    source_exists = _table_exists(conn, "public", "interview_registrations")
    target_exists = _table_exists(conn, "humanresources", "interview_registrations")

    if source_exists and target_exists:
        source_count = _table_count(conn, "public", "interview_registrations")
        target_count = _table_count(conn, "humanresources", "interview_registrations")

        if target_count == 0:
            conn.execute(text('DROP TABLE "humanresources"."interview_registrations"'))
            target_exists = False
        elif source_count == 0:
            return True
        else:
            raise RuntimeError(
                "public.interview_registrations 与 humanresources.interview_registrations 同时存在且都有数据，请人工处理后重试"
            )

    if target_exists:
        return True

    if source_exists:
        conn.execute(text("ALTER TABLE public.interview_registrations SET SCHEMA humanresources"))
        return True

    return False


def _create_target_table(conn) -> None:
    sql = """
    CREATE TABLE IF NOT EXISTS humanresources.interview_registrations (
        id SERIAL PRIMARY KEY,
        region VARCHAR(100),
        campus_name VARCHAR(100),
        name VARCHAR(100) NOT NULL,
        source VARCHAR(50),
        phone VARCHAR(50),
        position VARCHAR(100),
        invite_date DATE,
        inviter VARCHAR(100),
        scheduled_time VARCHAR(100),
        attended_first VARCHAR(10),
        first_interviewer VARCHAR(100),
        first_evaluation TEXT,
        first_hire_decision VARCHAR(10),
        attended_second VARCHAR(10),
        second_time VARCHAR(100),
        second_evaluation TEXT,
        final_hire_decision VARCHAR(10),
        reported VARCHAR(10),
        onboard_date DATE,
        not_onboard_reason TEXT,
        created_by_user_id INTEGER,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS ix_interview_registrations_campus_name
    ON humanresources.interview_registrations(campus_name);

    CREATE INDEX IF NOT EXISTS ix_interview_registrations_name
    ON humanresources.interview_registrations(name);

    CREATE INDEX IF NOT EXISTS ix_interview_registrations_position
    ON humanresources.interview_registrations(position);

    CREATE INDEX IF NOT EXISTS ix_interview_registrations_invite_date
    ON humanresources.interview_registrations(invite_date);
    """
    conn.execute(text(sql))


def run_migration():
    with engine.begin() as conn:
        _ensure_humanresources_schema(conn)
        moved_or_exists = _move_public_table_if_needed(conn)
        if not moved_or_exists:
            _create_target_table(conn)


if __name__ == "__main__":
    run_migration()
