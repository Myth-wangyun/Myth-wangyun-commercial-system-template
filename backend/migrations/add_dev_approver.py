"""Add the development fallback approver for export approval flows."""

from __future__ import annotations

import sys

from sqlalchemy import text

sys.path.insert(0, ".")

from app.core.database import engine


TABLE_NAME = 'consult."咨询量导出审批人"'


def add_dev_approver() -> None:
    """Add the dev user (`user_id=0`) as an approver when missing."""
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT id FROM {TABLE_NAME} WHERE user_id = 0"))
        if result.fetchone():
            print("Dev user (user_id=0) already exists as approver")
        else:
            conn.execute(
                text(
                    f"""
                    INSERT INTO {TABLE_NAME}
                    (user_id, user_name, real_name, is_active, created_by)
                    VALUES (0, 'dev', '开发免登录用户', true, 0)
                    """
                )
            )
            conn.commit()
            print("Dev user (user_id=0) added as approver")

        result = conn.execute(
            text(
                f"""
                SELECT id, user_id, user_name, real_name, is_active
                FROM {TABLE_NAME}
                """
            )
        )
        print("\nCurrent approvers:")
        for row in result:
            print(
                "  id={id}, user_id={user_id}, user_name={user_name}, "
                "real_name={real_name}, is_active={is_active}".format(
                    id=row[0],
                    user_id=row[1],
                    user_name=row[2],
                    real_name=row[3],
                    is_active=row[4],
                )
            )


if __name__ == "__main__":
    add_dev_approver()
