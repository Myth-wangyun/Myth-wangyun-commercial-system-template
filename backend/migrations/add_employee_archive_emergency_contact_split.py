"""
为员工档案补齐紧急联系人姓名/电话拆分列，并尽量从旧合并字段回填。
"""

from __future__ import annotations

import os
import re
import sys

from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import engine


PHONE_PATTERN = re.compile(r"1\d{10}")


def _split_legacy_contact(value: str | None) -> tuple[str | None, str | None]:
    raw = (value or "").strip()
    if not raw:
        return None, None

    match = PHONE_PATTERN.search(raw)
    if not match:
        return raw, None

    phone = match.group(0)
    name = PHONE_PATTERN.sub("", raw, count=1)
    name = re.sub(r"[\s,:，：;；/|()（）-]+", " ", name).strip()
    return name or None, phone


def run_migration():
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE IF EXISTS humanresources.employees
                    ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
                """
            )
        )

        rows = conn.execute(
            text(
                """
                SELECT id, emergency_contact, emergency_contact_name, emergency_contact_phone
                FROM humanresources.employees
                WHERE emergency_contact IS NOT NULL
                """
            )
        ).mappings()

        for row in rows:
            if row["emergency_contact_name"] or row["emergency_contact_phone"]:
                continue

            name, phone = _split_legacy_contact(row["emergency_contact"])
            if not name and not phone:
                continue

            conn.execute(
                text(
                    """
                    UPDATE humanresources.employees
                    SET emergency_contact_name = :name,
                        emergency_contact_phone = :phone
                    WHERE id = :id
                    """
                ),
                {"id": row["id"], "name": name, "phone": phone},
            )
